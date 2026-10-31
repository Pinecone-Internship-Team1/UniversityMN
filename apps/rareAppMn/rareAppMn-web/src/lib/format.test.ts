import { describe, expect, test } from "bun:test";
import { formatAimag, formatDateMn, formatDateRange, formatMajorPlace, parseExamScore } from "./format";

describe("formatDateMn", () => {
  test("a stored date in Mongolian order, read from the string", () => {
    expect(formatDateMn("2026-11-23")).toBe("2026.11.23");
    // UTC midnight is the previous evening in American time zones; the string must not shift.
    expect(formatDateMn("2026-01-01")).toBe("2026.01.01");
  });

  test("month-day only", () => {
    expect(formatDateMn("08-20")).toBe("08.20");
  });

  test("a timestamp shows its day in Ulaanbaatar", () => {
    expect(formatDateMn("2026-10-08T08:07:59.819Z")).toBe("2026.10.08");
    expect(formatDateMn("2026-10-08T20:00:00.000Z")).toBe("2026.10.09");
  });

  test("other text as is; empty as null", () => {
    expect(formatDateMn("2025 оны жишиг: 8-р сарын 18 – 9-р сарын 5")).toBe(
      "2025 оны жишиг: 8-р сарын 18 – 9-р сарын 5",
    );
    expect(formatDateMn(null)).toBeNull();
    expect(formatDateMn("")).toBeNull();
  });
});

describe("formatDateRange", () => {
  test("start and end", () => {
    expect(formatDateRange("2026-10-01", "2026-11-23")).toBe("2026.10.01 – 2026.11.23");
  });

  test("only an end", () => {
    expect(formatDateRange(null, "2026-11-27")).toBe("2026.11.27 хүртэл");
  });

  test("only a start, or the same day twice", () => {
    expect(formatDateRange("2026-07-02", null)).toBe("2026.07.02");
    expect(formatDateRange("2026-07-02", "2026-07-02")).toBe("2026.07.02");
  });

  test("neither", () => {
    expect(formatDateRange(null, null)).toBe("Хугацаа тодорхойгүй");
  });
});

describe("formatMajorPlace", () => {
  // Faculty rows as stored for ШУТИС.
  const MANAGEMENT = {
    name: "Менежментийн сургууль",
    location: "Улаанбаатар, Сүхбаатар дүүрэг, 8-р хороо, Бага тойруу (ШУТИС-ийн хотхон)",
  };
  const DARKHAN = { name: "Дархан-Уул аймаг дахь Технологийн сургууль", location: "Дархан-Уул аймаг" };
  const ERDENET = {
    name: "Эрдэнэт цогцолбор дээд сургууль",
    location: "Орхон аймаг, Баян-Өндөр сум (Эрдэнэт)",
  };

  test("a school in Ulaanbaatar: just its name", () => {
    expect(formatMajorPlace(MANAGEMENT)).toBe("Менежментийн сургууль");
    expect(formatMajorPlace({ name: "Хууль зүйн сургууль", location: null })).toBe(
      "Хууль зүйн сургууль",
    );
  });

  test("a branch school adds its aimag", () => {
    expect(formatMajorPlace(DARKHAN)).toBe(
      "Дархан-Уул аймаг дахь Технологийн сургууль · Дархан-Уул аймаг",
    );
    expect(formatMajorPlace(ERDENET)).toBe("Эрдэнэт цогцолбор дээд сургууль · Орхон аймаг");
  });

  test("a list that mixes universities adds the short name", () => {
    expect(formatMajorPlace(DARKHAN, "ШУТИС")).toBe(
      "ШУТИС · Дархан-Уул аймаг дахь Технологийн сургууль · Дархан-Уул аймаг",
    );
    expect(formatMajorPlace(null, "ШУТИС")).toBe("ШУТИС");
    expect(formatMajorPlace(null)).toBeNull();
  });

  test("formatAimag", () => {
    expect(formatAimag("Өмнөговь аймаг, Даланзадгад")).toBe("Өмнөговь аймаг");
    expect(formatAimag("Сүхбаатар дүүрэг, Улаанбаатар")).toBeNull();
  });
});

describe("parseExamScore", () => {
  test("a whole ЭЕШ score from the URL", () => {
    expect(parseExamScore("620")).toBe(620);
    expect(parseExamScore("200")).toBe(200);
    expect(parseExamScore("800")).toBe(800);
  });

  test("anything else is ignored", () => {
    expect(parseExamScore(undefined)).toBeNull();
    expect(parseExamScore("")).toBeNull();
    expect(parseExamScore("abc")).toBeNull();
    expect(parseExamScore("620.5")).toBeNull();
    expect(parseExamScore("199")).toBeNull();
    expect(parseExamScore("801")).toBeNull();
  });
});
