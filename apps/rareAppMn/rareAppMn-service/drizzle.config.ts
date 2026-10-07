import { defineConfig } from 'drizzle-kit';

// `drizzle-kit generate` only reads ./src/db/schema.ts and needs no
// credentials, so it works fully offline. `dbCredentials` is only consulted
// by `drizzle-kit migrate` against a *remote* D1 database over HTTP; local
// migrations are applied with `wrangler d1 migrations apply --local` instead,
// which also needs no connected Cloudflare account.
export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './src/db/schema.ts',
  out: './d1',
  dbCredentials: {
    accountId: process.env['CLOUDFLARE_ACCOUNT_ID'] ?? '',
    databaseId: process.env['CLOUDFLARE_DATABASE_ID'] ?? '',
    token: process.env['CLOUDFLARE_D1_TOKEN'] ?? '',
  },
});
