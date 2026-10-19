# Three more universities for oyutan.mn: СЭЗИС, МУБИС, ХААИС

Database-ready data for three big state universities, collected from their official sites on 2026-10-15:

| University | Programs | Ready for the score check now | What Claude Code still has to read on your Mac |
|---|---|---|---|
| **СЭЗИС** — University of Finance and Economics | 58 | 50 | 5 programs of its new Education and Social Sciences schools, and UFE Tech fees |
| **МУБИС** — Mongolian National University of Education | 38 | 0 | its 2026-27 subject and minimum-score table (a Google Drive PDF) |
| **ХААИС** — Mongolian University of Life Sciences | 52 | 0 (subjects known) | its 2026-27 minimum scores (ХААИС's admission system) |

Each university also has: scholarships, dorms, contacts, admission steps and dates, and yearly fees (official, or an estimate marked as one).

## How to use (one sentence, once)

Unzip into your Downloads folder and tell Claude Code:

> Read ~/Downloads/oyutan-next-unis/CLAUDE_CODE_INSTRUCTIONS.md and do everything in it without asking me.

Claude Code then does the following on its own:
- reads the PDFs and images that couldn't be read here (most important: МУБИС's subject and minimum-score table);
- imports everything into the local database and checks it;
- backs up production, imports the three universities, and checks the live pages;
- opens a pull request and writes `IMPORT_REPORT.md`.

**You probably won't need to paste anything.** One exception: СЭЗИС uses "the average of two exams" as its minimum. If the site's code can't show that correctly yet, Claude Code makes a small fix and gives you **one** line to paste for the deploy.

## Contents

- `unis/<name>/data/*.json`: the data (`{ _meta, records }`; English keys, Mongolian values; `status` and `source_urls` on every record).
- `unis/<name>/GUIDE_MN.md`: a guide for students in Mongolian, with a table of all programs.
- `unis/<name>/NOTES.md`: what the research found and what's still missing.
- `CLAUDE_CODE_INSTRUCTIONS.md`: the runbook for Claude Code.
- `seed/load-data.mjs`: checks every file (`node seed/load-data.mjs`).
- `seed/eligibility.mjs`: the reference score check (`node seed/eligibility.mjs ufe Математик=640 "Англи хэл"=620`).
- `seed/exam-tools.mjs`: helpers for writing exam data in the same format.
- `seed/build-guide.mjs`: rebuilds the guides after a data change.

## How these differ from МУИС, ШУТИС and АШУҮИС

- **СЭЗИС** sets one minimum on the **average** of the two exams (for example "average 580 or more"), not a minimum per exam. Its majors also come in versions (2+2 abroad, BTEC, +MBA, dual majors), and each version is its own program. Economics also needs Math ≥ 600. The site can't check that extra rule yet, so Economics shows "ask the university".
- **МУБИС** publishes its exam table only as a Google Drive PDF, which couldn't be opened here. Claude Code downloads and reads it on your Mac. Most МУБИС programs train teachers, and the state teacher scholarship applies to them.
- **ХААИС**: the subjects for each program are known, but the 2026-27 minimum scores aren't (its website blocks automated reading). Claude Code reads them from ХААИС's admission system.

## Монголоор товч

Энэ хавтсанд СЭЗИС, МУБИС, ХААИС-д элсэхэд хэрэгтэй мэдээлэл өгөгдлийн санд оруулахад бэлэн JSON хэлбэрээр байна. Сурагчдад зориулсан гарын авлага нь сургууль бүрийн `GUIDE_MN.md`.
