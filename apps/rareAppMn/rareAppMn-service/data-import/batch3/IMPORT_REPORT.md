# Batch 3 → oyutan.mn: import report (2026-10-18)

**Status: live.** Этүгэн, Отгонтэнгэр, Хүрээ, ОУУБИС and СУИС are filled on production. Data only: no migration, no code change, no deploy. The commit is on `zetsu`; it adds to the open **PR #9** (https://github.com/Pinecone-Internship-Team1/UniversityMN/pull/9, not merged). No new PR was opened.

Live pages: https://oyutan-mn-web.zelmeganbayr0408.workers.dev/university/etugen · /university/otgontenger · /university/huree · /university/iuu · /university/suis

## Per university (production)

| | Programs | Score check works | "Сургуулиас тодруулна уу" | Faculties | Scholarships | Dorms | Dates |
|---|---|---|---|---|---|---|---|
| Этүгэн `sch_etugen` | 29 (2 associate) | 27 | 2 (Орхон branch: only "430" is known) | 7 | 6 | 2 | 5 |
| Отгонтэнгэр `sch_otgontenger` | 19 | 19 (6 have a skills test as exam 2) | 0 | 3 | 16 | 0 | 7 |
| Хүрээ `sch_huree` | 10 | 10 | 0 | 1 | 12 | 1 | 2 |
| ОУУБИС `sch_iuu` | 29 | 28 | 1 (Банк: not in the 2026-27 table) | 5 | 16 | 1 | 9 |
| СУИС `sch_suis` | 35 | 24 | 11 (two-round skills test = 3 exams) | 6 | 3 | 0 | 4 |

"Score check works" counts programs that have exam subjects. Where the 2nd exam is the university's own skills test, the site checks only the 1st exam's minimum.

### Этүгэн
- **Filled from** the 2026-27 rules PDF (Rector's order №44, read page by page as images) and the 2026 web table image. 26 of the 27 Ulaanbaatar rows are identical in both. The rows marked `likely` are now `confirmed`.
- **Био-Анагаах ухаан:** both 2026 sources say **480 / 490** (the 490 came from an undated page), so it now gets a score check instead of the neutral answer.
- **Олон улсын сувилахуй:** both sources list it with Сувилахуй: bachelor, 4 years, **430 / 450**.
- **Хоол үйлдвэрлэл:** the web image leaves Физик out of exam 1, but the rules PDF and the Ministry's national table (order А/34) include it, so Физик stays.
- **Сургуулийн өмнөх боловсролын багш:** Математик added to exam 1.
- District changed **Баянгол → Сүхбаатар**.
- **Still unknown:** tuition (only the 250,000₮ seat deposit is published), dorm price, and the Орхон branch's subjects.

### Отгонтэнгэр
- The website showed an older year's table. The **stamped 2026-27 rules PDF**, found through the admission system with headless Chrome, matches the Ministry's national table row for row.
- **All 19 programs are `confirmed`.**
- Formula: each exam weighs 50% (rule 5.2), so the site shows an average.
- **Corrected programs:**
  - Багш, монгол хэл: exam 2 is a skills test.
  - Багш, гадаад хэл: exam 2 is a skills test.
  - Гадаад хэлний орчуулга: Англи/Орос/Математик, then Нийгэм/Монгол хэл/Түүх.
  - Аялал жуулчлал: Газарзүй/Математик/Англи, then a skills test.
  - Агаарын тээврийн үйлчилгээ (was cut off): 490 / skills test 480.
- **Added:** Бизнесийн эрх зүй.
- Also added:
  - 2026 dates: registration 04-15 → 06-29, program choice 07-01 → 07-09, documents 07-15 → 07-22;
  - fees: 10,000₮ registration and a 1,000,000₮ seat confirmation;
  - a 10% early-payment discount.
- District changed **Хан-Уул → Баянзүрх**.
- **Still unknown:** tuition and dorms.

### Хүрээ
- Values unchanged and still `likely`, because the school's table has no year. All 10 minimums equal the Ministry's 2026-27 table, and each row's note now says so.
- 4 programs not in the 2026 form stay out.
- **Still unknown:** tuition, and whether the dorm still runs. The page shows "Мэдээлэл удахгүй нэмэгдэнэ" for the dorm.

### ОУУБИС
- The scanned 2026-27 rules table (read as images) gives **28 programs `confirmed`**. Its values equal the website and the Ministry's table.
- Selection is **direct**: rule 3.3 says meeting the minimums earns an admission letter, within the quota.
- "Санхүү" was renamed **"Санхүү, банк"** (as in the table).
- **"Банк" is not in the 2026-27 table**, so it shows "⚠ Тодруулах … сургуулиас тодруулна уу".
- Also added: 2026 registration 06-29 → 08-29, winter intake 2027-01-04 → 01-23, and new-student discounts (30–100% by exam average) plus 3 more discount types.
- District changed **Сонгинохайрхан → Баянзүрх**.
- **Still unknown:** tuition, registration fee and dorm price.

### СУИС
- The admission system (burtgel.mnuac.edu.mn) loads its data from a **public read-only API**. It lists **35 bachelor majors in 6 schools**, each with its ЭШ subjects, minimums and skills-test pass marks.
- Formula, from the site's own score calculator:
  - skills-test majors: ЭШ ÷ 2 + skills test;
  - ЭШ-only majors: the average of 2 subjects.
- 24 majors are checkable.
- **11 majors use a two-round skills test** (music, singing, acting, directing), which makes 3 exams. Per the runbook they are neutral, and their note lists both rounds' pass marks.
- 2 schools were added (Кино-телевиз-медиа; Хөгжмийн урлагийн сургууль), and "Дүрслэх урлагийн академи" was renamed.
- Contacts are now 7766-0011 and burtgel@mnuac.edu.mn; registration opened 2026-05-25; 3 scholarships were added.
- All edits were made in `build_data.py`, as the runbook asks.
- **Still unknown:** tuition and dorms.

## Checks
- **Local:** every second run made 0 changes, and every other university's rows were byte-identical before and after.
- **App vs the dataset's reference check:** 7,329 cases, **0 mismatches**, on both local and production. That includes every case in the runbook.
- **Production:** fresh backup `~/Documents/oyutan-backups/rareapp-db-20261018-2217-before-batch3.sql` (11 tables, 993 rows) and Time Travel bookmark `00000067-00000000-00005108-345ce278b9eadb4e4a19fef42ec668e0`, both taken right before the first write.
- **Imports:** one SQL file per university, one at a time. After each, the second run made 0 changes and the six other universities were byte-identical.
- **Pages:** all 11 pages return 200. The earlier six keep the same program counts.
- No migration was pending, and none was applied.

## Worth checking by eye
1. **Этүгэн faculty names.** The 2026-27 rules call the business school "Хүмүүнлэгийн сургууль", the org chart says "Инженерчлэл-эдийн засаг, менежментийн сургууль", and the data (now live) says "Төрийн захиргаа, эдийн засаг, менежментийн сургууль". I kept the data's name.
2. **ОУУБИС "direct" wording.** The page now says "шууд элсэх боломжтой" with the site's standard direct-selection note ("зөвхөн 1 хөтөлбөр сонгох … төлбөр төлсөн дарааллаар"). The rules only say that meeting the minimums earns an admission letter.
3. **СУИС skills-test majors.** They show "Суурь (33%) / Дагалдах (67%)", which follows from ЭШ ÷ 2 + skills test. The 11 two-round majors show "Сургуулиас тодруулна уу".
4. **СУИС address.** The admission system's footer says "Баянгол дүүрэг"; the site still shows "Сүхбаатар", as the runbook asked.
5. **ОУУБИС "Банк".** It is still listed on the university's website but not in its 2026-27 rules. Consider removing it if the school confirms.

## Not done / notes
- Tuition is unknown for all five; no hand-typed tuition existed on their rows.
- Facebook pages weren't read (they need a login).
- The national rule "every applicant needs Монгол хэл ≥ 400" isn't modelled by the site (same as before).
- No separate "Улаанбаатар Их Сургууль" row exists, so ОУУБИС has no duplicate.
- **Local only:** the old seed demo rows of these five (faculty "Бусад хөтөлбөрүүд", maj_<slug>_1..3, sp_/dorm_/adm_ rows) were left alone, as the runbook asks. Production never had them.
- **Universities with empty pages on production after the import:** none. All 11 have programs (query run on production).

## Follow-ups (2026-10-18, owner's decisions)
- **Direct-selection note** (`src/lib/scoreMatch.ts`): `DIRECT_NOTE` was АШУҮИС's own rule ("зөвхөн 1 хөтөлбөр … төлсөн дарааллаар"), which isn't true for Этүгэн or ОУУБИС. It now reads " Шууд элсүүлэх хөтөлбөрт босго хангасан бүртгүүлэгчийг суудал дүүртэл элсүүлдэг тул элсэх эрхээ хугацаанд нь баталгаажуулаарай." A new test checks a passing direct major gets it and no "1 хөтөлбөр"; service tests: 19 pass.
- **АШУҮИС's rule kept visible:** the 52 АШУҮИС direct-selection programs (`selection_type: direct`) now end their `notes_mn` in `ashuuis/data/programs.json` with "«Шууд сонгох» бүлгээс зөвхөн 1 хөтөлбөр сонгоно; босго хангасан бол хөтөлбөрөө сонгож, сургалтын төлбөрөө төлснөөр баталгаажна (2026 онд 7-р сарын 1-нд)." Imported with `import-mnums.mjs` (local, then production): 52 majors, `exam_note` only.
- **СУИС district:** `import-batch3.mjs` now sets СУИС's district to Баянгол (its admission system says "Улаанбаатар хот, Баянгол дүүрэг"): location "Сүхбаатар дүүрэг, Улаанбаатар" → **"Баянгол дүүрэг, Улаанбаатар"** on local and production.
- The other "worth checking by eye" items are left as they are.
- **Safety:**
  - Production backup `~/Documents/oyutan-backups/rareapp-db-20261018-2241-before-batch3-followups.sql` (11 tables, 1,221 rows) and Time Travel bookmark `00000068-00000000-00005108-7e163360386ace3917a265cf7a179b87`, both taken right before the first write. No migration.
  - Every row of all 11 universities in the 6 tables was snapshotted before and after, on local and on production. The only differences: 52 АШУҮИС `majors.exam_note` and СУИС `schools.location`.
  - Second runs: 0 statements.
