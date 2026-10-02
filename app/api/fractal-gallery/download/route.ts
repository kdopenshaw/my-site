// Same-origin download for a public gallery image.
// The browser cannot save the storage URL directly because that host does not allow it.

import { NextRequest, NextResponse } from "next/server";
import { getGalleryConfig } from "../backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const config = getGalleryConfig();
  if (!config) {
    return NextResponse.json({ error: "The community gallery has not been connected yet." }, { status: 503 });
  }

  const imageUrl = request.nextUrl.searchParams.get("url") ?? "";
  const filename = request.nextUrl.searchParams.get("filename") ?? "fractal.png";
  let target: URL;
  try {
    target = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: "The fractal image could not be downloaded." }, { status: 400 });
  }

  const storage = new URL(config.url);
  const storagePrefix = storage.pathname === "/" ? "/" : `${storage.pathname.replace(/\/$/, "")}/`;
  const safeName = filename.replace(/[^\w.-]+/g, "-").replace(/^[.-]+/, "").slice(0, 80) || "fractal.png";
  if (target.origin !== storage.origin || !target.pathname.startsWith(storagePrefix) || !safeName.endsWith(".png")) {
    return NextResponse.json({ error: "The fractal image could not be downloaded." }, { status: 400 });
  }

  const upstream = await fetch(target);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "The fractal image could not be downloaded." }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
