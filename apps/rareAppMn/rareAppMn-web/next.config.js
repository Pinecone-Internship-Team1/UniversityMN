//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required by @opennextjs/cloudflare to produce a self-contained server bundle.
  output: "standalone",
};

module.exports = nextConfig;
