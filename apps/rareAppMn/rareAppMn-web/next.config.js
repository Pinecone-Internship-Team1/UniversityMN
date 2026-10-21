//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required by @opennextjs/cloudflare to produce a self-contained server bundle.
  output: "standalone",
  // Titles, descriptions and canonical links go in <head> for every visitor,
  // not streamed into <body>: Google ignores a canonical link in <body>, and
  // crawlers and people get the same HTML. School pages wait for their data
  // anyway, so this costs almost nothing.
  htmlLimitedBots: /.*/,
};

module.exports = nextConfig;
