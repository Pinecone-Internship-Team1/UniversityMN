> Research notes written on 2026-10-15 by the agent that collected this data. If anything here differs from `CLAUDE_CODE_INSTRUCTIONS.md`, follow the instructions. For example, fill gaps with `seed/exam-tools.mjs` in `data/programs.json`, not with a build script.

# МУБИС (msue) dataset: notes

**Counts.** university 1, schools 10 (7 constituent, 2 branches, 1 unit), programs 38, scholarships 6, dorms 5, admission_dates 10, admission_2026 3, tuition 6, faq 14, links 28, sources 80 (15 are gaps). Programs by split_confidence: **unknown 38**. `node seed/load-data.mjs` prints "All files valid ✔".

**Scoring formula and threshold type: not found.** МУБИС publishes its 2026-27 exam subjects, minimums and formula only in an embedded Google Drive PDF, "Босго оноо 2026-2027.pdf" (https://drive.google.com/file/d/1TUTXE0ZBCT_NvMuULmIYjkxcd0i243pi/preview, shown on https://www.msue.edu.mn/p/r/5650). Drive needs JavaScript and blocks downloads, so it was never read. Every program therefore has empty subject lists and null minimums, `threshold_type` and `selection_type`. Weights are a placeholder 0.7/0.3 marked `weights_is_placeholder: true`. News gives МУБИС minimums of 420–480 in 2024 and 2025 (news.mn); these are kept as reference only.

**Solid:**
- 38 Ulaanbaatar programs in 7 schools, with program codes and credits, from the official accredited-programs PDF and school pages.
- School contacts and stats.
- Teacher scholarship: a БЗС quota. From 2026-27, GPA 3.0–3.3 gives 70% and above 3.3 gives 100%. Graduates must then work 3 years outside the capital or 5 in Ulaanbaatar.
- Loan and grant rules, dorm basics.
- National rules: Mongolian exam minimum of 400, skills-test score conversion.

**Unknown:** all exam data; official 2026-27 tuition (news only: up 9%); registration dates and fee; which programs need a skills test; branch programs; dorm prices for 2026.

**Top gaps for the Mac agent.** Fill them with `seed/exam-tools.mjs` (Step 2 of `CLAUDE_CODE_INSTRUCTIONS.md`).
1. The threshold PDF above.
2. "МУБИС-Элсэлт 2026.pdf" (https://drive.google.com/file/d/15FJPrGsC_JqNKULMaBF0EDVyjJ0DvvkK/preview): dates, fee, rules.
3. Quota PDF (https://drive.google.com/file/d/1ZpUSJLOv3e-W2vNW_sEK8tQLt8aUeeoU/preview): which programs admit, plus branch rows.
4. https://burtgel.msue.edu.mn/, the registration site (JavaScript app).
5. Branch program images, listed in sources.json (gap-bost-2026, gap-ast-programs).

**Surprises:**
- МУБИС's news feed has no admission posts. All admission information sits in Drive PDFs, images, the JavaScript registration site or Facebook.
- БЗС did not fund the teacher scholarship in spring 2026. МУБИС did not charge students for that semester and moved the autumn fee deadline to December.
- The Bayan-Ölgii branch took applications through a Google Form.
- The national minimum is planned to rise: 480 in 2027, 495 in 2028, 505 in 2029. This is a plan, not yet confirmed.
- Three PE-school programs are missing from the accredited list. Check whether they still admit students.
