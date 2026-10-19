#!/usr/bin/env python3
"""Build the СУИС (MNUAC, Монгол Улсын Соёл Урлагийн Их Сургууль) dataset for oyutan.mn.

Collected 2026-10-16 within a ~40 web-call budget.

STATE OF THE DATA
- Every official SUIS page (www.mnuac.edu.mn, the school sub-sites, and the admission system
  burtgel.mnuac.edu.mn) is a JavaScript app: the HTML carries only the menu/metadata, so no 2026-2027
  program table, subjects, thresholds, tuition or dates could be read. The homepage fetch was blocked.
- Readable sources: two 2016 admission articles (program codes, skills-test content, 400-point rule),
  a 2016 article naming the Fine Arts and Design school, ikon.mn articles on the 2026 national exam (ЭШ),
  and page titles from the search index (school/department names).
- So programs.json holds only the 2016 list as status "unverified" (NOT imported) and every 2026 fact is a
  gap in sources.json.

HOW TO FILL THE GAP (Mac agent)
1. Open https://burtgel.mnuac.edu.mn/bachelor in a real browser and read the 2026-2027 table.
2. Add one dict per program to PROGRAMS_2026 below (format documented there). The exam block is built with
   build_exam()/apply_exam(), a Python port of seed/exam-tools.mjs (same field names and wording).
3. Fix school names in SCHOOLS (and add schools) from the live site. Mark the sources you used in FILLED.
   Make EVERY СУИС change in this file: it rewrites all 11 JSON files, so edits made in data/*.json are lost.
4. Run: python3 build_data.py && node ../../seed/load-data.mjs suis
   When PROGRAMS_2026 is non-empty the 2016 "unverified" rows and their holding school are dropped automatically.
"""
import json
import os
import re

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
TODAY = "2026-10-18"
UNI = "СУИС"
SKILL = "Ур чадварын шалгалт"
UB = "Улаанбаатар"

# ------------------------------------------------------------------ URLs
HOME = "https://www.mnuac.edu.mn"
HOME_BARE = "https://mnuac.edu.mn/"
BURTGEL = "https://burtgel.mnuac.edu.mn"
BURTGEL_ROOT = "https://burtgel.mnuac.edu.mn/"
BURTGEL_BACHELOR = "https://burtgel.mnuac.edu.mn/bachelor"
BURTGEL_PROGRAMS = "https://burtgel.mnuac.edu.mn/bachelor/programs"
BURTGEL_CALCULATOR = "https://burtgel.mnuac.edu.mn/bachelor/score-calculator"
BURTGEL_SCHOLARSHIP = "https://burtgel.mnuac.edu.mn/bachelor/scholarship"
API_PROGRAMS = "https://burtgel.mnuac.edu.mn/api/v1/program/programs/public?language=mn"
API_THRESHOLDS = "https://burtgel.mnuac.edu.mn/api/v1/exam/public/eesh-thresholds"
API_CONTACTS = "https://burtgel.mnuac.edu.mn/api/v1/cms/contact-info"
API_PAGES = "https://burtgel.mnuac.edu.mn/api/v1/cms/page-contents"
ELSELT_2025 = "https://mnuac.edu.mn/main/383792?content=6034453"
BACHELOR_PAGE = "https://mnuac.edu.mn/main/409093"
MASTER_PAGE = "https://mnuac.edu.mn/main/409095"
DOCTOR_PAGE = "https://mnuac.edu.mn/main/409097"
RULES_PAGE = "https://mnuac.edu.mn/main/485828"
CONTACT_PAGE = "https://mnuac.edu.mn/main/421896"
JOBS_PAGE = "https://mnuac.edu.mn/main/573178"
EN_SITE = "https://en.mnuac.edu.mn/main/391614"
STUDENT_WEB = "http://student.mnuac.edu.mn"
LIBRARY = "http://catalog.mnuac.edu.mn"
ELEARNING = "http://open.mnuac.edu.mn"
SHILEN_DANS = "https://shilendans.gov.mn/organization/37119"

SSSA = "https://sssa.mnuac.edu.mn/"
SSSA_CONTACT = "https://sssa.mnuac.edu.mn/main/490937"
SSSA_DEPT_ACTING = "https://sssa.mnuac.edu.mn/main/426691"
SSSA_DEPT_STUDIES = "https://sssa.mnuac.edu.mn/main/426663"
SFA = "https://sfa.mnuac.edu.mn/"
SCC = "https://scc.mnuac.edu.mn/main/424270"
SCC_DEPT = "https://scc.mnuac.edu.mn/main/424802?content=492953"
SBM = "https://sbm.mnuac.edu.mn/main/424267"
MAFA_DRAWING = "https://mafa.mnuac.edu.mn/main/424545?content=5255818"
FB_SOYOL = "https://www.facebook.com/suis.soyoliinsurguuli/"
DANCE_BROCHURE = ("https://pubhtml5.com/wrnh/vnoh/%D0%A1%D0%BE%D1%91%D0%BB_%D1%83%D1%80%D0%BB%D0%B0%D0%B3%D0%B8%D0%B9%D0%BD_"
                  "%D0%B8%D1%85_%D1%81%D1%83%D1%80%D0%B3%D1%83%D1%83%D0%BB%D1%8C_%D0%91%D2%AF%D0%B6%D0%B3%D0%B8%D0%B9%D0%BD_"
                  "%D1%83%D1%80%D0%BB%D0%B0%D0%B3%D0%B8%D0%B9%D0%BD_%D1%81%D1%83%D1%80%D0%B3%D1%83%D1%83%D0%BB%D1%8C/6")

IKON_2016 = "https://ikon.mn/n/s1m"
NEWSMN_2016 = "https://news.mn/r/738459/"
IKON_AMGALAN = "https://ikon.mn/n/o3c"
IKON_ESH_REG = "https://ikon.mn/n/3lsg"
IKON_ESH_DATES = "https://ikon.mn/n/3lvf"
IKON_ESH_LEVELS = "https://ikon.mn/n/32ud"
IKON_APTITUDE = "https://ikon.mn/n/3off"
IKON_FEE = "https://ikon.mn/n/3pjj"
ZMS_INTERVIEW = "https://www.zms.mn/a/79383"
ZMS_OVERVIEW = "https://www.zms.mn/a/97900"
WIKI_MN = "https://mn.wikipedia.org/wiki/%D0%A1%D0%BE%D1%91%D0%BB_%D0%A3%D1%80%D0%BB%D0%B0%D0%B3%D0%B8%D0%B9%D0%BD_%D0%98%D1%85_%D0%A1%D1%83%D1%80%D0%B3%D1%83%D1%83%D0%BB%D1%8C"
WIKI_MN_CAT = "https://mn.wikipedia.org/wiki/%D0%90%D0%BD%D0%B3%D0%B8%D0%BB%D0%B0%D0%BB:%D0%A1%D0%BE%D1%91%D0%BB_%D0%A3%D1%80%D0%BB%D0%B0%D0%B3%D0%B8%D0%B9%D0%BD_%D0%98%D1%85_%D0%A1%D1%83%D1%80%D0%B3%D1%83%D1%83%D0%BB%D1%8C"
EEC = "https://www.eec.mn"

# ------------------------------------------------------------------ helpers (from EXAMPLE_build_data_ashuuis.py)
TR = {"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "i",
      "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "ө": "u", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
      "ү": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "i",
      "э": "e", "ю": "yu", "я": "ya"}


def slug(s):
    s = "".join(TR.get(c, c) for c in s.lower())
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-")


def uniq(xs):
    return list(dict.fromkeys(xs))


def join_or(xs):
    return xs[0] if len(xs) == 1 else ", ".join(xs[:-1]) + " эсвэл " + xs[-1]


def meta(name, desc, **kw):
    m = {"dataset": name, "university": UNI, "description": desc, "language": "mn", "verified_at": TODAY}
    m.update(kw)
    return m


def save(name, m, records):
    with open(os.path.join(OUT, name + ".json"), "w", encoding="utf-8") as f:
        json.dump({"_meta": m, "records": records}, f, ensure_ascii=False, indent=1)
        f.write("\n")


# ------------------------------------------------------------------ exam helpers (Python port of seed/exam-tools.mjs)
def _num(w):
    """JS-style number text: 1 -> '1', 0.7 -> '0.7'."""
    return str(int(w)) if float(w).is_integer() else str(w)


def _round(x):
    return int(x + 0.5)


def labels(weights, formula_known=True):
    w1 = (weights or {}).get("suuri", 0.7)
    w2 = (weights or {}).get("dagaldah", 0.3)
    if not formula_known or w1 == w2:
        return ["1-р шалгалт", "2-р шалгалт"]
    p1, p2 = _round(w1 / (w1 + w2) * 100), _round(w2 / (w1 + w2) * 100)
    return [f"Суурь ({p1}%)", f"Дагалдах ({p2}%)"]


def group_text(g):
    return "Ур чадварын шалгалт (их сургууль өөрөө авна)" if g == [SKILL] else join_or(g)


def formula_mn(weights, formula_known=True):
    if not formula_known:
        return "онооны томьёо зарлаагүй"
    w1 = (weights or {}).get("suuri", 0.7)
    w2 = (weights or {}).get("dagaldah", 0.3)
    if w1 == w2 == 1:
        return "хоёр шалгалтын онооны нийлбэр"
    if w1 == w2 == 0.5:
        return "хоёр шалгалтын онооны дундаж"
    l1, l2 = labels(weights)
    return f"{_num(w1)} × {l1.split(' ')[0].lower()} + {_num(w2)} × {l2.split(' ')[0].lower()}"


def build_display(group1, group2, threshold1, threshold2, weights, threshold_type, selection,
                  subject_minimums=None, formula_known=True):
    l1, l2 = labels(weights, formula_known)
    if threshold_type == "total":
        s = (f"{l1}: {group_text(group1)}. {l2}: {group_text(group2)}. "
             f"Тооцсон оноо ({formula_mn(weights, formula_known)}) — босго {threshold1}.")
    else:
        s = (f"{l1}: {group_text(group1)} — босго {threshold1}. {l2}: {group_text(group2)}"
             f"{f' — босго {threshold2}' if threshold2 else ''}.")
        if not formula_known:
            s += " Хоёр шалгалтын оноог хэрхэн нийлүүлэхийг (онооны томьёо) сургууль зарлаагүй."
    for subj, mn in (subject_minimums or {}).items():
        s += f" Үүнээс гадна {subj} дор хаяж {mn}."
    if selection == "direct":
        s += " Босгыг хангавал шууд элсэх эрхтэй."
    return s


def build_exam(group1, group2, threshold1, weights, threshold_type, source_url, threshold2=None, selection="list",
               swap_subjects=(), subject_minimums=None, formula_known=True, note=None, confidence="confirmed"):
    if not formula_known and threshold_type == "total":
        raise ValueError("one combined minimum without a formula can't be checked — leave the row unknown")
    dag = uniq(list(group2) + list(swap_subjects))
    w1, w2 = weights["suuri"], weights["dagaldah"]
    formula = "sum" if w1 == w2 == 1 else "average" if w1 == w2 == 0.5 else "weighted"
    return {
        "subjects_to_prepare": uniq(list(group1) + list(group2)),
        "suuri_options": list(group1),
        "dagaldah_options": dag,
        "swap_subjects": list(swap_subjects) if swap_subjects else None,
        "suuri_threshold": threshold1,
        "dagaldah_threshold": None if threshold_type == "total" else threshold2,
        "threshold_type": threshold_type,
        "subject_minimums": subject_minimums,
        "weights": weights,
        "formula_known": formula_known,
        "score_formula": formula if formula_known else None,
        "selection_type": selection,
        "split_confidence": confidence,
        "note_mn": note,
        "source_url": source_url,
        "status": "current",
    }


def apply_exam(record, exam):
    """Write the exam block into a program record and keep derived fields in sync (like applyExam)."""
    record["exam_2026_2027"] = exam
    record["threshold_score"] = exam["suuri_threshold"]
    record["secondary_threshold_score"] = exam["dagaldah_threshold"]
    record["selection_type"] = exam["selection_type"]
    swap = exam.get("swap_subjects") or []
    if exam["split_confidence"] in ("confirmed", "likely"):
        record["required_subjects_display_mn"] = build_display(
            exam["suuri_options"], [d for d in exam["dagaldah_options"] if d not in swap],
            exam["suuri_threshold"], exam["dagaldah_threshold"], exam["weights"], exam["threshold_type"],
            exam["selection_type"], exam["subject_minimums"], exam.get("formula_known") is not False)
    record["aptitude_test_required"] = SKILL in exam["dagaldah_options"]
    record["source_urls"] = uniq((record.get("source_urls") or []) + [exam["source_url"]])
    record["verified_at"] = TODAY
    return record


def tuition_block(per_year=None, per_credit=None, credits=None, src=None, note=None):
    """Spec shapes: yearly fee (official) / per-credit price (estimate per year) / unknown."""
    if per_year:
        return {"per_year": per_year, "currency": "MNT", "is_official": True,
                "estimated_per_year": {"min": per_year, "max": per_year, "typical": per_year, "currency": "MNT",
                                       "basis_mn": "Сургуулийн нийтэлсэн 2026-2027 оны 1 жилийн сургалтын төлбөр.",
                                       "status": "current"},
                "source_url": src, "note_mn": note}
    if per_credit:
        yearly = credits / 4 if credits else 30
        typical = int(round(yearly * per_credit))
        basis = (f"Тооцоо: {credits} кредит ÷ 4 жил × {per_credit:,}₮." if credits
                 else f"Тооцоо: жилд 30 кредит × {per_credit:,}₮ (кредитийн тоо нийтлэгдээгүй).")
        return {"per_credit": per_credit, "per_year": None, "currency": "MNT", "is_official": False,
                "estimated_per_year": {"min": typical, "max": typical, "typical": typical, "currency": "MNT",
                                       "basis_mn": basis, "status": "estimate"},
                "source_url": src, "note_mn": note}
    return {"per_credit": None, "per_year": None, "currency": "MNT", "is_official": False, "estimated_per_year": None,
            "note_mn": note or "СУИС-ийн 2026-2027 оны сургалтын төлбөрийн мэдээлэл олдсонгүй — сургуулиас тодруулна уу."}


# ------------------------------------------------------------------ schools
SCHOOLS = [
    dict(id="suis-teatr", type="constituent", name_mn="Театрын урлагийн сургууль", abbr_mn=None,
         website=SSSA, page=SSSA, location_mn=UB,
         contacts={"contact_page": SSSA_CONTACT},
         departments_mn=[{"name_mn": "Найруулах, жүжиглэх урлагийн тэнхим", "url": SSSA_DEPT_ACTING},
                         {"name_mn": "Ярих урлаг, театр, кино судлалын тэнхим", "url": SSSA_DEPT_STUDIES}],
         notes_mn="1957 оноос театр, кино урлагийн мэргэжилтэн бэлтгэдэг (элсэлтийн системийн танилцуулга).",
         source_urls=[BURTGEL_BACHELOR, SSSA, SSSA_DEPT_ACTING, SSSA_DEPT_STUDIES], status="current"),
    dict(id="suis-dursleh", type="constituent", name_mn="Дүрслэх урлагийн академи", abbr_mn=None,
         website=None, page=BURTGEL_BACHELOR, location_mn=UB, contacts=None,
         notes_mn=("Д.Амгалангийн нэрэмжит Дүрслэх урлагийн академи — 1945 онд байгуулагдсан (элсэлтийн системийн танилцуулга). "
                   "2016 оны мэдээнд 'Дүрслэх, дизайн урлагийн сургууль' нэрээр."),
         source_urls=[BURTGEL_BACHELOR, IKON_AMGALAN, MAFA_DRAWING], status="current"),
    dict(id="suis-buzhig", type="constituent", name_mn="Бүжгийн урлагийн сургууль", abbr_mn=None,
         website=None, page=BURTGEL_BACHELOR, location_mn=UB, contacts=None,
         notes_mn="1944 оноос бүжгийн мэргэжилтэн бэлтгэж эхэлсэн (элсэлтийн системийн танилцуулга).",
         source_urls=[BURTGEL_BACHELOR, DANCE_BROCHURE], status="current"),
    dict(id="suis-soyol", type="constituent", name_mn="Соёлын сургууль", abbr_mn=None,
         website=None, page=FB_SOYOL, location_mn=UB, contacts={"facebook": FB_SOYOL},
         notes_mn="1965 онд байгуулагдсан; соёл судлал, аялал жуулчлал, номын сан, менежмент, музей-соёлын өвийн чиглэлээр (элсэлтийн системийн танилцуулга).",
         source_urls=[BURTGEL_BACHELOR, FB_SOYOL, SCC, SCC_DEPT], status="current"),
    dict(id="suis-kino", type="constituent", name_mn="Кино, телевиз медиа урлагийн сургууль", abbr_mn=None,
         website=None, page=BURTGEL_BACHELOR, location_mn=UB, contacts=None,
         notes_mn="1996 онд байгуулагдсан; сэтгүүлч, кино-телевизийн найруулагч, зураглаач, дууны инженер, аниматор бэлтгэдэг (элсэлтийн системийн танилцуулга).",
         source_urls=[BURTGEL_BACHELOR], status="current"),
    dict(id="suis-khugjim", type="constituent", name_mn="Хөгжмийн урлагийн сургууль", abbr_mn=None,
         website=None, page=BURTGEL_BACHELOR, location_mn=UB, contacts=None,
         notes_mn="Хөгжмийн урлаг, дуулах урлаг, үндэсний язгуур урлаг, хөгжмийн багшийн чиглэлээр (элсэлтийн системийн танилцуулга).",
         source_urls=[BURTGEL_BACHELOR], status="current"),
]
LEGACY_SCHOOL = dict(
    id="suis-2016", type="constituent", name_mn="СУИС — 2016 оны бакалаврын хөтөлбөрийн жагсаалт (шалгагдаагүй)", abbr_mn=None,
    website=None, page=IKON_2016, location_mn=UB, contacts=None,
    notes_mn=("2016-2017 оны элсэлтийн мэдээний хөтөлбөрүүдийг түр байршуулах бүлэг. Хөтөлбөр бүрийн харьяалах сургууль тодорхойгүй тул "
              "2026-2027 оны албан ёсны жагсаалтаар солиход устгана."),
    source_urls=[IKON_2016, NEWSMN_2016], status="unverified")

# ------------------------------------------------------------------ programs: 2026-2027 (EMPTY — fill from the live admission system)
# One dict per program read from https://burtgel.mnuac.edu.mn/bachelor (2026-2027):
#   dict(school="suis-teatr", name="<exact name>", name_en=None, years=4, credits=None, code=None,
#        group1=["Монгол хэл"], t1=400,              # first exam group + its minimum
#        group2=[SKILL], t2=None,                     # second group; SKILL = the university's own test
#        ttype="per_exam",                            # or "total" (then t2 must be None and formula_known True)
#        weights={"suuri": 1, "dagaldah": 1}, formula_known=False,   # real weights + True if a formula is published
#        selection="list",                            # or "direct"
#        conf="confirmed",                            # "likely"; use "unclear" for 3+ exams (describe them in note)
#        subject_minimums=None, swap=[],
#        fee_per_year=None, fee_per_credit=None,
#        note="<skills test: what, when, scale, pass mark; the university's own subject wording>",
#        display=None,                                # only for unclear rows: one plain sentence for students
#        src="https://burtgel.mnuac.edu.mn/bachelor", official_url=None, notes=None)
# Filled 2026-10-18 from the admission system's public API (/api/v1/program/programs/public and
# /api/v1/exam/public/eesh-thresholds), the data behind https://burtgel.mnuac.edu.mn/bachelor/programs.
PROGRAMS_2026 = [
    dict(school="suis-dursleh",
         name="Багш, дүрслэх урлагийн боловсрол",
         name_en=None,
         years=4,
         credits=None,
         code="011419",
         group1=["Математик", "Нийгэм судлал", "Монгол хэл"],
         t1=460,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Математик, Нийгэм судлал эсвэл Монгол хэл (аль нэг хичээлээр) 460-аас багагүй; ур чадварын шалгалт (зохиомж, хар зураг, уран зураг, бие дааж хийсэн ажил) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-khugjim",
         name="Багш, хөгжмийн боловсрол (Хөгжмийн багш)",
         name_en=None,
         years=4,
         credits=None,
         code="011424",
         group1=["Англи хэл", "Монгол хэл", "Нийгэм судлал"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Англи хэл, Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (сонсгол, ой тогтоолт, ярилцлага) — тэнцэх оноо 490; 2-р шат (ур чадвар, хөгжмийн боловсролын мэдэгдэхүүн) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-buzhig",
         name="Багш, бүжгийн боловсрол (Бүжгийн багш)",
         name_en=None,
         years=4,
         credits=None,
         code="011425",
         group1=["Монгол хэл", "Нийгэм судлал"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (бие бялдрын хөгжил, уян хатан чанар, сонсгол, ой тогтоолт, хөгжмийн мэдрэмж, бүжиглэх ур чадвар, үсрэлт, хөдөлгөөний эвсэл, ярилцлага) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-kino",
         name="Зураг авалт (Кино, телевизийн зураглаач)",
         name_en=None,
         years=4,
         credits=None,
         code="021101",
         group1=["Монгол хэл", "Нийгэм судлал", "Физик"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Монгол хэл, Нийгэм судлал эсвэл Физик (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (видео танилцуулга, эсээ бичлэг, ур чадвар) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-kino",
         name="Дуу чимээний технологи (Дууны инженер, дууны найруулагч)",
         name_en=None,
         years=4,
         credits=None,
         code="021102",
         group1=["Англи хэл", "Монгол хэл", "Нийгэм судлал"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Англи хэл, Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (соноршуулга, ярилцлага) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-dursleh",
         name="График дизайн (Консепт Артист, Компьютерийн график дизайн, Фото медиа Артист)",
         name_en=None,
         years=4,
         credits=None,
         code="021105",
         group1=["Англи хэл", "Математик"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Англи хэл эсвэл Математик (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (зохиомж, хар зураг, уран зураг, бие дааж хийсэн ажил) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-kino",
         name="Анимейшн, мультимедиа дизайн",
         name_en=None,
         years=4,
         credits=None,
         code="021106",
         group1=["Англи хэл", "Математик"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Англи хэл эсвэл Математик (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (хар зураг, зохиомж) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-dursleh",
         name="Хувцасны дизайн",
         name_en=None,
         years=4,
         credits=None,
         code="021202",
         group1=["Англи хэл", "Математик"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Англи хэл эсвэл Математик (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (зохиомж, хар зураг, уран зураг, бие дааж хийсэн ажил) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-dursleh",
         name="Уран зураг (Уран зураг; Монгол зураг; Монументаль уран зураг)",
         name_en=None,
         years=4,
         credits=None,
         code="021301",
         group1=["Монгол хэл", "Нийгэм судлал", "Түүх"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Монгол хэл, Нийгэм судлал эсвэл Түүх (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (зохиомж, хар зураг, уран зураг, бие дааж хийсэн ажил) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-teatr",
         name="Тайз, дэлгэцийн зураг (Тайз, дэлгэц, киноны зураач)",
         name_en=None,
         years=4,
         credits=None,
         code="021304",
         group1=["Англи хэл", "Нийгэм судлал", "Түүх"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Англи хэл, Нийгэм судлал эсвэл Түүх (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (хар зураг, уран зураг, бие дааж хийсэн ажил) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-dursleh",
         name="Уран баримал (Уран баримал; керамик урлаг; арьсан урлаг; чимэглэх урлаг; уран дархан; уран сийлбэр)",
         name_en=None,
         years=4,
         credits=None,
         code="021305",
         group1=["Монгол хэл", "Нийгэм судлал", "Түүх"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Монгол хэл, Нийгэм судлал эсвэл Түүх (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (зохиомж, хар зураг, уран зураг, бие дааж хийсэн ажил) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-dursleh",
         name="Зураасан зураг (Зураасан зураг, Номын зураг)",
         name_en=None,
         years=4,
         credits=None,
         code="021310",
         group1=["Монгол хэл", "Нийгэм судлал", "Түүх"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Монгол хэл, Нийгэм судлал эсвэл Түүх (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (зохиомж, хар зураг, уран зураг, бие дааж хийсэн ажил) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-khugjim",
         name="Хөгжмийн урлаг (Зохиомж; MIDI зохиомж хөгжим судлал; удирдах-найрал дуу; найрал хөгжим)",
         name_en=None,
         years=4,
         credits=None,
         code="021501",
         group1=["Англи хэл", "Монгол хэл", "Нийгэм судлал"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Англи хэл, Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (сонсгол, ой тогтоолт, ярилцлага) — тэнцэх оноо 490; 2-р шат (хөгжмийн зохиомж, midi зохиомж, хөгжим судлал, найрал дуу, хөгжим удирдах) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-khugjim",
         name="Хөгжимдөх урлаг (Үндэсний)",
         name_en=None,
         years=4,
         credits=None,
         code="021507",
         group1=["Англи хэл", "Монгол хэл", "Нийгэм судлал"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Англи хэл, Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (сонсгол, ой тогтоолт, ярилцлага) — тэнцэх оноо 490; 2-р шат (ур чадвар, биеий хөгжил) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-khugjim",
         name="Хөгжимдөх урлаг (Сонгодог)",
         name_en=None,
         years=4,
         credits=None,
         code="021507",
         group1=["Англи хэл", "Монгол хэл", "Нийгэм судлал"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Англи хэл, Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (сонсгол, ой тогтоолт, ярилцлага) — тэнцэх оноо 490; 2-р шат (ур чадвар, биеий хөгжил) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-khugjim",
         name="Хөгжимдөх урлаг (Орчин цаг)",
         name_en=None,
         years=4,
         credits=None,
         code="021507",
         group1=["Монгол хэл", "Нийгэм судлал", "Англи хэл"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Монгол хэл, Нийгэм судлал эсвэл Англи хэл (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (сонсгол, ой тогтоолт, ярилцлага) — тэнцэх оноо 490; 2-р шат (ур чадвар, биеий хөгжил) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-khugjim",
         name="Дуулах урлаг (Орчин цагийн)",
         name_en=None,
         years=4,
         credits=None,
         code="021508",
         group1=["Монгол хэл", "Нийгэм судлал"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (сонсгол, ой тогтоолт, ярилцлага) — тэнцэх оноо 490; 2-р шат (ур чадвар, биеийн хөгжил, хоолойн эрүүл ахуй, уран уншлага, хөдөлгөөний эвсэл) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-khugjim",
         name="Дуулах урлаг (Дуурийн)",
         name_en=None,
         years=4,
         credits=None,
         code="021508",
         group1=["Монгол хэл", "Нийгэм судлал"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (сонсгол, ой тогтоолт, ярилцлага) — тэнцэх оноо 490; 2-р шат (ур чадвар, биеийн хөгжил, хоолойн эрүүл ахуй, уран уншлага, хөдөлгөөний эвсэл) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-khugjim",
         name="Дуулах урлаг (Уртын, ардын)",
         name_en=None,
         years=4,
         credits=None,
         code="021508",
         group1=["Монгол хэл", "Нийгэм судлал"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (сонсгол, ой тогтоолт, ярилцлага) — тэнцэх оноо 490; 2-р шат (ур чадвар, биеийн хөгжил, хоолойн эрүүл ахуй, уран уншлага, хөдөлгөөний эвсэл) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-khugjim",
         name="Үндэсний язгуур урлаг (Хөөмэй, тууль)",
         name_en=None,
         years=4,
         credits=None,
         code="021509",
         group1=["Нийгэм судлал", "Түүх"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Нийгэм судлал эсвэл Түүх (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (сонсгол, ой тогтоолт, ярилцлага) — тэнцэх оноо 490; 2-р шат (ур чадвар, биеий хөгжил) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-teatr",
         name="Жүжиглэх урлаг (Кино; драмын)",
         name_en=None,
         years=4,
         credits=None,
         code="021510",
         group1=["Монгол хэл", "Нийгэм судлал"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (хөдөлгөөний эвсэл, дуулах ур чадвар, өөрийн судалбар, сонсгол римт, ёгт үлгэр) — тэнцэх оноо 400; 2-р шат (1-р биеийн өгүүллэг, өгөгдсөн судалбар, анхаарал, ой тогтоолт, ярилцлага) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-teatr",
         name="Найруулах урлаг (Жүжгийн)",
         name_en=None,
         years=4,
         credits=None,
         code="021512-1",
         group1=["Монгол хэл", "Нийгэм судлал"],
         t1=None,
         group2=["Ур чадварын шалгалт"],
         t2=None,
         ttype="per_exam",
         weights={"suuri": 1, "dagaldah": 1},
         formula_known=False,
         selection="list",
         conf="unclear",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ 450+ ба 2 шаттай ур чадварын шалгалт (тус бүр 800 онооноос) — нийт 3 шалгалт тул сайт оноогоор шалгахгүй. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         display="ЭШ: Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) — босго 450. Үүнээс гадна СУИС-ийн 2 шаттай ур чадварын шалгалт: 1-р шат (хөдөлгөөний эвсэл, дуулах ур чадвар, өөрийн судалбар, сонсгол римт, ёгт үлгэр) — тэнцэх оноо 400; 2-р шат (1-р биеийн өгүүллэг, өгөгдсөн судалбар, анхаарал, ой тогтоолт, ярилцлага) — тэнцэх оноо 490. Элсэх оноо = ЭШ ÷ 2 + ур чадвар — дэлгэрэнгүйг сургуулиас тодруулна уу.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-kino",
         name="Найруулах урлаг (Телевизийн; киноны)",
         name_en=None,
         years=4,
         credits=None,
         code="021512-2",
         group1=["Монгол хэл", "Нийгэм судлал"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (видео танилцуулга, эсээ бичлэг, ур чадвар) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-buzhig",
         name="Бүжгийн урлаг (Бүжиглэх урлаг; бүжгийн найруулга)",
         name_en=None,
         years=4,
         credits=None,
         code="021513",
         group1=["Монгол хэл", "Нийгэм судлал"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (бие бялдрын хөгжил, уян хатан чанар, сонсгол, ой тогтоолт, хөгжмийн мэдрэмж, бүжиглэх ур чадвар, үсрэлт, хөдөлгөөний эвсэл, ярилцлага) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-teatr",
         name="Жүжиг, киноны зохиол",
         name_en=None,
         years=4,
         credits=None,
         code="023205",
         group1=["Монгол хэл", "Нийгэм судлал"],
         t1=450,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) 450-аас багагүй; ур чадварын шалгалт (ярилцлага, эсээ бичих) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-teatr",
         name="Урлаг судлал (Урлаг судлаач, Театр, кино)",
         name_en=None,
         years=4,
         credits=None,
         code="028801",
         group1=["Монгол хэл", "Түүх"],
         t1=490,
         group2=["Нийгэм судлал", "Англи хэл"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 0.5},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): Монгол хэл + Нийгэм судлал; Монгол хэл + Англи хэл; Түүх + Нийгэм судлал; Түүх + Англи хэл — хичээл бүр 490-аас багагүй. Ур чадварын шалгалтгүй; элсэх оноо = 2 хичээлийн дундаж (дээд тал нь 800), онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-soyol",
         name="Соёл судлал (Соёлын өв, музей)",
         name_en=None,
         years=4,
         credits=None,
         code="031401",
         group1=["Түүх", "Монгол хэл"],
         t1=490,
         group2=["Нийгэм судлал", "Англи хэл"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 0.5},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): Түүх + Нийгэм судлал; Түүх + Англи хэл; Монгол хэл + Нийгэм судлал; Англи хэл + Монгол хэл — хичээл бүр 490-аас багагүй. Ур чадварын шалгалтгүй; элсэх оноо = 2 хичээлийн дундаж (дээд тал нь 800), онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-kino",
         name="Сэтгүүл зүй (Радио, телевизийн)",
         name_en=None,
         years=4,
         credits=None,
         code="032101",
         group1=["Англи хэл", "Монгол хэл", "Нийгэм судлал"],
         t1=490,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Англи хэл, Монгол хэл эсвэл Нийгэм судлал (аль нэг хичээлээр) 490-аас багагүй; ур чадварын шалгалт (эсээ) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-soyol",
         name="Номын сан судлал",
         name_en=None,
         years=4,
         credits=None,
         code="032201",
         group1=["Нийгэм судлал", "Монгол хэл"],
         t1=450,
         group2=["Түүх", "Англи хэл"],
         t2=450,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 0.5},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): Нийгэм судлал + Түүх; Нийгэм судлал + Англи хэл; Монгол хэл + Түүх; Монгол хэл + Англи хэл — хичээл бүр 450-аас багагүй. Ур чадварын шалгалтгүй; элсэх оноо = 2 хичээлийн дундаж (дээд тал нь 800), онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-soyol",
         name="Менежмент (Соёл урлагийн)",
         name_en=None,
         years=4,
         credits=None,
         code="041303",
         group1=["Математик"],
         t1=490,
         group2=["Нийгэм судлал", "Англи хэл"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 0.5},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): Математик + Нийгэм судлал; Математик + Англи хэл — хичээл бүр 490-аас багагүй. Ур чадварын шалгалтгүй; элсэх оноо = 2 хичээлийн дундаж (дээд тал нь 800), онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-soyol",
         name="Менежмент (Шоу, бизнесийн)",
         name_en=None,
         years=4,
         credits=None,
         code="041303",
         group1=["Математик"],
         t1=490,
         group2=["Нийгэм судлал", "Англи хэл"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 0.5},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): Математик + Нийгэм судлал; Математик + Англи хэл — хичээл бүр 490-аас багагүй. Ур чадварын шалгалтгүй; элсэх оноо = 2 хичээлийн дундаж (дээд тал нь 800), онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-soyol",
         name="Маркетинг (Дижитал маркетинг)",
         name_en=None,
         years=4,
         credits=None,
         code="041401",
         group1=["Математик"],
         t1=490,
         group2=["Нийгэм судлал", "Англи хэл"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 0.5},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): Математик + Нийгэм судлал; Математик + Англи хэл — хичээл бүр 490-аас багагүй. Ур чадварын шалгалтгүй; элсэх оноо = 2 хичээлийн дундаж (дээд тал нь 800), онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-soyol",
         name="Маркетинг (Зар суртачлагааны)",
         name_en=None,
         years=4,
         credits=None,
         code="041401",
         group1=["Математик"],
         t1=490,
         group2=["Нийгэм судлал", "Англи хэл"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 0.5},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): Математик + Нийгэм судлал; Математик + Англи хэл — хичээл бүр 490-аас багагүй. Ур чадварын шалгалтгүй; элсэх оноо = 2 хичээлийн дундаж (дээд тал нь 800), онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-dursleh",
         name="Түүх соёлын дурсгалт зүйлийн сэргээн засварлалт",
         name_en=None,
         years=4,
         credits=None,
         code="028802",
         group1=["Монгол хэл", "Нийгэм судлал", "Түүх"],
         t1=490,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Монгол хэл, Нийгэм судлал эсвэл Түүх (аль нэг хичээлээр) 490-аас багагүй; ур чадварын шалгалт (хар зураг, уран зураг, ярилцлага) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
    dict(school="suis-soyol",
         name="Түүх, соёлын аялал жуулчлал",
         name_en=None,
         years=4,
         credits=None,
         code="101502",
         group1=["Англи хэл", "Түүх"],
         t1=490,
         group2=["Ур чадварын шалгалт"],
         t2=490,
         ttype="per_exam",
         weights={"suuri": 0.5, "dagaldah": 1},
         formula_known=True,
         selection="list",
         conf="confirmed",
         subject_minimums=None,
         swap=[],
         fee_per_year=None,
         fee_per_credit=None,
         note="СУИС-ийн элсэлтийн систем (2026): ЭШ — Англи хэл эсвэл Түүх (аль нэг хичээлээр) 490-аас багагүй; ур чадварын шалгалт (ярилцлага, эсээ бичих) 800 онооноос, тэнцэх оноо 490. Элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); онооны дарааллаар жагсааж мэргэжил сонгуулна. Элсэлтийн системд Нийгэм судлалыг \"Нийгмийн тухай мэдлэг\", Түүхийг \"Монгол улсын түүх\" гэж бичсэн.",
         src="https://burtgel.mnuac.edu.mn/bachelor/programs",
         official_url="https://burtgel.mnuac.edu.mn/bachelor/programs",
         notes=None),
]

# ------------------------------------------------------------------ sources you filled (Step 2)
# This script rewrites every СУИС JSON file, so mark used sources HERE, not in data/sources.json:
#   FILLED = {"gap-burtgel-bachelor": {"filled_at": "2026-10-20", "filled_note": "one line: what was read"}}
# A source listed here is written with gap: false plus these fields.
FILLED = {
    "gap-burtgel-bachelor": {"filled_at": "2026-10-18", "filled_note": (
        "Headless Chrome + элсэлтийн системийн нээлттэй API (program/programs/public, exam/public/eesh-thresholds): 2026 оны "
        "35 бакалаврын мэргэжлийн ЭШ-ын хичээл, босго, ур чадварын шалгалтын тэнцэх оноо, хугацаа.")},
    "gap-burtgel-root": {"filled_at": "2026-10-18", "filled_note": (
        "Онооны тооцоолуурын томьёо (ЭШ ÷ 2 + ур чадвар; зөвхөн ЭШ бол дундаж), бүртгэл 2026-05-25-нд эхэлсэн, утас 7766-0011, "
        "burtgel@mnuac.edu.mn, тэтгэлгийн хуудас.")},
    "gap-bachelor-programs": {"filled_at": "2026-10-18", "filled_note": "Бүрэлдэхүүн сургууль, хөтөлбөрийн жагсаалтыг элсэлтийн системээс авав."},
}

# ------------------------------------------------------------------ programs: 2016-2017 list (reference only, status "unverified")
# (code, name_mn, name_en, sub-tracks (2016), skills-test content (2016), likely school)
# name_mn is a plain Mongolian rendering of the 2016 article (except 'Зураасан зураг', which matches an official page title).
LEGACY_2016 = [
    ("011404", "Багш, урлагийн боловсрол (хөгжим, бүжиг)", "Teacher, arts education (music, dance)", "хөгжим, бүжиг",
     "Хөгжмийн чиглэл: төгөлдөр хуураар 2 бүтээл, хэмнэл, сонсгол ба ой тогтоолт, дуулах, урлагийн ярилцлага, бие бялдар. "
     "Бүжгийн чиглэл: бие бялдар, уян хатан байдал, хөгжмийн мэдрэмж, бүжгийн авьяас, үсрэлт, хөдөлгөөний зохицуулалт", None),
    ("021101", "Кино зураглал", "Cinematography", None, "ярилцлага, оюун ухааны тест, өөрийн бүтээл", None),
    ("021102", "Дууны технологи", "Sound technology", None, "сонсгол, ярилцлага, оюун ухааны тест", None),
    ("021201", "Хувцасны дизайн", "Clothing design", None, "найруулга зураг, хар цагаан зураг, будгийн зураг, өөрийн бүтээл",
     "Дүрслэх, дизайн урлагийн сургууль"),
    ("021202", "График дизайн", "Graphic design", "компьютер график, медиа анимэйшн, хэвлэлийн дизайн", None,
     "Дүрслэх, дизайн урлагийн сургууль"),
    ("021301", "Уран зураг", "Painting", "уран зураг, монгол зураг, монументаль зураг, тайз дэлгэцийн зураг", None,
     "Дүрслэх, дизайн урлагийн сургууль"),
    ("021302", "Уран баримал", "Sculpture", "керамик, арьсан урлал, чимэглэх урлаг, гар урлал, сийлбэр", None,
     "Дүрслэх, дизайн урлагийн сургууль"),
    ("021303", "Зураасан зураг", "Drawing", None, None, "Дүрслэх, дизайн урлагийн сургууль"),
    ("021304", "Түүх, соёлын дурсгалт зүйлийн сэргээн засварлалт", "Restoration of historical and cultural monuments", None, None,
     "Дүрслэх, дизайн урлагийн сургууль"),
    ("021501", "Хөгжмийн урлаг", "Music arts", "хөгжмийн зохиолч, компьютерийн хөгжим, хөгжим судлал, удирдаач",
     "2–3 хоолойн диктант, хөгжмийн онол ба бодлого, төгөлдөр хуур, нот бичих программаар өөрийн зохиол, найрал хөгжим (2 бүтээл) ба "
     "найрал дуу (2 бүтээл) удирдах, дуулах, ярилцлага, урлагийн сэдэвт 250–300 үгийн эссэ", None),
    ("021502", "Хөгжим тоглох урлаг", "Instrumental music", "сонгодог, үндэсний, орчин үеийн",
     "хөгжмийн зэмсгээр 2 бүтээл, хэмнэл, сонсгол ба ой тогтоолт, дуулах, ярилцлага, бие бялдар", None),
    ("021503", "Дуулах урлаг", "Vocal arts", "дуурь, ардын, орчин үеийн",
     "2–3 дуу, хэмнэл, сонсгол ба ой тогтоолт, хөгжмийн зэмсэг, бие бялдар (хоолойн хүрээ, амны хөндийн эрүүл ахуй), хөдөлгөөн ба бүжиг", None),
    ("021504", "Үндэсний ардын урлаг (хөөмий, тууль)", "National folk art (khöömei, epic)", "хөөмий, тууль",
     "түргэн үгийн дасгал, амьсгалын багтаамжийн дасгал", None),
    ("021505", "Театрын урлаг (жүжигчин)", "Theatre arts (acting)", "кино, драмын, хөгжимт театрын жүжигчин",
     "өөрийн бэлтгэсэн этюд, хөдөлгөөн ба бүжиг, дуулах, сонсгол ба хэмнэл, уран уншлага, ардын үлгэр ярих, монолог, өгөгдсөн этюд, "
     "ярилцлага, оюун ухааны тест", "Театрын урлагийн сургууль"),
    ("021516", "Найруулах урлаг", "Directing", "кино, радио, телевиз, театрын найруулагч",
     "өөрийн бэлтгэсэн этюд, хөдөлгөөн ба бүжиг, дуулах, сонсгол ба хэмнэл, уран уншлага, эссэ, ярилцлага, оюун ухааны тест",
     "Театрын урлагийн сургууль"),
    ("021507", "Бүжгийн урлаг", "Dance arts", "бүжиг дэглэлт, бүжиглэх урлаг",
     "бие бялдар ба уян хатан байдал, хөгжмийн мэдрэмж, бүжгийн авьяас, үсрэлт ба хөдөлгөөний зохицуулалт", "Бүжгийн урлагийн сургууль"),
    ("021801", "Урлаг судлал", "Art studies", "театр, кино, дүрслэх урлаг судлал", "эссэ, ярилцлага, оюун ухааны тест", None),
    ("023203", "Утга зохиол судлал (кино, жүжгийн зохиол)", "Literature studies (film and drama scripts)", "кино, жүжгийн зохиол", None, None),
    ("032101", "Сэтгүүл зүй", "Journalism", None, "ярилцлага, эссэ, оюун ухааны тест", None),
]

SKILL_2016_MN = ("2016-2017 оны элсэлтийн мэдээгээр ур чадварын шалгалттай хөтөлбөрт Элсэлтийн ерөнхий шалгалтын аль нэг хичээлээс 400+ оноо, "
                 "мөн СУИС-ийн ур чадварын шалгалт (800 оноо) шаарддаг байсан; хоёр оноог хэрхэн нийлүүлэхийг заагаагүй.")


def base_program(pid, sid, name, name_en, official_url, code=None, years=None, credits=None):
    return {
        "id": pid, "name_mn": name, "name_en": name_en, "school_id": sid, "degree": "Бакалавр", "study_form": "Өдөр",
        "credits": credits, "duration_years": years, "code": code, "official_url": official_url,
        "selection_type": None, "selection_type_mn": None,
        "priority": {"is_priority_field": False, "is_in_demand_field": False, "note_mn": None},
        "aptitude_test_required": None, "required_subjects_display_mn": None,
        "threshold_score": None, "secondary_threshold_score": None, "exam_2026_2027": None,
        "tuition_2026_2027": tuition_block(), "campus_mn": UB, "joint_program": None, "notes_mn": None,
        "source_urls": [], "verified_at": TODAY, "status": "current",
    }


def program_2026(p):
    pid = f"suis-{p['school'].split('-', 1)[1]}-{slug(p['name'])}"
    rec = base_program(pid, p["school"], p["name"], p.get("name_en"), p.get("official_url") or p["src"],
                       p.get("code"), p.get("years"), p.get("credits"))
    conf = p.get("conf", "confirmed")
    if conf in ("confirmed", "likely"):
        exam = build_exam(p["group1"], p["group2"], p.get("t1"), p.get("weights", {"suuri": 1, "dagaldah": 1}),
                          p.get("ttype", "per_exam"), p["src"], threshold2=p.get("t2"), selection=p.get("selection", "list"),
                          swap_subjects=p.get("swap", []), subject_minimums=p.get("subject_minimums"),
                          formula_known=p.get("formula_known", False), note=p.get("note"), confidence=conf)
    else:  # three or more exams / unreadable split: describe in the note, thresholds stay null
        exam = build_exam(p.get("group1", []), p.get("group2", []), None, {"suuri": 1, "dagaldah": 1}, None, p["src"],
                          selection=p.get("selection"), formula_known=False, note=p.get("note"), confidence=conf)
        rec["required_subjects_display_mn"] = p.get("display") or (
            "Энэ мэргэжилд хэд хэдэн шалгалт шаарддаг — дэлгэрэнгүйг сургуулиас тодруулна уу (burtgel.mnuac.edu.mn).")
    apply_exam(rec, exam)
    rec["selection_type_mn"] = {"list": "Онооны эрэмбээр (жагсаалтаар) сонгоно", "direct": "Шууд сонгоно"}.get(rec["selection_type"])
    rec["tuition_2026_2027"] = tuition_block(p.get("fee_per_year"), p.get("fee_per_credit"), p.get("credits"), p["src"])
    rec["notes_mn"] = p.get("notes")
    rec["status"] = "current"
    return rec


def program_2016(code, name, name_en, tracks, content, likely_school):
    rec = base_program(f"suis-2016-{slug(name)}", LEGACY_SCHOOL["id"], name, name_en, BURTGEL_BACHELOR, code=code)
    content_mn = (f"Ур чадварын шалгалтын агуулга (2016 оны, хуучирсан байж болзошгүй): {content}." if content
                  else "Ур чадварын шалгалтын агуулгыг 2016 оны мэдээнд заагаагүй.")
    rec["exam_2026_2027"] = {
        "subjects_to_prepare": [SKILL],
        "suuri_options": [],
        "dagaldah_options": [SKILL],
        "swap_subjects": None,
        "suuri_threshold": None,
        "dagaldah_threshold": None,
        "threshold_type": None,
        "subject_minimums": None,
        "weights": {"suuri": 1, "dagaldah": 1},
        "formula_known": False,
        "score_formula": None,
        "selection_type": None,
        "split_confidence": "unclear",
        "page_thresholds": [{"year": 2016, "academic_year": "2016-2017",
                             "label_mn": "Элсэлтийн ерөнхий шалгалтын аль нэг хичээлийн доод оноо; ур чадварын шалгалтын дээд оноо",
                             "suuri_min_any_subject": 400, "skills_exam_max": 800, "source_url": IKON_2016}],
        "note_mn": f"{SKILL_2016_MN} {content_mn} 2026-2027 оны шаардлага тодорхойгүй.",
        "source_url": IKON_2016,
        "status": "stale",
    }
    rec["aptitude_test_required"] = True
    rec["required_subjects_display_mn"] = (
        "2026-2027 оны шалгалтын шаардлага тодорхойгүй. 2016 онд Элсэлтийн ерөнхий шалгалтын аль нэг хичээлээс 400-аас дээш оноо, "
        "мөн СУИС-ийн ур чадварын шалгалт өгдөг байсан. Одоогийн шаардлагыг burtgel.mnuac.edu.mn-ээс шалгана уу.")
    notes = [f"2016-2017 оны элсэлтийн мэдээнээс (индекс {code}); 2026 онд элсэлт авсан эсэх, албан ёсны нэр нь баталгаажаагүй."]
    if tracks:
        notes.append(f"2016 оны чиглэлүүд: {tracks}.")
    if likely_school:
        notes.append(f"Харьяалах сургууль тодорхойгүй ({likely_school} байж магадгүй).")
    if code == "021303":
        notes.append("Албан ёсны сайтад 'Зураасан зураг хөтөлбөрийн суралцахуйн үр дүн' хуудас бий (mafa.mnuac.edu.mn).")
        rec["source_urls"] = [MAFA_DRAWING]
    rec["notes_mn"] = " ".join(notes)
    rec["source_urls"] = uniq([IKON_2016, NEWSMN_2016] + rec["source_urls"])
    rec["status"] = "unverified"
    return rec


def main():
    use_legacy = not PROGRAMS_2026
    programs = [program_2026(p) for p in PROGRAMS_2026]
    if use_legacy:
        programs += [program_2016(*row) for row in LEGACY_2016]
    schools = [dict(s) for s in SCHOOLS] + ([dict(LEGACY_SCHOOL)] if use_legacy else [])
    for s in schools:
        s.setdefault("contacts", None)
        s.setdefault("departments_mn", None)
        s["verified_at"] = TODAY

    conf_counts = {}
    for p in programs:
        c = p["exam_2026_2027"]["split_confidence"]
        conf_counts[c] = conf_counts.get(c, 0) + 1

    save("programs", meta(
        "programs",
        ("СУИС-ийн бакалаврын өдрийн мэргэжлүүд (2026-2027): элсэлтийн системийн 35 мэргэжил, ЭШ-ын хичээл, босго, ур чадварын шалгалт."
         if PROGRAMS_2026 else
         "СУИС-ийн бакалаврын өдрийн хөтөлбөрүүд. 2026-2027 оны жагсаалт уншигдаагүй тул одоогоор зөвхөн 2016-2017 оны элсэлтийн мэдээний "
         "19 хөтөлбөрийг 'unverified' (импортлохгүй) төлөвтэй жишиг болгон оруулав."),
        sources=[BURTGEL_PROGRAMS, API_PROGRAMS, API_THRESHOLDS, BURTGEL_CALCULATOR] if PROGRAMS_2026 else [BURTGEL_BACHELOR, IKON_2016, NEWSMN_2016, MAFA_DRAWING],
        counts={"total": len(programs), "imported": sum(p["status"] != "unverified" for p in programs),
                "by_split_confidence": conf_counts},
        scoring_mn=("2026-2027: ур чадварын шалгалттай мэргэжилд элсэх оноо = ЭШ ÷ 2 + ур чадвар (дээд тал нь 1200); зөвхөн ЭШ "
                    "шаарддаг 7 мэргэжилд 2 хичээлийн дундаж (800). ЭШ-ын хичээл бүр өөрийн босготой (450, 460, 490), ур чадварын "
                    "шалгалтын тэнцэх оноо 490 (жүжиглэх, найруулахын 1-р шат 400); 11 мэргэжилд 2 шаттай ур чадварын шалгалт. "
                    "2016-2017: ур чадварын шалгалттай 19 хөтөлбөрт ЭЕШ-ын аль нэг хичээлээс 400+, ур чадварын шалгалт 800 оноогоор; "
                    "ур чадварын шалгалтгүй 6 хөтөлбөрт заасан 2 хичээлийн аль нэгээс 400+. Хоёр оноог хэрхэн нийлүүлэхийг заагаагүй."),
        fields_mn={"exam_2026_2027.page_thresholds": "2016 оны дүрмийн утгууд (оноор нь).",
                   "code": "2016 оны мэргэжлийн индекс.",
                   "status": "unverified = 2016 оны жагсаалт, импортлохгүй; 2026-2027 оны жагсаалтаар солино."}),
        programs)

    # ------------------------------------------------------------------ university
    university = [{
        "id": "suis",
        "name_mn": "Монгол Улсын Соёл Урлагийн Их Сургууль",
        "short_name_mn": "СУИС",
        "name_en": "Mongolian National University of Arts and Culture",
        "short_name_en": "MNUAC",
        "db_slug": "suis",
        "website": HOME,
        "admission_website": BURTGEL,
        "admission_system_url": BURTGEL_BACHELOR,
        "overview_mn": ("Монгол Улсын Соёл Урлагийн Их Сургууль (СУИС) нь Улаанбаатар хотод байрладаг, соёл, урлагийн чиглэлээр мэргэжилтэн "
                        "бэлтгэдэг их сургууль юм. Театр, бүжиг, дүрслэх урлаг, дизайн, кино зэрэг чиглэлээр бакалавр, магистр, докторын "
                        "түвшинд сургалт явуулдаг. Театрын урлагийн сургууль зэрэг хэд хэдэн бүрэлдэхүүн сургуультай. Урлагийн ихэнх "
                        "мэргэжилд элсэгчид их сургуулийн өөрийн авдаг ур чадварын шалгалт өгдөг. 2026 онд Бүжгийн, Кино-телевиз-медиа, Соёлын, "
                        "Театрын, Хөгжмийн урлагийн сургууль болон Дүрслэх урлагийн академи гэсэн 6 сургуулийн 35 бакалаврын мэргэжлээр "
                        "элсэлт авсан. Элсэлтийн бүртгэлийг burtgel.mnuac.edu.mn цахим системээр явуулдаг."),
        "history": [
            {"year": 2016, "event_mn": "Засгийн газрын 2-р сарын 8-ны хуралдаанаар Дүрслэх, дизайн урлагийн сургуулийг Ардын зураач "
                                       "Д.Амгалангийн нэрэмжит болгосон.", "source_url": IKON_AMGALAN, "status": "current"},
            {"year": 2016, "event_mn": "2016-2017 оны хичээлийн жилд 25 бакалаврын хөтөлбөрөөр элсэлт авч, 19-д нь ур чадварын шалгалт авсан.",
             "source_url": IKON_2016, "status": "current"},
        ],
        "history_source_urls": [IKON_AMGALAN, IKON_2016],
        "history_note_mn": "Байгуулагдсан он болон дэлгэрэнгүй түүхийг их сургуулийн албан ёсны сайтаас шалгана уу.",
        "stats": [
            {"label_mn": "Бакалаврын хөтөлбөр (2016-2017 оны элсэлт)", "value": "25 (19-д нь ур чадварын шалгалттай)",
             "source_url": IKON_2016, "status": "stale"},
        ],
        "rankings": None,
        "rankings_note_mn": "Олон улсын чансааг баталгаажуулаагүй.",
        "contacts": {
            "address_mn": None,
            "address_admission_system_mn": "Элсэлтийн системийн хөл хэсэгт: Улаанбаатар хот, Баянгол дүүрэг (бүтэн хаяг бичээгүй).",
            "phones": ["7766-0011"],
            "emails": {"admission": "burtgel@mnuac.edu.mn"},
            "contact_page": CONTACT_PAGE,
            "admission_system": BURTGEL,
            "phones_2016_mn": "2016 оны элсэлтийн мэдээнд: 11-326129, 11-318774, 9418-4844, 9818-4855 (одоо ажиллаж буй эсэхийг шалгана уу).",
            "note_mn": "Хаяг, утас, цахим шууданг их сургуулийн 'Холбоо барих' хуудаснаас шалгана уу.",
        },
        "location_short_mn": UB,
        "social": {"facebook": None, "facebook_soyoliin_surguuli": FB_SOYOL},
        "student_services": [
            {"name_mn": "Элсэлтийн цахим систем (бүртгэл)", "url": BURTGEL},
            {"name_mn": "Оюутны веб", "url": STUDENT_WEB},
            {"name_mn": "Номын сангийн каталог", "url": LIBRARY},
            {"name_mn": "Цахим сургалт", "url": ELEARNING},
            {"name_mn": "Дүрэм журам", "url": RULES_PAGE},
        ],
        "sidebar_suggestion": {
            "tuition_text_mn": "Тодорхойгүй — 2026-2027 оны сургалтын төлбөрийг сургуулиас тодруулна уу",
            "tuition_number": None,
            "tuition_number_note_mn": "СУИС-ийн 2026-2027 оны сургалтын төлбөр нийтлэгдсэн эх сурвалж олдсонгүй.",
            "dorm_flag": "Тодорхойгүй",
            "scholarship_flag": "Боломжтой",
            "dorm_howto_mn": ("СУИС-ийн оюутны байрны мэдээлэл (байр бий эсэх, үнэ, хэрхэн бүртгүүлэх) олдсонгүй. Элсэлтийн систем "
                              "(burtgel.mnuac.edu.mn), Оюутны веб (student.mnuac.edu.mn) болон их сургуулийн сайтын 'Холбоо барих' хэсгээс "
                              "(mnuac.edu.mn) тодруулна уу. Орон нутгаас ирэх бол ур чадварын шалгалт, элсэлтийн өдрүүдэд Улаанбаатарт "
                              "байх шаардлага гарч болохыг анхаарна уу."),
            "phones": ["7766-0011"],
            "email": "burtgel@mnuac.edu.mn",
            "location_mn": UB,
            "website": HOME,
        },
        "source_urls": [BURTGEL_ROOT, API_CONTACTS, API_PAGES, BACHELOR_PAGE, MASTER_PAGE, DOCTOR_PAGE, SSSA, IKON_2016, IKON_AMGALAN],
        "verified_at": TODAY,
        "status": "partial",
    }]
    save("university", meta("university", "СУИС-ийн ерөнхий мэдээлэл: танилцуулга, түүх, холбоо барих, оюутны үйлчилгээ, sidebar-ийн утгууд."),
         university)

    # ------------------------------------------------------------------ admission
    admission = [
        {
            "id": "suis-bachelor-2026",
            "title_mn": "Бакалаврын элсэлт (2026-2027)",
            "academic_year": "2026-2027",
            "system_url": BURTGEL,
            "bachelor_url": BURTGEL_BACHELOR,
            "registration": {"start": "2026-05-25", "end": None,
                             "where_mn": "burtgel.mnuac.edu.mn → бакалаврын элсэлт"},
            "registration_note_mn": "Элсэлтийн бүртгэл 2026 оны 5-р сарын 25-наас эхэлсэн (элсэлтийн систем); дуусах огноог нийтлээгүй.",
            "registration_fee": None,
            "registration_fee_note_mn": "Бүртгэлийн хураамжийн мэдээлэл олдсонгүй.",
            "steps": [
                {"step": 1, "title_mn": "Элсэлтийн шалгалтад (ЭШ) бүртгүүлэх",
                 "detail_mn": "Боловсролын үнэлгээний төвийн Элсэлтийн шалгалтад бүртгүүлнэ. 2026 онд бүртгэл 3-р сарын 4 – 5-р сарын 15-нд "
                              "явагдсан: 12-р ангийнхан сургуулийнхаа цахим системээр, өмнөх онуудын төгсөгчид 3-р сарын 6-наас."},
                {"step": 2, "title_mn": "Элсэлтийн шалгалт өгөх",
                 "detail_mn": "2026 онд 6-р сарын 25–28-нд болсон. СУИС-ийн мэргэжил бүрт ямар хичээл, түвшин шаардахыг элсэлтийн системээс шалгана уу."},
                {"step": 3, "title_mn": "СУИС-ийн элсэлтийн системд бүртгүүлэх",
                 "detail_mn": "burtgel.mnuac.edu.mn-д бүртгүүлж мэргэжлээ сонгоно."},
                {"step": 4, "title_mn": "Ур чадварын шалгалт өгөх",
                 "detail_mn": "Урлагийн ихэнх мэргэжилд СУИС өөрөө ур чадварын шалгалт авдаг. 2016 онд үүнийг зөвхөн Улаанбаатарт, 7-р сарын "
                              "эхээр авч, 800 оноогоор дүгнэж байсан. 2026-2027 оны хуваарь, агуулгыг элсэлтийн системээс шалгана уу."},
            ],
            "selection_rules": {
                "current_mn": ("Элсэх оноогоор жагсааж, хамгийн өндөр оноотой нь түрүүлж мэргэжлээ сонгоно (онооны тооцоолуур). "
                               "ЭШ-ын хичээл бүр өөрийн босготой; ур чадварын шалгалтын тэнцэх оноо 490 (жүжиглэх, найруулахын 1-р шат 400)."),
                "reference_2016_mn": ("2016-2017: ур чадварын шалгалттай 19 хөтөлбөрт Элсэлтийн ерөнхий шалгалтын аль нэг хичээлээс 400+ оноо, "
                                      "ур чадварын шалгалт 800 оноогоор; бусад 6 хөтөлбөрт заасан 2 хичээлийн аль нэгээс 400+ оноо."),
            },
            "score_formula_mn": ("Ур чадварын шалгалттай мэргэжилд элсэх оноо = ЭШ-ын оноо ÷ 2 + ур чадварын шалгалтын оноо (дээд тал нь 1200); "
                                 "зөвхөн ЭШ шаарддаг мэргэжилд элсэх оноо = заасан 2 хичээлийн дундаж (дээд тал нь 800)."),
            "skills_test": {
                "name_mn": "Ур чадварын шалгалт",
                "detail_mn": ("Их сургууль өөрөө авдаг мэргэжлийн шалгалт. 2016 онд жишээ нь жүжигчинд монолог, этюд, дуулах, хөдөлгөөн; бүжигт "
                              "уян хатан байдал, хөгжмийн мэдрэмж, үсрэлт; хөгжим тоглоход хөгжмийн зэмсгээр 2 бүтээл, хэмнэл, сонсгол; "
                              "хувцасны дизайнд хар цагаан зураг, будгийн зураг, өөрийн бүтээл; сэтгүүл зүйд ярилцлага, эссэ шалгаж байсан."),
                "scale_2016_mn": "800 оноо",
                "scale_2026_mn": "800 оноо; тэнцэх оноо 490 (жүжиглэх, найруулах урлагийн 1-р шат 400). Хөгжим, дуулах, хөгжмийн багш, "
                                 "жүжиглэх, найруулах (жүжгийн) мэргэжилд 2 шаттай.",
                "date_mn": None,
                "date_note_mn": "2026 оны огноог нийтлэгдсэн хэлбэрээр олсонгүй (2016 онд 7-р сарын 5–7).",
            },
            "regulation": {"title_mn": "Дүрэм журам (элсэлтийн журмыг эндээс хайна)", "url": RULES_PAGE, "readable": False},
            "source_urls": [BURTGEL_ROOT, BURTGEL_BACHELOR, BURTGEL_CALCULATOR, API_PROGRAMS, API_PAGES, IKON_ESH_REG, IKON_ESH_DATES, IKON_2016],
            "verified_at": TODAY,
            "status": "current",
        },
        {
            "id": "suis-esh-2026",
            "title_mn": "Элсэлтийн шалгалт (ЭШ) 2026 — бүх элсэгчид",
            "academic_year": "2026-2027",
            "facts_mn": [
                "2026 оноос эхлэн I, II, III түвшний шалгалтуудаас сонгож Элсэлтийн шалгалт өгдөг болсон (Боловсролын үнэлгээний төв).",
                "Элсэлтийн шалгалт өгөх бүх шалгуулагч монгол хэл бичиг, математикийн нэгдмэл агуулгатай Суралцах чадварын шалгалт өгдөг болсон.",
                "2026 оны бүртгэл: 3-р сарын 4 – 5-р сарын 15 (Улаанбаатарын цагаар 18:00 хүртэл).",
                "2026 оны шалгалт: 6-р сарын 25–28.",
            ],
            "source_urls": [IKON_ESH_LEVELS, IKON_APTITUDE, IKON_ESH_REG, IKON_ESH_DATES],
            "verified_at": TODAY,
            "status": "reference",
        },
        {
            "id": "suis-bachelor-2016",
            "title_mn": "2016-2017 оны элсэлт (хуучирсан жишиг)",
            "academic_year": "2016-2017",
            "facts_mn": [
                "25 бакалаврын хөтөлбөрөөр элсэлт авч, 19-д нь ур чадварын шалгалт авсан.",
                "Ур чадварын шалгалттай хөтөлбөрт Элсэлтийн ерөнхий шалгалтын аль нэг хичээлээс 400+ оноо шаардсан; ур чадварын шалгалт 800 оноотой.",
                "Ур чадварын шалгалтгүй 6 хөтөлбөрт заасан 2 хичээлийн аль нэгээс 400+ оноо шаардсан.",
                "Ур чадварын шалгалтыг зөвхөн Улаанбаатарт авсан; орон нутгийн элсэгчид цахимаар бүртгүүлээд шалгалтын өдөр ирсэн.",
                "Огноо (2016): цахим бүртгэл 7-р сарын 4 (ур чадвартай) / 7-р сарын 7 (бусад) хүртэл, ур чадварын шалгалт 7-р сарын 5–7, "
                "эцсийн дүн 7-р сарын 7, суралцах эрхийн бичиг 7-р сарын 8–10.",
            ],
            "source_urls": [IKON_2016, NEWSMN_2016],
            "verified_at": TODAY,
            "status": "stale",
        },
    ]
    save("admission_2026", meta("admission_2026", "СУИС-ийн элсэлтийн үйл явц: 2026-2027 оны мэдэгдэж буй алхам, ЭШ-ын ерөнхий мэдээлэл, 2016 оны жишиг."),
         admission)

    dates = [
        {"id": "suis-date-esh-reg-2026", "event_mn": "2026 оны жишиг: Элсэлтийн шалгалтын (ЭШ) бүртгэл (Боловсролын үнэлгээний төв; "
                                                     "12-р анги — сургуулийн цахим системээр, өмнөх онуудын төгсөгчид 3-р сарын 6-наас)",
         "start": "2026-03-04", "end": "2026-05-15", "source_url": IKON_ESH_REG, "status": "reference"},
        {"id": "suis-date-esh-2026", "event_mn": "2026 оны жишиг: Элсэлтийн шалгалт (ЭШ)",
         "start": "2026-06-25", "end": "2026-06-28", "source_url": IKON_ESH_DATES, "status": "reference"},
        {"id": "suis-date-suis-reg-2026", "event_mn": "СУИС-ийн бакалаврын элсэлтийн бүртгэл эхэлсэн (2026)",
         "start": "2026-05-25", "end": None, "source_url": API_PAGES, "status": "current"},
        {"id": "suis-date-scholarship-2026", "event_mn": "Шинэ элсэгчийн тэтгэлгийн хүсэлт гаргах (2026)",
         "start": "2026-07-03", "end": "2026-08-27", "source_url": BURTGEL_SCHOLARSHIP, "status": "current"},
    ]
    save("admission_dates", meta("admission_dates", "СУИС-ийн хуудсанд харуулах огноонууд. 'жишиг' = 2026 оны огноо (2027 оных зарлагдаагүй).",
                                 sources=[IKON_ESH_REG, IKON_ESH_DATES, BURTGEL_BACHELOR]), dates)

    # ------------------------------------------------------------------ tuition
    tuition = [
        {"id": "suis-tuition-2026", "label_mn": "2026-2027 оны сургалтын төлбөр", "per_year": None, "price_per_credit": None,
         "currency": "MNT",
         "note_mn": ("СУИС-ийн 2026-2027 оны сургалтын төлбөрийн мэдээлэл олдсонгүй — элсэлтийн систем (burtgel.mnuac.edu.mn) "
                     "эсвэл сургуулиас тодруулна уу."),         "source_urls": [BURTGEL_BACHELOR, IKON_FEE], "status": "unknown"},
    ]
    save("tuition_2026_2027", meta("tuition_2026_2027", "СУИС-ийн 2026-2027 оны сургалтын төлбөр (одоогоор тодорхойгүй)."), tuition)

    # ------------------------------------------------------------------ scholarships / dorms
    scholarships = [
        {"id": "suis-sch-new", "name_mn": "Шинэ элсэгчдэд олгох тэтгэлэг",
         "coverage_mn": "Сургалтын төлбөрийн дунджаар 50% хүртэл.",
         "requirements_mn": "Элсэлтийн хуудсанд '650 оноо' гэж заасан; хүсэлтийг сургалтын албанд журмын дагуу өгнө.",
         "deadline_mn": "2026-07-03 – 2026-08-27 (хүсэлт)", "source_urls": [BURTGEL_SCHOLARSHIP], "status": "current"},
        {"id": "suis-sch-state", "name_mn": "Төрийн сангийн зээл, тэтгэлэг", "coverage_mn": None,
         "requirements_mn": "Нөхцөлийг сургуулиас тодруулна уу.", "deadline_mn": None,
         "source_urls": [BURTGEL_SCHOLARSHIP], "status": "partial"},
        {"id": "suis-sch-director", "name_mn": "Захирлын нэрэмжит тэтгэлэг", "coverage_mn": None,
         "requirements_mn": "Нөхцөлийг сургуулиас тодруулна уу.", "deadline_mn": None,
         "source_urls": [BURTGEL_SCHOLARSHIP], "status": "partial"},
    ]
    save("scholarships", meta("scholarships", "СУИС-ийн тэтгэлэг, зээл, хөнгөлөлт (элсэлтийн системийн 'Тэтгэлэг' хуудас)."), scholarships)
    dorms = [
        {"id": "suis-dorm-info", "record_type": "info", "name_mn": "Оюутны байрны мэдээлэл",
         "facts_mn": ["СУИС-ийн оюутны байрны мэдээлэл (байр, үнэ, бүртгэл) олдсонгүй — их сургуулиас тодруулна уу."],
         "source_urls": [HOME, STUDENT_WEB], "verified_at": TODAY, "status": "unknown"},
    ]
    save("dorms", meta("dorms", "СУИС-ийн оюутны байр (мэдээлэл олдоогүй)."), dorms)

    # ------------------------------------------------------------------ links
    links = [
        ("admission", "Элсэлтийн цахим систем", BURTGEL),
        ("admission", "Бакалаврын элсэлт", BURTGEL_BACHELOR),
        ("admission", "Бакалаврын хөтөлбөр", BACHELOR_PAGE),
        ("admission", "Дүрэм журам", RULES_PAGE),
        ("info", "Их сургуулийн албан ёсны сайт", HOME),
        ("info", "Холбоо барих", CONTACT_PAGE),
        ("info", "Магистрын хөтөлбөр", MASTER_PAGE),
        ("info", "Докторын хөтөлбөр", DOCTOR_PAGE),
        ("info", "Англи хэлээр (English)", EN_SITE),
        ("info", "Шилэн данс", SHILEN_DANS),
        ("student", "Оюутны веб", STUDENT_WEB),
        ("student", "Номын сангийн каталог", LIBRARY),
        ("student", "Цахим сургалт", ELEARNING),
        ("school", "Театрын урлагийн сургууль", SSSA),
        ("school", "Соёлын сургууль (фэйсбүүк)", FB_SOYOL),
        ("exam", "Боловсролын үнэлгээний төв (ЭШ)", EEC),
    ]
    save("links", meta("links", "СУИС-ийн албан ёсны холбоосууд."),
         [{"id": f"suis-l-{i + 1:02d}", "category": c, "title_mn": t, "url": u} for i, (c, t, u) in enumerate(links)])

    # ------------------------------------------------------------------ faq
    faq = [
        ("admission", "СУИС-д элсэхийн тулд юу хийх вэ?",
         "1) Боловсролын үнэлгээний төвийн Элсэлтийн шалгалтад (ЭШ) бүртгүүлж, шалгалт өгнө — 2026 онд бүртгэл 3-р сарын 4 – 5-р сарын 15, "
         "шалгалт 6-р сарын 25–28-нд болсон. 2) СУИС-ийн элсэлтийн цахим систем burtgel.mnuac.edu.mn-д бүртгүүлж, мэргэжлээ сонгоно. "
         "3) Урлагийн ихэнх мэргэжилд их сургуулийн өөрийн авдаг ур чадварын шалгалт өгнө. Мэргэжил бүрийн хичээл, босго, огноог тус системээс шалгана уу."),
        ("exams", "Ур чадварын шалгалт гэж юу вэ?",
         "Их сургууль өөрөө авдаг мэргэжлийн шалгалт. 2016 онд жишээ нь жүжигчинд монолог, этюд, дуулах, хөдөлгөөн; бүжигт уян хатан байдал, "
         "хөгжмийн мэдрэмж, үсрэлт; хөгжим тоглоход хөгжмийн зэмсгээр 2 бүтээл, хэмнэл, сонсгол; хувцасны дизайнд хар цагаан зураг, будгийн "
         "зураг, өөрийн бүтээл; сэтгүүл зүйд ярилцлага, эссэ шалгаж байсан. Тэр үед 800 оноогоор дүгнэж, зөвхөн Улаанбаатарт авдаг байсан. "
         "2026-2027 оны агуулга, хуваарийг burtgel.mnuac.edu.mn-ээс шалгана уу."),
        ("exams", "Ямар хичээлээр шалгалт өгөх вэ, босго оноо хэд вэ?",
         "2026 онд ур чадварын шалгалттай мэргэжилд ЭШ-ын заасан хичээлүүдийн аль нэгээр 450 (зарим нь 460, 490)-аас багагүй оноо, "
         "ур чадварын шалгалтад 490 (800-аас) оноо шаардсан. Зөвхөн ЭШ шаарддаг мэргэжилд (Урлаг судлал, Соёл судлал, Номын сан судлал, "
         "Менежмент, Маркетинг) 2 хичээл тус бүр 450 эсвэл 490-аас багагүй. Мэргэжил бүрийн хичээлийг гарын авлагын хавсралтаас харна уу."),
        ("programs", "Ямар мэргэжлүүд байдаг вэ?",
         "2026 онд 6 сургуулийн 35 бакалаврын мэргэжлээр элсэлт авсан: жишээ нь жүжиглэх, найруулах урлаг, зураг авалт, дуу чимээний технологи, "
         "график, хувцасны дизайн, анимейшн, уран зураг, уран баримал, хөгжимдөх, дуулах урлаг, бүжиг, урлаг судлал, соёл судлал, "
         "сэтгүүл зүй, менежмент, маркетинг. Бүрэн жагсаалт гарын авлагын хавсралтад бий."),
        ("exams", "2026 оны Элсэлтийн шалгалт өмнөхөөсөө юугаараа өөр вэ?",
         "Боловсролын үнэлгээний төвийн мэдээллээр 2026 оноос I, II, III түвшний шалгалтуудаас сонгож өгдөг болсон бөгөөд бүх шалгуулагч "
         "монгол хэл бичиг, математикийн нэгдмэл агуулгатай Суралцах чадварын шалгалт өгнө. СУИС мэргэжил бүрт аль хичээл, түвшинг шаардахыг "
         "элсэлтийн системээс шалгана уу."),
        ("admission", "Орон нутгаас ур чадварын шалгалт өгч болох уу?",
         "2016 онд ур чадварын шалгалтыг зөвхөн Улаанбаатарт авдаг байсан тул орон нутгийн элсэгчид цахимаар бүртгүүлээд шалгалтын өдөр ирдэг "
         "байсан. 2026-2027 онд хаана, хэрхэн авахыг сургуулиас тодруулна уу."),
        ("tuition", "Сургалтын төлбөр хэд вэ?",
         "СУИС-ийн 2026-2027 оны сургалтын төлбөрийн мэдээлэл олдсонгүй. Элсэлтийн систем (burtgel.mnuac.edu.mn) эсвэл сургуулиас тодруулна уу."),
        ("dorms", "Оюутны байр бий юу?",
         "СУИС-ийн оюутны байрны мэдээлэл олдсонгүй. Их сургуулийн сайтын 'Холбоо барих' хэсэг (mnuac.edu.mn) болон Оюутны веб "
         "(student.mnuac.edu.mn)-ээс тодруулна уу."),
        ("contact", "Хэнтэй холбогдох вэ?",
         "Их сургуулийн сайтын 'Холбоо барих' хэсэг (mnuac.edu.mn) болон элсэлтийн систем (burtgel.mnuac.edu.mn). 2016 оны элсэлтийн мэдээнд "
         "11-326129, 11-318774 утас өгсөн байсан — одоо ажиллаж буй эсэхийг шалгана уу."),
    ]
    save("faq", meta("faq", "СУИС-ийн элсэгчдэд зориулсан асуулт хариулт."),
         [{"id": f"suis-faq-{i + 1:02d}", "category": c, "q_mn": q, "a_mn": a} for i, (c, q, a) in enumerate(faq)])

    # ------------------------------------------------------------------ sources (+ gaps)
    src = [
        ("src-burtgel-meta", BURTGEL_ROOT, "Элсэлтийн системийн нэр, мета тайлбар ('бакалавр, магистр, докторын элсэлтийн бүртгэл, мэргэжил, "
                                           "оноо, төлбөр, дүрэм журам'); /bachelor хуудасны мета түлхүүр үг 'элсэлт 2026'", False, None),
        ("src-mnuac-nav", BACHELOR_PAGE, "Албан ёсны сайтын цэс: Оюутны веб, номын сан, цахим сургалт, Холбоо барих, Дүрэм журам, шилэн данс", False, None),
        ("src-master-doctor", MASTER_PAGE, "Хайлтын гарчиг: 'Магистрын хөтөлбөр' (мөн " + DOCTOR_PAGE + " 'Докторын хөтөлбөр')", False, None),
        ("src-sssa", SSSA, "Хайлтын гарчиг: 'Театрын урлагийн сургууль - Соёл урлагийн их сургууль'", False, None),
        ("src-sssa-acting", SSSA_DEPT_ACTING, "Хайлтын гарчиг: 'Найруулах, жүжиглэх урлагийн тэнхим'", False, None),
        ("src-sssa-studies", SSSA_DEPT_STUDIES, "Хайлтын гарчиг: 'Ярих урлаг, театр, кино судлалын тэнхим'", False, None),
        ("src-mafa-drawing", MAFA_DRAWING, "Хайлтын гарчиг: 'Зураасан зураг хөтөлбөрийн суралцахуйн үр дүн'", False, None),
        ("src-scc-dept", SCC_DEPT, "Хайлтын гарчиг: 'Хүмүүнлэг, боловсрол судлалын тэнхим'", False, None),
        ("src-ikon-2016", IKON_2016, "2016-2017 оны элсэлт: 25 хөтөлбөр, 19 ур чадварын шалгалттай, индекс, шалгалтын агуулга, ЭЕШ 400+, "
                                     "800 оноо, огноо, утас (хуучирсан)", False, None),
        ("src-newsmn-2016", NEWSMN_2016, "2016-2017 оны элсэлт — ikon.mn-ий мэдээг давхар шалгасан", False, None),
        ("src-ikon-amgalan", IKON_AMGALAN, "2016: Дүрслэх, дизайн урлагийн сургуулийг Ардын зураач Д.Амгалангийн нэрэмжит болгосон", False, None),
        ("src-ikon-esh-reg", IKON_ESH_REG, "2026 оны ЭШ-ын бүртгэл: 3-р сарын 4 – 5-р сарын 15 (төгсөгчид 3-р сарын 6-наас)", False, None),
        ("src-ikon-esh-dates", IKON_ESH_DATES, "2026 оны ЭШ 6-р сарын 25–28 (нийтлэлийн гарчгаас)", False, None),
        ("src-ikon-levels", IKON_ESH_LEVELS, "2026 оноос I, II, III түвшний шалгалт (нийтлэлийн гарчгаас)", False, None),
        ("src-ikon-aptitude", IKON_APTITUDE, "Бүх шалгуулагчид Суралцах чадварын шалгалт (нийтлэлийн гарчгаас)", False, None),
        ("src-ikon-fee", IKON_FEE, "2026-2027 оны төлбөрийн мэдээ — СУИС ороогүйг шалгасан", False, None),
        ("src-burtgel-api-programs", API_PROGRAMS, "Элсэлтийн системийн нээлттэй API: 2026 оны хөтөлбөр, мэргэжил, сургууль, хугацаа, "
                                                   "ур чадварын шалгалтын бүрэлдэхүүн ба тэнцэх оноо", False, None),
        ("src-burtgel-api-thresholds", API_THRESHOLDS, "Элсэлтийн системийн нээлттэй API: мэргэжил бүрийн ЭШ-ын хичээл, босго (2026)", False, None),
        ("src-burtgel-calculator", BURTGEL_CALCULATOR, "Онооны тооцоолуур: элсэх оноо = ЭШ ÷ 2 + ур чадвар (1200); зөвхөн ЭШ бол дундаж (800)", False, None),
        ("src-burtgel-scholarship", BURTGEL_SCHOLARSHIP, "Тэтгэлгийн хуудас: шинэ элсэгчийн тэтгэлэг (50% хүртэл, 650 оноо), хугацаа", False, None),
        ("src-burtgel-contacts", API_CONTACTS, "Холбоо барих: 7766-0011, burtgel@mnuac.edu.mn, 'Улаанбаатар хот, Баянгол дүүрэг'", False, None),
        ("src-fb-soyol-title", FB_SOYOL, "Хайлтын гарчиг: 'СУИС-ийн Соёлын сургууль' (агуулгыг уншаагүй — gap-fb-soyol)", False, None),
        # ---- gaps
        ("gap-burtgel-bachelor", BURTGEL_BACHELOR,
         "ЦООРХОЙ (ГОЛ): СУИС-ийн элсэлтийн систем — бакалаврын элсэлт (Next.js, агуулга JavaScript-ээр ачаалдаг)", True,
         "Браузераар нээж 2026-2027 оны бакалаврын хөтөлбөр БҮРИЙН: (1) яг нэр, харьяалах сургууль, индекс, хугацаа/кредит; (2) Элсэлтийн "
         "шалгалтын 1 ба 2-р хичээл (түвшин I/II/III заасан бол), хичээл тус бүрийн эсвэл нийлбэр/дундаж босго; (3) ур чадварын шалгалтын "
         "агуулга, огноо, онооны хуваарь (0–800 / 0–100), тэнцэх оноо, ЭШ-ын оноотой хэрхэн нийлүүлэх (жин, хувь), 3+ шалгалттай эсэх; "
         "(4) жагсаалтаар/шууд сонгох, хяналтын тоо; (5) 1 жилийн төлбөр эсвэл кредитийн үнэ; (6) бүртгэлийн хугацаа, хураамж. Дараа нь "
         "build_data.py-ийн PROGRAMS_2026-г бөглөж ажиллуулна — 2016 оны 'unverified' мөрүүд автоматаар хасагдана."),
        ("gap-burtgel-root", BURTGEL_ROOT, "ЦООРХОЙ: Элсэлтийн системийн нүүр (JavaScript)", True,
         "Нүүр болон цэсний 'дүрэм журам', 'төлбөр', 'оноо', түгээмэл асуулт хэсгээс: элсэлтийн журам (PDF холбоос), бүртгэлийн хураамж, "
         "онооны томьёо, ур чадварын шалгалтын ерөнхий дүрэм, 2026 оны огноо, элсэлтийн албаны утас, имэйл."),
        ("gap-home", HOME, "ЦООРХОЙ: Албан ёсны нүүр хуудас — хандах зөвшөөрөл олгогдоогүй тул уншаагүй (сайт JavaScript)", True,
         "Нүүр хуудасны мэдээ, цэснээс: 2026/2027 оны элсэлтийн зар (хөтөлбөр, хичээл, босго), оюутны байр (байр, ор, үнэ), тэтгэлэг "
         "(нэр, хамрах хүрээ, шаардлага, хугацаа), их сургуулийн танилцуулга (байгуулагдсан он, оюутны тоо), бүрэлдэхүүн сургуулиудын "
         "албан ёсны жагсаалт."),
        ("gap-elselt-2025", ELSELT_2025, "ЦООРХОЙ: '✨СУИС ЭЛСЭЛТ 2025✨' мэдээ (Nuxt, JavaScript)", True,
         "2025 оны хөтөлбөр, хичээл, босгын хүснэгтийг exam_2026_2027.page_thresholds-д (он: 2025) хадгална; ижил төрлийн '2026' мэдээ "
         "(content=... ID) байгаа эсэхийг шалгаж, байвал 2026-2027 оны гол эх сурвалж болгоно."),
        ("gap-bachelor-programs", BACHELOR_PAGE, "ЦООРХОЙ: 'Бакалаврын хөтөлбөр' хуудас (JavaScript)", True,
         "Сургууль тус бүрийн бакалаврын хөтөлбөрийн жагсаалт, индекс, суралцах хугацаа, кредит, хөтөлбөрийн хуудасны холбоос."),
        ("gap-rules", RULES_PAGE, "ЦООРХОЙ: 'Дүрэм журам' хуудас (JavaScript)", True,
         "'Суралцагч элсүүлэх журам' (2026, PDF байж магадгүй): онооны томьёо, ур чадварын шалгалтын дүгнэлт (хуваарь, хөрвүүлэлт), тэнцсэн "
         "үед харгалзах зүйл, бүртгэлийн хураамж, буцаалт, урлаг/спортын амжилтаар элсэх нөхцөл."),
        ("gap-contact", CONTACT_PAGE, "ЦООРХОЙ: 'Холбоо барих' хуудас (JavaScript)", True,
         "Хаяг (дүүрэг, хороо, гудамж), ерөнхий утас, элсэлтийн албаны утас, имэйл, фэйсбүүк хаяг — university.json contacts болон sidebar-д."),
        ("gap-sfa", SFA, "ЦООРХОЙ: sfa.mnuac.edu.mn — бүрэлдэхүүн сургуулийн сайт (татахад алдаа гарсан)", True,
         "Сургуулийн яг нэр (Дүрслэх, дизайн урлагийн сургууль эсэх), тэнхим, бакалаврын хөтөлбөрүүд, холбоо барих."),
        ("gap-sssa-contact", SSSA_CONTACT, "ЦООРХОЙ: Театрын урлагийн сургуулийн 'Холбоо барих' (JavaScript)", True,
         "Театрын урлагийн сургуулийн хаяг, утас, имэйл; сайтын цэснээс бакалаврын хөтөлбөрүүд (жүжигчин, найруулагч, кино г.м.)."),
        ("gap-scc", SCC, "ЦООРХОЙ: scc.mnuac.edu.mn — бүрэлдэхүүн сургуулийн сайт (JavaScript)", True,
         "Сургуулийн яг нэр (Соёлын сургууль эсэх), тэнхим ('Хүмүүнлэг, боловсрол судлалын тэнхим' г.м.), бакалаврын хөтөлбөрүүд."),
        ("gap-sbm", SBM, "ЦООРХОЙ: sbm.mnuac.edu.mn — бүрэлдэхүүн сургуулийн сайт (JavaScript)", True,
         "Сургуулийн яг нэр, тэнхим, бакалаврын хөтөлбөрүүд; schools.json-д шинэ сургууль нэмэх эсэх."),
        ("gap-mafa", MAFA_DRAWING, "ЦООРХОЙ: mafa.mnuac.edu.mn — 'Зураасан зураг' хөтөлбөрийн хуудас (JavaScript)", True,
         "mafa сайтын харьяалах сургуулийн яг нэр; Зураасан зураг болон бусад дүрслэх урлагийн хөтөлбөрүүд 2026 онд элсэлт авсан эсэх."),
        ("gap-dance-brochure", DANCE_BROCHURE, "ЦООРХОЙ: 'Соёл урлагийн их сургууль Бүжгийн урлагийн сургууль' цахим танилцуулга "
                                               "(pubhtml5; URL хэт урт тул прокси татаагүй)", True,
         "Танилцуулгын он, Бүжгийн урлагийн сургуулийн бакалаврын хөтөлбөрүүд, элсэлтийн шаардлага (ЭШ-ын хичээл, ур чадварын шалгалтын "
         "агуулга), хугацаа, холбоо барих. Оныг заавал шалгана."),
        ("gap-zms-interview", ZMS_INTERVIEW, "ЦООРХОЙ: 'М.Амартүвшин: СУИС элсэлт болон мэргэжлийн ур чадварын шалгалтаа цахимаар авна' "
                                             "(zms.mn — роботын хоригтой)", True,
         "Нийтэлсэн огноо; ур чадварын шалгалтыг цахимаар (видео г.м.) авах журам, онооны хуваарь, ЭШ-тай нийлүүлэх арга. 2026 оных бол "
         "admission_2026-ийн skills_test-д оруулна, хуучин бол зөвхөн жишиг."),
        ("gap-zms-overview", ZMS_OVERVIEW, "ЦООРХОЙ: 'Их, дээд сургуулиудын цогц мэдээлэл' (zms.mn — роботын хоригтой домэйн, уншаагүй)", True,
         "Огноо; СУИС-ийн хөтөлбөр, босго, сургалтын төлбөрийн мэдээлэл байгаа эсэх (2026-2027 бол tuition, programs-д)."),
        ("gap-fb-soyol", FB_SOYOL, "ЦООРХОЙ: 'СУИС-ийн Соёлын сургууль' фэйсбүүк хуудас", True,
         "2026 оны элсэлтийн нийтлэлүүд: Соёлын сургуулийн бакалаврын хөтөлбөрүүд, ЭШ-ын хичээл, босго, ур чадварын шалгалт (байвал), утас."),
        ("gap-wiki", WIKI_MN, "ЦООРХОЙ: Википедиа нийтлэл (хайлтын URL 'олдсонгүй' алдаа өгсөн; ангиллын хуудас: " + WIKI_MN_CAT + ")", True,
         "Байгуулагдсан он, түүхийн гол үе (нэр солигдсон он, Консерватори тусгаарласан эсэх), бүрэлдэхүүн сургуулиуд — university.json "
         "history-д (албан ёсны эх сурвалжаар баталгаажуулж)."),
        ("gap-student-web", STUDENT_WEB, "ЦООРХОЙ: Оюутны веб (нэвтрэх шаардлагатай байж магадгүй)", True,
         "Оюутны байрны бүртгэл, үнэ; тэтгэлгийн зар, хугацаа — dorms.json, scholarships.json-д."),
        ("gap-en-site", EN_SITE, "ЦООРХОЙ: Англи хэлний сайт (JavaScript)", True,
         "Admission / Programs хэсгээс бакалаврын хөтөлбөрийн жагсаалт (англи нэр), гадаад оюутны элсэлт, хаяг, утас."),
    ]
    save("sources", meta("sources", "Энэ датасетэд ашигласан эх сурвалжууд ба уншиж чадаагүй (цоорхой) эх сурвалжууд.",
                         note_mn="gap = true бол уншиж чадаагүй; gap_fill_hint_mn-д тэндээс юу авахыг бичсэн. СУИС-ийн бүх албан ёсны "
                                 "хуудас JavaScript-ээр ачаалдаг тул бодит браузер шаардлагатай."),
         [dict(id=i, url=u, used_for=t, gap=bool(g) and i not in FILLED, **({"gap_fill_hint_mn": h} if h else {}), **FILLED.get(i, {}))
          for i, u, t, g, h in src])
    unknown_marks = set(FILLED) - {i for i, *_ in src}
    assert not unknown_marks, f"FILLED names unknown source ids: {sorted(unknown_marks)}"

    save("schools", meta("schools", "СУИС-ийн бүрэлдэхүүн сургуулиуд (нэрсийг хэсэгчлэн баталгаажуулсан)."), schools)
    print("programs", len(programs), "| imported", sum(p["status"] != "unverified" for p in programs),
          "| by confidence", conf_counts, "| schools", len(schools), "| dates", len(dates), "| faq", len(faq),
          "| links", len(links), "| sources", len(src), "| gaps", sum(1 for s in src if s[3]))


if __name__ == "__main__":
    main()
