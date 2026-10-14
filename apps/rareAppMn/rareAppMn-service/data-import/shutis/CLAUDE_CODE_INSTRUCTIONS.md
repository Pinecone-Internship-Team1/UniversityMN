# ШУТИС (MUST) → oyutan.mn — autonomous runbook for Claude Code

**Owner's request:** do the whole job in this file without asking the owner anything: fill the data gaps, import, check, deploy and report. They have given permission for all of it and prefer short, plain-English explanations.

**Done means:**
- ШУТИС is live on oyutan.mn with its 13 schools, 183+ bachelor programs, 14 scholarships, dorm info and 11+ admission dates.
- The score check handles ШУТИС's per-exam minimums.
- Хүрээ's address is fixed.
- There is a short report.

**Paths used below**
- `FOLDER` = `~/Downloads/shutis-oyutan-mn`: this folder, as the owner unzipped it. `IMPORT_LOG.md` and `IMPORT_REPORT.md` go here.
- `REPO` = `/Users/zetsu/Documents/pinecone/UniversityMN` (branch `zetsu`).
- `SERVICE` = `REPO/apps/rareAppMn/rareAppMn-service`; `WEB` = `REPO/apps/rareAppMn/rareAppMn-web`.
- `DATA` = `SERVICE/data-import/shutis`: your working copy of this folder. **All data edits happen here.**

---

## 0. Ground rules (read first)

**Don't ask — decide and log.**
- When something is unclear, take the safest reasonable choice, write it in `FOLDER/IMPORT_LOG.md`, and continue.
- Claude Code may still show its own "allow this command?" prompts. Those come from the owner's settings, not from you, and are fine.
- Log every step as you go: commands, counts, decisions, errors. If your context gets long, re-read the log to resume.

**Safety rules.** These override "don't ask".
1. **Back up first.** Never write to the remote (production) database without a backup or Time Travel bookmark taken in this run, just before the first remote write.
2. **Run only your migration on production.** Before the remote `migrations apply`, run `migrations list --remote`. Continue only if the single pending migration is the one you wrote. If anything else is pending on remote, don't apply anything there: skip Step 6 and report it. Step 7 doesn't need a migration and can still run.
   - **Local DB:** it may be behind. Locally it's fine to apply the migrations already applied on remote, plus yours. Never apply a migration that is pending on **both** local and remote and isn't yours (the owner's work in progress); log it instead.
3. **Additive schema changes only.** Migrations may only add (`ADD COLUMN`). Never drop or rename.
4. **Touch only ШУТИС's rows.**
   - Never delete or change another university's data. The only exception is Хүрээ's address in Step 7.
   - Don't delete existing ШУТИС rows either. Update matches in place; leave unmatched rows alone and list them in the report.
5. **Never half-import.**
   - The import must be idempotent: `INSERT … ON CONFLICT(id) DO UPDATE …`, or look up first and then UPDATE/INSERT.
   - **Never** use `INSERT OR REPLACE` or delete-and-reinsert. D1 enforces foreign keys, so cascades would wipe child rows.
6. **Data before code? No.** Import ШУТИС majors into production **only after** the new score-check code is live (Step 6 order). If the new code can't be deployed, don't import. Old code would score ШУТИС with the wrong rule.
7. **Git.**
   - Commit on the current branch and stage only your own files.
   - Never commit `gap-files/`, because downloads stay local.
   - Never force-push, rewrite history or touch other branches.
8. **Deploy only committed code** (see Step 5).
9. **Leave settings and secrets alone.**
   - Run wrangler from `SERVICE` or `WEB` (or their copies in the Step 5 worktree), so the project's own wrangler version and config are used.
   - Don't change Cloudflare account settings. Don't print secrets. Don't install global tools.
   - Don't send the owner's personal data anywhere.
10. **Stop a failing step.** If the same step fails twice, stop it, log why, and skip the steps that depend on it. Prefer fixing forward over rolling back.

---

## 1. What's in this folder

| Path | What it is |
|---|---|
| `data/programs.json` | **183 bachelor programs** for 13 schools: суурь/дагалдах options, per-exam minimums, display text, yearly tuition estimate, joint-program info, `status`. 15 are joint programs with foreign universities (2+2, 2.5+2, 3+1). |
| `data/schools.json` | 18 records: 10 Улаанбаатар schools (`type: "constituent"`), 3 branches (`"branch"`: Дархан, Эрдэнэт, Өмнөговь) and 5 `"unit"` records (colleges, graduate school, high school). Skip the units. |
| `data/university.json` | Overview, history, stats, QS Asia ranks, contacts, student services, and `sidebar_suggestion` (ready-made sidebar values including `dorm_howto_mn`). |
| `data/scholarships.json` | 14 rows: 7 university-wide (`school_id: null`), 1 for ХШУС coal/oil programs (`must-company-funded`), 6 for the Эрдэнэт branch only (`school_id: "must-etsds"`; name starts with "ЭЦДС:"). |
| `data/dorms.json` | 6 records: 1 facts record, 4 buildings (`record_type: "building"`; prices from 2020, `stale`), 1 how-to-apply record. |
| `data/admission_dates.json` | 11 date rows. Names say "2026 оны жишиг" for last year's dates. 2 rows have no end date and 1 has no start date. |
| `data/admission_2026.json` | Steps, fees, bank accounts, score formula, swap rule, aptitude test, other admissions (multi-format, non-degree, winter). |
| `data/joint_programs.json` | 40 records: the 25 official joint programs from must.edu.mn/mn/page/700 (bachelor/master/PhD), plus extras from school pages, foreign-language-taught programs and branch 1+3/2+2. |
| `data/tuition_2026_2027.json` | 209,000₮ per credit (218,500₮ for 5 priority programs) and the full rate table. |
| `data/exams.json`, `faq.json`, `links.json` | National exam (ЭШ) info, Q&A, official links. |
| `data/sources.json` | Every source. **`gap: true`** = couldn't be read from the cloud; `gap_fill_hint_mn` says what to take from it. |
| `GUIDE_MN.md` | Student guide in Mongolian, with an appendix table of all programs. |
| `seed/load-data.mjs` | `node seed/load-data.mjs` validates everything. It must end with "All files valid ✔". |
| `seed/exam-tools.mjs` | `buildExam` / `applyExam`: write exam data in the dataset's exact format (swap rule, display text). |
| `seed/eligibility.mjs` | **Reference score check**: the spec for `scoreMatch`. Includes a CLI demo. |
| `seed/guide-appendix.mjs` | Rebuilds the GUIDE_MN.md appendix after programs.json changes. |

**Conventions.**
- Every file is `{ _meta, records }`, with English keys and Mongolian values.
- Every record has `id`, `status` and `source_urls`.
- `status` is one of: current, stale, verify, unverified, estimate, conflicting, reference, approximate, partial.

---

## Step 1 — Get your bearings

1. `cd REPO`. Run `git status` and log the result. If there are uncommitted changes that aren't yours, never stage or commit them; Step 5 explains how to deploy safely around them.
2. Confirm the layout from the МУИС import, and adapt if it changed:
   - **API** (`SERVICE`): `npx wrangler deploy --env production`.
   - **Web** (`WEB`): `npx next build && npx opennextjs-cloudflare build --skipNextBuild && npx opennextjs-cloudflare deploy`.
   - **Database:** D1 `rareapp-db`; production points at the same database.
   - **Remote migrations** (from `SERVICE`): `npx wrangler d1 migrations apply rareapp-db --remote --env production`.
   - **Local migrations:** the same with `--local`. If package.json has scripts for these, use them.
3. Learn how МУИС was imported, and use the same approach and field conventions:
   - read `SERVICE/data-import/muis-map.json`;
   - run `git log --oneline -- apps/rareAppMn/rareAppMn-service/data-import`;
   - search the repo for `muis-map`.
4. Read the migrations folder to learn the real table and column names. From the МУИС work, expect:
   - **`majors`:** requiredSubjects, primarySubjects, secondarySubjects (JSON), cutOffScore, degreeType, tuitionFee, tuitionIsEstimate, examNote.
   - **`faculties.location`.**
   - **University fields:** dorm/scholarship flags (Тодорхойгүй/Боломжтой/Боломжгүй), tuition text, dorm how-to, overview.
   - **Other tables:** `dorms`, `scholarships`, admission dates.
   - Also note whether ids are TEXT (deterministic ids possible) or INTEGER autoincrement.
5. Find ШУТИС's university row, on local **and** remote (read-only `SELECT`). Search for the name containing "Шинжлэх ухаан, технологийн их сургууль" or "ШУТИС"; its website is https://www.must.edu.mn.
   - Never create a second row.
   - Record its id on each database; they may differ.
   - Log any faculties or majors it already has. It should have none, because the demo data was removed.
6. Run `npx wrangler d1 migrations list rareapp-db --remote --env production` (and `--local`) from `SERVICE`, and log what is pending **now**, before you add anything.
7. Copy `FOLDER` to `DATA`. Add `gap-files/` to `.gitignore` (or never stage it). Run `node seed/load-data.mjs` in `DATA`.
   - Check how МУИС data was committed. If the МУИС JSON was kept out of git, commit only the mapping and scripts for ШУТИС too.

---

## Step 2 — Fill the data gaps (the cloud couldn't reach these; you can)

The dataset was built in a cloud sandbox where some official sources were blocked, scanned or image-only. On this Mac you can download them with `curl` and read images and PDFs with your Read tool, which shows them to you.

**What's missing**
- **55 `unknown` programs:** ЭХИС 11, ДаТС 23, ЭЦДС 17, ӨмТДС 4. They are *not* in the regulation PDF (`in_2026_regulation: false`); fill them from the school and branch sources.
- **22 rows that are `unclear` (13) or `likely` (9).**
- **9 rows with `secondary_threshold_score: null`.**
- The 22 rows and the 9 rows are best fixed from the regulation PDF.
- **Other gaps:** 2020 dorm prices; the exact 2026 registration dates; the 2026-27 calendar.

**Sources, in order.** They are the `gap: true` records in `DATA/data/sources.json`.
1. `gap-reg-pdf`: the regulation PDF. It returned 504 on 2026-10-10; if it times out, look for a newer link on https://elselt.edu.mn/page/14.
2. `gap-energy` plus https://elselt.edu.mn/page/48: ЭХИС.
3. Branches: `gap-branches`, `gap-stda`, `gap-um`, `gap-eit-admission`.
4. `gap-sflid` (images on the page), `gap-ssh-268`, `gap-ssh-276`, `gap-guus`, `gap-sict`.
5. `gap-dorm-price`.
6. `gap-dates`, `gap-news57` (images), `gap-calendar`, `gap-tuition-pdf`, `gap-elselt-news`, `gap-quotas`.

**How**
1. Download into `DATA/gap-files/`, e.g. `curl -L --max-time 60 -A "Mozilla/5.0" -o gap-files/reg.pdf "<url>"`.
   - If a download fails twice, move on and retry once at the end of this step. Then give up on that source.
2. Read what you downloaded:
   - **HTML:** read the text, and download any `<img>` tables too.
   - **Images:** open with Read.
   - **PDFs:** open with Read, in page ranges of 20 or fewer.
3. Write values with `seed/exam-tools.mjs` so the format and swap rule match the rest of the data:
   ```js
   import { readFile, writeFile } from 'node:fs/promises';
   import { buildExam, applyExam } from './seed/exam-tools.mjs';
   const file = 'data/programs.json';
   const json = JSON.parse(await readFile(file, 'utf8'));
   const p = json.records.find((r) => r.id === 'must-ekhs-…');
   const exam = buildExam({ program: p, allPrograms: json.records,
     suuri: ['Математик', 'Физик'], dagaldah: ['Англи хэл', 'Нийгэм судлал'], // as the source lists them, WITHOUT swap subjects
     suuriThreshold: 490, dagaldahThreshold: 450, sourceUrl: '<url you read>', confidence: 'confirmed' });
   applyExam(p, exam, { today: '<YYYY-MM-DD>' });
   await writeFile(file, JSON.stringify(json, null, 1) + '\n');
   ```

**Matching**
- **How to match:** match on school + index code + name, never code alone (e.g. 071501 appears on 6 rows).
- **Joint rows:** never change rows that have `joint_program` from the regulation; it lists regular programs only.
- **New programs:** if the regulation lists one that's missing, add it:
  - id `must-<school>-<latin-slug>`, `in_2026_regulation: true`;
  - tuition = credits ÷ years × price per credit from `tuition_2026_2027.json`;
  - all other fields shaped like neighbouring rows.

**Rules**
- **Confidence.** Use `confirmed` only when the cell is clearly legible **and** it is unambiguous which column (суурь or дагалдах) each subject and minimum belongs to. Otherwise use `likely`. If a cell is blurry, leave the row and log it.
- **Already-confirmed rows.** Change them only when the official source clearly contradicts them, and log old → new.
- **Branch rows:** use the minimums the source gives. If it gives a single number (usually 430), use it for both суурь and дагалдах. If it gives none, use 430 for суурь and leave дагалдах null.
- **Dorms.** For a 2025-26 price, set `price_per_year`, `price_year: "2025-2026"`, `status: "current"` and the source in `dorms.json`. Then update the price sentence in `university.json → sidebar_suggestion.dorm_howto_mn` and keep the year in it.
- **Dates.** Add 2026 dates to `admission_dates.json` as `"2026 оны жишиг: …"` with `status: "reference"`. 2027 is not announced.
- **Mark each source you used** in `sources.json`: `gap: false`, `filled_at`, and a one-line `filled_note`.

**Finish**
1. `node seed/load-data.mjs` must report valid.
2. Run `node seed/guide-appendix.mjs`.
3. Log a table: rows filled per source, every filled program id with its new subjects and minimums (for the owner to spot-check), and what is still unknown.

Spend about 30–40 minutes here at most. Rows that stay unknown show "Сургуулиас тодруулна уу", which is fine.

---

## Step 3 — Code change: per-exam minimums (`secondaryCutOffScore`)

ШУТИС sets a minimum for **each** exam: суурь ≥ `threshold_score` **and** дагалдах ≥ `secondary_threshold_score`. МУИС uses one minimum on the weighted total. **`seed/eligibility.mjs` is the exact reference; port it.**

1. **Migration.** Add the next numbered migration: `ALTER TABLE majors ADD COLUMN secondaryCutOffScore INTEGER;` (nullable; match the existing naming style).
2. **API.** Read and return the field everywhere `cutOffScore` is read or returned: types, queries, serializers.
3. **scoreMatch.**
   - **Null rows:** where `secondaryCutOffScore` is null (МУИС and all other universities), keep the old logic **unchanged**. Use strict null checks (`== null`), never `||`, because 0 is a real value here.
   - **Rows where it is set:**
     - **Pairs.** Consider every pair (s from primarySubjects, d from secondarySubjects) where s ≠ d, both scores are finite, and neither is "Ур чадварын шалгалт". That subject is SKILL_EXAM; it has no ЭШ score and never forms a pair.
     - **Passing.** A pair passes if `score[s] ≥ cutOffScore` and `score[d] ≥ secondaryCutOffScore`.
     - **Eligible:** at least one pair passes. Show "Босго давсан — өрсөлдөх эрхтэй" and rank by the best passing `0.7·s + 0.3·d`.
     - **Below:** pairs exist but none passes. Show "Босго хүрэхгүй: …", naming the short exam. If a суурь subject passes and the student left some дагалдах subjects empty, also suggest them (`couldPassWith` in the reference).
     - **Missing:** no complete pair can be formed.
   - **Aptitude test only.** When the only дагалдах is SKILL_EXAM, give the existing neutral verdict. Give "below" only if every entered суурь score is under `cutOffScore`.
   - **No subjects.** Empty primary or secondary subjects give the neutral "Сургуулиас тодруулна уу", as now.
   - **`secondaryCutOffScore = 0`** means the дагалдах minimum is unknown. Check only the суурь minimum and add the caveat "Дагалдах хичээлийн босго тодорхойгүй".
   - **Mongolian writing exam (400+).** If the old logic checks it, keep the check for these rows too.
4. **UI.** Where the cut-off is shown ("Босго оноо"):
   - `secondaryCutOffScore > 0`: "Суурь ≥ X, дагалдах ≥ Y".
   - `secondaryCutOffScore = 0`: "Суурь ≥ X (дагалдах: тодорхойгүй)".
5. **Tests.** Put them next to any existing scoreMatch tests. Use fixture rows copied from the **untouched** `FOLDER/data/programs.json`, not from `DATA` (Step 2 changes it) and not from the live DB. If the score check requires a Mongolian writing score, give every test case one (e.g. 500). Cover:
   - one МУИС case that must not change;
   - Компьютерын ухаан (061301): М=600, Ф=500 → eligible, 570;
   - 061301: М=600, Ф=440, nothing else → below, short on дагалдах Физик (450), with Нийгэм судлал / Англи хэл suggested;
   - Программ хангамжийн инженерчлэл (071405, secondary 0): М=600, Ф=300 → eligible, 510, with the caveat;
   - Архитектур: М=500 → below; М=600 → neutral;
   - Хийн инженерчлэл (072408, unclear) → neutral;
   - any row that is still unknown after Step 2 → neutral.

   Then run the tests, typecheck/lint, and both builds.
6. **Cross-check:** `node seed/eligibility.mjs Математик=620 Физик=540 "Англи хэл"=500 "Нийгэм судлал"=480`. Before Step 2 it gives eligible 106, neutral 74, below 2, missing 1; the counts change after gap-filling.

---

## Step 4 — Mapping and import into the **local** database

Write an idempotent import script, mirroring the МУИС one. Running it twice must change nothing.
- Save `SERVICE/data-import/must-map.json`, mapping dataset id → DB id, in the same shape as `muis-map.json`.
- **TEXT ids:** use deterministic ids derived from the dataset ids, following the МУИС pattern if there is one.
- **INTEGER autoincrement ids:** never reuse local ids on remote. On each database, look rows up by natural key (ШУТИС university id + faculty name; faculty id + major name; and so on).
- **Before writing,** assert that no target id already belongs to another university.

**Faculties (13).** The `schools.json` records whose type is `constituent` or `branch`.
- **name:** `name_mn`.
- **location:** `location_mn`. The 10 Улаанбаатар schools contain "Улаанбаатар". The branches are "Дархан-Уул аймаг", "Орхон аймаг, Баян-Өндөр сум (Эрдэнэт)" and "Өмнөговь аймаг, Даланзадгад".
- Check that the Улаанбаатар / Орон нутаг recommendation filter classifies them correctly; compare with how МУИС's branch faculties are stored.

**Majors (183+).** The key is the programs.json `id`. Existing ШУТИС majors with the same faculty and name are updated in place.

| Field | Value |
|---|---|
| faculty | the faculty for `school_id` |
| name | `name_mn` (joint programs already include the partner) |
| degreeType | the same value МУИС bachelor rows use |
| primarySubjects | `exam_2026_2027.suuri_options` if `split_confidence` is confirmed or likely; otherwise `[]` |
| secondarySubjects | `exam_2026_2027.dagaldah_options` (swap subjects already included); same condition, else `[]` |
| requiredSubjects | confirmed/likely: follow the МУИС convention (check what МУИС rows hold). unclear/unknown: `[]`, so the neutral verdict always shows |
| cutOffScore | `threshold_score` (may be 430 for branches even when subjects are unknown) |
| secondaryCutOffScore | confirmed/likely: `secondary_threshold_score`, or **0** when that is null. unclear/unknown: null |
| tuitionFee | `tuition_2026_2027.estimated_per_year.max`, or null. 47 rows have a range, and max is its top |
| tuitionIsEstimate | true whenever tuitionFee is set, so the UI shows "≈" |
| examNote | see below |

**examNote** is built from:
- `required_subjects_display_mn`;
- `exam_2026_2027.note_mn`, minus the standard sentence starting "Журмын дагуу эрэлттэй";
- `notes_mn`;
- for foreign joint programs: "Хамтарсан хөтөлбөр: {format}, {partner_mn} ({country_mn})."

Add a prefix for these statuses:
- `verify`: "⚠ Тодруулах: "
- `conflicting`: "⚠ Эх сурвалж зөрүүтэй: "

**University row (ШУТИС, update only).** From `university.json`:
- **overview:** `overview_mn`.
- **tuition text / number:** `sidebar_suggestion.tuition_text_mn` / `tuition_number`.
- **flags:** "Боломжтой" for both the dorm and scholarship flags.
- **dorm how-to:** `sidebar_suggestion.dorm_howto_mn`.
- **phones / email / location:** from `sidebar_suggestion`.
- **ranking:** fill only if the field already exists ("QS Asia 2026: 1301–1400"); don't add columns.

**Scholarships (14).**
- **name:** `name_mn`.
- **coverage:** `coverage_mn`.
- **requirements:** `requirements_mn`.
- **deadline:** `deadline_mn`, empty when null.

**Dorms.** Only the 4 `record_type: "building"` rows.
- **name:** `name_mn`, with location and residents in the details or note field.
- **Fee per year:** empty, unless Step 2 found a 2025-26 price. Then fill it, with "2025-2026" in the details. Never show the 2020 price as current; it's already in the how-to text as old information.

**Admission dates (11+).**
- **event / start / end:** `event_mn` / `start` / `end`.
- **Null start:** a single deadline.
- **Null end:** a single day or an open-ended event.

**Not imported:** `faq`, `links`, `exams`, `joint_programs`, `tuition`, `sources`. They have no tables. Don't create tables or pages in this run; suggest them in the report (e.g. an FAQ or "Хамтарсан хөтөлбөр" section).

**Run locally**
1. Compare `migrations list --local` with `--remote` (rule 2). Apply locally the ones already applied on remote, plus yours.
2. Run the import locally. Check:
   - **counts for ШУТИС:** 13 faculties, 183+ majors, 14 scholarships, 4 dorms, 11+ dates;
   - **sample rows:** Компьютерын ухаан → primary [Математик, Физик], secondary [Нийгэм судлал, Англи хэл, Математик, Физик], 490/450. Архитектур → 550/550. Хэрэглээний математик 2+2 (Кумамото) is present. A ДаТС program is classified as Орон нутаг;
   - **МУИС unchanged:** compare its majors count and a checksum of a few rows, before and after;
   - **second run:** run the import again and confirm it changes nothing.
3. If practical, run the app or API locally against the local DB. Check that the ШУТИС page renders and the score check gives the Step 3 verdicts.

---

## Step 5 — Commit before deploying

1. Commit your work on the current branch:
   - the migration, API/web changes and tests;
   - `must-map.json` and the import script;
   - `data-import/shutis/` (without `gap-files/`, and without the data JSON if МУИС's JSON was kept out of git).

   Example message: `Add ШУТИС data and per-exam minimums (secondaryCutOffScore)`.
2. Choose the **build folder**. **Don't deploy yet:** deploying happens in Step 6c, after the remote migration.
   - Run `git status --porcelain` for the whole repo. Root lockfiles and shared packages get bundled too.
   - **Clean apart from your committed work:** the build folder is `REPO`.
   - **The owner has other uncommitted changes:** use a clean worktree as the build folder:
     1. `git worktree add ../UniversityMN-deploy HEAD`.
     2. Copy the untracked env/config files the build needs (`.env*`, `.dev.vars`, untracked wrangler config) from `REPO`.
     3. Install deps with the repo's package manager (frozen lockfile).
     4. Remove the worktree only after Step 6d.
3. Run both builds in the build folder now (`next build` etc.) to catch errors early.
   - **The build fails twice:** don't deploy and don't import to production. Report it.

---

## Step 6 — Production: back up → migration → deploy code → import data

**a. Prepare.** Run all production wrangler commands from the build folder's service directory: `SERVICE`, or its copy in the worktree. That way only committed migrations are considered.
1. Back up:
   ```bash
   mkdir -p ~/Documents/oyutan-backups
   npx wrangler d1 export rareapp-db --remote --env production \
     --output ~/Documents/oyutan-backups/rareapp-db-$(date +%Y%m%d-%H%M)-before-shutis.sql
   ```
   - Check that the file is non-empty and contains `CREATE TABLE`.
   - If the export fails (e.g. on virtual tables), log it and rely on the Time Travel bookmark below.
2. Log the current API deployment: `npx wrangler deployments list --env production`. Do the same in `WEB`; drop `--env` if its config has none. These are your code-rollback targets.
3. Take the bookmark **right before** the first remote write: `npx wrangler d1 time-travel info rareapp-db --env production --json`. Log it.

**b. Migration.**
1. Run `npx wrangler d1 migrations list rareapp-db --remote --env production`. Continue only if the single pending migration is yours (rule 2).
2. Apply it: `npx wrangler d1 migrations apply rareapp-db --remote --env production`.

The column is additive and nullable, so the current live code keeps working.

**c. Deploy code. ШУТИС has no majors yet, so this changes nothing visible.**
1. Deploy from the **build folder** chosen in Step 5: first the API (its `apps/rareAppMn/rareAppMn-service`), then the web (its `apps/rareAppMn/rareAppMn-web`). The commands are in Step 1.
2. Smoke-test the live site:
   - find the production API URL in the wrangler config or web env;
   - check that an МУИС page and its score check still work;
   - check that the ШУТИС page still loads.
3. If a deploy fails twice: don't import. If the site is broken, roll code back (e.2). Report.

**d. Import data.**
1. Run the same import against remote, using the remote ШУТИС id and natural-key lookups.
2. Re-run the Step 4 count checks on remote.
3. Live check:
   - the ШУТИС page shows its programs (HTTP 200, a program name in the HTML);
   - one live score check matches Step 3 (e.g. 061301 with М600/Ф440 → below).
   - **If the page still shows no programs but the API returns them,** the page is cached or prerendered. Revalidate or redeploy `WEB`; don't re-import.
4. If you used a worktree, remove it now (`git worktree remove ../UniversityMN-deploy`).

**e. Rollback, only if the live site is broken.**
1. **Fix forward first:** correct the data and re-run the idempotent import.
2. **Then the code:** `npx wrangler rollback <previous-version-id> --env production --message "revert shutis"` in `SERVICE`, and the same in `WEB` (drop `--env` if its config has none).
3. **Last resort, and only after the code is rolled back:** `npx wrangler d1 time-travel restore rareapp-db --bookmark=<bookmark> --env production`. This also throws away any user writes made after the bookmark; log that.

---

## Step 7 — Fix Хүрээ's address (the only other-university change allowed)

The DB has "Хан-Уул дүүрэг, Улаанбаатар" for Хүрээ, which is unverified seed data.

1. Open https://huree.edu.mn (footer or contact page). On 2026-10-09 it said:
   > Баянгол дүүрэг, 11-р хороо, Бичил хороолол, Хасбаатарын гудамж, Улаанбаатар · 7701-2002 · huree@huree.edu.mn
   - If the site now says something different, use that.
   - If the site is down, use the address above (it was read from the official footer on 2026-10-09) and say so in the log.
2. Update only Хүрээ's location: local first, then remote. Take and log a fresh Time Travel bookmark right before the remote write.
3. Fill phone/email only if those fields exist and are empty.

---

## Step 8 (optional, report-only, at most 30 minutes) — Check other universities' addresses

For other universities with a website:
- compare the address on the official site (footer or contact page) with the DB location;
- **don't change anything**; list the mismatches in the report with URLs, so the owner can decide.

---

## Step 9 — Push and report

1. **Push** only if the branch has an upstream (`git rev-parse --abbrev-ref @{u}`). Never force. Commit any Step 7 script changes first.
2. **Write `FOLDER/IMPORT_REPORT.md`**, and copy it to `DATA`:
   - counts imported;
   - gap-filling results: filled X of Y, by source; the list of filled rows; what's still unknown;
   - code changes and deploy versions;
   - the Хүрээ fix;
   - Step 8 mismatches;
   - anything skipped, and why;
   - 3–5 things worth checking on the site by eye.
3. **Tell the owner, in plain English, in 5–10 lines:** what's live, what's still missing, and where the report is. No jargon.

---

## Appendix A — Facts and caveats (keep them visible on the site)

**Score and minimums**
- **Score** = 0.7 × суурь + 0.3 × дагалдах.
- **Typical minimums:**
  - most programs: 490/450 (some 490/490, 450/450 or 490/440);
  - Архитектур: 550/550;
  - design programs: 450 + aptitude test 490;
  - branch schools: 430.
- **Swap rule:** for in-demand (Э) programs and index 05–09 programs, one суурь subject may count as the дагалдах exam. `dagaldah_options` already includes it. The aptitude-test programs never swap.

**Program data**
- Most exam data was read from the scanned 2026-27 regulation, whose OCR was broken. School sites (mes, sm, sas) filled 15 more rows on 2026-10-10.
- **Before Step 2:** 106 confirmed, 9 likely, 13 unclear, 55 unknown.
- **Korean 2+2 Механик инженерчлэл** (3 rows): the school page says суурь 480 (`verify`). Moving to Korea needs GPA 2.5 and TOPIK-4.
- **Эрдэнэт "Механик инженерчлэл":** one source says 2+2, another 1+3 (`conflicting`).

**Tuition**
- 209,000₮ per credit for 2026 entrants; 218,500₮ for Архитектур, Барилгын инженерчлэл, Программ хангамжийн инженерчлэл, Хиймэл оюун ухаан and Интерьер дизайн.
- Yearly figures are estimates. For joint programs they cover only the years at ШУТИС.
- ЭЦДС and ӨмТДС prices aren't published.
- The admission page's 190,000₮ confirmation payment is probably last year's figure.

**Dorms and dates**
- **Dorms:** 4 buildings in Улаанбаатар. Prices are from 2020/2022 until Step 2 finds the 2025-26 table.
- **2027 dates:** not announced. "2026 оны жишиг" rows are last year's pattern.

**Wording**
- Passing the minimum does not mean admitted, because seats are filled by rank. Say "Босго давсан — өрсөлдөх эрхтэй", never "Тэнцсэн".

## Appendix B — Yearly refresh (each spring)

1. Re-check:
   - the regulation PDF (programs, subjects, minimums);
   - elselt.edu.mn/page/14 (steps, fees, scholarships) and page/28 (tuition);
   - the dorm price PDF;
   - ЭШ dates (eec.mn);
   - must.edu.mn/mn/page/700 (joint programs).
2. Update `verified_at` and `status`.
3. Run `node seed/load-data.mjs`.
4. Re-run the import (it's idempotent).
