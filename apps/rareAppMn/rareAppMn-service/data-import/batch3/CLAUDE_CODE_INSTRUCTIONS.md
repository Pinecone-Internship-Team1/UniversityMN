# Batch 3 → oyutan.mn: runbook for Claude Code (data only)

**Owner's request:** fill in the universities in `unis/` on oyutan.mn without asking anything. They have given permission, and they prefer short, plain-English explanations.

**What this run is.** These universities already exist on the site as empty placeholder pages ("Мэдээлэл удахгүй нэмэгдэнэ"). This run fills them with data:
- what each university row already has;
- faculties, majors, scholarships, dorms and dates.

The site's code already handles every rule the data uses, from the МУИС, ШУТИС, АШУҮИС, СЭЗИС, МУБИС and ХААИС runs:
- per-exam minimums;
- weights (0.7/0.3, a sum, an average);
- `selectionType`;
- the skills test;
- associate degrees.

So this run is **data only: no migration, no code change, no deploy.** If a program needs a rule the code can't represent, import it as a neutral row (Step 1.5).

**Universities in this package** (`unis/<folder>/`):

| Folder (`db_slug`) | University | Programs | Checkable now* | Score rule | Main job in Step 2 |
|---|---|---|---|---|---|
| `etugen` | Этүгэн их сургууль | 29 | 25 | A minimum per exam; no formula; most programs **direct** | Check the 2026-27 rules table (PDF + image); fees |
| `otgontenger` | Отгонтэнгэр их сургууль (ОТИС) | 18 | 17 | A minimum per exam; no formula | 1 row cut off in the table; fees |
| `huree` | Хүрээ МХТДС | 14 (4 skipped) | 10 | A minimum per exam; no formula | Fees, dorm |
| `iuu` | Олон Улсын Улаанбаатарын Их Сургууль (ОУУБИС) | 29 | 0 (subjects known) | A minimum per exam; no formula | Read the scanned 2026-27 admission rules |
| `suis` | Монгол Улсын Соёл Урлагийн Их Сургууль (СУИС) | 19 (all skipped: a 2016 list) | 0 | Unknown; mostly a skills test | Render the 2026-27 program table with headless Chrome and fill it in |

\* Programs the score check can judge before Step 2. The rest import as neutral rows unless Step 2 fills them. Each university also has scholarships, dorms, contacts, admission steps and dates, and a student guide (`GUIDE_MN.md`).

**Paths**
- `FOLDER`: this folder, wherever the owner unzipped it. Normally it is `~/Downloads/oyutan-batch3`; macOS may name it `oyutan-batch3 2`. Put `IMPORT_LOG.md` and `IMPORT_REPORT.md` here.
- `REPO`: `/Users/zetsu/Documents/pinecone/UniversityMN`. Work on branch `zetsu`.
- `SERVICE`: `REPO/apps/rareAppMn/rareAppMn-service`.
- `DATA`: `SERVICE/data-import/batch3`, your working copy of `FOLDER`. **All data edits happen here.**

**If macOS blocks reading `FOLDER` or the zip:** this happened in the last run. Tell the owner in one sentence to drag the unzipped folder into this chat (or move it into `~/Documents`). Then continue.

---

## 0. Ground rules

**Don't ask: decide and log.**
- Choose the safest reasonable option and write it in `FOLDER/IMPORT_LOG.md`.
- Log every step: commands, counts, decisions, errors. Re-read the log if your context gets long.

**Safety rules.** These override "don't ask".
1. **Back up first.** No remote write without a backup or Time Travel bookmark taken in this run, right before the first remote write.
2. **Touch only the universities in this package.** Never change or delete another university's rows. Existing rows of these universities: update matches in place, leave unmatched rows alone, and list them in the report.
3. **Idempotent import.**
   - Use `INSERT … ON CONFLICT(id) DO UPDATE`, or look up first and then UPDATE/INSERT. Never `INSERT OR REPLACE`, never delete-and-reinsert (D1 enforces foreign keys).
   - Natural keys, looked up on each database separately (local and remote ids can differ):
     - faculty: (university, name);
     - major: (university, faculty, name);
     - scholarship and dorm: (university, name);
     - date: (university, event).
   - Before writing, assert that no target id belongs to another university.
4. **One university at a time on production.**
   - Each university gets **one** generated SQL file, run with **one** `wrangler d1 execute --remote --file` call.
   - Log the ids it inserts.
   - If an import can't be completed, delete **only the rows this run inserted** for that university, then report.
5. **No schema or code changes in this run.** Never run `migrations apply`.
6. **Git and settings.**
   - Work on `zetsu`. Stage only your own files. Never commit `gap-files/`. Never force-push.
   - Run wrangler from `SERVICE`. Don't change Cloudflare settings. Don't print secrets. Don't install global tools.
7. **Stop a failing step.** If a step fails twice, stop it, log why, and skip whatever depends on it. Prefer fixing forward.

---

## Step 1 — Get your bearings

1. **Repo and the last run.**
   - `cd REPO`, run `git status` and `git pull --ff-only` on `zetsu`. If it can't fast-forward, log it and continue.
   - Read the last run's import: normally `SERVICE/data-import/import-next-unis.mjs`, the `*-map.json` files and `SERVICE/data-import/next-unis/IMPORT_REPORT.md`. If the names differ, find them with `git log --oneline -- apps/rareAppMn/rareAppMn-service/data-import`.
   - **Reuse that import script.** Extend it to read this package (or copy it to `import-batch3.mjs` if that's cleaner). Keep its tested mapping, checks and safety logic.
2. **Production is ready for data only.** Run `npx wrangler d1 migrations list rareapp-db --remote --env production` from `SERVICE`. It must show **no** pending migration.
   - If one is pending, do Steps 1–3 locally only. Skip Step 4, and report what is pending. Don't apply it.
   - If the permission check blocks this read-only command, don't stop the owner for it now. Do Steps 1–3 locally and check it at Step 4.1; the `!` line there includes it.
3. **Validate.** Copy `FOLDER` to `DATA` and add `gap-files/` to `.gitignore`. Run `node seed/load-data.mjs` in `DATA`; it must end with "All files valid ✔".
4. **Find each university's row** on local **and** remote with a read-only `SELECT` of all universities.
   - Match first by the site's slug, `university.json` → `db_slug`: `suis`, `otgontenger`, `etugen`, `huree`, `iuu`. Then confirm by name in JavaScript with `toLowerCase()` (SQLite `LIKE` only ignores case for Latin letters).
   - **Ids can differ** between local and remote; that's normal. The two *disagree* only when the same slug has a different name, or the same name has a different slug.
   - **On remote but not local:** copy that one row into the local database as it is (if its id is taken locally, let local pick a new one), log it, and continue.
   - **Missing on remote, more than one match, or a real disagreement:** skip that university and report it. Don't create new university rows on the live site; these five already exist there.
   - **If remote reads are blocked,** match on local now and check remote at Step 4.1, from the fresh backup file (it holds every row).
5. **Rules the code can't represent:** three or more exams, or an extra minimum for one subject (`exam_2026_2027.subject_minimums`). Import those programs as **neutral rows** with the rule in `examNote`, and report them.
6. **Subject names.** Every subject in this package is one of: Математик, Физик, Хими, Биологи, Англи хэл, Орос хэл, Монгол хэл, Нийгэм судлал, Түүх, Газарзүй, plus "Ур чадварын шалгалт" (the university's own skills test). These are the names the last runs used. If the app spells one differently, map it in the import and log it.

---

## Step 2 — Fill the data gaps (about 15–25 minutes per university)

**Sources.** Each university's `unis/<folder>/data/sources.json` lists `gap: true` sources with a `gap_fill_hint_mn` saying what to take.

**Downloading.** Download into `DATA/gap-files/<folder>/`, letting Node's URL parser encode the address:
`curl -L --max-time 60 -A "Mozilla/5.0" -o gap-files/<folder>/<name> "$(node -p 'new URL(process.argv[1]).href' '<url>')"`
- **Google Drive** (`drive.google.com/file/d/<ID>/…`): download `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`. Check with `file <name>` that it's really a PDF.
- **Pages that only work in a browser** (Next.js/Nuxt apps that return an empty page to `curl`): render them with the owner's own Google Chrome in headless mode. Nothing needs installing:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --virtual-time-budget=15000 --dump-dom '<url>' > gap-files/<folder>/<name>.html`
  - Then read the text from that HTML.
  - If Chrome isn't there or the output is still empty, look in the page source for the PDF, image or API URL it loads.
  - Otherwise log it and move on.
- **Images and PDFs:** open them with your Read tool, in page ranges of 20 or fewer.
- **Failures:** if a download fails twice, retry once at the end, then give up on it.

**Writing values.** Use `seed/exam-tools.mjs` (`buildExam` + `applyExam`) so every row keeps the same shape and wording. `applyExam` refreshes the display sentence and, for a `confirmed` fill, sets `status: "current"`.
- **СУИС is different:** make every СУИС change in `unis/suis/build_data.py`, never in its JSON files (see the appendix).
- **Formula published:** pass the real `weights` and `thresholdType`. Copy them from the university's other rows only when those rows have `formula_known: true`.
- **A minimum per exam but no formula:** use `per_exam`, weights 1/1 and `formulaKnown: false`, with confidence `likely` unless the table is clear. The verdict doesn't depend on the weights.
- **One combined minimum but no formula:** the verdict can't be computed, so leave the row unclear. `buildExam` refuses this case.
- **Formula learned:** also rewrite that university's `admission_2026.json` → `score_formula_mn` in one plain Mongolian sentence.

**Rules**
- **The year.** Use a table only if it's for **2026-2027**. An older or undated table can confirm that a program exists, but then leave its minimums unknown.
- **Don't judge a minimum by a national range.** Official 2026-27 tables have Ulaanbaatar minimums as low as 400–440. Accept any value from a table labelled 2026-2027; an unusual value is only a reason to re-read the cell.
- **Confidence.** Use `confirmed` only for clearly legible cells. Use `likely` when you had to infer which exam a subject belongs to. If a cell is blurry, leave the row and log it.
- **Missing programs.** If a 2026-27 source lists a program that's missing, add it with the id pattern `<prefix>-<school>-<latin-slug>`, in the shape of the existing rows.
- **Mark sources you used** in `sources.json`: `gap: false`, `filled_at`, and a one-line `filled_note`. For СУИС, add them to `FILLED` in `build_data.py` instead.
- **Finish.**
  - Run `node seed/load-data.mjs` (it must report valid) and `node seed/build-guide.mjs`.
  - Log every filled row: subjects, minimums, source.

---

## Step 3 — Mapping and import into the **local** database

Use the last run's mapping. In every file, skip records whose `status` is `unverified`.

**University row** (update the existing placeholder row):
- overview ← `overview_mn`;
- tuition text / number ← `sidebar_suggestion.tuition_text_mn` / `tuition_number`;
- dorm and scholarship flags ← `sidebar_suggestion.dorm_flag` / `scholarship_flag`;
- dorm how-to ← `sidebar_suggestion.dorm_howto_mn`;
- phones / email / website ← `sidebar_suggestion`. For the location, see "Location and district" below.

**What to keep:**
- Never overwrite the database's name, logo or website. If the data's website differs, keep the database's and log it.
- Never overwrite any value with null or an empty list.

**Location and district.** Keep the database's format.
- Change the district only for **Этүгэн, Отгонтэнгэр and ОУУБИС**, whose placeholder rows have the wrong one (the appendix gives the right one). Write it the way the database already writes it (the live site shows just the name, e.g. "Баянгол" → "Сүхбаатар"), and log the old value.
- **Хүрээ and СУИС keep their location and district as they are.**
- Put a full street address only into a field meant for an address. Never replace a value that names a district with one that doesn't (СУИС's data says only "Улаанбаатар").

**Tuition on the placeholder rows.** The data has no tuition number for any of the five, so the database keeps whatever it has. If a placeholder row already shows a tuition number, it was typed by hand: leave it, and list it in the report as "not from an official source" so the owner can decide.

**Faculties.** One per `schools.json` record of type `constituent` or `branch` that has at least one imported program. `unit` records never become faculties. Set location ← `location_mn`.

**Majors.** There are two kinds of rows:
- **Checkable rows:** `split_confidence` is confirmed/likely and `subject_minimums` is empty.
- **Neutral rows:** everything else. Import them with empty subjects and null `cutOffScore`, `secondaryCutOffScore`, weights and `selectionType`. Students see "Сургуулиас тодруулна уу", and `examNote` carries what is known.

| Field | Value |
|---|---|
| faculty | faculty for `school_id` |
| name | `name_mn` |
| degreeType | bachelor value, or the associate value for `degree: "Дэд бакалавр"` |
| primarySubjects | `exam_2026_2027.suuri_options` |
| secondarySubjects | `exam_2026_2027.dagaldah_options` |
| requiredSubjects | the convention the last runs used |
| cutOffScore | `threshold_score` |
| secondaryCutOffScore | `threshold_type = "per_exam"`: `secondary_threshold_score`, or **0** when it is null. `threshold_type = "total"`: **null** |
| primaryWeight / secondaryWeight | `exam_2026_2027.weights`. **Null when they are exactly 0.7 / 0.3**. Rows with `formula_known: false` carry 1/1 on purpose, so the page shows a plain sum, not a 70/30 split |
| selectionType | `exam_2026_2027.selection_type` |
| tuitionFee | `tuition_2026_2027.per_year`, else `estimated_per_year.typical`, else `estimated_per_year.max`, else null |
| tuitionIsEstimate | `false` only when `is_official` is true and `per_year` is set; otherwise `true` when there is a fee |
| examNote | `required_subjects_display_mn` + `exam_2026_2027.note_mn` + `notes_mn`. Prefix status `verify` with "⚠ Тодруулах: " and `conflicting` with "⚠ Эх сурвалж зөрүүтэй: " |

**Scholarships.** name ← `name_mn`; coverage ← `coverage_mn`; requirements ← `requirements_mn`; deadline ← `deadline_mn`.

**Dorms.** Only `record_type: "building"` rows. Fill the fee only when `price_per_year` is set and the row's status isn't `stale`, and put `price_year` in the details.

**Admission dates.** event / start / end ← `event_mn` / `start` / `end`. Skip rows where both dates are null, and rows with status `unverified` or `stale`.

**Not imported:** faq, links, exams, tuition, sources.

**Local checks**
- **Counts per university:** faculties, majors (and how many have exam subjects), scholarships, dorms, dates.
- **Sample rows:** 2–3 per university. Check that subjects, minimums, weights, tuition and examNote are right.
- **Other universities unchanged:** before the first import, save every other university's rows in every touched table to a JSON file. Afterwards they must be identical.
- **Second run:** run the import again for each university; it must change nothing.
- **Score check:** for each university with checkable rows, run the cases in the appendix plus 2 programs of your choice. Compare the app's `scoreMatch` with `checkProgram(program, scores)` from `seed/eligibility.mjs`; they must give the same verdict. (The command `node seed/eligibility.mjs <folder> <scores>` lists only the programs that pass.) A score equal to the minimum passes. Skip rows with `subject_minimums`, which are neutral in the app by design.
- **Pages:** if practical, run the app locally and open each university page.

---

## Step 4 — Production (data only)

1. **Back up: always a fresh backup, here,** right before the first remote write, even if you took one earlier in this run. From `SERVICE`, run the backup and bookmark yourself:
   - `mkdir -p ~/Documents/oyutan-backups && npx wrangler d1 export rareapp-db --remote --env production --output ~/Documents/oyutan-backups/rareapp-db-$(date +%Y%m%d-%H%M)-before-batch3.sql`. Check it is non-empty and contains `CREATE TABLE`.
   - `npx wrangler d1 time-travel info rareapp-db --env production --json`, and log the bookmark.
   - **If the permission check blocks these** (it did last time), give the owner this one read-only line. It checks migrations, saves the backup and prints the bookmark:
```
! cd /Users/zetsu/Documents/pinecone/UniversityMN/apps/rareAppMn/rareAppMn-service && npx wrangler d1 migrations list rareapp-db --remote --env production && mkdir -p ~/Documents/oyutan-backups && F=~/Documents/oyutan-backups/rareapp-db-$(date +%Y%m%d-%H%M)-before-batch3.sql && npx wrangler d1 export rareapp-db --remote --env production --output "$F" && ls -l "$F" && grep -c "CREATE TABLE" "$F" && npx wrangler d1 time-travel info rareapp-db --env production --json
```
   - Tell the owner to type `!` themselves and then paste the rest of the line, with no quotes around it (a quoted line didn't run last time).
   - If its output says the account isn't valid, ask the owner to paste `! npx wrangler login` first; that fixed it last time.
   - Then finish what Step 1 couldn't do remotely: no pending migration (if one is pending, stop here and report it), and each university's row on remote (from the backup file if remote reads are still blocked).
2. **Import each university remotely**, one at a time.
   - Before the first remote import, save every other university's production rows in the touched tables with read-only `SELECT`s.
   - Run its SQL file with one `execute --remote --file`, and log the inserted ids.
   - Re-run the Step 3 counts on remote, and confirm the other universities' production rows are unchanged.
   - If the permission check blocks a remote command, give the owner that one command as a `!` line, then wait for "done".
3. **Live checks.**
   - Each university's page on https://oyutan-mn-web.zelmeganbayr0408.workers.dev/university/<db_slug> loads and shows its programs.
   - One score check per university gives the Step 3 answer.
   - The six earlier universities' pages still look the same.
4. **If a page shows no programs but the API returns them,** it's cached. Ask the owner for one `!` web redeploy line only if it doesn't refresh within a few minutes.
5. **Rollback, only if something is broken.**
   - Fix forward first: correct the data and re-run the idempotent import.
   - Otherwise delete this run's inserted rows (the logged ids).
   - Time Travel restore to the bookmark is the last resort. It also loses user writes made after it.

---

## Step 5 — Commit, PR, report

1. **Commit** on `zetsu`: the import script changes, the `*-map.json` files, and `data-import/batch3/` (without `gap-files/`).
   - Push.
   - Open a pull request into main with `gh pr create`. Don't merge it; give the owner the link.
   - If a pull request from `zetsu` into main is already open, don't open another one; give its link.
2. **Write `FOLDER/IMPORT_REPORT.md`** and copy it to `DATA`. Include:
   - per university: counts, gap-filling results, what's still unknown, anything skipped and why;
   - 3–5 things worth checking by eye;
   - **any other universities on the site whose pages are still empty**, so the owner knows what's left. Find them with a read-only query on **production** after the import (universities with no majors), not on local. If remote reads are blocked, work them out from the Step 4.1 backup minus the universities this run filled, and say so.
3. **Tell the owner, in plain English, in 5–10 lines:** what's live (with each page link), what's still missing, and the PR link.

---

## Appendix — per-university rules

### Этүгэн — `etugen`

- **Match:** `db_slug` etugen; "Этүгэн их сургууль", "Этүгэн", "Etugen University".
- **District:** all its buildings are in **Сүхбаатар дүүрэг** (official site). The live site shows Баянгол, so update it (Step 3) and log the old value.
- **Score:** a minimum per exam with no published formula (1/1, `formula_known: false`); the best subject in each list counts.
  - Most programs are `direct`: meet both minimums and fit the quota, and you're in. Only Хүний их эмч and Шүдний их эмч are `list`.
- **Sources:** the 2026-27 rules (`juram2627.pdf`, Rector's order №44, 2026-03-11) and the site's table.
  - Rows are `confirmed` where both agree, and `likely` where the PDF text came out garbled.
  - **Step 2:** check the PDF table by eye and the 2026 image (`Burtgel WEB-d 26.png`), and upgrade clear rows to `confirmed`.
- **Rows with known issues:**
  - "Ур чадвар (сорил)" is an *optional* choice inside long second-exam lists. The app never pairs the skills test, so a student can pass with a normal subject.
  - Био-Анагаах ухаан: for exam 1 the 2026-27 rules say 480 and the site's undated table says 490. So it imports **neutral** (`conflicting`, with the ⚠ prefix), and its note gives both values. If the 2026 image clearly shows one value, fill the row with `buildExam` / `applyExam` as `confirmed`; otherwise leave it neutral.
  - Олон улсын сувилахуй: bachelor (430/450) or associate (410/450)? It's `unclear`, so it imports neutral.
- **Орхон (Эрдэнэт) branch:** 2 rows with only a 430 minimum known, so they import neutral. Its faculty is created because those rows import.
- **Degrees:** 2 rows are Дэд бакалавр (associate).
- **Fees:** tuition is unknown; the confirmation deposit is 250,000₮.
- **Score cases:**
  - Программ хангамжийн инженер: Математик 495 + Англи хэл 455 → pass; Математик 495 + Англи хэл 445 → below (exam 2 needs 450).
  - Сувилахуй: Хими 440 + Монгол хэл 460 → pass (a normal subject is enough; the skills test isn't needed).
  - Био-Анагаах ухаан: any scores → neutral ("Сургуулиас тодруулна уу").

### Отгонтэнгэр — `otgontenger`

- **Match:** `db_slug` otgontenger; "Отгонтэнгэр их сургууль", "ОТИС", "Otgontenger University".
- **District:** the official address is **Баянзүрх дүүрэг**, 41-р хороо, Жуковын гудамж. The live site shows Хан-Уул, so update it and log the old value.
- **Score:** a minimum per exam, mostly 490/490 (preschool teacher 440/490, software 490/450), with no formula (1/1, `formula_known: false`).
  - Source: Хавсралт 1 of the 2026-2027 rules (https://api.otgontenger.edu.mn/enrollment).
  - Rows are `likely` because the rules' text still cites older years. Upgrade to `confirmed` if Step 2 finds a clean 2026-27 copy.
- **Rows with known issues:**
  - Агаарын тээврийн үйлчилгээ is `unclear` because its table row is cut off (Step 2 gap 1).
  - Хүний нөөцийн менеджмент and Маркетинг are `verify`: they're in the table but missing from the program list.
- **Skills test:** preschool teacher and journalism.
- **Admission system:** `elselt.otgontenger.edu.mn`. Try headless Chrome for fees and dates.
- **Score cases:**
  - Программ хангамж: Математик 500 + Нийгэм судлал 455 → pass; Математик 485 + Нийгэм судлал 600 → below (exam 1 needs 490).
  - Сэтгүүл зүй: Монгол хэл 500 → neutral (exam 2 is the university's own skills test).

### Хүрээ — `huree`

- **Match:** `db_slug` huree; "Хүрээ мэдээлэл холбоо технологийн дээд сургууль", "Хүрээ МХТДС", "Huree University of ICT".
- **Score:** a minimum per exam of 450 or 490, from the official table (https://huree.edu.mn/enter/enter.php), with no formula (1/1, `formula_known: false`).
  - The table has no year, but it sits next to the 2026 registration dates and lists a department that opened in 2026, so the rows are `likely`.
  - 4 programs in the table but not in the 2026 form are `unverified` and skipped.
- **Skills test:** Архитектур, График дизайн.
- **Fees:** tuition isn't published (Facebook gap); the registration fee is 10,000₮ and the admission fee 100,000₮.
- **Dorm:** it's unclear whether the 2004 dorm still runs, so the flag is "Тодорхойгүй".
- **Score cases:** Компьютерын ухаан: Физик 490 + Англи хэл 450 → pass (equal to the minimum); Физик 489 + Англи хэл 600 → below.

### ОУУБИС — `iuu`

- **Match:** `db_slug` iuu; "Олон Улсын Улаанбаатарын Их Сургууль", "ОУУБИС", "International University of Ulaanbaatar".
  - From 2012 to 2015 it was called "Улаанбаатар их сургууль". If the database also has a separate "Улаанбаатар Их Сургууль" row, report it as a possible duplicate; don't merge or delete it.
- **District:** the official address is **Баянзүрх дүүрэг**, 25-р хороо, Намянжугийн гудамж. The live site shows Сонгинохайрхан, so update it and log the old value.
- **Score:** all 29 programs have subjects from the official table (https://www.iuu.edu.mn/bachelor/program).
  - Its minimums (430–490) have no year, so they sit in `page_thresholds` and the rows are `unclear`. They import neutral until Step 2.
- **Step 2, main job:** the scanned 2026-2027 admission rules (`gap-regulation-2026`). If their table gives 2026-27 minimums, fill the rows with `buildExam` / `applyExam`: `per_exam`, 1/1 and `formulaKnown: false` unless the rules give a formula.
- **Skills test:** 9 programs use the university's own test as exam 2.

### СУИС — `suis`

- **Match:** `db_slug` suis; "Монгол Улсын Соёл Урлагийн Их Сургууль", "СУИС", "MNUAC".
- **No 2026-27 data could be read here:** every official page is a JavaScript app. `programs.json` holds only a 2016 list, all `unverified`, so nothing imports yet.
- **Edit СУИС only in `DATA/unis/suis/build_data.py`.** Each run of it rewrites all 11 СУИС JSON files, so a change made straight in a JSON file is lost. This covers everything: programs (`PROGRAMS_2026`), school names (`SCHOOLS`), dates, fees, dorms, the formula sentence, and Step 2's source marks (`FILLED`, documented in the file).
- **Step 2, main job:**
  1. Render https://burtgel.mnuac.edu.mn/bachelor with headless Chrome (Step 2 command) and read the 2026-27 table.
  2. Fill `PROGRAMS_2026` in `DATA/unis/suis/build_data.py`; the format is documented in the file. Fix the school names in `SCHOOLS` from the live site.
  3. Run `python3 build_data.py && node ../../seed/load-data.mjs suis` in `DATA/unis/suis`. The 2016 rows drop out automatically.
- **Skills test:** most programs use СУИС's own creative test as one exam ("Ур чадварын шалгалт" in group 2). If a program needs three or more exams, mark it `unclear`.
- **Also try:** https://www.mnuac.edu.mn and https://mnuac.edu.mn/main/485828 for the rules, fees, contacts and dorms.
- **If nothing can be read:** import only the university row and the two national dates, and report СУИС as still empty.

### All universities

- **National minimums:** news in April 2026 said the Ministry set 450–500 for big universities and 430 for branch schools. Official 2026-27 tables still have Ulaanbaatar programs at 400–440, so never use the national figures to judge or change a program's minimum.
- **Mongolian language exam:** every applicant needs at least 400 (national rule). If the app already models this, nothing changes; otherwise mention it in the report.
