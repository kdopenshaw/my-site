// Gallery API. URL: /api/fractal-gallery
// GET returns one page of images. POST stores a PNG and its parameters.
// Database and storage credentials stay on the server (see the README).

import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { galleryDatabase, galleryStorage, getGalleryConfig } from "./backend";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 6_000_000;
const MAX_PAGE_SIZE = 8;

type FractalFamily = "mandelbrot" | "julia" | "burning_ship" | "tricorn" | "newton";

const FRACTAL_FAMILIES: readonly FractalFamily[] = [
  "mandelbrot",
  "julia",
  "burning_ship",
  "tricorn",
  "newton",
];

type FractalMetadata = {
  family: FractalFamily;
  power: number;
  cReal: number;
  cImag: number;
  centerX: number;
  centerY: number;
  scale: number;
  iterations: number;
  escapeRadius: number;
  gamma: number;
  width: number;
  height: number;
  palette: string;
  colors: string[];
};

type GalleryRow = {
  id: string;
  storage_path: string;
  width: number;
  height: number;
  family: FractalFamily;
  power: number;
  palette: string;
  created_at: string;
  parameters: FractalMetadata;
};

type GalleryPageRow = GalleryRow & {
  order_key: string;
};

type GalleryCursor = { orderKey: string; id: string };

function publicImageUrl(url: string, bucket: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function galleryItem(row: GalleryRow, url: string, bucket: string) {
  return {
    id: row.id,
    imageUrl: publicImageUrl(url, bucket, row.storage_path),
    width: row.width,
    height: row.height,
    family: row.family,
    power: row.power,
    palette: row.palette,
    createdAt: row.created_at,
    parameters: row.parameters,
  };
}

function integer(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function finiteNumber(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function fractalFamily(value: unknown): value is FractalFamily {
  return typeof value === "string" && FRACTAL_FAMILIES.includes(value as FractalFamily);
}

function validMetadata(value: unknown): value is FractalMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const metadata = value as Record<string, unknown>;

  return fractalFamily(metadata.family)
    && integer(metadata.power, 2, 8)
    && finiteNumber(metadata.cReal, -2, 2)
    && finiteNumber(metadata.cImag, -2, 2)
    && finiteNumber(metadata.centerX, -10, 10)
    && finiteNumber(metadata.centerY, -10, 10)
    && finiteNumber(metadata.scale, 0.000001, 20)
    && integer(metadata.iterations, 20, 400)
    && finiteNumber(metadata.escapeRadius, 2, 10)
    && finiteNumber(metadata.gamma, 0.5, 2.2)
    && integer(metadata.width, 64, 1_200)
    && integer(metadata.height, 64, 1_200)
    && typeof metadata.palette === "string"
    && metadata.palette.length > 0
    && metadata.palette.length <= 64
    && Array.isArray(metadata.colors)
    && metadata.colors.length >= 2
    && metadata.colors.length <= 8
    && metadata.colors.every((color) => typeof color === "string" && /^#[\da-f]{6}$/i.test(color));
}

function pngDimensions(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || !signature.every((value, index) => bytes[index] === value)) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function validImageProof(image: Uint8Array, proof: string, secret: string) {
  if (!/^[0-9a-f]{64}$/i.test(proof)) return false;
  const expected = createHmac("sha256", secret).update(createHash("sha256").update(image).digest()).digest();
  const provided = Buffer.from(proof, "hex");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function clientAddress(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
}

async function claimUpload(secret: string, request: NextRequest) {
  const requestHash = createHash("sha256")
    .update(`${secret}:${clientAddress(request)}`)
    .digest("hex");
  const { rows } = await galleryDatabase().query<{ allowed: boolean }>(
    "select public.fractal_gallery_claim_upload($1) as allowed", [requestHash],
  );
  return rows[0].allowed;
}

export async function GET(request: NextRequest) {
  const config = getGalleryConfig();
  if (!config) {
    return NextResponse.json(
      { error: "The community gallery has not been connected yet." },
      { status: 503 },
    );
  }

  const seed = request.nextUrl.searchParams.get("seed")?.slice(0, 100) || randomUUID();
  const parsedLimit = Number(request.nextUrl.searchParams.get("limit") ?? MAX_PAGE_SIZE);
  const limit = Number.isInteger(parsedLimit) ? Math.max(1, Math.min(parsedLimit, MAX_PAGE_SIZE)) : MAX_PAGE_SIZE;
  const afterOrder = request.nextUrl.searchParams.get("afterOrder");
  const afterId = request.nextUrl.searchParams.get("afterId");
  const hasValidCursor = !!afterOrder
    && /^[\da-f]{32}$/i.test(afterOrder)
    && !!afterId
    && /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(afterId);

  try {
    const { rows } = await galleryDatabase().query<GalleryPageRow>(
      "select * from public.fractal_gallery_page($1, $2, $3, $4)",
      [seed, hasValidCursor ? afterOrder : null, hasValidCursor ? afterId : null, limit + 1],
    );
    const page = rows.slice(0, limit);
    const lastRow = page.at(-1);
    const nextCursor: GalleryCursor | null = rows.length > limit && lastRow
      ? { orderKey: lastRow.order_key, id: lastRow.id }
      : null;

    return NextResponse.json(
      {
        items: page.map((row) => galleryItem(row, config.url, config.bucket)),
        nextCursor,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to load the fractal gallery:", error);
    return NextResponse.json({ error: "The gallery could not be loaded." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const config = getGalleryConfig();
  if (!config) {
    return NextResponse.json(
      { error: "The community gallery has not been connected yet." },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_BYTES + 50_000) {
    return NextResponse.json({ error: "The fractal image is too large." }, { status: 413 });
  }

  try {
    const form = await request.formData();
    const file = form.get("image");
    const rawMetadata = form.get("metadata");
    const proof = form.get("proof");

    if (!(file instanceof File) || typeof rawMetadata !== "string" || rawMetadata.length > 10_000
      || typeof proof !== "string") {
      return NextResponse.json({ error: "A fractal image and its settings are required." }, { status: 400 });
    }
    if (file.type !== "image/png" || file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Gallery images must be PNG files smaller than 6 MB." }, { status: 400 });
    }

    let parsedMetadata: unknown;
    try {
      parsedMetadata = JSON.parse(rawMetadata);
    } catch {
      return NextResponse.json({ error: "The fractal settings are invalid." }, { status: 400 });
    }
    if (!validMetadata(parsedMetadata)) {
      return NextResponse.json({ error: "The fractal settings are invalid." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const dimensions = pngDimensions(bytes);
    if (!dimensions || dimensions.width !== parsedMetadata.width || dimensions.height !== parsedMetadata.height) {
      return NextResponse.json({ error: "The image dimensions do not match the rendered fractal." }, { status: 400 });
    }
    if (!validImageProof(bytes, proof, config.rateLimitSecret)) {
      return NextResponse.json(
        { error: "Gallery images have to come from the fractal generator." },
        { status: 400 },
      );
    }

    if (!await claimUpload(config.rateLimitSecret, request)) {
      return NextResponse.json(
        { error: "You have added several fractals recently. Please wait a few minutes before adding another." },
        { status: 429 },
      );
    }

    const id = randomUUID();
    const storagePath = `images/${id}.png`;
    await galleryStorage().send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: storagePath,
      Body: bytes,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    let row: GalleryRow;
    try {
      const result = await galleryDatabase().query<GalleryRow>(
        `insert into public.fractal_gallery
          (id, storage_path, width, height, family, power, palette, parameters)
         values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
        [id, storagePath, parsedMetadata.width, parsedMetadata.height,
          parsedMetadata.family, parsedMetadata.power, parsedMetadata.palette,
          JSON.stringify(parsedMetadata)],
      );
      row = result.rows[0];
    } catch (error) {
      await galleryStorage().send(new DeleteObjectCommand({
        Bucket: config.bucket, Key: storagePath,
      })).catch((cleanupError) => console.error("Unable to remove unused gallery image:", cleanupError));
      throw error;
    }

    return NextResponse.json(
      { item: galleryItem(row, config.url, config.bucket) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unable to publish a fractal:", error);
    return NextResponse.json({ error: "The fractal could not be added to the gallery." }, { status: 502 });
  }
}
