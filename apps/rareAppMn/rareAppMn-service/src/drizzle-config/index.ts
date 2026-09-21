import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { defineConfig } from 'drizzle-kit';

// drizzle-kit resolves `schema` relative to the process's current working
// directory, not this file's location, so it's built as an absolute path
// to stay correct regardless of where the CLI is invoked from.
const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Schema changes are authored as SQL migrations under
// apps/rareAppMn/rareAppMn-web/migrations and applied with
// `wrangler d1 migrations apply` — this config exists only so drizzle-kit
// tooling (e.g. `drizzle-kit studio` for browsing data) can find the
// runtime schema and connect to the same D1 database.
//
// Studio needs a scoped Cloudflare API token (Account: D1 Edit), not the
// `wrangler login` OAuth session — create one at
// https://dash.cloudflare.com/profile/api-tokens and set
// CLOUDFLARE_D1_TOKEN before running `bun run service:studio`.
export default defineConfig({
  schema: path.join(currentDir, '../db/schema.ts'),
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env['CLOUDFLARE_ACCOUNT_ID'] ?? '',
    databaseId: 'a47a35c3-26d4-4e74-9c50-89548aec591b',
    token: process.env['CLOUDFLARE_D1_TOKEN'] ?? '',
  },
});
