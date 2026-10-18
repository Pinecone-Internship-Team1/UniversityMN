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
  // Programs marked "unverified" (e.g. an old list kept only for reference) are not shown to students.
  const allPrograms = d.programs ?? [];
  const programs = allPrograms.filter((p) => p.status !== 'unverified');
  const hidden = allPrograms.length - programs.length;
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
    : '- Шалгалтын хичээл, босгыг сургуулиас тодруулна уу.'));
  if (someSubjects) out.push('- Бүлэг бүрээс хамгийн өндөр оноотой НЭГ хичээл тооцогдоно.');
  // How seats are filled, only as the data says: "list" = by score order, "direct" = meet the minimums and fit the quota.
  const selOf = (p) => p.exam_2026_2027?.selection_type ?? p.selection_type ?? null;
  const listRows = programs.filter((p) => selOf(p) === 'list');
  const directRows = programs.filter((p) => selOf(p) === 'direct');
  const LIST = '**босго давсан нь элссэн гэсэн үг биш** — суудлыг онооны дарааллаар дүүргэнэ';
  const DIRECT = 'босго бүрийг хангаж, хяналтын тоонд (суудлын тоонд) багтвал шууд элсүүлнэ';
  const names = (rows) => [...new Set(rows.map((p) => p.name_mn))].join(', ');
  if (listRows.length && directRows.length) {
    const [few, many, fewText, manyText] = listRows.length <= directRows.length
      ? [listRows, directRows, LIST, DIRECT] : [directRows, listRows, DIRECT, LIST];
    out.push(few.length <= 5 && few.length < many.length
      ? `- Ихэнх хөтөлбөрт ${manyText}. Харин ${names(few)} хөтөлбөрт ${fewText}.`
      : `- ${directRows.length} хөтөлбөрт ${DIRECT}; ${listRows.length} хөтөлбөрт ${LIST}.`);
  } else if (listRows.length) out.push('- **Босго давсан нь элссэн гэсэн үг биш** — суудлыг онооны дарааллаар дүүргэнэ.');
  else if (directRows.length) out.push('- Босго бүрийг хангаж, хяналтын тоонд (суудлын тоонд) багтвал шууд элсүүлнэ.');
  out.push('');

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
  const feeStart = out.length;
  if (s.tuition_text_mn) out.push(`- **${s.tuition_number ? 'Жилд ойролцоогоор' : 'Төлбөр'}:** ${s.tuition_text_mn}`);
  for (const t of d.tuition_2026_2027 ?? []) {
    if (['stale', 'unverified'].includes(t.status)) continue; // old or unconfirmed prices stay out of the guide
    const cur = !t.currency || t.currency === 'MNT' ? '₮' : ` ${t.currency}`;
    const amt = (v) => `${Number(v).toLocaleString('en-US')}${cur}`;
    const perCredit = t.price_per_credit ?? t.per_credit;
    const perYear = t.price_per_year ?? t.per_year;
    const bits = [
      t.label_mn,
      perCredit ? `1 кредит ${amt(perCredit)}` : null,
      perYear ? `жилд ${amt(perYear)}` : null,
      Number.isFinite(t.amount) ? amt(t.amount) : null,
      t.registration_fee ? `бүртгэлийн хураамж ${amt(t.registration_fee)}` : null,
      t.admission_fee ? `элсэлтийн хураамж ${amt(t.admission_fee)}` : null,
      t.items?.length ? t.items.map((i) => `${i.name_mn} ${amt(i.amount)}`).join('; ') : null,
      t.bank_accounts_mn?.length ? `данс: ${t.bank_accounts_mn.join(', ')}` : null,
      t.note_mn,
    ].filter(Boolean);
    if (bits.length > 1) out.push(`- ${bits.join(' — ')}`);
  }
  const anyFee = programs.some((p) => p.tuition_2026_2027?.per_year || p.tuition_2026_2027?.estimated_per_year);
  if (anyFee) out.push('- Хөтөлбөр тус бүрийн жилийн төлбөр Хавсралтад бий.');
  if (out.length === feeStart) out.push('- 2026-2027 оны сургалтын төлбөрийг сургуулиас тодруулна уу.');
  out.push('');

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
  if (programs.length) out.push(`- Нийт ${programs.length} хөтөлбөрөөс **${counts.confirmed}** нь албан ёсны хүснэгтээс (✓), **${counts.likely}** магадлалтай (≈), **${counts.unclear + counts.unknown}** нь шалгалтын хичээл эсвэл босго тодорхойгүй (?) — эдгээрийг сургуулиас тодруулна уу.`);
  if (estFee) out.push(`- ${estFee} хөтөлбөрийн жилийн төлбөр нь албан ёсны дүн биш, тооцоо (≈).`);
  if (noFee) out.push(`- ${noFee} хөтөлбөрийн төлбөр тодорхойгүй.`);
  out.push('- 2027 оны огноо, босго өөрчлөгдөж болно.', '');

  out.push('## Хавсралт: Бүх хөтөлбөр', '');
  if (!programs.length) {
    out.push(`- 2026-2027 оны хөтөлбөрийн жагсаалтыг одоогоор оруулж чадаагүй — ${u.admission_website ?? u.website ?? 'их сургуулийн сайт'}-аас шалгана уу.`, '');
  }
  if (hidden && programs.length) out.push(`- Баталгаажаагүй ${hidden} хөтөлбөрийг энд оруулаагүй.`, '');
  if (!programs.length) return out.join('\n');
  out.push('- **Босго:** «520 / 500» — 1-р / 2-р шалгалт тус бүрийн доод оноо; «дундаж ≥ 580», «нийлбэр ≥ 1100», «тооцсон ≥ 650» — хоёр шалгалтыг нийлүүлсэн онооны НЭГ доод оноо.');
  const hasSkill = programs.some((p) => [...(p.exam_2026_2027?.suuri_options ?? []), ...(p.exam_2026_2027?.dagaldah_options ?? [])].includes(SKILL_EXAM));
  const legend = [
    hasSkill ? '† Ур чадварын шалгалтыг их сургууль өөрөө авна.' : null,
    estFee ? '**Жилд:** ≈ тэмдэгтэй нь тооцоо.' : null,
    '**Итгэл:** ✓ албан ёсны хүснэгтээс, ≈ магадлалтай, ? тодорхойгүй.',
  ];
  out.push(`- ${legend.filter(Boolean).join(' ')}`, '');
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
