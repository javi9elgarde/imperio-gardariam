import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/imperio-gardariam",
  assetPrefix: "/imperio-gardariam/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
