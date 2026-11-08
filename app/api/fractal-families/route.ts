// Shared named families. URL: /api/fractal-families
// GET returns the public list. POST adds a family anyone can load.

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { galleryDatabase, getGalleryConfig } from "../fractal-gallery/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FRACTAL_FAMILIES = ["mandelbrot", "julia", "burning_ship", "tricorn", "newton"] as const;
const MAX_LABEL = 40;

type FractalFamily = (typeof FRACTAL_FAMILIES)[number];

type FamilyParameters = {
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
  relax?: number;
  width: number;
  height: number;
  palette: string;
  colors: string[];
};

type FamilyRow = {
  id: string;
  label: string;
  parameters: FamilyParameters;
  created_at: string;
};

function integer(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function finiteNumber(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function validParameters(value: unknown): value is FamilyParameters {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const metadata = value as Record<string, unknown>;
  const familyOk =
    typeof metadata.family === "string" && FRACTAL_FAMILIES.includes(metadata.family as FractalFamily);
  const relaxOk = metadata.relax === undefined || finiteNumber(metadata.relax, 0.2, 2);

  return familyOk
    && integer(metadata.power, 2, 8)
    && finiteNumber(metadata.cReal, -2, 2)
    && finiteNumber(metadata.cImag, -2, 2)
    && finiteNumber(metadata.centerX, -10, 10)
    && finiteNumber(metadata.centerY, -10, 10)
    && finiteNumber(metadata.scale, 0.000001, 20)
    && integer(metadata.iterations, 20, 400)
    && finiteNumber(metadata.escapeRadius, 2, 10)
    && finiteNumber(metadata.gamma, 0.5, 2.2)
    && relaxOk
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

function validLabel(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 1 && value.trim().length <= MAX_LABEL;
}

function clientAddress(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
}

async function claimSave(secret: string, request: NextRequest) {
  const requestHash = createHash("sha256")
    .update(`${secret}:family:${clientAddress(request)}`)
    .digest("hex");
  const { rows } = await galleryDatabase().query<{ allowed: boolean }>(
    "select public.fractal_families_claim_save($1) as allowed",
    [requestHash],
  );
  return rows[0].allowed;
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Shared families have not been connected yet." },
      { status: 503 },
    );
  }

  try {
    const { rows } = await galleryDatabase().query<FamilyRow>(
      `select id, label, parameters, created_at
       from public.fractal_families
       order by created_at desc
       limit 80`,
    );
    return NextResponse.json(
      { items: rows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to load shared fractal families:", error);
    return NextResponse.json({ error: "Shared families could not be loaded." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const config = getGalleryConfig();
  if (!process.env.DATABASE_URL || !config) {
    return NextResponse.json(
      { error: "Shared families have not been connected yet." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    if (!validLabel(label) || !validParameters(body?.parameters)) {
      return NextResponse.json({ error: "A family name and valid settings are required." }, { status: 400 });
    }

    if (!await claimSave(config.rateLimitSecret, request)) {
      return NextResponse.json(
        { error: "Several families were saved recently. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const { rows } = await galleryDatabase().query<FamilyRow>(
      `insert into public.fractal_families (label, parameters)
       values ($1, $2)
       returning id, label, parameters, created_at`,
      [label, JSON.stringify({ ...body.parameters, relax: body.parameters.relax ?? 1 })],
    );

    return NextResponse.json({ item: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Unable to save a fractal family:", error);
    return NextResponse.json({ error: "The family could not be saved." }, { status: 502 });
  }
}
