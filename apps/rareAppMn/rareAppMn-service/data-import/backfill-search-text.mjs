// Fills (or refreshes) the folded search columns for every university and major, idempotently.
//
//   node data-import/backfill-search-text.mjs --local            # dry run: print what would change
//   node data-import/backfill-search-text.mjs --local --apply    # write, then re-run to check nothing is left to change
//   node data-import/backfill-search-text.mjs --remote --apply   # same against production (--env production)
//
// Run from apps/rareAppMn/rareAppMn-service, after migration 0010 (which adds the columns and the aliases). The API
// keeps these columns up to date on admin edits and the import scripts on imports; run this after any other write
// that changes names or aliases (e.g. SQL by hand), or after changing src/lib/search.ts. Only schools.search_text,
// schools.search_aliases, faculties.search_text and majors.search_text are written; one UPDATE per changed row, in
// one SQL file run by one `wrangler d1 execute`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { facultySearchText, majorSearchText, schoolSearchAliases, schoolSearchText } from '../src/lib/search.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVICE = path.join(HERE, '..');
const OUT = path.join(HERE, 'search-text', 'out');

const args = process.argv.slice(2);
const target = args.includes('--remote') ? 'remote' : args.includes('--local') ? 'local' : null;
if (!target) throw new Error('pass --local or --remote');
const apply = args.includes('--apply');
const targetFlags = target === 'remote' ? ['--remote', '--env', 'production'] : ['--local'];

function wrangler(extra) {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'rareapp-db', ...targetFlags, '--json', ...extra], {
    cwd: SERVICE,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out.slice(out.indexOf('[')));
}

function query(sql) {
  const [result] = wrangler(['--command', sql]);
  if (!result?.success) throw new Error(`query failed: ${sql}`);
  return result.results;
}

const lit = (value) => (value === null || value === undefined ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`);

const schools = query('SELECT id, name, aliases, search_text, search_aliases FROM schools ORDER BY rowid');
const faculties = query('SELECT id, name, search_text FROM faculties ORDER BY rowid');
const majors = query('SELECT id, name, search_text FROM majors ORDER BY rowid');

const statements = [];
for (const school of schools) {
  const aliases = school.aliases ? JSON.parse(school.aliases) : null;
  const text = schoolSearchText(school.name, aliases);
  const aliasText = schoolSearchAliases(aliases);
  if (text === school.search_text && aliasText === school.search_aliases) continue;
  statements.push(
    `UPDATE schools SET search_text = ${lit(text)}, search_aliases = ${lit(aliasText)} WHERE id = ${lit(school.id)};`
  );
  console.log(`school ${school.id}: ${text}  ${aliasText}`);
}
const schoolChanges = statements.length;
/** Queues an UPDATE of `search_text` for each row whose folded name changed; returns how many. */
function refresh(table, rows, fold) {
  const before = statements.length;
  for (const row of rows) {
    const text = fold(row.name);
    if (text !== row.search_text) statements.push(`UPDATE ${table} SET search_text = ${lit(text)} WHERE id = ${lit(row.id)};`);
  }
  return statements.length - before;
}
const facultyChanges = refresh('faculties', faculties, facultySearchText);
const majorChanges = refresh('majors', majors, majorSearchText);

console.log(`search text → ${target}${apply ? ' (apply)' : ' (dry run)'}`);
console.log(`schools: ${schools.length} rows, ${schoolChanges} to update`);
console.log(`faculties: ${faculties.length} rows, ${facultyChanges} to update`);
console.log(`majors: ${majors.length} rows, ${majorChanges} to update`);

if (statements.length === 0) {
  console.log('nothing to change');
} else if (!apply) {
  console.log('dry run: nothing written to the database');
} else {
  mkdirSync(OUT, { recursive: true });
  const sqlFile = path.join(OUT, `${target}-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`);
  writeFileSync(sqlFile, statements.join('\n') + '\n');
  wrangler(['--yes', '--file', sqlFile]);
  console.log(`applied ${statements.length} statement(s) from ${path.relative(SERVICE, sqlFile)}`);
  console.log('re-run without --apply to confirm it now reports no changes');
}
