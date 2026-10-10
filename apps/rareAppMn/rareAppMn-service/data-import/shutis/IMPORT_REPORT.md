# ШУТИС v2 import — report (2026-10-10)

**Status: ready, but not live yet.** Everything is done and checked on the local copy and committed (`50f2298`). The production deploy was blocked by Claude Code's permission check, so the live site still shows yesterday's v1 data. Per the runbook, data goes to production only after the new code is live, so main has **not** been changed (only backed up).

## Counts (local, ready for main)

| | Before (v1, live now) | After (v2) |
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

## Code (commit `50f2298`, not deployed)

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

## Skipped and why

- **Production (Step 6c–d):** the deploy command was denied by Claude Code's permission check, so nothing was deployed or imported to main.
  - Backup taken: `~/Documents/oyutan-backups/2026-10-10-main-before-shutis-v2.sql`.
  - Rollback targets: API `faeb1659-5446-47a1-963c-4e50772fd183`, web `8d6da31e-f293-4fc7-b526-c989175cfb10`.
- **Step 8 (other universities' addresses):** optional; not done.
- **Push:** not done; waiting until production is decided.
- Not added: two programs of "Инженерийн олон улсын сургууль" (no faculty for it), and ЭЦДС "Санхүү, банк" (it is the existing МС 2+2 row).
- Ideas for later: an FAQ section and a "Хамтарсан хөтөлбөр" section (the dataset has 40 joint programs and 15 Q&As, but there are no tables for them).

## To finish (from `apps/rareAppMn/rareAppMn-service`)

```bash
npx wrangler deploy --env production
(cd ../rareAppMn-web && npx opennextjs-cloudflare deploy)   # already built from 50f2298
node data-import/import-must.mjs --remote             # dry run: expect 26 insert / 97 update majors
node data-import/import-must.mjs --remote --apply
node data-import/import-must.mjs --remote             # must report 0 statements
```

## Worth checking by eye (after it's live)

1. /university/shutis: the Метро programs and "Суурь ≥ 490, дагалдах ≥ 450" on program cards.
2. Score check on Компьютерын ухаан with Математик 600, Физик 440: should say "Босго хүрэхгүй: дагалдах Физик 440 (босго 450)".
3. Dorm section: "Сарын төлбөр 91,900₮" and the 2025-2026 note.
4. Нийтийн удирдлага: the "⚠ Эх сурвалж зөрүүтэй" note.
5. An МУИС program's score check: same as before.
