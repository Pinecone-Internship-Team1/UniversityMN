//@ts-check
const createNextIntlPlugin = require("next-intl/plugin");

// Points next-intl at src/i18n/request.ts, which picks the language from the
// NEXT_LOCALE cookie (no locale in the URL).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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

module.exports = withNextIntl(nextConfig);
