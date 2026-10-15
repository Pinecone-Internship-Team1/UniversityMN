// Rebuilds the program appendix of GUIDE_MN.md (and the counts line in section 10) from data/*.json.
// Run after you change data/programs.json:   node seed/guide-appendix.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadAll } from './load-data.mjs';
import { SKILL_EXAM } from './exam-tools.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GUIDE = path.join(ROOT, 'GUIDE_MN.md');
const HEAD = '## Хавсралт: Бүх хөтөлбөр';
const ORDER = ['mnums-med', 'mnums-traditional', 'mnums-dental', 'mnums-pharmacy', 'mnums-bio', 'mnums-public-health',
  'mnums-nursing', 'mnums-darkhan', 'mnums-govi-altai', 'mnums-dornogovi', 'mnums-arkhangai'];
const CONF = { confirmed: '✓', likely: '≈', unclear: '?', unknown: '?' };

const data = await loadAll();
const schools = Object.fromEntries(data.schools.map((s) => [s.id, s]));
const money = (v) => (v == null ? '—' : `${(v / 1e6).toFixed(2)} сая`);

function group(subjects, threshold) {
  if (!subjects?.length) return 'тодорхойгүй';
  const names = subjects.map((s) => (s === SKILL_EXAM ? 'Ур чадварын шалгалт†' : s)).join(' / ');
  return threshold ? `**${names}** (${threshold})` : names;
}

function name(p) {
  let n = p.name_mn;
  if (p.status === 'verify') n += ' *(тодруулах)*';
  if (p.status === 'conflicting') n += ' *(эх сурвалж зөрүүтэй)*';
  if (p.status === 'unverified') n += ' *(баталгаажаагүй)*';
  return n;
}

const marks = (p) => [p.priority?.is_priority_field ? 'Т' : null, p.priority?.is_in_demand_field ? 'Э' : null].filter(Boolean).join(', ');
const selection = (p) => ({ list: 'Жагсаалт', direct: 'Шууд' }[p.exam_2026_2027?.selection_type] ?? '—');

const counts = { confirmed: 0, likely: 0, unclear: 0, unknown: 0 };
let total = 0;
const out = [HEAD, '',
  'Эх сурвалж: mnums.edu.mn/admission/requirements (2026-2027 оны босго), сургууль тус бүрийн хуудас (хугацаа, төлбөр), салбар сургуулиудын сайт.', '',
  '- **1-р, 2-р шалгалт:** бүлэг бүрээс хамгийн өндөр оноотой НЭГ хичээл тооцогдоно; хаалтанд тухайн бүлгийн босго. Оноо = хоёр шалгалтын нийлбэр.',
  '- **†** Ур чадварын шалгалтыг АШУҮИС өөрөө авна (биологийн 100 онооны тест, 60+ тэнцэнэ).',
  '- **Сонголт:** Жагсаалт = 8 хүртэл хөтөлбөр сонгож, нийлбэр оноогоор өрсөлдөнө; Шууд = хоёр босгыг хангавал шууд элсэнэ.',
  '- **Тэмдэг:** Т — тэргүүлэх, Э — эрэлттэй. **Жилд:** 2026-2027 оны 1 жилийн албан ёсны төлбөр. **Итгэл:** ✓ албан ёсны хүснэгтээс, ? тодорхойгүй.', ''];
for (const sid of ORDER) {
  const s = schools[sid];
  const rows = data.programs.filter((p) => p.school_id === sid);
  if (!s || !rows.length) continue;
  out.push('', `### ${s.name_mn}${s.type === 'branch' ? ` — ${s.location_mn}` : ''}`, '',
    '| Хөтөлбөр | Түвшин | 1-р шалгалт | 2-р шалгалт | Сонголт | Тэмдэг | Жил | Жилд | Итгэл |',
    '|---|---|---|---|---|---|---|---|---|');
  for (const p of rows) {
    const e = p.exam_2026_2027 ?? {};
    const conf = e.split_confidence ?? 'unknown';
    counts[conf] = (counts[conf] ?? 0) + 1;
    total += 1;
    out.push(`| ${name(p)} | ${p.degree === 'Дэд бакалавр' ? 'Дэд бакалавр' : 'Бакалавр'} | ${group(e.suuri_options, e.suuri_threshold)} | `
      + `${group(e.dagaldah_options, e.dagaldah_threshold)} | ${selection(p)} | ${marks(p)} | ${p.duration_years ?? '—'} | `
      + `${money(p.tuition_2026_2027?.per_year)} | ${CONF[conf] ?? '?'} |`);
  }
}
out.push('', `Нийт: ${total} хөтөлбөр. Салбар сургуулиудын хичээл, босгыг зөвхөн зургаар нийтэлсэн тул тодорхойгүй гэж тэмдэглэв.`, '');

let text = await readFile(GUIDE, 'utf8');
const at = text.indexOf(HEAD);
if (at < 0) throw new Error('appendix heading not found in GUIDE_MN.md');
text = text.slice(0, at) + out.join('\n');
text = text.replace(/^- Нийт \d+ хөтөлбөрөөс .*$/m,
  `- Нийт ${total} хөтөлбөрөөс **${counts.confirmed}** нь албан ёсны хүснэгтээс (✓), **${counts.likely}** магадлалтай (≈), **${counts.unclear + counts.unknown}** нь тодорхойгүй (?).`);
await writeFile(GUIDE, text);
console.log(`GUIDE_MN.md appendix rebuilt: ${total} programs`, counts);
