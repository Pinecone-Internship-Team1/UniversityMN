# АШУҮИС (MNUMS) → oyutan.mn — autonomous runbook for Claude Code

**Owner's request:** do the whole job in this file without asking the owner anything. They have given permission for all of it, and they prefer short, plain-English explanations.

**This is the third university.** МУИС and ШУТИС were imported the same way. Reuse what exists:
- `SERVICE/data-import/import-must.mjs` and `must-map.json` (ШУТИС);
- the `secondaryCutOffScore` per-exam logic;
- `Major.faculty`;
- the date helper.

**Done means:**
- АШУҮИС is live on oyutan.mn with its programs (20 bachelor + 8 associate in Улаанбаатар, unless Step 3.4 skips associates, plus branch programs confirmed in Step 2), 7 scholarships, dorm info and admission dates.
- The score check handles АШУҮИС's sum formula.
- There is a short report.

**Paths**
- `FOLDER` = `~/Downloads/ashuuis-oyutan-mn`: this folder as unzipped. `IMPORT_LOG.md` and `IMPORT_REPORT.md` go here.
- `REPO` = `/Users/zetsu/Documents/pinecone/UniversityMN` (branch `zetsu`).
- `SERVICE` = `REPO/apps/rareAppMn/rareAppMn-service`. `WEB` = `REPO/apps/rareAppMn/rareAppMn-web`.
- `DATA` = `SERVICE/data-import/ashuuis`: your working copy of this folder. **All data edits happen here.**

---

## 0. Ground rules (read first)

**Don't ask: decide and log.**
- When something is unclear, take the safest reasonable choice, write it in `FOLDER/IMPORT_LOG.md`, and continue.
- If your context gets long, re-read the log to resume.

**Production deploys are blocked by this machine's permission check.** Don't try them. When a deploy is due, give the owner **one** `!` line to paste, then wait for "done" (Step 6).

**Safety rules.** These override "don't ask".
1. **Back up first.** Never write to the remote (production) database without a backup or Time Travel bookmark taken in this run, just before the first remote write.
2. **Only your migration on production.**
   - Before any remote `migrations apply`, run `migrations list --remote`. Continue only if the single pending migration is the one you wrote.
   - If anything else is pending, apply nothing: skip Step 6 and report it.
   - **Local DB:** `migrations apply --local` applies everything pending, so decide at Step 1.5. If a migration that isn't yours is pending on **both** local and remote (the owner's work in progress), skip the local import and Step 6, and report it. If local is only behind remote, applying locally is fine.
3. **Additive schema changes only** (`ADD COLUMN`). Never drop or rename anything.
4. **Touch only АШУҮИС's rows.** Never change another university's data.
   - Don't delete existing АШУҮИС rows either. Update matches in place, leave unmatched rows alone, and list them in the report.
5. **Never half-import.**
   - The import must be idempotent: `INSERT … ON CONFLICT(id) DO UPDATE`, or look up first, then UPDATE/INSERT.
   - **Never** use `INSERT OR REPLACE` or delete-and-reinsert. D1 enforces foreign keys.
6. **Code before data.** Import АШУҮИС majors into production only after the new score-check code is live. Old code would rank АШУҮИС with the 0.7/0.3 rule.
7. **Git.** Commit on the current branch and stage only your own files.
   - Never commit `gap-files/`.
   - Never force-push or rewrite history.
8. **Deploy only committed code** (Step 5).
9. **Settings and secrets.**
   - Run wrangler from `SERVICE` or `WEB`, or their copies in the Step 5 worktree.
   - Don't change Cloudflare account settings, print secrets, install global tools, or send the owner's personal data anywhere.
10. **Stop a failing step.** If the same step fails twice, stop it, log why, and skip the steps that depend on it. Prefer fixing forward.
    - The remote import is the exception: never leave it half done. Either fix and re-run it, or delete **only the rows this run inserted** (their ids are logged in Step 6d).

---

## 1. What's in this folder

| Path | What it is |
|---|---|
| `data/programs.json` | **42 rows.** 28 Улаанбаатар programs: 20 bachelor + 8 дэд бакалавр (associate), all `confirmed` from the official 2026-27 table. 14 Дархан-Уул branch rows are `unknown`/`unverified` and are filled in Step 2. |
| `data/schools.json` | 12 records: 7 Улаанбаатар schools that admit students (`constituent`), 4 branches (`branch`) and 1 graduate school (`unit`, skip). |
| `data/university.json` | Overview, history, stats, contacts, services, and `sidebar_suggestion` (ready-made sidebar values, including `dorm_howto_mn`). |
| `data/scholarships.json` | 7 rows, all university-wide. |
| `data/dorms.json` | 1 facts record, 4 buildings (`record_type: "building"`: 3 in Улаанбаатар + Дархан-Уул; prices unknown) and 1 how-to record. |
| `data/admission_dates.json` | 6 rows labelled "2026 оны жишиг". 2027 dates aren't announced. |
| `data/admission_2026.json` | Steps, list/direct selection rules, score formula, skills test (with conversion table), special routes, foreign applicants, Дархан-Уул extra admission. |
| `data/joint_programs.json` | English-taught MBBS, the Дархан-Уул 2+4 / 2+3 tracks, exchanges. |
| `data/tuition_2026_2027.json`, `exams.json`, `faq.json`, `links.json` | Tuition table, national exam info, Q&A, links. |
| `data/sources.json` | All sources. **`gap: true`** = couldn't be read from the cloud; `gap_fill_hint_mn` says what to take from it. |
| `GUIDE_MN.md` | Student guide in Mongolian, with an appendix of all programs. |
| `seed/load-data.mjs` | Validates everything. It must end with "All files valid ✔". |
| `seed/exam-tools.mjs` | `buildExam` / `applyExam`: write exam data in the dataset's exact format. |
| `seed/eligibility.mjs` | **Reference score check** for both formulas (АШУҮИС sum; МУИС/ШУТИС 0.7/0.3). This is the spec. |
| `seed/guide-appendix.mjs` | Rebuilds the guide's appendix after programs.json changes. |

**How АШУҮИС admission works.** These rules differ from МУИС and ШУТИС; see `admission_2026.json`.
- **Two exam groups.** Each program has two groups, e.g. Хүний их эмч: Хими/Математик + Биологи/Физик. The student's best subject in each group counts.
- **Two minimums.** Each group has its own minimum (`threshold_score`, `secondary_threshold_score`).
- **Score = group 1 + group 2.** A plain sum, max 1600. In the data that's `exam_2026_2027.weights = {suuri: 1, dagaldah: 1}`, versus 0.7/0.3 at МУИС and ШУТИС.
- **Two selection types** (`selection_type`):
  - `list` (up to 8 choices): ranked by the sum.
  - `direct` (1 choice): anyone meeting both minimums can enrol.
- **"Ур чадварын шалгалт"** is АШУҮИС's own biology skills test (100 points, 60+ passes, converted to 200–800). Students have no ЭШ score for it, so it gets the neutral verdict, like ШУТИС's aptitude test.
- **Tuition** in programs.json is the **official** yearly fee for 2026-27 (`is_official: true`), not an estimate.

---

## Step 1 — Get your bearings

1. **Check the repo.** `cd REPO` and run `git status`. Never stage the owner's uncommitted changes.
2. **Read the ШУТИС import.** Read `SERVICE/data-import/import-must.mjs` and `must-map.json`, and the ШУТИС report in `SERVICE/data-import/shutis/IMPORT_REPORT.md`. Reuse the same approach, field conventions and commands.
3. **Read the schema.** Read the migrations folder for the real `majors` columns, including `secondaryCutOffScore` and `degreeType`. Check which `degreeType` values exist and how the UI uses them.
4. **Find АШУҮИС's university row** on local **and** remote with a read-only `SELECT` of all universities' id, name and short name/slug.
   - Match in JavaScript, not SQL: SQLite `LIKE` and `lower()` ignore case only for Latin letters.
   - Compare `toLowerCase()` names against "анагаахын шинжлэх ухааны", "ашуүис" and "mnums".
   - If more than one row matches, or local and remote disagree, stop before Step 4 and report it.
   - **It exists:** use it on each database (the ids may differ). Log any faculties or majors it already has.
   - **It doesn't exist:** create it in Step 4, copying the shape of the ШУТИС row (same kind of id/slug, e.g. `ashuuis`). Log that its logo may be missing.
5. **Log pending migrations.** Run `npx wrangler d1 migrations list rareapp-db --remote --env production` and the same with `--local`, from `SERVICE`. Log what is pending now.
6. **Copy the data.** Copy `FOLDER` to `DATA`, add `gap-files/` to `.gitignore`, and run `node seed/load-data.mjs` in `DATA`.

---

## Step 2 — Fill the data gaps (the cloud couldn't reach these; you can)

Download into `DATA/gap-files/`. Many URLs contain spaces or Cyrillic, so encode them:
`curl -L --max-time 60 -A "Mozilla/5.0" -o gap-files/<name> "$(node -p 'encodeURI(process.argv[1])' '<url>')"`. Open images and PDFs with your Read tool, in page ranges of 20 or fewer. If a download fails twice, retry once at the end of this step, then give up on it.

**Sources in order** (the `gap: true` records in `DATA/data/sources.json`):
1. **`gap-reg-pdf`.** The 2026-27 admission regulation А/136, a scanned PDF. Take:
   - the registration fee;
   - each branch's program table (subjects and minimums);
   - the skills-test date;
   - seat numbers;
   - anything that contradicts programs.json.
2. **`gap-darkhan`.** Each `mnums-darkhan-*` row's `exam_2026_2027.note_mn` holds its image URL. Also read the admission-guidance images.
3. **`gap-govi-altai`, `gap-dornogovi`, `gap-arkhangai`.** Program lists and tables, mostly images.
4. **`gap-dorm-price`.** Skip `gap-programs-page`: it is a JavaScript page that needs a browser.

**Check the year.**
- Many branch images are from 2023–2025. Use a table for exam subjects and minimums **only if it is for 2026-2027**.
- An older image can still confirm that a program exists, but then leave its subjects unknown and set `status: "verify"`.

**Write values with `seed/exam-tools.mjs`.**
```js
import { readFile, writeFile } from 'node:fs/promises';
import { buildExam, applyExam } from './seed/exam-tools.mjs';
const file = 'data/programs.json';
const json = JSON.parse(await readFile(file, 'utf8'));
const p = json.records.find((r) => r.id === 'mnums-darkhan-suvilagch');
const exam = buildExam({ group1: ['Хими', 'Биологи'], group2: ['Ур чадварын шалгалт'],
  threshold1: 430, threshold2: 450, selection: 'direct', sourceUrl: '<url you read>', confidence: 'confirmed' });
applyExam(p, exam, { today: '<YYYY-MM-DD>' });
await writeFile(file, JSON.stringify(json, null, 1) + '\n');
```

**Rules**
- **Confidence.** Use `confirmed` only when every cell is clearly legible. Use `likely` when you had to infer which group a subject belongs to. If a cell is blurry, leave the row and log it.
- **Selection type.** Use what the source says. If it says nothing, copy it from the same-named Улаанбаатар program, and set `confidence: 'likely'` and the row's `status: "verify"`.
- **Branch tuition.** Only if the source shows **2026-2027** fees: set `tuition_2026_2027.per_year`, `is_official: true` and the matching `estimated_per_year`.
- **Programs missing from programs.json.** Add them with:
  - id `mnums-<branch>-<latin-slug>`;
  - `school_id` = the branch id;
  - `campus_mn`;
  - all other fields shaped like the existing rows.
- **Дархан-Уул rows you can't confirm for 2026-27** stay `unverified`. Step 4 skips them.
- **Registration fee.** Write it into `admission_2026.json → mnums-bachelor-2026.registration_fee` (₮) and update the guide sentence in section 3.
- **Dorm prices.** Set `price_per_year`, `price_year` and the source on the building rows, then update the price sentence in `university.json → sidebar_suggestion.dorm_howto_mn`.
- **Mark each gap source you used** in `sources.json`: `gap: false`, `filled_at`, and a one-line `filled_note`.

**Finish**
1. `node seed/load-data.mjs` must report valid.
2. Run `node seed/guide-appendix.mjs`.
3. Log every filled row (subjects, minimums, source) so the owner can spot-check.

Spend about 30–40 minutes here at most.

---

## Step 3 — Code change: score formula, selection type, associate degree

One additive migration: `ALTER TABLE majors ADD COLUMN primaryWeight REAL;`, `… secondaryWeight REAL;`, `… selectionType TEXT;`. All are nullable; match the existing naming style.

**1. API.** Read and return the three fields wherever `secondaryCutOffScore` is read or returned.

**2. scoreMatch.** **Extend** the existing function; don't replace it. `seed/eligibility.mjs` is the spec for the **new** behaviour, which applies only to rows whose weights or selectionType are set.
- **Baseline first.** Before editing, save the current output (verdict, message, score) for every local МУИС and ШУТИС major across these inputs: {Математик 620, Физик 540, Англи хэл 500, Нийгэм судлал 480}, {Математик 480, Физик 470}, {Хими 620, Биологи 580}, {Математик 600}, {}. After the change, the output must be identical.
- **Weights.** `w1 = primaryWeight ?? 0.7`, `w2 = secondaryWeight ?? 0.3`. Rows with null weights (МУИС, ШУТИС, everyone else) behave **exactly** as now.
- **Pair score.** `w1·s + w2·d`. The pair rules stay the same: s ≠ d, both scores finite, the skills test never forms a pair, and the per-exam minimums apply.
- **Mixed lists.** Rank by `score / (w1 + w2)`, so the АШУҮИС sum and the 0.7/0.3 score sit on the same 200–800 scale.
- **Verdict text for `selectionType = 'direct'`:** "Босго давсан — шууд элсэх боломжтой". Everything else keeps "Босго давсан — өрсөлдөх эрхтэй".
- **Skills test.** If the neutral skills-test message names ШУТИС, make it generic: "Ур чадварын шалгалтыг их сургууль өөрөө авна — сургуулиас тодруулна уу".

**3. UI.** When `w1 = w2` (the sum formula):
- label the exams "1-р шалгалт ≥ X, 2-р шалгалт ≥ Y" instead of "Суурь / Дагалдах";
- if a computed score is shown, label it "Нийлбэр оноо".

**4. Associate degree.** Make sure "Дэд бакалавр" shows correctly.
- If degreeType is free text, use it.
- If it's an enum, add the value.
- If filters assume bachelor only, include associates with a clear label.
- If this needs more than small, safe changes, skip the 8 associate rows in Step 4 and report it.

**5. Tests.** Use fixture rows copied from the **untouched** `FOLDER/data/programs.json`. If the score check needs a Mongolian writing score, give every case one.
- An МУИС case and a ШУТИС case, unchanged.
- Хүний их эмч (`mnums-med-khunii-ikh-emch`):
  - Хими 620, Биологи 580 → eligible, score 1200;
  - Хими 620, Биологи 480 → below (Биологи 490), suggesting Физик. Математик is not suggested, because group 1 already passes.
- Сувилагч (`mnums-nursing-suvilagch`):
  - Хими 500 → neutral (skills test);
  - Хими 420 → below.
- Эрүүл мэндийн мэдээлэл зүйч (`direct`): Математик 600, Англи хэл 500 → eligible with the "шууд элсэх" text.
- Any `mnums-darkhan-*` row still unknown → neutral.

Then run the tests, typecheck/lint and both builds.

**6. Cross-check.** In `FOLDER`, which stays untouched, `node seed/eligibility.mjs Хими=620 Биологи=580 Математик=500 "Англи хэл"=520` gives eligible 16, neutral 25, missing 1. Your port must give the same per-row verdicts for these rows.

---

## Step 4 — Mapping and import into the **local** database

Write `SERVICE/data-import/import-mnums.mjs`, a copy of the ШУТИС import adapted to this data, plus `SERVICE/data-import/mnums-map.json`.
- The import generates **one** SQL file and runs it with **one** `wrangler d1 execute --file` call.
- It logs the ids it inserts.
- Idempotent: running it twice changes nothing.
- Use natural-key lookups on each database.
- Assert that no target id belongs to another university.

**University row:** update the existing row, or create it (Step 1.4).
- overview ← `overview_mn`;
- tuition text / number ← `sidebar_suggestion.tuition_text_mn` / `tuition_number`;
- both flags ← "Боломжтой";
- dorm how-to ← `dorm_howto_mn`;
- phones / email / location / website ← `sidebar_suggestion`.

**Faculties:** the 7 `constituent` schools.
- A branch becomes a faculty **only if it gets at least one imported program**.
- location ← `location_mn`. Branches are in aimags, so the Улаанбаатар / Орон нутаг filter must classify them as Орон нутаг; check it.

**Majors:** import only rows whose `status` is not `unverified` and whose `split_confidence` is not `unknown` after Step 2. All 28 Улаанбаатар rows qualify.

| Field | Value |
|---|---|
| faculty | faculty for `school_id` |
| name | `name_mn` (unique within a faculty: the associate nurse is "Сувилагч (дэд бакалавр)") |
| degreeType | bachelor value, or the associate value from Step 3.4 for `degree: "Дэд бакалавр"` |
| primarySubjects | `exam_2026_2027.suuri_options` (group 1) |
| secondarySubjects | `exam_2026_2027.dagaldah_options` (group 2) |
| requiredSubjects | the МУИС/ШУТИС convention |
| cutOffScore | `threshold_score` |
| secondaryCutOffScore | `secondary_threshold_score` |
| primaryWeight / secondaryWeight | `exam_2026_2027.weights.suuri` / `.dagaldah` (1 / 1) |
| selectionType | `selection_type` (`list` / `direct`) |
| tuitionFee | `tuition_2026_2027.per_year` |
| tuitionIsEstimate | `false` when `is_official` is true; otherwise `true` |
| examNote | see below |

examNote is built from:
- `required_subjects_display_mn`;
- `exam_2026_2027.note_mn`;
- `notes_mn`;
- for Дархан-Уул 2+4 / 2+3 rows, `joint_program.label_mn`.

Add a prefix for these statuses:
- `verify`: "⚠ Тодруулах: "
- `conflicting`: "⚠ Эх сурвалж зөрүүтэй: "

If `tuition_2026_2027.status` is `conflicting` (Зүү төөний их эмч), append "⚠ Төлбөр эх сурвалжаар зөрүүтэй."

**Scholarships (7):**
- name ← `name_mn`;
- coverage ← `coverage_mn`;
- requirements ← `requirements_mn`;
- deadline ← `deadline_mn`.

**Dorms:** the `record_type: "building"` rows.
- name ← `name_mn`; location and capacity go in details.
- Fee per year only if Step 2 found one, with the year in the details.

**Admission dates (6+):**
- event / start / end ← `event_mn` / `start` / `end`.
- A null start means a single deadline; a null end means a single day or an open-ended event.

**Not imported:** faq, links, exams, joint_programs, tuition, sources. They have no tables. Suggest them in the report.

**Run locally**
1. Compare `migrations list --local` with `--remote` (rule 2), then apply.
2. Run the import, then check:
   - **Counts:** faculties, majors, scholarships, dorms and dates for АШУҮИС.
   - **Sample rows:**
     - Хүний их эмч: groups [Хими, Математик] / [Биологи, Физик], 490/490, weights 1/1, `list`, fee 6,851,000, not an estimate.
     - Сувилагч: the skills test.
     - An associate row.
   - **МУИС and ШУТИС unchanged:** compare majors counts and checksums before and after.
   - **Second run:** run the import again; it must change nothing.
3. Run the app or API locally if practical. The АШУҮИС page should render, and the Step 3 verdicts should match.

---

## Step 5 — Commit, then prepare the build

1. **Commit** on the current branch:
   - the migration, code and tests;
   - `import-mnums.mjs`, `mnums-map.json`;
   - `data-import/ashuuis/` (without `gap-files/`).

   Example message: `Add АШУҮИС data and sum-formula scoring (primaryWeight/secondaryWeight, selectionType)`.
2. **Build folder: always a fresh worktree at your commit,** so the deploy ships exactly what you checked.
   - Run `git worktree prune`, then `git worktree add ../UniversityMN-ashuuis-$(date +%Y%m%d%H%M) HEAD`. Call this folder `WT`, and log its path and the commit SHA.
   - Copy the untracked env/config files the build needs (`.env*`, `.dev.vars`) from `REPO`.
   - Install deps with the frozen lockfile.
3. **Build both apps in `WT` now:**
   - the service build/typecheck;
   - in the web, `npx next build && npx opennextjs-cloudflare build --skipNextBuild`.

   If a build fails twice, stop: no deploy, no production import. Report it.

---

## Step 6 — Production: back up → owner deploys → import data

**a. Prepare.** Run these yourself, from `WT/apps/rareAppMn/rareAppMn-service`.
1. **Backup:** `mkdir -p ~/Documents/oyutan-backups && npx wrangler d1 export rareapp-db --remote --env production --output ~/Documents/oyutan-backups/rareapp-db-$(date +%Y%m%d-%H%M)-before-ashuuis.sql`.
   - Check that the file is non-empty and contains `CREATE TABLE`.
   - If it fails, rely on the bookmark below.
2. **Rollback targets:** log `npx wrangler deployments list --env production` in the service, and `npx wrangler deployments list` in the web (no `--env`, as in the ШУТИС deploy).
   - Also save the production baseline for 6c, for 3 МУИС and 3 ШУТИС programs with {Математик 620, Физик 540, Англи хэл 500}:
     - the live score-check answers, if the API has a score-check endpoint;
     - otherwise, the API responses for those majors, which hold the fields scoreMatch uses.
3. **Pending migrations:** run `migrations list --remote` and confirm yours is the **only** one pending (rule 2).
4. **Bookmark:** log one with `npx wrangler d1 time-travel info rareapp-db --env production --json`.

If one of these is blocked by the permission check, give the owner that read-only command as its own `!` line. Read its output before going on.

**b. Hand over the deploy.** Don't try it yourself.
1. Re-run the 6a.3 migration check right before handing over.
2. Tell the owner, in one plain sentence, to paste this **one** line into Claude Code. Fill in the real `WT` path and SHA:
```
! cd <WT>/apps/rareAppMn/rareAppMn-service && test -z "$(git status --porcelain --untracked-files=no)" && [ "$(git rev-parse HEAD)" = "<SHA>" ] && npx wrangler d1 migrations apply rareapp-db --remote --env production && npx wrangler deploy --env production && cd ../rareAppMn-web && npx opennextjs-cloudflare deploy
```
- The guard stops it if tracked files in the worktree changed or HEAD moved. Build output is untracked, so it doesn't trip the guard.
- The web bundle was built in Step 5.3.
- The new columns are additive and nullable, so the migration and the new code are safe for every university before any АШУҮИС data exists.
- Then wait for "done".

**c. After "done".**
1. Read the deploy output from the conversation.
2. Confirm **both** workers show new version ids (`deployments list`), and that the API now returns the `primaryWeight` field.
   - **The service deployed but the web didn't:** give the owner the web-only part of the line again. The API change is additive, so this is safe.
3. Smoke-test:
   - the 6a production baseline answers are identical;
   - the live pages return 200.
4. **If anything is broken,** roll code back (6e) and stop.

**d. Import data.**
1. Take and log a second Time Travel bookmark.
2. Run the import against remote (one SQL file, one `execute`), using the remote АШУҮИС id and natural keys.
   - Log the inserted ids.
   - If the permission check blocks it, give the owner that one command as a `!` line.
3. Re-run the Step 4 checks on remote.
4. Live check:
   - the АШУҮИС page shows its programs;
   - one score check: Хүний их эмч with Хими 620 / Биологи 480 → below.
5. **If the page shows no programs but the API returns them,** the page is cached. Revalidate or redeploy the web; don't re-import.
6. Remove the worktree (`git worktree remove <WT>`).

**e. Rollback, only if the live site is broken.**
1. **Fix forward first:** correct the data and re-run the idempotent import.
2. **Before rolling code back after 6d:** delete this run's inserted rows (the logged ids). Otherwise АШУҮИС would be scored with the old rule.
3. **Then the code:** give the owner `! … npx wrangler rollback <previous-version-id> --env production --message "revert ashuuis"` for the service, and the same without `--env` for the web.
4. **Last resort, after the code is rolled back:** Time Travel restore to the first bookmark. This also loses user writes made after it; log that.

---

## Step 7 — Push and report

1. **Push** only if the branch has an upstream. Never force.
2. **Write `FOLDER/IMPORT_REPORT.md`** and copy it to `DATA`:
   - counts;
   - Step 2 results: filled rows, what's still unknown, and the year of each source;
   - code changes and deploy versions;
   - anything skipped (e.g. associates, unconfirmed branch rows) and why;
   - 3–5 things to check by eye.
3. **Tell the owner, in plain English, in 5–10 lines:** what's live, what's still missing, and where the report is.

---

## Appendix — Facts and caveats (keep them visible on the site)

**Score**
- **Formula:** group 1 + group 2 (sum). Each group has its own minimum.
- **Medicine programs:** Хими/Математик ≥ 490 + Биологи/Физик ≥ 490 for Хүний, Хүүхдийн and Шүдний их эмч, Эм зүйч and Био-анагаах.
- **Traditional medicine:** 440 / 490 (Зүү төөний их эмч 440 / 450).

**Selection**
- **List programs:** Хүний, Хүүхдийн, Шүдний, Уламжлалт анагаахын and Зүү төөний их эмч, Эм зүйч, Био-анагаах, Эрүүл ахуй, тархвар судлаач. Ranked by the sum; ties are broken by high-school GPA, then the Mongolian language exam.
- **Direct programs:** the other bachelors and all associates.
- **Skills test:** biology, 100 points, 60+ passes. Conversion: 60→480, 70→560, 80→640, 90→720, 95–100→760–800.

**Tuition (official, 2026-27)**
- Doctor programs 6,851,000₮.
- Зүү төөний их эмч 7,072,000₮ on the school page, which conflicts with a news report saying the maximum is 6,851,000₮.
- Associates 3.52–3.96 сая ₮.

**Unknown**
- Branch tables, tuition and dorm prices.
- The registration fee (Step 2 may find it).
- The skills-test date.
- 2027 dates.

**Wording**
- List programs: say "Босго давсан — өрсөлдөх эрхтэй", never "Тэнцсэн".
- Direct programs: "шууд элсэх боломжтой".
