import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
     remotePatterns: [
    {
      protocol: "https",
      hostname: "*",
      pathname: "/**",
    },
  ],
  },
   reactStrictMode: true,

  async headers() {
    return [
      {
        // HTML & routes only (static assets cache থাকবে)
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
