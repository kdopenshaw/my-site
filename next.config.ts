import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

const nextConfig = (phase: string): NextConfig => ({
  // Keep `next build` from replacing files used by the running dev server.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://assets.pinterest.com https://widgets.pinterest.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https://i.pinimg.com https://*.supabase.co;
            `.replace(/\n/g, " "),
          },
        ],
      },
    ];
  },
});

export default nextConfig;
