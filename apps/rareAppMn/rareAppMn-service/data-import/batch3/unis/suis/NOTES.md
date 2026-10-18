> Research notes written on 2026-10-16 by the agent that collected this data. If anything here differs from `CLAUDE_CODE_INSTRUCTIONS.md`, follow the instructions. For СУИС, make every change through `build_data.py`, never in `data/*.json`: the script rewrites all its JSON files (see the instructions' appendix).

# СУИС (MNUAC) — NOTES

**Counts:** university 1, schools 5, programs 19, scholarships 0, dorms 1 (info), admission_dates 3, admission_2026 3, tuition_2026_2027 1, faq 9, links 16, sources 36 (19 gaps). Validator: All files valid ✔.

**Programs by split_confidence:** unclear 19. All 19 are the 2016 list with status `unverified`, so **0 programs import** until the main gap is filled. Their holding school `suis-2016` (also unverified) is dropped automatically once `PROGRAMS_2026` in build_data.py has rows.

**Formula / threshold type:** none found for 2026-2027. The only rule found is from 2016 (https://ikon.mn/n/s1m, cross-checked with https://news.mn/r/738459/). Then, 19 of 25 programs had a skills test (out of 800) plus ЭЕШ ≥400 in *any one* subject; the other 6 needed ≥400 in one of two named subjects. No combining formula was published. Stored in `page_thresholds` (year 2016).

**Solid:** 2026 national ЭШ dates (registration 03-04 to 05-15, exam 06-25 to 06-28; ikon.mn/n/3lsg, /3lvf); the admission system URL; Театрын урлагийн сургууль and two departments (page titles in search results); the 2016 naming of Дүрслэх, дизайн урлагийн сургууль (ikon.mn/n/o3c).
**Unknown:** every 2026-2027 program, subject, minimum and formula; tuition, dorms, scholarships, address, phones.

**Top gaps for the Mac agent (real browser needed):**
1. https://burtgel.mnuac.edu.mn/bachelor: the 2026-2027 program table (Next.js). Fill `PROGRAMS_2026` (format documented). Its Python buildExam/buildDisplay port matches exam-tools.mjs output and validates.
2. https://burtgel.mnuac.edu.mn/ and https://mnuac.edu.mn/main/485828: admission regulation, formula, fees.
3. https://www.mnuac.edu.mn: fetch blocked (permission request not answered). Contacts, dorms, scholarships.
4. https://mnuac.edu.mn/main/383792?content=6034453: the "СУИС ЭЛСЭЛТ 2025" post; look for a 2026 version.
5. School sites sfa., scc., sbm., mafa.mnuac.edu.mn: exact school names; confirm the three `verify` schools.

**Surprises:**
- No official SUIS page (Nuxt/Next.js) returns readable text.
- A zms.mn interview, "СУИС … ур чадварын шалгалтаа цахимаар авна", is robots-blocked; date unknown.
- The 2016 program names are my Mongolian renderings of an English summary, except "Зураасан зураг" (an official page title). Replace with official names.
- A separate State Conservatory exists (search title only). Check whether SUIS still admits to music programs.
- 2026 ЭШ added level I/II/III exams and an aptitude test; check which levels SUIS requires.
