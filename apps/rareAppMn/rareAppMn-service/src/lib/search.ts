/**
 * Search that understands Mongolian typed in Latin letters ("muis", "khuree",
 * "programm hangamj") as well as in Cyrillic.
 *
 * Names and typed text are folded into one simple Latin form: Cyrillic is
 * transliterated, the different ways people write each letter are merged
 * (х = h/kh/x, ө = o/u/q, ү = u/v/y, ы/й = i/y, ц = ts/c, ш = sh/w, ж = j/zh),
 * vowels that people mix up share a letter (o and u), ь counts as i and
 * doubled letters become one ("ulsiin" = улсын, "surguuli" = сургууль). The
 * folded text is stored next to the name (`search_text`), so a search is a
 * plain `LIKE` per typed word.
 *
 * Text with any Cyrillic letter keeps the old exact matching on the name, so
 * Cyrillic searches find what they found before; the only addition is that a
 * school's short name or alias (МУИС, Хүрээ) finds that school.
 *
 * The import scripts (data-import/*.mjs) import this file directly, so it
 * must stay plain, erasable TypeScript with no imports.
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  ө: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ү: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ъ: '',
  ы: 'i',
  ь: 'i',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

const CYRILLIC_LETTER = /[Ѐ-ӿ]/;

/** Most typed words a search uses; more would only narrow it further. */
const MAX_SEARCH_WORDS = 5;
/** Longest folded word matched; SQLite rejects long LIKE patterns. */
const MAX_WORD_LENGTH = 32;
/** A typed "y" can be ы/й (i) or ү (u); only the first ones get both readings. */
const MAX_AMBIGUOUS_Y = 2;

/** Lowercase Latin letters and digits, Cyrillic transliterated; anything else becomes a space. */
function toLatin(text: string): string {
  const lower = text.normalize('NFC').toLowerCase();
  let latin = '';
  for (const character of lower) latin += CYRILLIC_TO_LATIN[character] ?? character;
  return latin
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ');
}

/**
 * Merges the spellings of each letter. A "y" that could be ы/й or ү is left
 * as "Y" for the caller to resolve; "y" before a vowel is я/ё/ю/е ("ya" = "ia").
 */
function mergeSpellings(latin: string): string {
  return latin
    .replace(/kh|x/g, 'h')
    .replace(/zh/g, 'j')
    .replace(/dz/g, 'z')
    .replace(/ph/g, 'f')
    .replace(/w/g, 'sh')
    .replace(/ch/g, 'C')
    .replace(/c/g, 'ts')
    .replace(/C/g, 'ch')
    .replace(/q/g, 'o')
    .replace(/ye/g, 'e')
    .replace(/y(?=[aeiou])/g, 'i')
    .replace(/y/g, 'Y')
    .replace(/[ov]/g, 'u');
}

/** Collapses doubled letters and spaces. */
function finish(text: string): string {
  return text
    .replace(/([a-z])\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The folded form of a name or alias, as stored in `search_text`. */
export function foldSearchText(text: string): string {
  return finish(mergeSpellings(toLatin(text)).replace(/Y/g, 'i'));
}

/** Every folded reading of typed text: each ambiguous "y" read as both i and u. */
function foldedReadings(text: string): string[] {
  let readings = [mergeSpellings(toLatin(text))];
  for (let i = 0; i < MAX_AMBIGUOUS_Y; i += 1) {
    readings = readings.flatMap((reading) =>
      reading.includes('Y') ? [reading.replace('Y', 'i'), reading.replace('Y', 'u')] : [reading]
    );
  }
  return [...new Set(readings.map((reading) => finish(reading.replace(/Y/g, 'i'))))];
}

export interface SearchQuery {
  /** The trimmed text as typed. */
  text: string;
  /** True when the text has Cyrillic letters: it then matches names exactly, as before. */
  cyrillic: boolean;
  /** The whole text folded; empty when it has no letters or digits. */
  folded: string;
  /**
   * The folded words to look for, once per reading of an ambiguous "y"
   * (first reading first). A row matches when it has every word of one reading.
   */
  readings: string[][];
}

/** Parses a search box value; null when there is nothing to search for. */
export function parseSearch(value: string | null | undefined): SearchQuery | null {
  const text = value?.trim();
  if (!text) return null;
  const readings = foldedReadings(text).map((reading) =>
    reading
      .split(' ')
      .filter(Boolean)
      .slice(0, MAX_SEARCH_WORDS)
      .map((word) => word.slice(0, MAX_WORD_LENGTH))
  );
  return {
    text,
    cyrillic: CYRILLIC_LETTER.test(text),
    folded: foldSearchText(text),
    readings: readings.filter((words) => words.length > 0),
  };
}

/** Trimmed, de-duplicated aliases in their given order. */
export function cleanAliases(aliases: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const alias of aliases ?? []) {
    const text = alias.trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

/** A school's `search_aliases`: its folded aliases between pipes, e.g. `|muis|num|`, so `%|muis|%` is an exact match. */
export function schoolSearchAliases(aliases: readonly string[] | null | undefined): string {
  const folded = [...new Set(cleanAliases(aliases).map(foldSearchText).filter(Boolean))];
  return folded.length > 0 ? `|${folded.join('|')}|` : '';
}

/** A school's `search_text`: its folded name and aliases (short names, slugs, English names). */
export function schoolSearchText(name: string, aliases: readonly string[] | null | undefined): string {
  return [...new Set([name, ...cleanAliases(aliases)].map(foldSearchText).filter(Boolean))].join(' | ');
}

/** A major's `search_text`: its folded name. */
export function majorSearchText(name: string): string {
  return foldSearchText(name);
}

/** A faculty's `search_text`: its folded name ("huuli" finds Хууль зүйн сургууль's majors). */
export function facultySearchText(name: string): string {
  return foldSearchText(name);
}

/**
 * Whether a name matches a search, the way the SQL search matches it; for
 * lists the API filters in memory (a university's faculties and majors).
 */
export function matchesSearch(search: SearchQuery, name: string): boolean {
  if (search.cyrillic) return name.toLowerCase().includes(search.text.toLowerCase());
  const folded = foldSearchText(name);
  return search.readings.some((words) => words.every((word) => folded.includes(word)));
}
