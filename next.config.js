/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.instagram.com;
              style-src 'self' 'unsafe-inline' https://www.instagram.com;
              frame-src https://www.instagram.com;
              img-src 'self' data: https://www.instagram.com;
            `.replace(/\n/g, " "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
