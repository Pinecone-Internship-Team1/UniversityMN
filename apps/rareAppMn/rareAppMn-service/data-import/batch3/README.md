# The last five universities for oyutan.mn: СУИС, Отгонтэнгэр, Этүгэн, Хүрээ, ОУУБИС

Your site already lists these five universities, but their pages are empty ("Мэдээлэл удахгүй нэмэгдэнэ"). This folder fills them with data collected from their official sites on 2026-10-16:

| University | Programs | Ready for the score check now | What Claude Code still has to read on your Mac |
|---|---|---|---|
| **Этүгэн** | 29 | 25 | one PDF table to double-check (one program's two sources disagree); fees |
| **Отгонтэнгэр** | 18 | 17 | one program cut off in its table; fees |
| **Хүрээ** | 10 (+4 not open in 2026) | 10 | fees, dorm |
| **ОУУБИС** | 29 | 0 (subjects known) | its 2026-27 minimum scores (a scanned PDF) |
| **СУИС** | its 2026-27 list couldn't be read here | 0 | its program table (a page that only works in a browser; Claude Code opens it with your Chrome) |

Each university also has: scholarships, dorms, contacts, and admission steps and dates. None of the five publishes its tuition online, so Claude Code looks for it; if it can't find it, the page says to ask the school.

## How to use

Double-click the zip so it unzips in Downloads, then tell Claude Code:

> Find the newest oyutan-batch3 folder in ~/Downloads (it may be called "oyutan-batch3 2"; if only the zip is there, unzip it), read CLAUDE_CODE_INSTRUCTIONS.md inside it and do everything in it without asking me.

Claude Code then does the following on its own:
- reads the PDFs and images that couldn't be read here;
- imports everything locally and checks it;
- backs up the live database;
- fills the five pages on the live site;
- opens a pull request and writes `IMPORT_REPORT.md`.

**No code change or deploy is needed this time.** The only thing you may have to paste is one read-only backup line, as last time: type `!` yourself, then paste the rest.

## Contents

- `unis/<name>/data/*.json`: the data (`{ _meta, records }`; English keys, Mongolian values; `status` and `source_urls` on every record).
- `unis/<name>/GUIDE_MN.md`: a guide for students in Mongolian, with a table of all programs.
- `unis/<name>/NOTES.md`: what the research found and what's still missing.
- `CLAUDE_CODE_INSTRUCTIONS.md`: the runbook for Claude Code.
- `seed/`: the same checking tools as last time (`load-data`, `eligibility`, `exam-tools`, `build-guide`).

## Монголоор товч

Энэ хавтсанд СУИС, Отгонтэнгэр, Этүгэн, Хүрээ, ОУУБИС-д элсэхэд хэрэгтэй мэдээлэл өгөгдлийн санд оруулахад бэлэн JSON хэлбэрээр байна. Сурагчдад зориулсан гарын авлага нь сургууль бүрийн `GUIDE_MN.md`.
