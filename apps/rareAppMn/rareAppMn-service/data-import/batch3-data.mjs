// Checks the batch-3 dataset (data-import/batch3/unis/<slug>/data), runs its reference score check and rebuilds each
// university's GUIDE_MN.md.
//
//   node data-import/batch3-data.mjs check [slug]                     # validate; exit code 1 on problems
//   node data-import/batch3-data.mjs guide [slug]                     # rebuild unis/<slug>/GUIDE_MN.md
//   node data-import/batch3-data.mjs eligibility <slug> Математик=620 "Англи хэл"=540
//
// Same rules as the dataset's seed/load-data.mjs, seed/eligibility.mjs and seed/exam-tools.mjs (byte-identical to the
// next-unis ones, so they are reused from next-unis-data.mjs) and its updated seed/build-guide.mjs, ported below.
// Claude Code's permission check blocks running downloaded scripts.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKILL_EXAM, VERDICT, checkProgram, formulaMn, scoreKind, thresholdText, validate } from './next-unis-data.mjs';

export const UNIS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'batch3', 'unis');
export { applyExam, buildExam, checkProgram, VERDICT } from './next-unis-data.mjs';

const isScored = (exam) => ['confirmed', 'likely'].includes(exam?.split_confidence);

// -------------------------------------------------------------------------------------------- loading

export function listUnis() {
  return readdirSync(UNIS_DIR)
    .sort()
    .filter((name) => {
      try {
        return statSync(path.join(UNIS_DIR, name, 'data')).isDirectory();
      } catch {
        return false;
      }
    });
}

const dataFiles = (slug) =>
  readdirSync(path.join(UNIS_DIR, slug, 'data'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => ({ name: file.replace(/\.json$/, ''), file: path.join(UNIS_DIR, slug, 'data', file) }));

/** `{ programs: [...], schools: [...], ... }` for one university. */
export function loadAll(slug) {
  return Object.fromEntries(dataFiles(slug).map(({ name, file }) => [name, JSON.parse(readFileSync(file, 'utf8')).records]));
}

/** Reads one data file whole (`{ _meta, records }`), so it can be edited and written back. */
export function readFile(slug, name) {
  return JSON.parse(readFileSync(path.join(UNIS_DIR, slug, 'data', `${name}.json`), 'utf8'));
}

export function writeFile(slug, name, json) {
  writeFileSync(path.join(UNIS_DIR, slug, 'data', `${name}.json`), JSON.stringify(json, null, 2) + '\n');
}

// ---------------------------------------------------------------------------------------------- guide

const CONFIDENCE_MARK = { confirmed: '✓', likely: '≈', unclear: '?', unknown: '?' };
const money = (value) => (Number.isFinite(value) ? `${(value / 1e6).toFixed(2)} сая ₮` : '—');
const cell = (value) => String(value ?? '—').replace(/\|/g, '/').replace(/\n/g, ' ');
const subjectList = (subjects) =>
  subjects?.length ? subjects.map((s) => (s === SKILL_EXAM ? 'Ур чадварын шалгалт†' : s)).join(' / ') : 'тодорхойгүй';

/** One line per kind of score rule in use, e.g. "- **25 хөтөлбөр:** онооны томьёог сургууль зарлаагүй; …". */
function formulaLines(programs) {
  const kinds = new Map();
  for (const program of programs) {
    const exam = program.exam_2026_2027;
    if (!isScored(exam)) continue;
    const weights = exam.weights ?? { suuri: 0.7, dagaldah: 0.3 };
    const key = `${weights.suuri}/${weights.dagaldah}/${exam.threshold_type}/${exam.formula_known !== false}`;
    const kind = kinds.get(key) ?? { n: 0, likely: 0 };
    kind.n += 1;
    if (exam.split_confidence === 'likely') kind.likely += 1;
    kinds.set(key, kind);
  }
  return [...kinds.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .map(([key, { n, likely }]) => {
      const [w1, w2, type, known] = key.split('/');
      const weights = { suuri: Number(w1), dagaldah: Number(w2) };
      const kind = scoreKind(weights);
      const rule =
        type === 'total'
          ? `${kind} онооны НЭГ босготой (${kind} оноо ≥ босго)`
          : 'шалгалт тус бүр өөрийн босготой (аль нэг нь доош бол элсэх эрхгүй)';
      const note = likely ? ` (${likely} нь албан ёсны хүснэгтээс биш — магадлалтай)` : '';
      const formula = known === 'true' ? `оноо = ${formulaMn(weights)}` : 'онооны томьёог сургууль зарлаагүй';
      return `- **${n} хөтөлбөр${note}:** ${formula}; ${rule}.`;
    })
    .join('\n');
}

export function buildGuide(slug, d) {
  const u = d.university?.[0] ?? {};
  const sidebar = u.sidebar_suggestion ?? {};
  const schools = new Map((d.schools ?? []).map((s) => [s.id, s]));
  // Programs marked "unverified" (e.g. an old list kept only for reference) are not shown to students.
  const allPrograms = d.programs ?? [];
  const programs = allPrograms.filter((p) => p.status !== 'unverified');
  const hidden = allPrograms.length - programs.length;
  const admission = (d.admission_2026 ?? [])[0] ?? {};
  const short = u.short_name_mn ?? slug;
  const site = u.admission_website ?? u.website ?? 'их сургуулийн сайт';
  const out = [];

  out.push(`# ${short}-д элсэх гарын авлага — 12-р анги төгсөгчдөд`, '');
  out.push(`> ${u.name_mn ?? short}${u.name_en ? ` (${u.name_en})` : ''}.`);
  out.push(`> Мэдээллийг ${u.verified_at ?? ''}-нд албан ёсны сайт болон мэдээний сайтаас цуглуулав.`);
  out.push(
    `> **Анхаар:** 2027 оны элсэлтийн огноо, босго хараахан зарлагдаагүй — доорх нь 2026-2027 оны элсэлтийн мэдээлэл. Бүртгүүлэхээсээ өмнө ${site}-аас шалгаарай.`,
    '',
    '---',
    ''
  );

  out.push('## 1. Товчхондоо', '', u.overview_mn ?? '—', '');
  out.push('## 2. Оноо хэрхэн тооцдог вэ', '');
  // The university-level sentence is skipped when it only says "unknown" but some programs are now filled.
  const knownRows = programs.some((p) => isScored(p.exam_2026_2027));
  const saysUnknown = /тодорхойгүй|чадаагүй|олдсонгүй/iu.test(admission.score_formula_mn ?? '');
  if (admission.score_formula_mn && !(knownRows && saysUnknown)) out.push(admission.score_formula_mn, '');
  const someSubjects = programs.some((p) => p.exam_2026_2027?.suuri_options?.length);
  out.push(
    formulaLines(programs) ||
      (someSubjects
        ? '- Хөтөлбөр бүрийн шалгалтын хичээл Хавсралтад бий; 2026-2027 оны босгыг сургуулиас тодруулна уу.'
        : '- Шалгалтын хичээл, босгыг сургуулиас тодруулна уу.')
  );
  if (someSubjects) out.push('- Бүлэг бүрээс хамгийн өндөр оноотой НЭГ хичээл тооцогдоно.');
  // How seats are filled, only as the data says: "list" = by score order, "direct" = meet the minimums and fit the quota.
  const selectionOf = (p) => p.exam_2026_2027?.selection_type ?? p.selection_type ?? null;
  const listRows = programs.filter((p) => selectionOf(p) === 'list');
  const directRows = programs.filter((p) => selectionOf(p) === 'direct');
  const LIST = '**босго давсан нь элссэн гэсэн үг биш** — суудлыг онооны дарааллаар дүүргэнэ';
  const DIRECT = 'босго бүрийг хангаж, хяналтын тоонд (суудлын тоонд) багтвал шууд элсүүлнэ';
  const names = (rows) => [...new Set(rows.map((p) => p.name_mn))].join(', ');
  if (listRows.length && directRows.length) {
    const [few, many, fewText, manyText] =
      listRows.length <= directRows.length ? [listRows, directRows, LIST, DIRECT] : [directRows, listRows, DIRECT, LIST];
    out.push(
      few.length <= 5 && few.length < many.length
        ? `- Ихэнх хөтөлбөрт ${manyText}. Харин ${names(few)} хөтөлбөрт ${fewText}.`
        : `- ${directRows.length} хөтөлбөрт ${DIRECT}; ${listRows.length} хөтөлбөрт ${LIST}.`
    );
  } else if (listRows.length) out.push('- **Босго давсан нь элссэн гэсэн үг биш** — суудлыг онооны дарааллаар дүүргэнэ.');
  else if (directRows.length) out.push('- Босго бүрийг хангаж, хяналтын тоонд (суудлын тоонд) багтвал шууд элсүүлнэ.');
  out.push('');

  const steps = admission.steps ?? [];
  if (steps.length || admission.steps_mn?.length) {
    out.push('## 3. Элсэх алхам', '');
    if (steps.length) steps.forEach((step, i) => out.push(`${i + 1}. **${step.title_mn ?? ''}** — ${step.detail_mn ?? ''}`));
    else admission.steps_mn.forEach((step, i) => out.push(`${i + 1}. ${step}`));
    if (admission.system_url) out.push('', `Бүртгэлийн систем: ${admission.system_url}`);
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
  if (sidebar.tuition_text_mn) out.push(`- **${sidebar.tuition_number ? 'Жилд ойролцоогоор' : 'Төлбөр'}:** ${sidebar.tuition_text_mn}`);
  for (const t of d.tuition_2026_2027 ?? []) {
    if (['stale', 'unverified'].includes(t.status)) continue; // old or unconfirmed prices stay out of the guide
    const currency = !t.currency || t.currency === 'MNT' ? '₮' : ` ${t.currency}`;
    const amount = (value) => `${Number(value).toLocaleString('en-US')}${currency}`;
    const perCredit = t.price_per_credit ?? t.per_credit;
    const perYear = t.price_per_year ?? t.per_year;
    const bits = [
      t.label_mn,
      perCredit ? `1 кредит ${amount(perCredit)}` : null,
      perYear ? `жилд ${amount(perYear)}` : null,
      Number.isFinite(t.amount) ? amount(t.amount) : null,
      t.registration_fee ? `бүртгэлийн хураамж ${amount(t.registration_fee)}` : null,
      t.admission_fee ? `элсэлтийн хураамж ${amount(t.admission_fee)}` : null,
      t.items?.length ? t.items.map((i) => `${i.name_mn} ${amount(i.amount)}`).join('; ') : null,
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
  if (sidebar.dorm_howto_mn) out.push(sidebar.dorm_howto_mn, '');
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
  const contacts = u.contacts ?? {};
  if (contacts.address_mn) out.push(`- **Хаяг:** ${contacts.address_mn}`);
  if (contacts.phones?.length) out.push(`- **Утас:** ${contacts.phones.join(', ')}`);
  const emails = contacts.emails ? Object.values(contacts.emails).filter(Boolean) : [];
  if (emails.length) out.push(`- **И-мэйл:** ${emails.join(', ')}`);
  if (u.website) out.push(`- **Сайт:** ${u.website}`);
  const branches = (d.schools ?? []).filter((s) => s.type === 'branch');
  if (branches.length) {
    out.push('', '| Салбар | Байршил | Утас |', '|---|---|---|');
    for (const b of branches) out.push(`| ${cell(b.name_mn)} | ${cell(b.location_mn)} | ${cell(b.contacts?.phone)} |`);
  }
  out.push('');

  const counts = { confirmed: 0, likely: 0, unclear: 0, unknown: 0 };
  for (const p of programs) counts[p.exam_2026_2027?.split_confidence ?? 'unknown'] += 1;
  const noFee = programs.filter((p) => !p.tuition_2026_2027?.per_year && !p.tuition_2026_2027?.estimated_per_year).length;
  const estimatedFee = programs.filter((p) => !p.tuition_2026_2027?.per_year && p.tuition_2026_2027?.estimated_per_year).length;
  out.push('## 9. Анхааруулга', '');
  if (programs.length) {
    out.push(
      `- Нийт ${programs.length} хөтөлбөрөөс **${counts.confirmed}** нь албан ёсны хүснэгтээс (✓), **${counts.likely}** магадлалтай (≈), **${counts.unclear + counts.unknown}** нь шалгалтын хичээл эсвэл босго тодорхойгүй (?) — эдгээрийг сургуулиас тодруулна уу.`
    );
  }
  if (estimatedFee) out.push(`- ${estimatedFee} хөтөлбөрийн жилийн төлбөр нь албан ёсны дүн биш, тооцоо (≈).`);
  if (noFee) out.push(`- ${noFee} хөтөлбөрийн төлбөр тодорхойгүй.`);
  out.push('- 2027 оны огноо, босго өөрчлөгдөж болно.', '');

  out.push('## Хавсралт: Бүх хөтөлбөр', '');
  if (!programs.length) {
    out.push(`- 2026-2027 оны хөтөлбөрийн жагсаалтыг одоогоор оруулж чадаагүй — ${site}-аас шалгана уу.`, '');
    return out.join('\n');
  }
  if (hidden) out.push(`- Баталгаажаагүй ${hidden} хөтөлбөрийг энд оруулаагүй.`, '');
  out.push('- **Босго:** «520 / 500» — 1-р / 2-р шалгалт тус бүрийн доод оноо; «дундаж ≥ 580», «нийлбэр ≥ 1100», «тооцсон ≥ 650» — хоёр шалгалтыг нийлүүлсэн онооны НЭГ доод оноо.');
  const hasSkill = programs.some((p) =>
    [...(p.exam_2026_2027?.suuri_options ?? []), ...(p.exam_2026_2027?.dagaldah_options ?? [])].includes(SKILL_EXAM)
  );
  const legend = [
    hasSkill ? '† Ур чадварын шалгалтыг их сургууль өөрөө авна.' : null,
    estimatedFee ? '**Жилд:** ≈ тэмдэгтэй нь тооцоо.' : null,
    '**Итгэл:** ✓ албан ёсны хүснэгтээс, ≈ магадлалтай, ? тодорхойгүй.',
  ];
  out.push(`- ${legend.filter(Boolean).join(' ')}`, '');
  const bySchool = new Map();
  for (const p of programs) bySchool.set(p.school_id, [...(bySchool.get(p.school_id) ?? []), p]);
  for (const [schoolId, rows] of bySchool) {
    const school = schools.get(schoolId) ?? {};
    out.push(`### ${school.name_mn ?? schoolId}${school.type === 'branch' ? ` — ${school.location_mn ?? ''}` : ''}`, '');
    out.push('| Хөтөлбөр | Түвшин | 1-р / суурь | 2-р / дагалдах | Босго | Жил | Жилд | Итгэл |', '|---|---|---|---|---|---|---|---|');
    for (const p of rows) {
      const exam = p.exam_2026_2027 ?? {};
      const extra = Object.entries(exam.subject_minimums ?? {}).map(([s, m]) => ` + ${s} ≥ ${m}`).join('');
      const threshold =
        thresholdText({ threshold1: exam.suuri_threshold, threshold2: exam.dagaldah_threshold, weights: exam.weights, thresholdType: exam.threshold_type }) + extra;
      const tuition = p.tuition_2026_2027 ?? {};
      const estimate = tuition.estimated_per_year;
      const fee = tuition.per_year ?? (estimate ? `≈ ${money(estimate.typical ?? estimate.max)}` : null);
      const flag = { verify: ' *(тодруулах)*', conflicting: ' *(зөрүүтэй)*', unverified: ' *(баталгаажаагүй)*' }[p.status] ?? '';
      const second = exam.dagaldah_options?.filter((s) => !(exam.swap_subjects ?? []).includes(s));
      out.push(
        `| ${cell(p.name_mn)}${flag} | ${cell(p.degree)} | ${subjectList(exam.suuri_options)} | ${subjectList(second)} | ${threshold} | ` +
          `${cell(p.duration_years)} | ${typeof fee === 'number' ? money(fee) : cell(fee)} | ${CONFIDENCE_MARK[exam.split_confidence] ?? '?'} |`
      );
    }
    out.push('');
  }
  return out.join('\n');
}

// -------------------------------------------------------------------------------------------------- CLI

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [command, ...rest] = process.argv.slice(2);
  if (command === 'check') {
    let total = 0;
    for (const slug of rest[0] ? [rest[0]] : listUnis()) {
      const data = loadAll(slug);
      const confidence = {};
      for (const p of data.programs ?? []) {
        const c = p.exam_2026_2027?.split_confidence ?? 'none';
        confidence[c] = (confidence[c] ?? 0) + 1;
      }
      const counts = Object.entries(data).map(([name, records]) => `${name} ${records.length}`).join(', ');
      console.log(`\n[${slug}] ${counts}\n  programs by split_confidence: ${JSON.stringify(confidence)}`);
      const problems = validate(data);
      total += problems.length;
      console.log(problems.length ? `  ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}` : '  valid ✔');
    }
    console.log(total ? `\n${total} problem(s) in total` : '\nAll files valid ✔');
    process.exitCode = total ? 1 : 0;
  } else if (command === 'guide') {
    for (const slug of rest[0] ? [rest[0]] : listUnis()) {
      const data = loadAll(slug);
      writeFileSync(path.join(UNIS_DIR, slug, 'GUIDE_MN.md'), buildGuide(slug, data));
      console.log(`wrote batch3/unis/${slug}/GUIDE_MN.md (${data.programs?.length ?? 0} programs)`);
    }
  } else if (command === 'eligibility') {
    const [slug, ...pairs] = rest;
    if (!slug) throw new Error('usage: node data-import/batch3-data.mjs eligibility <slug> Математик=620 "Англи хэл"=540');
    const scores = Object.fromEntries(pairs.map((pair) => pair.split('=')).map(([k, v]) => [k.trim(), Number(v)]));
    const { programs } = loadAll(slug);
    const counts = {};
    for (const p of programs) {
      const { verdict } = checkProgram(p, scores);
      counts[verdict] = (counts[verdict] ?? 0) + 1;
    }
    console.log(`[${slug}] Оноо:`, scores, '→', counts);
    const ranked = programs
      .map((program) => ({ program, result: checkProgram(program, scores) }))
      .filter((x) => x.result.verdict === VERDICT.ELIGIBLE)
      .sort((a, b) => b.result.normalized - a.result.normalized);
    for (const { program, result } of ranked.slice(0, 12)) {
      console.log(`${String(result.score).padStart(7)}  ${program.name_mn}  [${program.school_id}]  (${result.suuri} + ${result.dagaldah})  ${result.message}`);
    }
  } else {
    throw new Error('usage: node data-import/batch3-data.mjs check|guide|eligibility …');
  }
}
