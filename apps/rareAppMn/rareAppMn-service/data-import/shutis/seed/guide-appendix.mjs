// Rebuilds the program appendix of GUIDE_MN.md (and the counts line in section 10) from data/*.json.
// Run after you change data/programs.json:   node seed/guide-appendix.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadAll } from './load-data.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GUIDE = path.join(ROOT, 'GUIDE_MN.md');
const ORDER = ['must-bas', 'must-gkhs', 'must-guus', 'must-mekhts', 'must-ms', 'must-mkhts', 'must-nkhs',
  'must-khkhuds', 'must-khshus', 'must-ekhs', 'must-dats', 'must-etsds', 'must-omtds'];
const CONF = { confirmed: '✓', likely: '≈', unclear: '?', unknown: '?' };
const HEAD = '## Хавсралт: Бүх бакалаврын хөтөлбөр';

const data = await loadAll();
const schools = Object.fromEntries(data.schools.map((s) => [s.id, s]));
const mil = (v) => (v / 1e6).toFixed(1);
const isForeign = (p) => Boolean(p.joint_program) && !['Монгол', undefined, null].includes(p.joint_program.country_mn);

function exam(p) {
  const e = p.exam_2026_2027 ?? {};
  const conf = e.split_confidence ?? 'unknown';
  if (['confirmed', 'likely'].includes(conf) && e.suuri_options?.length) {
    const su = e.suuri_options;
    const dag = (e.dagaldah_options ?? []).filter((x) => !su.includes(x));
    if ((e.dagaldah_options ?? []).some((x) => su.includes(x))) dag.push('нөгөө суурь хичээл');
    let s = `**${su.join(' / ')}**`;
    if (e.suuri_threshold) s += ` (${e.suuri_threshold})`;
    s += ` → ${dag.length ? dag.join(' / ') : '—'}`;
    if (e.dagaldah_threshold) s += ` (${e.dagaldah_threshold})`;
    return s;
  }
  if (conf === 'unclear' && e.subjects_to_prepare?.length) return `${e.subjects_to_prepare.join(', ')} *(хэсэгчлэн)*`;
  return 'тодорхойгүй';
}

function name(p) {
  let n = p.name_mn;
  const branch = schools[p.school_id].type === 'branch';
  const conf = p.exam_2026_2027?.split_confidence ?? 'unknown';
  if (!branch && p.in_2026_regulation === false) n += conf === 'unknown' ? ' *(2026 оны журамд олдсонгүй)*' : ' *(сургуулийн сайтаас)*';
  if (p.status === 'verify') n += ' *(тодруулах)*';
  if (p.status === 'conflicting') n += ' *(эх сурвалж зөрүүтэй)*';
  return n;
}

function tuition(p) {
  const t = p.tuition_2026_2027?.estimated_per_year;
  if (!t) return '—';
  return t.min === t.max ? `${mil(t.min)} сая` : `${mil(t.min)}–${mil(t.max)} сая`;
}

const marks = (p) => [p.priority?.is_priority_field ? 'Т' : null, p.priority?.is_in_demand_field ? 'Э' : null].filter(Boolean).join(', ');

const counts = { confirmed: 0, likely: 0, unclear: 0, unknown: 0 };
let total = 0;
let foreign = 0;
const out = [HEAD, '',
  'Эх сурвалж: ШУТИС-ийн 2026-2027 оны элсэлтийн журмын хавсралт (скан PDF), must.edu.mn/mn/pages/761, сургуулиудын сайт (mes, sm, sas), must.edu.mn/mn/page/700, салбар сургуулиудын элсэлтийн хуудас, eit.edu.mn.', '',
  '- **Суурь → Дагалдах:** суурь жагсаалтаас НЭГ, дагалдахаас НЭГ шалгалт; хаалтанд босго. "нөгөө суурь хичээл" = суурьт сонгоогүй нөгөө хичээлээ дагалдахаар өгч болно.',
  '- **Тэмдэг:** Т — тэргүүлэх, Э — эрэлттэй. **Итгэл:** ✓ тод уншигдсан, ≈ магадлалтай, ? хэсэгчлэн/тодорхойгүй.',
  '- **Жилд:** 2026-2027 оны төлбөрийн тооцоо (ойролцоо). Гадаадтай хамтарсан хөтөлбөрт зөвхөн ШУТИС-д суралцах жилийн тооцоо.', ''];
for (const sid of ORDER) {
  const s = schools[sid];
  let rows = data.programs.filter((p) => p.school_id === sid);
  if (!rows.length) continue;
  if (s.type !== 'branch') rows = [...rows.filter((p) => !isForeign(p)), ...rows.filter(isForeign)];
  out.push('', `### ${s.name_mn} (${s.abbr_mn})${s.type === 'branch' ? ` — ${s.location_mn}` : ''}`, '',
    '| Индекс | Хөтөлбөр | Суурь → Дагалдах | Тэмдэг | Жил/кредит | Жилд | Итгэл |', '|---|---|---|---|---|---|---|');
  for (const p of rows) {
    const conf = p.exam_2026_2027?.split_confidence ?? 'unknown';
    counts[conf] = (counts[conf] ?? 0) + 1;
    total += 1;
    foreign += isForeign(p) ? 1 : 0;
    const yrs = typeof p.duration_years === 'number' ? String(p.duration_years) : '—';
    out.push(`| ${p.code || '—'} | ${name(p)} | ${exam(p)} | ${marks(p)} | ${yrs} / ${p.credits || '—'} | ${tuition(p)} | ${CONF[conf] ?? '?'} |`);
  }
}
out.push('', `Нийт: ${total} хөтөлбөр (үүнээс гадаадын их сургуультай хамтарсан ${foreign}). Салбар сургуулиудын босго 430; шалгалтын хичээл нь нийтлэгдээгүй.`, '');

let text = await readFile(GUIDE, 'utf8');
const at = text.indexOf(HEAD);
if (at < 0) throw new Error('appendix heading not found in GUIDE_MN.md');
text = text.slice(0, at) + out.join('\n');
text = text.replace(/^- Нийт \d+ хөтөлбөрөөс .*$/m,
  `- Нийт ${total} хөтөлбөрөөс **${counts.confirmed}** нь шалгалтын хичээл, босго тод (✓), **${counts.likely}** нь магадлалтай (≈), **${counts.unclear}** нь хэсэгчлэн, **${counts.unknown}** нь тодорхойгүй (?). Ихэнхийг 2026-2027 оны журмын скан PDF-ээс, үлдсэнийг сургуулиудын сайтаас уншсан.`);
await writeFile(GUIDE, text);
console.log(`GUIDE_MN.md appendix rebuilt: ${total} programs`, counts);
