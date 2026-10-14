# ШУТИС v2 import — report (2026-10-10)

**Status: live.** Deployed and imported to main on 2026-10-10. Main now matches the checked local copy, and other universities are untouched.

## Counts (main = local)

| | Before (v1) | After (v2, live) |
|---|---|---|
| Faculties | 13 | 13 |
| Bachelor programs | 163 | **189** |
| …with exam subjects and minimums | 77 | **174** |
| …"Сургуулиас тодруулна уу" | 86 | **15** (branch joint programs) |
| Scholarships | 8 | **14** |
| Dorms | 4 (no price) | 4 (**monthly fee 2025-26**) |
| Admission dates | 9 | **14** |

Other universities: unchanged. Every non-ШУТИС row has the same checksum before and after; a second import run changes nothing.

## Gap-filling

- **The regulation PDF downloaded this time.** Its program table (pp. 14–23) is a clean scan.
  - From it: 13 unclear + 9 likely rows confirmed and 9 missing дагалдах minimums filled.
  - **All 11 ЭХИС programs** (the dataset thought they weren't in it), **all 29 regular branch programs** (ДаТС 15, ЭЦДС 10, ӨмТДС 4; 430/430), plus credits and Т/Э flags.
  - Filled: confirmed 106 → **174**; unknown 55 → **15**.
- **6 programs added** from the regulation: Гадаад хэлний орчуулга (Хятад, Солонгос, Япон); ЭХИС Инженерчлэл, эдийн засаг; ЭЦДС Менежмент and Бизнес шинжлэл, загварчлал (МС programs taught in Эрдэнэт, 490/490).
- **3 corrections:**
  - Робот ба хиймэл оюун ухаан: дагалдах 450 → 490.
  - Биотехнологи: subjects were wrong; now Биологи/Математик → Хими/Англи хэл.
  - Нийтийн удирдлага: the regulation and the school's site disagree on one дагалдах subject. It now shows the regulation and a "⚠ Эх сурвалж зөрүүтэй" warning.
- **Dorms:** official 2025-26 fees are **per month**: 91,900₮ for a 4-person room (I, IV, V байр); 167,000–197,000₮ in III байр; 30,000₮ deposit. Yearly fee left empty, since the number of billed months isn't stated.
- **Dates:** 2026 timeline added (ranking 6/30; program choice 6/30–7/02; open choice and student code 7/02).
- **Tuition:** the 218,500₮ rate applies only to 5 programs at their Улаанбаатар schools. The confirmation payment is **209,000₮** (the 190,000₮ was last year's).
- **Still unknown:**
  - exam subjects of the 15 branch joint programs (2+2 / 1+3);
  - ЭЦДС and ӨмТДС tuition;
  - 2026-27 dorm prices;
  - all 2027 dates.
- The full list of filled rows is in `IMPORT_LOG.md`.

## Code (commit `50f2298`, live)

- **Score check** (`scoreMatch.ts`), following the dataset's reference rules:
  - "Босго давсан — өрсөлдөх эрхтэй" / "Босго хүрэхгүй: …", naming the short exam and suggesting subjects left empty;
  - an unknown дагалдах minimum checks суурь only, with a caveat;
  - aptitude-test programs say "below" when суурь misses its minimum.
  - МУИС is unchanged (the tests use its exact old outputs).
- Cut-offs read "Суурь ≥ 490, дагалдах ≥ 450".
- First tests: 10 pass (`bun test`).
- **No new migration:** the per-exam column was already added yesterday (0007).
- Import script: `data-import/import-must.mjs` (dry run by default, idempotent, never deletes). Map: `data-import/must-map.json`.

## Хүрээ

Already fixed on both databases yesterday. Re-checked huree.edu.mn today: same address, phone 7701-2002, huree@huree.edu.mn. No change needed.

## Production

- Deployed by you (Claude Code's permission check blocked my deploy): API version `36b75cb4-7f49-494d-9b76-e4317c3321e5`, web version `4c054587-11f7-479b-b2e4-8dda5d56c211`.
- Backup before any write: `~/Documents/oyutan-backups/2026-10-10-main-before-shutis-v2.sql` (main was still identical to it right before deploying).
- Time Travel bookmark before the import: `0000003e-00000000-00005100-810fb675cfaff0dc9f30d75779485648`.
- Import: 143 statements (26 new and 97 updated programs). A second run makes 0. Every other university's rows are identical before and after.
- Smoke test passed: the МУИС score check gives exactly the old answer; the ШУТИС check and page show v2.
- To undo:
  - code: `npx wrangler rollback faeb1659-5446-47a1-963c-4e50772fd183 --env production` (service) and `npx wrangler rollback 8d6da31e-f293-4fc7-b526-c989175cfb10` (web);
  - data: `npx wrangler d1 time-travel restore rareapp-db --env production --bookmark=0000003e-00000000-00005100-810fb675cfaff0dc9f30d75779485648` (this also undoes anything written after it).
- Branch `zetsu` pushed.

## Skipped and why

- **Step 8 (other universities' addresses):** optional; not done.
- Not added: two programs of "Инженерийн олон улсын сургууль" (no faculty for it), and ЭЦДС "Санхүү, банк" (it is the existing МС 2+2 row).
- Ideas for later: an FAQ section and a "Хамтарсан хөтөлбөр" section (the dataset has 40 joint programs and 15 Q&As, but there are no tables for them).

## Worth checking by eye

I checked all five with curl and the live API and they look right; a look in the browser is still worthwhile.

1. /university/shutis: the Метро programs and "Суурь ≥ 490, дагалдах ≥ 450" on program cards.
2. Score check on Компьютерын ухаан with Математик 600, Физик 440: should say "Босго хүрэхгүй: дагалдах Физик 440 (босго 450)".
3. Dorm section: "Сарын төлбөр 91,900₮" and the 2025-2026 note.
4. Нийтийн удирдлага: the "⚠ Эх сурвалж зөрүүтэй" note.
5. An МУИС program's score check: same as before.
