// Run after `opennextjs-cloudflare build`, before deploying.
//
// OpenNext copies the .env files into the Worker bundle
// (.open-next/cloudflare/next-env.mjs) once per mode: production, development
// and test. The development copy is .env.local, which holds the Clerk test
// keys for `next dev`. The deployed Worker only reads the production copy
// (NEXTJS_ENV is unset), so the other two are emptied here. Then the whole
// bundle is checked: no Clerk secret key (sk_test_/sk_live_; the live one is a
// Worker secret) and no test publishable key may be left in it.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const appDir = join(import.meta.dirname, "..");
const outDir = join(appDir, ".open-next");
const envFile = join(outDir, "cloudflare", "next-env.mjs");

const { production } = await import(pathToFileURL(envFile).href);
writeFileSync(
  envFile,
  `export const production = ${JSON.stringify(production)};\n` +
    "export const development = {};\n" +
    "export const test = {};\n",
);

// Real keys are long base64 strings; this skips Clerk's own `pk_test_` checks.
const KEY_PATTERN = /\b(?:sk_(?:test|live)|pk_test)_[A-Za-z0-9]{20,}/g;
const found = [];
const entries = readdirSync(outDir, { recursive: true, withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile()) continue;
  const file = join(entry.parentPath, entry.name);
  for (const [key] of readFileSync(file, "latin1").matchAll(KEY_PATTERN)) {
    found.push(`${relative(appDir, file)}: ${key.slice(0, 8)}…`);
  }
}

if (found.length) {
  console.error("Clerk keys that must not be deployed are in the bundle:");
  for (const line of new Set(found)) console.error(`  ${line}`);
  // Nx loads the app's .env.local (test keys) into every task's environment,
  // where it beats .env.production.local; `bun run web:deploy` turns that off.
  console.error(
    "Deploy with `bun run web:deploy` (NX_LOAD_DOT_ENV_FILES=false), and keep the live key in .env.production.local.",
  );
  process.exit(1);
}
console.log("Bundled env: production only; no Clerk secret or test keys.");
