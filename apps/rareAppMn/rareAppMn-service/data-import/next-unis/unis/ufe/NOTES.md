> Research notes written on 2026-10-15 by the agent that collected this data. If anything here differs from `CLAUDE_CODE_INSTRUCTIONS.md`, follow the instructions. For example, fill gaps with `seed/exam-tools.mjs` in `data/programs.json`, not with a build script.

# СЭЗИС (UFE) dataset: notes

**Counts:** programs 58 (СЭЗИС core 43, UFE Tech 10, Education 4, Social Sciences 1), schools 5, admission_2026 5, admission_dates 18, tuition 8, scholarships 6, dorms 4, faq 15, links 30, sources 65 (12 gaps). `node seed/load-data.mjs` prints "All files valid ✔".
**split_confidence:** confirmed 21, likely 32, unknown 5.

**Scoring:** Each core major has two fixed ЭЕШ subjects. There is one minimum on their **average**, so `threshold_type: "total"`, weights 0.5/0.5 and `selection_type: "list"` (ranked by average).
- Thresholds (510–620) come from the official 2026-2027 table: https://admission.ufe.edu.mn/mn/newsDetail/199
- The "average" rule is stated on the dual-major page as "дундаж 580-аас дээш": https://admission.ufe.edu.mn/mn/newsDetail/197. The 2024 ranking rule says the same: https://ufe.edu.mn/widgetDetail/1383
- Economics also needs Math ≥ 600 (`exam.subject_minimums`).

UFE Tech lists a separate minimum for each exam (e.g. Math/Physics 520+, English/Social 500+), so it is `per_exam`. Its formula is unpublished: 0.5/0.5 is a placeholder and these rows are "likely".

**Solid:** the 16 core majors with subjects and thresholds. Tuition per credit is 310,000₮ (core, dual, +MBA), 376,000₮ (2+2 joint, years in Mongolia) and 447,000₮ (BTEC); Rotation is 28,000,000₮ a year. Also solid: 2026 dates, three new-student scholarships (3M, 3M, 5M₮) and dorm prices.

**Inferred:** The variant rows (11 joint, 2 BTEC, 2 Rotation, 6 +MBA) reuse their major's threshold. ACCA/CGMA/Interactive tuition is assumed to be 310,000₮ (`price_status: verify`). Linking the Education and Social Sciences programs to those schools is an inference.

**Unknown:** the registration fee and the 2026 confirmation fee; tuition at UFE Tech, Education and Social Sciences; Education and Social Sciences subjects and thresholds; seat numbers; how the skills test is scored.

**Top gaps for the Mac agent:**
1. Admission regulation (PDF in a JS viewer): https://admission.ufe.edu.mn/mn/admission-procedure
2. FAQ answers (fees, refunds, 100% discount): https://admission.ufe.edu.mn/mn/degree/1/faq
3. Brochure PDF with no text layer: https://cdnm.heyzine.com/files/uploaded/v3/243b02785b7bec1829f253ead920304324088e50.pdf
4. Threshold image: https://backadmission.ufe.edu.mn/content/post/image/202605/ac6044a820e0b66c488aa878832ca7ca.png
5. Scanned scholarship regulation: https://backadmission.ufe.edu.mn/content/post/image/202604/180067846491c672de3775ac9b7d8103.pdf
6. Education and Social Sciences program cards: https://admission.ufe.edu.mn/mn/professions/17 and /19

**Surprises:**
- Thresholds are averages and among Mongolia's highest. A 2025 news.mn article (https://news.mn/r/2800532/) said "дундаж оноо 510-650".
- Subjects are fixed pairs with no "or" choice.
- Tourism's second "exam" is a 1–2 minute video.
- The dual-major page lists "Маркетинг + Санхүү, банк" twice. The second entry is described as accounting and data analytics (status `verify`).
- Subject names were normalized to the app's names ("Нийгмийн тухай мэдлэг"/"Нийгэм" → Нийгэм судлал, "Монгол" → Монгол хэл). `seed/eligibility.mjs` handles `threshold_type: "total"` (the average rule).
