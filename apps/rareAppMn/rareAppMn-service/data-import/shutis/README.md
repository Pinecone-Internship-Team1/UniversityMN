# ШУТИС (Mongolian University of Science and Technology) dataset for oyutan.mn

Everything a 12th grader needs to get into ШУТИС:
- 183 bachelor programs across 13 schools, with суурь/дагалдах exam subjects, per-exam minimums and yearly tuition estimates;
- the admission steps, fees and bank accounts, and the aptitude test;
- 14 scholarships, dorms and admission dates;
- 25+ joint programs with foreign universities, plus an FAQ and links.

Collected from official ШУТИС sites on 2026-10-09/10.

## How to use (one sentence, once)

Unzip into your Downloads folder and tell Claude Code:

> Read ~/Downloads/shutis-oyutan-mn/CLAUDE_CODE_INSTRUCTIONS.md and do everything in it without asking me.

Claude Code then does the following on its own:
- fills the remaining data gaps from the official sites (it can open the scans and images this sandbox couldn't);
- adds the per-exam minimum rule to the score check;
- imports locally, backs up, imports to production and deploys;
- fixes Хүрээ's address;
- writes `IMPORT_REPORT.md` with a short summary for you.

## Contents

- `data/*.json`: 13 data files (`{ _meta, records }`; English keys, Mongolian values; `status` and `source_urls` on every record)
- `GUIDE_MN.md`: student guide in Mongolian, with a table of all programs
- `CLAUDE_CODE_INSTRUCTIONS.md`: the autonomous runbook (safety rules, gap-filling, schema change, mapping, import, deploy, report)
- `seed/load-data.mjs`: validate everything (`node seed/load-data.mjs`)
- `seed/eligibility.mjs`: reference score check (`node seed/eligibility.mjs Математик=620 Физик=540 "Англи хэл"=500`)
- `seed/exam-tools.mjs`: helpers to write exam data in the dataset's format
- `seed/guide-appendix.mjs`: rebuild the guide's program table from the data

## Changelog

**v2 (2026-10-10)**
- **Programs:** 183 programs, up from 163, from school websites: Metro programs, an English-taught program and 14 joint programs with foreign universities. 15 rows upgraded to confirmed. Yearly tuition for joint programs now counts only the years at ШУТИС.
- **Joint programs:** all 25 official joint programs (must.edu.mn/mn/page/700), with named partner universities.
- **Эрдэнэт (ЭЦДС):** its scholarships (Булган 50%, olympiad, Эрдэнэт үйлдвэр, "Монгол 21") and job guarantee, plus contacts.
- **Other additions:** QS Asia ranks, the non-degree winter-prep program, the student service centre, and a gap list with what to read from each source.
- **Tools:** new validator, score-check reference, exam helpers and guide builder. The runbook is now fully autonomous.

**v1 (2026-10-09):** first release.

## Монголоор товч

Энэ хавтсанд ШУТИС-д элсэхэд хэрэгтэй бүх мэдээлэл өгөгдлийн санд оруулахад бэлэн JSON хэлбэрээр байна. Сурагчдад зориулсан гарын авлага нь `GUIDE_MN.md`. Claude Code-д дээрх ганц өгүүлбэрийг хэлэхэд үлдсэнийг өөрөө хийнэ.
