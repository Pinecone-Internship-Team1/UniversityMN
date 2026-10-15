// Builds unis/<slug>/GUIDE_MN.md — a plain-Mongolian guide for 12th graders — from that university's data/*.json.
// Usage: node seed/build-guide.mjs [slug]     (no slug = every university)
// Re-run after any data change (e.g. gap filling).
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { listUnis, loadAll, UNIS_DIR } from './load-data.mjs';
import { SKILL_EXAM, formulaMn, scoreKind, thresholdText } from './exam-tools.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONF = { confirmed: '✓', likely: '≈', unclear: '?', unknown: '?' };
const money = (v) => (Number.isFinite(v) ? `${(v / 1e6).toFixed(2)} сая ₮` : '—');
const cell = (v) => String(v ?? '—').replace(/\|/g, '/').replace(/\n/g, ' ');
const list = (xs) => (xs?.length ? xs.map((x) => (x === SKILL_EXAM ? 'Ур чадварын шалгалт†' : x)).join(' / ') : 'тодорхойгүй');

function formulaText(programs) {
  const kinds = new Map();
  for (const p of programs) {
    const e = p.exam_2026_2027;
    if (!e || !['confirmed', 'likely'].includes(e.split_confidence)) continue;
    const w = e.weights ?? { suuri: 0.7, dagaldah: 0.3 };
    const key = `${w.suuri}/${w.dagaldah}/${e.threshold_type}/${e.formula_known !== false}`;
    const k = kinds.get(key) ?? { n: 0, likely: 0 };
    k.n += 1;
    if (e.split_confidence === 'likely') k.likely += 1;
    kinds.set(key, k);
  }
  const lines = [];
  for (const [key, { n, likely }] of [...kinds.entries()].sort((a, b) => b[1].n - a[1].n)) {
    const [w1, w2, type, known] = key.split('/');
    const weights = { suuri: Number(w1), dagaldah: Number(w2) };
    const kind = scoreKind(weights);
    const t = type === 'total'
      ? `${kind} онооны НЭГ босготой (${kind} оноо ≥ босго)`
      : 'шалгалт тус бүр өөрийн босготой (аль нэг нь доош бол элсэх эрхгүй)';
    const note = likely ? ` (${likely} нь албан ёсны хүснэгтээс биш — магадлалтай)` : '';
    const formula = known === 'true' ? `оноо = ${formulaMn(weights)}` : 'онооны томьёог сургууль зарлаагүй';
    lines.push(`- **${n} хөтөлбөр${note}:** ${formula}; ${t}.`);
  }
  return lines.join('\n');
}

function build(slug, d) {
  const u = d.university?.[0] ?? {};
  const s = u.sidebar_suggestion ?? {};
  const schools = Object.fromEntries((d.schools ?? []).map((x) => [x.id, x]));
  const programs = d.programs ?? [];
  const adm = (d.admission_2026 ?? [])[0] ?? {};
  const out = [];
  const short = u.short_name_mn ?? slug;

  out.push(`# ${short}-д элсэх гарын авлага — 12-р анги төгсөгчдөд`, '');
  out.push(`> ${u.name_mn ?? short}${u.name_en ? ` (${u.name_en})` : ''}.`);
  out.push(`> Мэдээллийг ${u.verified_at ?? ''}-нд албан ёсны сайт болон мэдээний сайтаас цуглуулав.`);
  out.push(`> **Анхаар:** 2027 оны элсэлтийн огноо, босго хараахан зарлагдаагүй — доорх нь 2026-2027 оны элсэлтийн мэдээлэл. Бүртгүүлэхээсээ өмнө ${u.admission_website ?? u.website ?? 'их сургуулийн сайт'}-аас шалгаарай.`, '', '---', '');

  out.push('## 1. Товчхондоо', '', u.overview_mn ?? '—', '');
  out.push('## 2. Оноо хэрхэн тооцдог вэ', '');
  // The university-level formula text; skipped when it only says "unknown" but some programs are now filled.
  const knownRows = programs.some((p) => ['confirmed', 'likely'].includes(p.exam_2026_2027?.split_confidence));
  const sayUnknown = /тодорхойгүй|чадаагүй|олдсонгүй/iu.test(adm.score_formula_mn ?? '');
  if (adm.score_formula_mn && !(knownRows && sayUnknown)) out.push(adm.score_formula_mn, '');
  const someSubjects = programs.some((p) => p.exam_2026_2027?.suuri_options?.length);
  out.push(formulaText(programs) || (someSubjects
    ? '- Хөтөлбөр бүрийн шалгалтын хичээл Хавсралтад бий; 2026-2027 оны босгыг сургуулиас тодруулна уу.'
    : '- Шалгалтын хичээл, босгыг сургуулиас тодруулна уу.'), '');
  out.push('- Бүлэг бүрээс хамгийн өндөр оноотой НЭГ хичээл тооцогдоно. **Босго давсан нь элссэн гэсэн үг биш** — суудлыг онооны дарааллаар дүүргэнэ.', '');

  const steps = adm.steps ?? [];
  if (steps.length || adm.steps_mn?.length) {
    out.push('## 3. Элсэх алхам', '');
    if (steps.length) steps.forEach((st, i) => out.push(`${i + 1}. **${st.title_mn ?? ''}** — ${st.detail_mn ?? ''}`));
    else adm.steps_mn.forEach((st, i) => out.push(`${i + 1}. ${st}`));
    if (adm.system_url) out.push('', `Бүртгэлийн систем: ${adm.system_url}`);
    out.push('');
  }

  const dates = (d.admission_dates ?? []).filter((r) => (r.start || r.end) && !['stale', 'unverified'].includes(r.status));
  if (dates.length) {
    out.push('## 4. Он сарын хуваарь', '', '| Юу | Эхлэх | Дуусах |', '|---|---|---|');
    for (const r of dates) out.push(`| ${cell(r.event_mn)} | ${cell(r.start)} | ${cell(r.end)} |`);
    out.push('');
  }

  out.push('## 5. Сургалтын төлбөр', '');
  if (s.tuition_text_mn) out.push(`- **Жилд ойролцоогоор:** ${s.tuition_text_mn}`);
  for (const t of d.tuition_2026_2027 ?? []) {
    const bits = [
      t.label_mn,
      t.price_per_credit ? `1 кредит ${t.price_per_credit.toLocaleString('en-US')}₮` : null,
      t.price_per_year ? `жилд ${t.price_per_year.toLocaleString('en-US')}₮` : null,
      t.note_mn,
    ].filter(Boolean);
    if (bits.length) out.push(`- ${bits.join(' — ')}`);
  }
  out.push('- Хөтөлбөр тус бүрийн жилийн төлбөр Хавсралтад бий.', '');

  if (d.scholarships?.length) {
    out.push('## 6. Тэтгэлэг, хөнгөлөлт', '', '| Нэр | Хэмжээ | Хэнд | Хугацаа |', '|---|---|---|---|');
    for (const r of d.scholarships) out.push(`| ${cell(r.name_mn)} | ${cell(r.coverage_mn)} | ${cell(r.requirements_mn)} | ${cell(r.deadline_mn)} |`);
    out.push('');
  }

  out.push('## 7. Оюутны байр', '');
  if (s.dorm_howto_mn) out.push(s.dorm_howto_mn, '');
  const buildings = (d.dorms ?? []).filter((r) => r.record_type === 'building');
  if (buildings.length) {
    out.push('| Байр | Байршил | Ор | Үнэ |', '|---|---|---|---|');
    for (const b of buildings) {
      const when = [b.price_year, b.status === 'stale' ? 'хуучин мэдээлэл' : null].filter(Boolean).join(', ');
      const price = b.price_per_year
        ? `${b.price_per_year.toLocaleString('en-US')}₮${when ? ` (${when})` : ''}`
        : (b.price_per_year_note_mn ?? '—');
      out.push(`| ${cell(b.name_mn)} | ${cell(b.location_mn)} | ${cell(b.capacity)} | ${cell(price)} |`);
    }
    out.push('');
  }

  out.push('## 8. Холбоо барих', '');
  const c = u.contacts ?? {};
  if (c.address_mn) out.push(`- **Хаяг:** ${c.address_mn}`);
  if (c.phones?.length) out.push(`- **Утас:** ${c.phones.join(', ')}`);
  const emails = c.emails ? Object.values(c.emails).filter(Boolean) : [];
  if (emails.length) out.push(`- **И-мэйл:** ${emails.join(', ')}`);
  if (u.website) out.push(`- **Сайт:** ${u.website}`);
  const branches = (d.schools ?? []).filter((x) => x.type === 'branch');
  if (branches.length) {
    out.push('', '| Салбар | Байршил | Утас |', '|---|---|---|');
    for (const b of branches) out.push(`| ${cell(b.name_mn)} | ${cell(b.location_mn)} | ${cell(b.contacts?.phone)} |`);
  }
  out.push('');

  const counts = { confirmed: 0, likely: 0, unclear: 0, unknown: 0 };
  for (const p of programs) counts[p.exam_2026_2027?.split_confidence ?? 'unknown'] += 1;
  const noFee = programs.filter((p) => { const t = p.tuition_2026_2027 ?? {}; return !t.per_year && !t.estimated_per_year; }).length;
  const estFee = programs.filter((p) => { const t = p.tuition_2026_2027 ?? {}; return !t.per_year && t.estimated_per_year; }).length;
  out.push('## 9. Анхааруулга', '');
  out.push(`- Нийт ${programs.length} хөтөлбөрөөс **${counts.confirmed}** нь албан ёсны хүснэгтээс (✓), **${counts.likely}** магадлалтай (≈), **${counts.unclear + counts.unknown}** нь шалгалтын хичээл эсвэл босго тодорхойгүй (?) — эдгээрийг сургуулиас тодруулна уу.`);
  if (estFee) out.push(`- ${estFee} хөтөлбөрийн жилийн төлбөр нь албан ёсны дүн биш, тооцоо (≈).`);
  if (noFee) out.push(`- ${noFee} хөтөлбөрийн төлбөр тодорхойгүй.`);
  out.push('- 2027 оны огноо, босго өөрчлөгдөж болно.', '');

  out.push('## Хавсралт: Бүх хөтөлбөр', '');
  out.push('- **Босго:** «520 / 500» — 1-р / 2-р шалгалт тус бүрийн доод оноо; «дундаж ≥ 580», «нийлбэр ≥ 1100», «тооцсон ≥ 650» — хоёр шалгалтыг нийлүүлсэн онооны НЭГ доод оноо.');
  out.push('- † Ур чадварын шалгалтыг их сургууль өөрөө авна. **Жилд:** ≈ тэмдэгтэй нь тооцоо. **Итгэл:** ✓ албан ёсны хүснэгтээс, ≈ магадлалтай, ? тодорхойгүй.', '');
  const bySchool = new Map();
  for (const p of programs) {
    if (!bySchool.has(p.school_id)) bySchool.set(p.school_id, []);
    bySchool.get(p.school_id).push(p);
  }
  for (const [sid, rows] of bySchool) {
    const sc = schools[sid] ?? {};
    out.push(`### ${sc.name_mn ?? sid}${sc.type === 'branch' ? ` — ${sc.location_mn ?? ''}` : ''}`, '');
    out.push('| Хөтөлбөр | Түвшин | 1-р / суурь | 2-р / дагалдах | Босго | Жил | Жилд | Итгэл |', '|---|---|---|---|---|---|---|---|');
    for (const p of rows) {
      const e = p.exam_2026_2027 ?? {};
      const extra = Object.entries(e.subject_minimums ?? {}).map(([s, m]) => ` + ${s} ≥ ${m}`).join('');
      const thr = thresholdText({ threshold1: e.suuri_threshold, threshold2: e.dagaldah_threshold, weights: e.weights, thresholdType: e.threshold_type }) + extra;
      const t = p.tuition_2026_2027 ?? {};
      const est = t.estimated_per_year;
      const fee = t.per_year ?? (est ? `≈ ${money(est.typical ?? est.max)}` : null);
      const flag = p.status === 'verify' ? ' *(тодруулах)*' : p.status === 'conflicting' ? ' *(зөрүүтэй)*' : p.status === 'unverified' ? ' *(баталгаажаагүй)*' : '';
      out.push(`| ${cell(p.name_mn)}${flag} | ${cell(p.degree)} | ${list(e.suuri_options)} | ${list(e.dagaldah_options?.filter((x) => !(e.swap_subjects ?? []).includes(x)))} | ${thr} | ${cell(p.duration_years)} | ${typeof fee === 'number' ? money(fee) : cell(fee)} | ${CONF[e.split_confidence] ?? '?'} |`);
    }
    out.push('');
  }
  return out.join('\n');
}

const only = process.argv[2];
for (const slug of only ? [only] : await listUnis()) {
  const d = await loadAll(slug);
  const file = path.join(UNIS_DIR, slug, 'GUIDE_MN.md');
  await writeFile(file, build(slug, d));
  console.log(`wrote ${path.relative(ROOT, file)} (${d.programs?.length ?? 0} programs)`);
}
