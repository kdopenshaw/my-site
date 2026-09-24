import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { S3Client } from "@aws-sdk/client-s3";

export function getGalleryConfig() {
  const url = process.env.AWS_ENDPOINT_URL_S3?.replace(/\/$/, "");
  const rateLimitSecret = process.env.GALLERY_RATE_LIMIT_SECRET ?? process.env.AWS_SECRET_ACCESS_KEY;
  if (!process.env.DATABASE_URL || !url || !process.env.AWS_ACCESS_KEY_ID
    || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !rateLimitSecret) return null;
  return { url, rateLimitSecret, bucket: process.env.FRACTAL_BUCKET ?? "fractal-gallery" };
}

let pool: Pool | undefined;
let storage: S3Client | undefined;

export function galleryDatabase() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5,
      connectionTimeoutMillis: 10_000, idleTimeoutMillis: 10_000 });
    pool.on("error", (error) => console.error("Gallery database connection error:", error));
    attachDatabasePool(pool);
  }
  return pool;
}

export function galleryStorage() {
  storage ??= new S3Client({ forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" });
  return storage;
}
