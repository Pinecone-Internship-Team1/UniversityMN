# АШУҮИС (Mongolian National University of Medical Sciences) dataset for oyutan.mn

Everything a 12th grader needs to get into АШУҮИС:
- 28 programs in Улаанбаатар (20 bachelor, 8 associate), each with its two exam groups, the minimum score for each group, list or direct selection, and the official 2026-27 yearly fee;
- the admission steps and the skills test;
- scholarships, loans and dorms;
- the branch schools.

Collected from official АШУҮИС sites on 2026-10-11.

## How to use (one sentence, once)

Unzip into your Downloads folder and tell Claude Code:

> Read ~/Downloads/ashuuis-oyutan-mn/CLAUDE_CODE_INSTRUCTIONS.md and do everything in it without asking me.

Claude Code then does the following on its own:
- fills the branch-school gaps from their images and the scanned regulation;
- adds АШУҮИС's "sum of two exams" rule to the score check;
- imports locally and backs up production;
- gives you **one** line to paste for the deploy (this machine blocks deploys by Claude Code itself);
- imports to production after you say "done", then writes `IMPORT_REPORT.md`.

## Contents

- `data/*.json`: 13 data files (`{ _meta, records }`; English keys, Mongolian values; `status` and `source_urls` on every record)
- `GUIDE_MN.md`: student guide in Mongolian, with a table of all programs
- `CLAUDE_CODE_INSTRUCTIONS.md`: the autonomous runbook
- `seed/load-data.mjs`: validate everything (`node seed/load-data.mjs`)
- `seed/eligibility.mjs`: reference score check (`node seed/eligibility.mjs Хими=620 Биологи=580`)
- `seed/exam-tools.mjs`: helpers to write exam data in the dataset's format
- `seed/guide-appendix.mjs`: rebuild the guide's program table from the data

## How АШУҮИС differs from МУИС and ШУТИС

- The score is the **sum** of two exams (max 1600), not 0.7/0.3. Each exam has its own minimum.
- Some programs are "list" programs (up to 8 choices, ranked by score). Others are "direct" programs (1 choice; anyone meeting both minimums can enrol).
- Nursing and therapy programs use АШУҮИС's own biology skills test as the second exam.
- The fees in the data are official 2026-27 yearly amounts, not estimates.

## Монголоор товч

Энэ хавтсанд АШУҮИС-д элсэхэд хэрэгтэй мэдээлэл өгөгдлийн санд оруулахад бэлэн JSON хэлбэрээр байна. Сурагчдад зориулсан гарын авлага нь `GUIDE_MN.md`.
