# Next universities → oyutan.mn: runbook for Claude Code (mostly data only)

**Owner's request:** add the universities in `unis/` to oyutan.mn without asking anything. They have given permission, and they prefer short, plain-English explanations.

**What's different this time.** The site's code should already handle the needed rules (from the МУИС, ШУТИС and АШУҮИС work):
- `secondaryCutOffScore`: a separate minimum for each exam;
- `primaryWeight` / `secondaryWeight` and `selectionType`;
- associate degrees.

So this run should be **data only: no migration, no deploy**. One new case needs checking first (Step 1.3): СЭЗИС sets **one minimum on the average of the two exams** (weights 0.5/0.5). If the code or the page doesn't handle that correctly, Step 3b makes one small fix and the owner pastes one deploy line. Nothing else should need code.

**Universities in this package** (`unis/<slug>/`):

| Folder | University | Programs | Checkable now* | Score rule | Main job in Step 2 |
|---|---|---|---|---|---|
| `ufe` | СЭЗИС — Санхүү эдийн засгийн их сургууль (UFE) | 58 (1 skipped) | 50 | Main majors: **average** of the 2 exams ≥ one minimum. UFE Tech: a minimum per exam | 5 Education/Social Sciences rows; UFE Tech fees |
| `msue` | МУБИС — Монгол Улсын Боловсролын Их Сургууль (MNUE) | 38 | 0 | Unknown until Step 2 | Read the 2026-27 subject and minimum table (Google Drive PDF) |
| `muls` | ХААИС — Хөдөө аж ахуйн их сургууль (MULS) | 52 (2 skipped) | 0 (subjects known) | A minimum per exam; formula unknown | Read the 2026-27 minimums from `admission.muls.edu.mn` |

\* Programs the score check can judge before Step 2. The rest import as neutral rows (Step 3) unless Step 2 fills them. Each university also has scholarships, dorms, contacts, admission steps and dates, and a student guide (`GUIDE_MN.md`).

**Paths**
- `FOLDER`: this folder, wherever the owner unzipped it (normally `~/Downloads/oyutan-next-unis`). Put `IMPORT_LOG.md` and `IMPORT_REPORT.md` here.
- `REPO`: `/Users/zetsu/Documents/pinecone/UniversityMN`. Work on branch `zetsu`.
- `SERVICE`: `REPO/apps/rareAppMn/rareAppMn-service`.
- `DATA`: `SERVICE/data-import/next-unis`, your working copy of `FOLDER`. **All data edits happen here.**

**If macOS blocks reading `FOLDER`** (it did once for ~/Downloads), tell the owner in one sentence to move the folder into `~/Documents` and say "moved". Then continue.

---

## 0. Ground rules

**Don't ask: decide and log.**
- Choose the safest reasonable option and write it in `FOLDER/IMPORT_LOG.md`.
- Log every step: commands, counts, decisions, errors. Re-read the log if your context gets long.

**Safety rules.** These override "don't ask".
1. **Back up first.** No remote write without a backup or a Time Travel bookmark taken in this run, right before the first remote write.
2. **Touch only the universities in this package.** Never change or delete another university's rows. Existing rows of these universities: update matches in place, leave unmatched rows alone, and list them in the report (Step 3, "Old rows").
3. **Idempotent import.**
   - Use `INSERT … ON CONFLICT(id) DO UPDATE`, or look up first and then UPDATE/INSERT. Never `INSERT OR REPLACE`, never delete-and-reinsert (D1 enforces foreign keys).
   - Use natural-key lookups on each database, because local and remote ids can differ. The keys:
     - faculty: (university, name);
     - major: (university, faculty, name);
     - scholarship and dorm: (university, name);
     - date: (university, event).
   - Before writing, assert that no target id belongs to another university.
4. **One university at a time on production.**
   - Each university gets **one** generated SQL file, run with **one** `wrangler d1 execute --remote --file` call.
   - Log the ids it inserts.
   - If an import can't be completed, delete **only the rows this run inserted** for that university, then report.
5. **Git.** Work on `zetsu`. Stage only your own files. Never commit `gap-files/`. Never force-push.
6. **Settings and secrets.** Run wrangler from `SERVICE`. Don't change Cloudflare settings. Don't print secrets. Don't install global tools.
7. **Stop a failing step.** If a step fails twice, stop it, log why, and skip whatever depends on it. Prefer fixing forward.

---

## Step 1 — Get your bearings

1. **Repo and past imports.**
   - `cd REPO`, run `git status` and `git pull --ff-only` on `zetsu`. If it can't fast-forward, log it and continue.
   - Read the last import (АШУҮИС): normally `SERVICE/data-import/import-mnums.mjs`, `mnums-map.json` and `SERVICE/data-import/ashuuis/IMPORT_REPORT.md`. If the names differ, find them with `git log --oneline -- apps/rareAppMn/rareAppMn-service/data-import`. Reuse the same approach.
   - **АШУҮИС must be finished first.** This run needs the АШУҮИС code (weights, `selectionType`) live in production. Check two things:
     - the production API returns `primaryWeight` for majors;
     - `npx wrangler d1 migrations list rareapp-db --remote --env production` (run from `SERVICE`) shows **no** pending migration.

     If either fails, the АШУҮИС deploy isn't done yet. Never apply migrations yourself in this run.
     - **No migration other than АШУҮИС's is pending** (АШУҮИС's adds `primaryWeight` / `secondaryWeight` / `selectionType`; it may already be applied), and АШУҮИС's worktree from its log still exists:
       1. First take the Step 4.1 backup and bookmark, because that line writes to production.
       2. Then tell the owner in one sentence to paste the АШУҮИС deploy line from that run. Copy it for them from the АШУҮИС `IMPORT_LOG.md`.
       3. Wait for "done", then re-run both checks.
     - **Any other migration is pending, or the АШУҮИС worktree is gone:** don't hand over any line. Do Steps 1–3 locally only, skip Steps 3b and 4, and say in the report what blocks production.
2. **Schema.** Read the migrations for the real `majors` columns:
   - `secondaryCutOffScore`, `primaryWeight`, `secondaryWeight`, `selectionType`, `degreeType`.
   - Note how `degreeType` is used for bachelor and associate degrees.
3. **Read `scoreMatch` and the major card / score-result UI.** Answer these in the log, with file and line:
   - (a) Per-exam rows (`secondaryCutOffScore` set) with weights: handled since АШУҮИС. Just confirm.
   - (b) One-minimum rows (`secondaryCutOffScore = null`, like МУИС): is the pass check `w1·s + w2·d ≥ cutOffScore` with `w1 = primaryWeight ?? 0.7`, `w2 = secondaryWeight ?? 0.3`, or the fixed 0.7/0.3?
   - (c) How does the page show a one-minimum row whose weights are 0.5/0.5? It must show **one** minimum on the combined score, not "2-р шалгалт ≥ …".
   - (d) If the page shows a computed score for a row with equal weights, what is it called? "Нийлбэр оноо" is right for 1/1 (АШУҮИС) but wrong for 0.5/0.5 (СЭЗИС, where it is an average).

   **All fine:** this run is data only, so skip Step 3b. **Any of (b)–(d) wrong:** do Step 3b. Reading the code isn't enough for (b): the СЭЗИС cases in Step 3's score check are the real test. A fixed 0.7/0.3 formula fails them, so if they fail, do Step 3b even if the code looked fine.
4. **Validate.** Copy `FOLDER` to `DATA` and add `gap-files/` to `.gitignore`. Run `node seed/load-data.mjs` in `DATA`; it must end with "All files valid ✔".
5. **Find each university's row** on local **and** remote with a read-only `SELECT` of all universities' id, name and short name/slug.
   - Match in JavaScript with `toLowerCase()`; SQLite `LIKE` only ignores case for Latin letters. Try the full name, the short name and the English short name from `unis/<slug>/data/university.json`.
   - **More than one match, or local and remote disagree:** skip that university and report it.
   - **No match:** create the row in Step 3, copying the shape of the АШУҮИС row (same kind of id/slug, e.g. `ufe`, `msue`, `muls`). Log that its logo may be missing.
6. **Rules the code can't represent** (for example three exams, or an extra minimum for one subject on top of the threshold — `exam_2026_2027.subject_minimums`, such as СЭЗИС Эдийн засаг: Математик ≥ 600):
   - Import those programs with empty subjects and the rule written in `examNote`, so students get the neutral verdict and read the rule.
   - Report them. Don't add code for them; Step 3b is only for the 1.3 cases.
7. **Subject names.** Every subject in this package is one of: Математик, Физик, Хими, Биологи, Англи хэл, Орос хэл, Монгол хэл, Нийгэм судлал, Түүх, Газарзүй, plus "Ур чадварын шалгалт" (the university's own skills test). Confirm these match the names the app's score form uses. If the app spells one differently, map it in the import and log it.

---

## Step 2 — Fill the data gaps (about 20–30 minutes per university)

**Sources.** Each university's `unis/<slug>/data/sources.json` lists `gap: true` sources with a `gap_fill_hint_mn` saying what to take.

**Downloading.** Download into `DATA/gap-files/<slug>/`, letting Node's URL parser encode the address. It encodes spaces and Cyrillic but leaves an existing `%3D` alone; `encodeURI` would double-encode it.
`curl -L --max-time 60 -A "Mozilla/5.0" -o gap-files/<slug>/<name> "$(node -p 'new URL(process.argv[1]).href' '<url>')"`
- **Google Drive** links (`drive.google.com/file/d/<ID>/preview`): download `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`. Check that the result is really a PDF (`file <name>`), not an HTML page.
- **Pages that only work in a browser** (JavaScript, accordions, flipbooks): if `curl` gets no content, look in the page source for the PDF/image/API URL it loads. If that fails, use a headless browser only if one is already installed. Otherwise log it and move on.
- Open images and PDFs with your Read tool, in page ranges of 20 or fewer.
- If a download fails twice, retry once at the end, then give up on it.

**Writing values.** Use `seed/exam-tools.mjs` (`buildExam` + `applyExam`) so every row keeps the same shape and wording. `applyExam` also refreshes the display sentence and, for a `confirmed` fill, sets `status: "current"` so the "⚠ Тодруулах" warning goes away.
- **Formula published:** pass the real `weights` and `thresholdType`. Copy them from the university's other rows only when those rows have `formula_known: true`.
- **No known rows yet (МУБИС, ХААИС):** take the formula from the source you are reading, such as the 2026 admission rules.
- **Source gives a minimum per exam but no formula:** use `per_exam`, weights 1/1 and `formulaKnown: false`, with confidence `likely` unless the table is clear.
  - The verdict doesn't depend on the weights.
  - The text then says "1-р / 2-р шалгалт" and "томьёо зарлаагүй" instead of claiming 70/30, and the app shows a plain sum.
- **Source gives one combined minimum but no formula:** the verdict can't be computed, so leave the row unknown (`buildExam` refuses this case).
- **Formula learned:** also rewrite that university's `admission_2026.json` → `score_formula_mn` in one plain Mongolian sentence. The guide prints it.

**Rules**
- **The year.** Use a table only if it's for **2026-2027**. An older or undated table can confirm that a program exists, but then leave its subjects unknown and set `status: "verify"`.
- **Don't judge a minimum by a national range.** Official 2026-27 tables have Ulaanbaatar bachelor minimums as low as 410–440 (АШУҮИС, ШУТИС). Accept any value from a table labelled 2026-2027. An unusual value is only a reason to re-read the cell.
- **Confidence.** Use `confirmed` only for clearly legible cells. Use `likely` when you had to infer which exam a subject belongs to. If a cell is blurry, leave the row and log it.
- **Missing programs.** If a source lists a program that's missing, add it with the id pattern `<prefix>-<school>-<latin-slug>`, in the shape of the existing rows.
- **Mark sources you used** in `sources.json`: `gap: false`, `filled_at`, and a one-line `filled_note`.
- **Finish.**
  - Run `node seed/load-data.mjs` (it must report valid) and `node seed/build-guide.mjs`.
  - Log every filled row: subjects, minimums, source.

---

## Step 3 — Mapping and import into the **local** database

Write `SERVICE/data-import/import-next-unis.mjs`, adapted from `import-mnums.mjs`, plus one `SERVICE/data-import/<slug>-map.json` per university. It takes a university slug and `--local` / `--remote`, and generates one SQL file per university. In every file, skip records whose `status` is `unverified`.

**University row** (update it, or create it per Step 1.5):
- overview ← `overview_mn`;
- tuition text / number ← `sidebar_suggestion.tuition_text_mn` / `tuition_number`;
- dorm and scholarship flags ← `sidebar_suggestion.dorm_flag` / `scholarship_flag`;
- dorm how-to ← `sidebar_suggestion.dorm_howto_mn`;
- phones / email / location / website ← `sidebar_suggestion`.

Never overwrite a value the database already has with null or an empty list. For example, ХААИС's phones and email are empty in the data.

**Faculties.** One per `schools.json` record of type `constituent` or `branch` that has at least one imported program; `unit` records never become faculties. Reuse an existing faculty of this university when its name matches. Set location ← `location_mn`, and check that the Улаанбаатар / Орон нутаг filter classifies it correctly.

**Old rows.** If this university already has majors or faculties that match nothing in the data (for example placeholder rows from the first seed), leave them alone. List them in the report under "Old rows you may want to remove".

**Majors.** Import every row whose `status` is not `unverified`.

**Two kinds of rows:**
- **Checkable rows:** `split_confidence` is confirmed/likely and `subject_minimums` is empty. Map them as in the table.
- **Neutral rows:** everything else (unclear/unknown, or Step 1.6). Import them with empty subjects and null `cutOffScore`, `secondaryCutOffScore`, weights and `selectionType`. Students then see "Сургуулиас тодруулна уу", and `examNote` carries what is known.

| Field | Value |
|---|---|
| faculty | faculty for `school_id` |
| name | `name_mn` |
| degreeType | bachelor value, or the associate value for `degree: "Дэд бакалавр"` |
| primarySubjects | `exam_2026_2027.suuri_options` |
| secondarySubjects | `exam_2026_2027.dagaldah_options` |
| requiredSubjects | the МУИС/ШУТИС/АШУҮИС convention |
| cutOffScore | `threshold_score` |
| secondaryCutOffScore | `threshold_type = "per_exam"`: `secondary_threshold_score`, or **0** when it is null. `threshold_type = "total"`: **null** |
| primaryWeight / secondaryWeight | `exam_2026_2027.weights`. **Null when they are exactly 0.7 / 0.3**, so those rows run the same code path as МУИС/ШУТИС. Rows with `formula_known: false` carry 1/1 on purpose, so the page shows a plain sum, not a 70/30 split |
| selectionType | `exam_2026_2027.selection_type` (`list` / `direct`) |
| tuitionFee | `tuition_2026_2027.per_year`, else `estimated_per_year.typical` (normal study length), else `estimated_per_year.max`, else null |
| tuitionIsEstimate | `false` only when `is_official` is true and `per_year` is set; otherwise `true` when there is a fee |
| examNote | see below |

examNote is built from:
- `required_subjects_display_mn`;
- `exam_2026_2027.note_mn`;
- `notes_mn`.

Add a prefix for these statuses:
- `verify`: "⚠ Тодруулах: "
- `conflicting`: "⚠ Эх сурвалж зөрүүтэй: "

**Scholarships.**
- name ← `name_mn`;
- coverage ← `coverage_mn`;
- requirements ← `requirements_mn`;
- deadline ← `deadline_mn`.

If `school_id` is set, the name should say which school it applies to; the data already does this.

**Dorms.** Only `record_type: "building"` rows.
- Fill the fee only when `price_per_year` is set and the row's status isn't `stale`. Put `price_year` in the details.
- For a stale row (e.g. МУБИС 1-р байр, a 2025 price), leave the fee empty.

**Admission dates.**
- event / start / end ← `event_mn` / `start` / `end`.
- Skip rows where both `start` and `end` are null, and rows with status `unverified` or `stale` (an old year that isn't labelled as a 2026 example).

**Not imported:** faq, links, exams, tuition, sources. Suggest them in the report.

**Local checks**
- **Counts per university:** faculties, majors (and how many have exam subjects), scholarships, dorms, dates.
- **Sample rows:** 2–3 per university. Check that subjects, minimums, weights, tuition and examNote are right.
- **Other universities unchanged:** before the first import, save every other university's rows in every table the import touches (universities, faculties, majors, scholarships, dorms, dates) to a JSON file. Afterwards they must be identical.
- **Second run:** run the import again for each university; it must change nothing.
- **Score check:** for each university with checkable rows, pick 2 programs and compare the app's `scoreMatch` with `node seed/eligibility.mjs <slug> <scores>`. They must give the same verdict. Skip rows with `subject_minimums`; they are neutral in the app by design.
- **СЭЗИС cases.** These must always be run. They are chosen so that a fixed 0.7/0.3 formula gives the wrong answer:
  - Санхүү, банк (`ufe-main-sankhuu-bank`, average ≥ 620):
    - Математик 590 + Англи хэл 660 → **eligible** (average 625; 0.7/0.3 would give 611, below);
    - Математик 660 + Англи хэл 570 → **below** (average 615; 0.7/0.3 would give 633, eligible).
  - Аялал жуулчлал (`ufe-main-ayalal-juulchlal`): Англи хэл 600 → **neutral** (the second exam is СЭЗИС's own skills test).
  - Програм хангамж (`ufe-tech-program-khangamj`): Физик 530 + Нийгэм судлал 490 → **below** (Нийгэм судлал 500).
  - Эдийн засаг (`ufe-main-ediin-zasag`): any scores → **neutral in the app** (Step 1.6). The reference script applies the full rule, so don't compare this one.
  - If any of these fail, Step 3b is needed (see 1.3). After Step 3b they must all pass.
  - **Exception:** if 3b ended in its neutral fallback, the two Санхүү, банк cases are expected to be **neutral**. Log the expected verdicts you use, and use the same ones in Step 4.4.
- **Pages:** if practical, run the app locally and open each university page.

---

## Step 3b — Only if Step 1.3 found a problem: one small code fix

Skip this whole step if 1.3 (b)–(d) were all fine.

1. **Baseline first.** Before editing, save scoreMatch's output (verdict, message, score) for every local МУИС, ШУТИС and АШУҮИС major across these inputs:
   - {Математик 620, Физик 540, Англи хэл 500, Нийгэм судлал 480}
   - {Математик 480, Физик 470}
   - {Хими 620, Биологи 580}
   - {Математик 600}
   - {}

   After the change, the output must be identical.
2. **scoreMatch.** Extend it; don't rewrite it. In the one-minimum branch (`secondaryCutOffScore` null), pass when `w1·s + w2·d ≥ cutOffScore`, with `w1 = primaryWeight ?? 0.7` and `w2 = secondaryWeight ?? 0.3`. Rows with null weights keep the exact current behaviour. `seed/eligibility.mjs` is the spec.
3. **Page text**, only where 1.3 found it wrong:
   - A one-minimum row shows one line: "Дундаж оноо ≥ T" for 0.5/0.5, "Нийлбэр оноо ≥ T" for 1/1, and the current text for 0.7/0.3.
   - A computed score shown for a row with 0.5/0.5 weights is called "Дундаж оноо".
4. **Tests.** Add the СЭЗИС cases from Step 3's score check. Then run the tests, typecheck/lint and both builds.
5. **Commit** on `zetsu`, e.g. `Support average-of-two-exams threshold (СЭЗИС)`.
6. **Build folder:** a fresh worktree at that commit, so the deploy ships exactly what you checked.
   - Run `git worktree prune`, then `git worktree add ../UniversityMN-nextunis-$(date +%Y%m%d%H%M) HEAD`. Call it `WT` and log its path and the SHA.
   - Copy the untracked env/config files the build needs (`.env*`, `.dev.vars`) from `REPO`. Install deps with the frozen lockfile.
   - Build in `WT`: the service build/typecheck; in the web, `npx next build && npx opennextjs-cloudflare build --skipNextBuild`.
   - **If a build fails twice, or the fix isn't small and safe:** skip the deploy, and `git revert --no-edit <3b SHA>` so the pull request never carries code that wasn't built and deployed. Then make the data fit the current code so the page never shows a wrong number or label:
     - The СЭЗИС one-minimum rows (weights 0.5/0.5): if 1.3(b) uses the weights and the page shows a one-minimum 1/1 row correctly, store 1/1 and `cutOffScore = 2 × threshold`. Put "дундаж T (= нийлбэр 2T)" in `examNote`.
     - Otherwise import them as neutral rows with the rule in `examNote` (Step 1.6).
     - Re-run the local import the same way, and report it.

---

## Step 4 — Production

1. **Back up.** From `SERVICE`:
   - Run `mkdir -p ~/Documents/oyutan-backups && npx wrangler d1 export rareapp-db --remote --env production --output ~/Documents/oyutan-backups/rareapp-db-$(date +%Y%m%d-%H%M)-before-next-unis.sql`. Check it is non-empty and contains `CREATE TABLE`.
   - Then take a bookmark with `npx wrangler d1 time-travel info rareapp-db --env production --json` and log it.
   - If the permission check blocks one of these read-only commands, give the owner that command as its own `!` line and read its output before going on.
2. **Only if Step 3b changed code: the deploy comes before any import.**
   - Log the rollback targets: `npx wrangler deployments list --env production` in the service, and `npx wrangler deployments list` in the web (no `--env`).
   - Save the production baseline: the live score-check answers (or the API responses scoreMatch uses) for 3 МУИС, 3 ШУТИС and 3 АШУҮИС majors with {Математик 620, Физик 540, Англи хэл 500, Хими 620, Биологи 580}.
   - Tell the owner, in one plain sentence, to paste this **one** line into Claude Code, with the real `WT` path and SHA. There is no migration this time.
```
! cd <WT>/apps/rareAppMn/rareAppMn-service && test -z "$(git status --porcelain --untracked-files=no)" && [ "$(git rev-parse HEAD)" = "<SHA>" ] && npx wrangler deploy --env production && cd ../rareAppMn-web && npx opennextjs-cloudflare deploy
```
   - The guard stops the line if tracked files in the worktree changed or HEAD moved.
   - Wait for "done". Then confirm both workers show new version ids, and that the baseline answers are unchanged.
   - **If anything is broken:** give the owner `! … npx wrangler rollback <previous-version-id> --env production --message "revert next-unis"` for the service, and the same without `--env` for the web. Then stop and report.
   - Remove the worktree when Step 4 is finished (`git worktree remove <WT>`).
3. **Import each university remotely**, one at a time.
   - Before the first remote import, save every other university's production rows in the touched tables with read-only `SELECT`s, as in Step 3.
   - Run its SQL file with one `execute --remote --file`, and log the inserted ids.
   - Re-run the Step 3 counts on remote, and confirm the other universities' production rows are unchanged.
   - If the permission check blocks a remote command, give the owner that one command as a `!` line, then wait for "done".
4. **Live checks.**
   - Each university's page on https://oyutan-mn-web.zelmeganbayr0408.workers.dev loads (HTTP 200) and shows its programs.
   - Each university with checkable rows gives the Step 3 answer for one score check, using the expected verdicts you logged in Step 3. For СЭЗИС, use both Санхүү, банк cases; they catch a 0.7/0.3 formula.
   - МУИС, ШУТИС and АШУҮИС pages still look the same.
5. **If a page shows no programs but the API returns them,** it's cached. Ask the owner for one `!` web redeploy line only if it doesn't refresh within a few minutes.
6. **Rollback, only if something is broken.**
   - Fix forward first: correct the data and re-run the idempotent import.
   - Otherwise delete this run's inserted rows (the logged ids), before any code rollback.
   - Time Travel restore to the bookmark is the last resort. It also loses user writes made after it.

---

## Step 5 — Commit, PR, report

1. **Commit** on `zetsu`:
   - `import-next-unis.mjs`;
   - the `*-map.json` files;
   - `data-import/next-unis/` (without `gap-files/`).

   Push. Then open a pull request into main with `gh pr create`. Don't merge it; give the owner the link. If a pull request from `zetsu` into main is already open (for example from АШУҮИС), don't open another one. Your commits are now part of it, so give its link.
2. **Write `FOLDER/IMPORT_REPORT.md`** and copy it to `DATA`:
   - per university: counts, gap-filling results, what's still unknown, anything skipped and why;
   - 3–5 things worth checking by eye.
3. **Tell the owner, in plain English, in 5–10 lines:** what's live (with each page link), what's still missing, and the PR link.

---

## Appendix — per-university rules

### СЭЗИС — `ufe`

- **Match names:** "Санхүү эдийн засгийн их сургууль", "СЭЗИС", "UFE", "University of Finance and Economics". New slug if missing: `ufe`.
- **Score.** The 16 main majors use two fixed subjects (no "or" choice) and **one minimum on the average of the two exams**. The minimums are 510–620, from the official 2026-27 table.
  - In the data this is `threshold_type: "total"` with weights 0.5/0.5, so `secondaryCutOffScore` is null and `primaryWeight` = `secondaryWeight` = 0.5.
  - This is the case Step 1.3 checks.
- **Variants** (2+2 joint, BTEC, Rotation, +MBA, dual majors) are separate rows. They reuse their major's subjects and minimum (`likely`), and their names say which variant they are.
- **Эдийн засаг** (and its 2+2) also needs Математик ≥ 600 (`subject_minimums`). Per Step 1.6, import them neutral with the rule in `examNote`.
- **Аялал жуулчлал** rows: the second "exam" is СЭЗИС's own video skills test, so they get the neutral verdict.
- **UFE Tech** (Инженер, технологийн сургууль) has its own minimum per exam (e.g. Математик/Физик ≥ 520, Англи хэл/Нийгэм судлал ≥ 500), so these are `per_exam` rows. Its formula isn't published, so they carry weights 1/1 with `formula_known: false`.
- **No per-exam floor.** СЭЗИС publishes no minimum for each exam under the average rule, so don't invent one. A very uneven pair can pass if its average does.
- **Боловсролын / Нийгмийн шинжлэх ухааны сургууль:** 5 rows with unknown subjects, status `partial`. Import them with empty subjects. The row with status `unverified` (Хиймэл оюун ухаан 2+2) is skipped.
- **Tuition** is per credit: 310,000₮ for main, dual and +MBA; 376,000₮ for 2+2 while in Mongolia; 447,000₮ for BTEC. Rotation is 28,000,000₮ a year (official).
  - Use `estimated_per_year.typical` (4 years; 4.5 for the 4.5–5-year duals) as the yearly figure, with `tuitionIsEstimate = true`.
  - UFE Tech, Education and Social Sciences fees are unknown (null).
- **Gap priorities:**
  1. `gap-edu-soc`: the 5 unknown rows.
  2. `gap-tech-tuition`.
  3. `gap-faq`: registration and confirmation fees.
  4. `gap-joint-variants`.

  The threshold image (`gap-threshold-img`) only confirms what is already filled.

### МУБИС — `msue`

- **Match names:** "Монгол Улсын Боловсролын Их Сургууль", "Монгол улсын боловсролын их сургууль", "МУБИС", "MNUE", "MSUE", "Mongolian National University of Education". Older names: "Монгол Улсын Багшийн Их Сургууль", "МУБИС" (same short name). New slug if missing: `msue`.
- **All 38 programs have unknown exam data.** МУБИС publishes its 2026-27 subjects, minimums and formula only in Google Drive PDFs, which couldn't be read here. Filling them is this university's main job in Step 2. Download with the Drive rule in Step 2:
  1. `1TUTXE0ZBCT_NvMuULmIYjkxcd0i243pi` — "Босго оноо 2026-2027.pdf": subjects and minimums per program. Most important.
  2. `15FJPrGsC_JqNKULMaBF0EDVyjJ0DvvkK` — "МУБИС-Элсэлт 2026.pdf": the formula, list or direct selection, dates, fee, skills tests.
  3. `1j6dN_guZMlqq_IbONhA77Uc6Ff0DGuQI` — "elselt.pdf": probably the admission rules.
  4. `1ZpUSJLOv3e-W2vNW_sEK8tQLt8aUeeoU` — quota (seats) PDF: confirms which programs admit, plus branch rows.
- **While filling:**
  - Match PDF rows to `programs.json` by program code (`code`, e.g. 011401) first, then by name.
  - Remove the `weights_is_placeholder` flag from filled rows; `buildExam` writes a fresh block.
  - Art, design, music and PE programs probably have a skills test. Put "Ур чадварын шалгалт" in group 2 only if the PDF says so.
  - Branch programs (Архангай, Баян-Өлгий) come from the branch images (`gap-ast-programs`, `gap-bost-2026`). Add them only if a 2026-27 source lists them.
- **If the Drive files can't be downloaded,** import all МУБИС rows neutral. The program list, scholarships, dorms and contacts are still useful. Report it as the top remaining gap.
- **Tuition:** the official 2026-27 price wasn't found. News says it rose 9%; the 2025 prices were 87,300–135,400₮ per credit. Import `tuitionFee` = null unless Step 2 finds the 2026-27 price (`gap-tuition-2026`). Don't compute one from the 2025 prices.
- **Teacher programs** ("Багш, …"): the БЗС teacher scholarship applies. Keep the note in `examNote`. It's not a scoring rule.
- **Dates:** skip the two date rows with no dates (`msue-date-msue-reg-2026`, `msue-date-2027`) and the `unverified` one.

### ХААИС — `muls`

- **Match names:** "Хөдөө аж ахуйн их сургууль", "ХААИС", "MULS", "Mongolian University of Life Sciences". New slug if missing: `muls`.
- **Subjects are known for the 50 Ulaanbaatar programs. The 2026-27 minimums are not** (all rows are `unclear`), so until Step 2 fills them, the rows import neutral and their subjects show in `examNote`.
  - The subjects come from the program pages `elselt.muls.edu.mn/majorview/N`, which carry no year.
  - Their scores (400–480) are in `exam_2026_2027.page_thresholds`. They are **not** used, because the pages carry no year.
  - Take minimums only from a source labelled 2026-2027.
- **Step 2, main source:** `http://admission.muls.edu.mn/Home/Profession`.
  - Use plain **http**: the https address redirects back to http.
  - It should list 2026-27 subjects, minimums and seats. Then `gap-elselt-2026` (the "ХААИС-ийн элсэлт-2026" news) for the formula and dates, and the time.mn threshold images (`gap-time-images`) as a cross-check.
  - Formula unknown: the rows carry weights 1/1 with `formula_known: false`. Use the Step 2 rule: per-exam minimums with no formula → `per_exam`, 1/1, `formulaKnown: false`.
- **School mapping:**
  - 17 programs sit in a placeholder faculty, "ХААИС — бусад хөтөлбөрүүд" (`muls-ub`), and 28 more were assigned with `likely` confidence (see each row's `school_assignment`).
  - If `gap-program-list` (`program_sum.php`) gives the real school, change `school_id` before importing. Otherwise keep the placeholder.
- **Pages to check by eye:**
  - majorview 3 and 177 may be the same program (only one row was made).
  - Row names use the page title. The profession name is in `notes_mn`; for majorview/24 the title is "Бэлчээр, хамгаалал нөхөн сэргээлт" and the profession is "Бэлчээр, тэжээлийн агрономч". If the 2026 admission system uses another name, use that.
  - Two programs list Хими in both groups; the score check never pairs a subject with itself.
- **Darkhan branch:** its 2 rows are `unverified` and are skipped. The faculty is created only if Step 2 confirms programs from `gap-darkhan`.
- **Tuition:** 156–169 thousand ₮ per credit (≈4.7–5.2 million ₮ a year), from news. It may be the 2025-26 price (status `conflicting`). Import it as an estimate (`tuitionIsEstimate = true`) unless Step 2 finds the official 2026-27 price.
- **Contacts:** the main phone and email are missing. Fill them from `gap-contacts` if possible; otherwise leave them empty.

### All three

- **National minimums:** news in April 2026 said the Ministry set 450–500 for big universities and 430 for branch schools, and a rise to 480 in 2027 is planned. Official 2026-27 tables still list some Ulaanbaatar programs at 410–440 (АШУҮИС, ШУТИС). So never use the national figures to judge or change a program's minimum.
- **Mongolian language exam:** every applicant needs at least 400 (national rule). If the app already models this, nothing changes. If it doesn't, don't add it in this run; mention it in the report.
