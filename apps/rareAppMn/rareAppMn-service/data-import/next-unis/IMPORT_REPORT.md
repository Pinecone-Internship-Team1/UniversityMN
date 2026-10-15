# СЭЗИС, МУБИС, ХААИС → oyutan.mn — import report (2026-10-15)

**Status: live.** СЭЗИС, МУБИС and ХААИС are imported on production, and so is АШУҮИС: its code was deployed first, then its data, at the owner's request. Committed on `zetsu`, **PR #9** (https://github.com/Pinecone-Internship-Team1/UniversityMN/pull/9, not merged).

Live pages: https://oyutan-mn-web.zelmeganbayr0408.workers.dev/university/sezis · /university/mubis · /university/khaais · /university/ashuuis

No code change was needed: the site already scores СЭЗИС's "average of two exams" correctly (Step 3b skipped).

## Per university

| | Programs in DB | With exam subjects (score check works) | "Сургуулиас тодруулна уу" | Faculties | Scholarships | Dorms | Dates |
|---|---|---|---|---|---|---|---|
| СЭЗИС `sch_sezis` | 58 | 56 | 2 (Эдийн засаг, Эдийн засаг 2+2: also need Математик ≥ 600) | 4 | 6 | 2 | 18 |
| МУБИС `sch_mubis` | 63 | 63 | 0 | 9 (7 + Архангай, Баян-Өлгий) | 7 | 3 | 7 |
| ХААИС `sch_khaais` | 62 | 54 | 8 (not on ХААИС's 2026-27 list) | 6 | 3 | 2 | 4 |

### МУБИС
- **Filled from МУБИС's own 2026-2027 admission rules** (Rector's order А/103, 2026-03-25, appendix 2): subjects and a minimum for each exam, credits and length for all 63 programmes it admits. Every row agrees with the Ministry's 2026-27 table (order А/34).
- 25 programmes added: 13 in Улаанбаатар (e.g. Архив, албан хэрэг хөтлөлт; Мультимедиа дизайн; three "…, англи хэлний багш" doubles) and 12 at the Архангай and Баян-Өлгий branches (minimums 430).
- The formula isn't published, so the site checks each exam's minimum and shows a plain sum. Programmes with a skills test as the 2nd exam give "Сургуулиас тодруулна уу" unless the 1st exam is already below its minimum.
- **Still unknown:** the 2026-27 tuition (null; news says +9%), whether any programme uses direct selection (imported as list), seat numbers (quota PDF not read).

### ХААИС
- The old admission system is gone. **Filled from `elselt.muls.edu.mn`**, headed "2026-2027 оны Бакалаврын элсэлтийн бүртгэл — 05/01 – 07/09": 55 programme cards with both minimums, grouped by school, plus each programme's page for the subjects. The values match the Ministry's 2026-27 table.
- Programme names now follow that site (31 renamed, e.g. "Малын их эмч" → "Мал эмнэлэг"); every programme is under its real school (the "бусад хөтөлбөрүүд" placeholder is gone); 12 programmes added (e.g. Мал зүй, Морин спорт, Газрын кадастр, joint 3+1 / 2+2 variants).
- 8 programmes are only in the site's menu, not its 2026-27 list (Хэрэглээний физик, Хэрэглээний математик, Арьс боловсруулалт, Металлурги, Газар тариалангийн аж ахуй, Үйлдвэрлэлийн менежмент, Био-инженерчлэл, Байгаль хамгаалал) → imported with "⚠ Тодруулах" and the old page values in the note.
- Main phone 7510-7777 added. **Still unknown:** a general email, the official 2026-27 fee (the 4.7–5.1 million ₮ news estimate is shown as an estimate), the Darkhan branch (2 rows skipped).

### СЭЗИС
- The 5 unknown Education / Social Sciences programmes are filled from the admission system (e.g. Багш, бага боловсрол: Монгол хэл/Математик ≥ 450 + skills test ≥ 490; 148,896₮ a credit).
- UFE Tech fees: 310,000₮ a credit → yearly estimates. "Хиймэл оюун ухаан 2+2" (Woosong University) confirmed and imported.
- Seat-confirmation fee 500,000₮ (40% kept if cancelled) added to the data.
- **Still unknown:** joint-programme partner details, scholarship PDF details, dorm room counts.

## Checks (local)
- Second run of each import: 0 changes. Every other university's rows: byte-identical before and after.
- The app's score check vs the dataset's reference check: 1,629 cases, 0 mismatches. СЭЗИС Санхүү, банк: Математик 590 + Англи хэл 660 → eligible (average 625); 660 + 570 → below (615).

## Old rows you may want to remove
Local only (seed demo data; production doesn't have them): for each of the three, faculty "Бусад хөтөлбөрүүд", majors `maj_sezis_1..3` / `maj_mubis_1..3` / `maj_khaais_1..3`, `sp_*_1`, `dorm_*`, `adm_*_1`. Left alone as the runbook asks.

## Not imported (could be added later)
FAQ, links, exam info, the tuition tables and sources. Also: the national rule that every applicant needs Монгол хэл ≥ 400 isn't modelled by the site.

## Worth checking by eye
1. МУБИС: the "Дээд боловсролын эрэлттэй мэргэжил" (*) marks and the new branch programmes on /university/mubis.
2. ХААИС: "Экологийн технологи" appears twice on its site (majorview 53 and 221, same page); only one was imported.
3. ХААИС: the renamed programmes, e.g. "Биологи" (was "Биологи-агнуур зүйч"), "Аялал жуулчлал" (moved to the Applied Sciences school, as on the site).
4. СЭЗИС: the Education school's address shows "тодорхой хаяг олдсонгүй — сургуулиас тодруулна уу".
5. The МУБИС first-year discount scholarship (ЭЕШ 500+, 70% / 50%) was read from a blurry scan; it's marked "verify".

## Production (2026-10-15)
- **Backup:** `~/Documents/oyutan-backups/rareapp-db-20261015-2158-before-next-unis.sql` (11 tables, 631 rows). **Time Travel bookmarks:** before the deploy `0000005d-00000000-00005105-9116feb0ac5a27e98f553a87df9e7be1`; before the imports `0000005e-00000004-00005105-fe72b45b05a039bbc261777ea6fd358f`.
- **АШУҮИС deploy** (owner's line, from the 2026-10-14 build at `f66bcfc`): migration 0008 applied; service version `db733a18-510e-44e8-b4c3-1d06d00ad37c`, web `dd9ec0a4-2558-4bdc-a0d0-3ac84229b77a`. Rollback targets if ever needed: service `8560248b-2e77-4d60-91d8-9890602c1661`, web `9c6d87df-b692-4f66-bfe8-04f1079921bf`. МУИС/ШУТИС score answers identical before and after.
- **Imports** (one SQL file each, ids logged in `out/…/remote-*-changes.json`): АШУҮИС 11 faculties / 78 majors; СЭЗИС 4 / 58; МУБИС 9 / 63; ХААИС 6 / 62, plus scholarships, dorms, dates and the university rows. Same ids as local. Each second run: 0 changes. Each import changed only its own university (МУИС, ШУТИС and the others are byte-identical).
- **Live checks:** all pages 200 and show the programmes. App vs reference check on production rows: 1,629 cases, 0 mismatches. Live API: СЭЗИС Санхүү, банк 590/660 → eligible (625), 660/570 → below (615); Аялал жуулчлал → ask the school; Програм хангамж Физик 530 + Нийгэм 490 → below; Эдийн засаг → ask the school; МУБИС Боловсрол судлаач 500/460 → eligible; ХААИС Экологи Биологи 500 + Хими 440 → below; АШУҮИС Хүний их эмч Хими 620 / Биологи 480 → below.
- The АШУҮИС build worktree was removed afterwards.
