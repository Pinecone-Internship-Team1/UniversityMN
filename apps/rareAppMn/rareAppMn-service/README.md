# rareAppMn-service

GraphQL API for rareAppMn, running on Cloudflare Workers with D1 (SQLite) via
Drizzle ORM, GraphQL Yoga, and Clerk authentication.

Clerk and Cloudflare D1 are not yet connected to a real account. Everything
below runs fully offline: `wrangler dev` spins up a local D1 simulation, and
`CLERK_SECRET_KEY` / `CLERK_WEBHOOK_SECRET` fall back to permissive local-dev
behavior whenever they're left as their mock defaults (see `src/lib/env.ts`).
These fallbacks, and `POST /dev/seed`, only apply to requests served from
localhost, so a deployed Worker is never permissive even without
`ENVIRONMENT=production`.

## Local setup

```bash
cp .dev.vars.example .dev.vars   # Worker runtime vars (wrangler dev / deploy)
cp .env.example .env             # CLI-side vars (drizzle-kit, etc.)

bun run service:db:generate       # generate migrations from src/db/schema.ts
bun run service:db:migrate:local  # apply them to the local D1 simulation
bun dev                           # start the Worker at http://localhost:8787
```

GraphQL: `POST /graphql` (GraphiQL enabled when `ENVIRONMENT` is not
`production`). Clerk webhooks: `POST /webhooks/clerk`. Health check: `GET
/health`.

## Connecting real accounts later

Setting `ENVIRONMENT=production` is what flips JWT verification, Clerk
webhook signature verification, and the GraphiQL playground to their strict
production behavior (see `src/lib/env.ts`) — no code changes required, only
the config/secrets below.

- **Clerk**: set a real `CLERK_SECRET_KEY` / `CLERK_WEBHOOK_SECRET` in
  `.dev.vars` locally, and via `wrangler secret put CLERK_SECRET_KEY --env
  production` (and the same for `CLERK_WEBHOOK_SECRET`) for the deployed
  environment.
- **D1**: run `wrangler d1 create oyutan-mn-db` against the production
  account, then replace the `database_id` placeholder under `env.production`
  in `wrangler.jsonc`, then `bun run service:db:migrate:remote`.
- Fill in `env.production.vars.ADMIN_CLERK_USER_IDS` and `.ALLOWED_ORIGINS`
  in `wrangler.jsonc` with real values (an empty `ALLOWED_ORIGINS` allows no
  browser origins in production), then `bun run service:deploy:production`.

## Scripts

- `dev` — alias for `service:dev`
- `service:dev` — `wrangler dev` (default/development environment)
- `service:deploy` — `wrangler deploy` (default/development environment)
- `service:deploy:production` — `wrangler deploy --env production`
- `service:db:generate` — `drizzle-kit generate` (reads `src/db/schema.ts`, no DB connection needed)
- `service:db:migrate:local` / `service:db:migrate:remote` — apply generated migrations in `d1/`
