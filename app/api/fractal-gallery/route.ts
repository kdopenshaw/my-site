import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_BUCKET = "fractal-gallery";
const MAX_IMAGE_BYTES = 6_000_000;
const MAX_PAGE_SIZE = 10;

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
};

type GalleryPageRow = GalleryRow & {
  order_key: string;
};

type GalleryCursor = { orderKey: string; id: string };

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_FRACTAL_BUCKET ?? DEFAULT_BUCKET;

  if (!url || !key) return null;
  return { url, key, bucket };
}

function adminHeaders(key: string, contentType = "application/json") {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": contentType,
  };
}

function publicImageUrl(url: string, bucket: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
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
    && integer(metadata.iterations, 10, 1_000)
    && finiteNumber(metadata.escapeRadius, 2, 100)
    && finiteNumber(metadata.gamma, 0.1, 5)
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

function clientAddress(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
}

async function claimUpload(url: string, key: string, request: NextRequest) {
  const requestHash = createHash("sha256")
    .update(`${key}:${clientAddress(request)}`)
    .digest("hex");
  const response = await fetch(`${url}/rest/v1/rpc/fractal_gallery_claim_upload`, {
    method: "POST",
    headers: adminHeaders(key),
    body: JSON.stringify({ p_request_hash: requestHash }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Upload limiter returned ${response.status}`);
  return await response.json() as boolean;
}

async function removeUpload(url: string, key: string, bucket: string, path: string) {
  await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}`, {
    method: "DELETE",
    headers: adminHeaders(key),
    body: JSON.stringify({ prefixes: [path] }),
  }).catch(() => undefined);
}

export async function GET(request: NextRequest) {
  const config = getSupabaseConfig();
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
    const response = await fetch(`${config.url}/rest/v1/rpc/fractal_gallery_page`, {
      method: "POST",
      headers: adminHeaders(config.key),
      body: JSON.stringify({
        p_seed: seed,
        p_after_order: hasValidCursor ? afterOrder : null,
        p_after_id: hasValidCursor ? afterId : null,
        p_limit: limit + 1,
      }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Gallery query returned ${response.status}`);
    const rows = await response.json() as GalleryPageRow[];
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
  const config = getSupabaseConfig();
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

    if (!(file instanceof File) || typeof rawMetadata !== "string" || rawMetadata.length > 10_000) {
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

    if (!await claimUpload(config.url, config.key, request)) {
      return NextResponse.json(
        { error: "You have added several fractals recently. Please wait a few minutes before adding another." },
        { status: 429 },
      );
    }

    const id = randomUUID();
    const storagePath = `images/${id}.png`;
    const uploadResponse = await fetch(
      `${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}/${storagePath}`,
      {
        method: "POST",
        headers: {
          ...adminHeaders(config.key, "image/png"),
          "x-upsert": "false",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
        body: bytes,
      },
    );

    if (!uploadResponse.ok) throw new Error(`Storage upload returned ${uploadResponse.status}`);

    const insertResponse = await fetch(`${config.url}/rest/v1/fractal_gallery`, {
      method: "POST",
      headers: {
        ...adminHeaders(config.key),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        id,
        storage_path: storagePath,
        width: parsedMetadata.width,
        height: parsedMetadata.height,
        family: parsedMetadata.family,
        power: parsedMetadata.power,
        palette: parsedMetadata.palette,
        parameters: parsedMetadata,
      }),
      cache: "no-store",
    });

    if (!insertResponse.ok) {
      await removeUpload(config.url, config.key, config.bucket, storagePath);
      throw new Error(`Gallery insert returned ${insertResponse.status}`);
    }

    const [row] = await insertResponse.json() as GalleryRow[];
    return NextResponse.json(
      { item: galleryItem(row, config.url, config.bucket) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unable to publish a fractal:", error);
    return NextResponse.json({ error: "The fractal could not be added to the gallery." }, { status: 502 });
  }
}
