import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  buckets: {
    "fractal-gallery": { access: "public_read" },
  },
});
