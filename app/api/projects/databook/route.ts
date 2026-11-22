import { randomUUID } from "node:crypto";
import { rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function PUT(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      (origin !== null && origin !== url.origin)) {
    return new Response(null, { status: 403 });
  }

  const book = await request.json().catch(() => null);
  if (typeof book?.title !== "string" || !Array.isArray(book.tabs) ||
      !book.tabs.every((tab: { rows?: unknown } | null) => Array.isArray(tab?.rows))) {
    return Response.json({ error: "Expected a DataBook document with tabs and rows." }, { status: 400 });
  }

  const source = join(process.cwd(), "app/projects/databook/data/rows.json");
  const temporary = source + "." + randomUUID();
  try {
    await writeFile(temporary, JSON.stringify(book, null, 2) + "\n");
    await rename(temporary, source);
  } finally {
    await rm(temporary, { force: true });
  }
  return Response.json({ ok: true });
}
