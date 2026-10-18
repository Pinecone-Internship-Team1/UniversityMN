> Research notes written on 2026-10-16 by the agent that collected this data. If anything here differs from `CLAUDE_CODE_INSTRUCTIONS.md`, follow the instructions. There is no build script here: edit `data/*.json` with `seed/exam-tools.mjs`.

# Otgontenger University (ОТИС) — notes

**Counts:** university 1, schools 3 (all constituent, one UB campus), programs 18, scholarships 15, dorms 1 (info only), admission_dates 7, admission_2026 1, tuition 3, faq 12, links 18, sources 31 (16 used + 15 gaps). Validator: All files valid ✔. Web calls: 39.

**Programs by split_confidence:** likely 17, unclear 1, confirmed 0, unknown 0.

**Formula / threshold type:** `per_exam`. ЭЕШ-1 is "one of the listed subjects"; ЭЕШ-2 is the "Дагалдах шалгалт". No formula published, so weights are 1/1 and `formula_known: false`. Most programs are 490/490; preschool teacher is 440/490; software is 490/450. Source: https://api.otgontenger.edu.mn/enrollment (Хавсралт 1 of "…2026-2027 ОНЫ ХИЧЭЭЛИЙН ЖИЛД ОЮУТАН ЭЛСҮҮЛЭХ ЖУРАМ").

**Why "likely", not "confirmed":** the regulation's title says 2026-2027, but its text still cites 2025-2026, 2024-2025 and the 2024 orders А/143 and А/170.

**Solid:** the program list, subjects, thresholds (likely), contacts, and scholarships/discounts (ЭЕШ-1 751–800 = 100% off the first year, 701–750 = 75%, 650–700 = 50%).
**Unknown:** tuition (no amounts anywhere), registration fee, the university's own dates (only the national 2026 exam dates, from ikon.mn), dorms, and skills-test details.

**Top gaps for the Mac agent:**
1. Row 104104, Агаарын тээврийн үйлчилгээ: the page text ends at "4…". Need its exam-1 threshold plus exam-2 subjects and threshold: https://api.otgontenger.edu.mn/enrollment
2. Admission system (blocked by robots.txt): https://elselt.otgontenger.edu.mn/home. Need tuition, fees and dates.
3. Tuition: https://www.otgontenger.edu.mn/mn/training/tuition-fees (no amounts) and https://www.facebook.com/OtgonTengerUni
4. Admission and scholarship regulations are listed with no file link: https://www.otgontenger.edu.mn/about/rules?term=term_5_4
5. Eight scholarship images at http://otgontenger.edu.mn/mn/student/scholarship

**Surprises:**
- The task brief says Хан-Уул дүүрэг; the official site says Баянзүрх дүүрэг, 41-р хороо, Жуковын гудамж.
- Preschool teacher and Journalism use a university skills test ("Ур чадвар", 490) as exam 2. No details are published.
- In the translation programs, Нийгэм судлал is in both exam groups.
- Хүний нөөцийн менеджмент and Маркетинг are in the 2026-27 table but missing from the bachelor program list, so they are status `verify`.
- The program list also has 2.5–3.5-year variants (some with minimum 0). I left them out and documented them.
- Program codes differ between the table and the program list.
- Rankings are null: the THE SDG4 "201–300" claim appears only in the university's own news.
