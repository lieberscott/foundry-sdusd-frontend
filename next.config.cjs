/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: "/foundry-sdusd-frontend", // Replace with your actual GitHub repo name
};

module.exports = nextConfig;
