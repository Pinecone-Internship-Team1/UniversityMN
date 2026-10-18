> Research notes written on 2026-10-16 by the agent that collected this data. If anything here differs from `CLAUDE_CODE_INSTRUCTIONS.md`, follow the instructions. There is no build script here: edit `data/*.json` with `seed/exam-tools.mjs`.

# Etugen University (etugen) — NOTES

**Counts:** programs 29, schools 8 (6 constituent, 1 branch, 1 unit), scholarships 6, dorms 4 (2 buildings), admission_2026 4, admission_dates 6, tuition_2026_2027 4, faq 14, links 22, sources 32 (12 gaps), university 1. Validator: All files valid ✔.

**split_confidence:** confirmed 11, likely 14, unclear 2, unknown 2 (Orkhon/Erdenet branch).

**Scoring:** thresholds are `per_exam`, and no formula is published (weights 1/1, `formula_known: false`). The best subject in each exam list counts. Most programs are `direct`: a student who meets both thresholds and fits the quota is admitted. Only Хүний их эмч and Шүдний их эмч are ranked (`list`). Sources: https://etugen.edu.mn/public/juram2627.pdf (Rector's order No. 44, 2026-03-11) and https://burtgel.etugen.edu.mn/account/bachelorregister.

**Solid:**
- Program list, subjects and thresholds: rows are `confirmed` where the 2026-27 regulation table and the site table (https://etugen.edu.mn/Home/admission/17, undated) agree. Rows where the PDF text was merged or garbled are `likely`.
- 2026 dates and fees: registration fee 2,000₮ for up to 4 programs, 250,000₮ confirmation deposit, document fee 30,000₮.
- Scholarships, the Namseoul 2+1+2 and Shenyang 3+1 joint programs, and dorm capacity (372 beds).

**Unknown:** tuition (not published), dorm prices, Erdenet subjects (only the 430 minimum is known), and the skills-test date.

**Top gaps:**
1. 2026 program table, image only: https://burtgel.etugen.edu.mn/public/Burtgel%20WEB-d%2026.png
2. Check the regulation PDF's table visually, since its layout broke when read as text: https://etugen.edu.mn/public/juram2627.pdf
3. Tuition and dorm price: https://www.facebook.com/etugen.university and https://burtgel.etugen.edu.mn/images/ElseltPoster26.png
4. Program brochures on Google Drive (credits, fees), linked from the https://etugen.edu.mn/Home/Bachlist?id=N pages
5. Old regulation (proxy 504): https://etugen.edu.mn/public/juram.pdf

**Surprises:**
- All 5 campus buildings are in **Сүхбаатар дүүрэг**, not Баянгол as the task said.
- "Ур чадвар (сорил)" is an *optional* alternative inside the long second-exam lists (nursing, physio, pharmacy technician, tourism, teachers). `aptitude_test_required=true` follows the exam-tools convention.
- Био-Анагаах ухаан: the regulation says 480, the site says 490. After review the row is `conflicting` and neutral (no minimums stored, both values in the display sentence), so nobody gets a false pass.
- Олон улсын сувилахуй: one source gives a bachelor program with 430/450, the other places it in the 3-year associate row (410/450). It is marked `unclear`, and both readings are kept in page_thresholds.
- Registration closes 2026-06-30 by the regulation but 2026-09-20 by the system. The FAQ still shows 2025 dates.
