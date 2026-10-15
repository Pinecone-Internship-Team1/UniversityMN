> Research notes written on 2026-10-15 by the agent that collected this data. If anything here differs from `CLAUDE_CODE_INSTRUCTIONS.md`, follow the instructions. For example, fill gaps with `seed/exam-tools.mjs` in `data/programs.json`, not with a build script.

# ХААИС (MULS) dataset notes, 2026-10-15

**Counts** (validator: "All files valid ✔"): 52 programs (50 in Ulaanbaatar, 2 in Darkhan), 8 schools (6 UB schools, the `muls-ub` placeholder and the Darkhan branch), 3 admission_2026, 5 admission_dates, 6 tuition, 4 scholarships, 4 dorms, 12 faq, 20 links and 44 sources (13 of them gaps). By split_confidence: **unclear 50, unknown 2, confirmed/likely 0**.

**Main obstacle:** WebFetch refused almost all of muls.edu.mn as robots-disallowed, and admission.muls.edu.mn loops between https and http. So the program data comes from the official admission site's program pages, `https://elselt.muls.edu.mn/majorview/N` (52 pages read).

**Scoring and thresholds:** Each page lists two subject groups ("Хичээл 1/2") with a score for each group, so `threshold_type` is `per_exam`. I found no formula (sum, average or 70/30). `weights` is a placeholder {1,1}, with `weights_known: false` and `score_formula: null`.

The page scores have no year. 40 of the 50 are below 450, but ХААИС used 450–480 in 2024 (https://todnews.mn/p/45/show/35943) and in 2025 (https://news.mn/r/2800532/). For 2026-27 the Ministry set 450–500 for bachelor programs and 430 for branch schools (https://ugluu.mn/523303.html). So the 2026-27 thresholds are null, and the page scores go in `exam_2026_2027.page_thresholds`. (Reviewer note: some official 2026-27 tables, e.g. АШУҮИС and ШУТИС, do have Ulaanbaatar minimums of 410–440, so a value under 450 is not proof of an old table; the real reason these page scores aren't used is that the pages carry no year.)

**Solid:** subject groups for the 50 UB programs; the "Тэргүүлэх/Эрэлттэй" labels; national 2026 dates (ЭШ registration 03-04 to 05-15, exam 06-25 to 06-28, winter registration 10-01 to 11-23); grant rules from the Education Loan Fund; dorm facts (3 dorms, about 1,300 places, 1.0–1.3M₮ in 2025-26); Darkhan contacts.

**Weak or unknown:**
- School mapping: 5 confirmed, 9 from 2019–2020 official sources, 19 guessed from the field of study, 17 in the placeholder.
- Tuition: 156–169k₮ per credit (4.7–5.2M₮ a year) comes from https://news.zindaa.mn/5ca0. It conflicts with zogii.mn, which gave the same range for 2025-26.
- Main-campus phone/email; ХААИС's own 2026 registration dates and fee.

**Top gaps for the Mac agent:**
1. https://muls.edu.mn/program_sum.php?page_value=ZW5jb2RldXNlcmlkMQ%3D%3D (program-to-school list)
2. http://admission.muls.edu.mn/Home/Profession (2026 subjects, thresholds, seats)
3. https://www.muls.edu.mn/view_news.php?value_id=ZW5jb2RldXNlcmlkNDIyNw%3D%3D ("ХААИС-ийн элсэлт-2026": rules, formula, dates)
4. Seven time.mn threshold images listed in sources.json, from https://www.arslan.mn/social/education/668226.shtml
5. https://www.sab.edu.mn/ pages "Available Majors" and "Dormitory" (Darkhan)
6. The muls.edu.mn pages "Оюутны төлбөрийн мэдээлэл" and "Холбоо барих"

**Surprises:**
- Some pages look like duplicates (majorview 3 and 177; 15 and 201).
- Хими appears in both exam groups for two programs.
- Landscape architecture needs a skills test ("Ур чадвар").
- The medicinal-plants page mentions "АШУИС", possibly a joint program.
- The 2027 national threshold is planned at 480 (https://ikon.mn/n/3okx).
