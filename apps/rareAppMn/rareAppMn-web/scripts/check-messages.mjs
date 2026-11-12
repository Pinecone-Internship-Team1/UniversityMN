// Fails when messages/en.json and messages/mn.json don't have the same keys,
// or when a value's {placeholders} differ between the two languages.
// Run: node scripts/check-messages.mjs
import { readFileSync } from "node:fs";

const load = (locale) =>
  JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));

function flatten(object, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, path, out);
    else out[path] = String(value);
  }
  return out;
}

// Top-level argument names only ({count, plural, ...} -> count).
function args(text) {
  const names = new Set();
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "{") {
      if (depth === 0) names.add(/^\{\s*(\w+)/.exec(text.slice(i))?.[1]);
      depth += 1;
    } else if (text[i] === "}") depth -= 1;
  }
  names.delete(undefined);
  return [...names].sort().join(",");
}

const mn = flatten(load("mn"));
const en = flatten(load("en"));
const problems = [];
for (const key of Object.keys(mn)) {
  if (!(key in en)) problems.push(`missing in en: ${key}`);
  else if (args(mn[key]) !== args(en[key])) problems.push(`placeholders differ: ${key}`);
}
for (const key of Object.keys(en)) if (!(key in mn)) problems.push(`missing in mn: ${key}`);

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`messages OK: ${Object.keys(mn).length} keys in each language`);
