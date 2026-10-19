> Research notes written on 2026-10-16 by the agent that collected this data. If anything here differs from `CLAUDE_CODE_INSTRUCTIONS.md`, follow the instructions. There is no build script here: edit `data/*.json` with `seed/exam-tools.mjs`.

# Хүрээ МХТДС (huree): notes

**Counts:**
- university 1, schools 1, programs 14 (10 current + 4 unverified), scholarships 12, dorms 2, admission_dates 3, admission_2026 1, tuition_2026_2027 3, faq 12, links 23, sources 32 (8 gaps).
- Programs by split_confidence: likely 10, unclear 4. Validator: "All files valid ✔".

**Formula / threshold type:**
- No admission formula is published, so rows are per_exam with weights 1/1 and formula_known false.
- Minimums (450 or 490 per program) come from the "Бакалаврын мэргэжлүүд" table at https://huree.edu.mn/enter/enter.php. All 10 department pages (https://huree.edu.mn/department/*.php) repeat them word for word ("ЭШ 1 / ЭШ 2 … /аль нэг/").
- Scholarship bands (550–800) use the average of exams 1 and 2 (https://elselt.huree.edu.mn/).

**Judgement call:** the table has no year. I rated the 10 programs in the 2026 online form (https://elselt.huree.edu.mn/register.php) "likely":
- the table sits next to the 2026 registration dates (2026.06.20–08.30);
- every department page repeats it;
- the Electronics page says the department started in 2026.

(The strict undated-table rule would make all 14 rows unclear; the runbook keeps them "likely".)

**Unverified (not imported):** Сэргээгдэх эрчим хүч, Барилгын инженерчлэл, Авто замын инженерчлэл, Хүнсний инженерчлэл. They are in the table but not the 2026 form, and none has a department page. Food engineering exists only as a minor inside Хоол зүй, шим судлал.

**Solid:** subjects and minimums, 2026 registration dates, fees (10,000₮ registration fee in cash, 100,000₮ admission fee by bank transfer), documents, scholarship bands, contacts, history.

**Unknown:**
- Bachelor tuition: not published anywhere I found.
- Skills-test details for Архитектур and График дизайн.
- Dorm: opened in 2004 per the history, but the English site says there is none now.
- 2027 dates.

No дэд бакалавр programs.

**Top gaps:**
1. https://www.facebook.com/huree.university.ICT: tuition, a requirements post with a year, the skills test, the dorm.
2. https://huree.edu.mn/bbs/bbs.php?start=3 and later pages: 2026 notices.
3. https://itoim.mn/a/2025/08/15/society/syk: list cut off; look for a 2025-26 per-credit price for Хүрээ.
4. https://huree.edu.mn:443/student/info.php: not read (call budget).

**Other:** the root https://huree.edu.mn was blocked by a permission timeout, so I read index.php instead. Both translation programs share index D023101. 40 web calls used.
