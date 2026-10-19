> Research notes written on 2026-10-16 by the agent that collected this data. If anything here differs from `CLAUDE_CODE_INSTRUCTIONS.md`, follow the instructions. There is no build script here: edit `data/*.json` with `seed/exam-tools.mjs`.

# ОУУБИС (IUU) dataset: notes

**Counts:** 29 programs (Humanities 10, Engineering/Design/Tech 9, Economics & Business 8, Law 1, Nursing 1), 5 schools, 2 admission_2026, 5 admission_dates, 3 tuition, 13 scholarships, 2 dorms, 12 faq, 27 links, 36 sources (10 gaps). Validator: "All files valid ✔".
**split_confidence:** unclear 29.

**Scoring:** No formula is published. The official table (https://www.iuu.edu.mn/bachelor/program) gives two exams per program, "Элсэлтийн шалгалт-1/-2" (Суурь/Дагалдах on the registration form), each with a number after its subjects (430–490, mostly 490). The table has no year and no word "босго". Per the spec, all rows are `unclear` and `per_exam`, with weights 1/1, `formula_known: false` and null thresholds. The numbers are kept in `exam_2026_2027.page_thresholds`. Commas between subjects are read as "one of".

**Solid:** the 29 programs (same as the registration dropdown), their subjects and index codes; the school mapping (Law and Nursing mapped by department); contacts and history; the dorm (6 floors, 180 places); 12 scholarship types (527 students, 559.7M₮ in semester 1 of 2026-27).
**Unknown:** 2026-27 minimums, the formula, tuition (published nowhere readable), registration dates and fee, skills-test content, dorm price, scholarship amounts.

**Top gaps for the Mac agent:**
1. The 2026-2027 admission regulation, a scanned PDF that probably holds all of the above (`gap-regulation-2026`). If it matches `page_thresholds`, promote the rows with buildExam/applyExam. A dry run of that path works.
2. The scanned scholarship regulation (`gap-scholarship-regulation`).
3. Facebook: https://www.facebook.com/ulaanbaataruniversity
4. The Law and Nursing school pages (https://www.iuu.edu.mn/university/5, /6).

**Surprises:**
- The official address is Баянзүрх дүүрэг, 25-р хороо, Намянжугийн гудамж, not Сонгинохайрхан.
- IUU's own timeline says it was named "Улаанбаатар их сургууль" in 2012–2015 (emails are @ulaanbaatar.edu.mn). Check that any separate "Улаанбаатар Их Сургууль" row on oyutan.mn is not a duplicate.
- 9 programs use the university's own skills test as exam 2, including Мал зүй.
- Graphic Design has two index codes (021106 in the table, 021105 on the school page). Two programs on the school page are not open for admission and are excluded.
- A direct fetch of iuu.edu.mn was blocked by an unanswered permission prompt; it loaded via search results.
