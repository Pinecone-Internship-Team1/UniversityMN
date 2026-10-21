import { describe, expect, test } from 'bun:test';
import {
  foldSearchText,
  matchesSearch,
  parseSearch,
  schoolSearchAliases,
  schoolSearchText,
} from './search';

function query(text: string) {
  const search = parseSearch(text);
  if (!search) throw new Error(`no search in "${text}"`);
  return search;
}

describe('foldSearchText', () => {
  test('Cyrillic names and the ways people type them in Latin letters fold to the same text', () => {
    const same: [string, string[]][] = [
      ['МУИС', ['muis', 'MUIS', 'Muis']],
      ['ШУТИС', ['shutis', 'SHUTIS', 'wutis']],
      ['Хүрээ', ['huree', 'khuree', 'xuree', 'hvree', 'HUREE']],
      ['Этүгэн', ['etugen', 'etvgen']],
      ['СЭЗИС', ['sezis']],
      ['АШУҮИС', ['ashuuis', 'ashuvis', 'ashvvis']],
      ['ХААИС', ['haais', 'khaais', 'xaais']],
      ['Монгол Улсын Их Сургууль', ['mongol ulsiin ih surguuli', 'Mongol Ulsiin Ikh Surguuli']],
      ['Программ хангамж', ['programm hangamj', 'program hangamj', 'programm khangamzh']],
      ['Хууль', ['huuli', 'khuuli', 'xuuli']],
      ['Анагаах', ['anagaah', 'anagaakh', 'anagah']],
      ['Багш', ['bagsh', 'bagw']],
      ['Хөгжим', ['hugjim', 'hogjim', 'hqgjim', 'khögjim']],
      ['Цэцэрлэг', ['tsetserleg', 'cecerleg']],
      ['Нийгмийн ажил', ['niigmiin ajil', 'nigmin ajil']],
      ['Эрчим хүч', ['erchim huch', 'erchim khuch']],
      ['Хятад хэл', ['hyatad hel', 'hiatad hel']],
    ];
    for (const [cyrillic, typed] of same) {
      for (const text of typed) expect([text, foldSearchText(text)]).toEqual([text, foldSearchText(cyrillic)]);
    }
  });

  test('keeps only letters and digits, in lowercase, one space apart', () => {
    expect(foldSearchText('  Мэдээллийн технологи (IT-2)!  ')).toBe('medelin tehnulugi it 2');
    expect(foldSearchText('***')).toBe('');
  });
});

describe('parseSearch', () => {
  test('is null for an empty box', () => {
    expect(parseSearch(null)).toBeNull();
    expect(parseSearch('   ')).toBeNull();
  });

  test('marks text with Cyrillic letters so it keeps the old exact matching', () => {
    expect(parseSearch('МУИС')?.cyrillic).toBe(true);
    expect(parseSearch('muis')?.cyrillic).toBe(false);
  });

  test('reads a "y" as both ы/й (i) and ү (u)', () => {
    expect(parseSearch('ulsyn')?.readings).toEqual([['ulsin'], ['ulsun']]);
    // ү typed as y: "yndesnii" = үндэсний.
    const yndesnii = parseSearch('yndesnii');
    expect(yndesnii?.readings).toContainEqual([foldSearchText('үндэсний')]);
    // я/ю/ё before a vowel are not ambiguous.
    expect(parseSearch('hyatad')?.readings).toEqual([[foldSearchText('хятад')]]);
  });

  test('caps the number and length of words', () => {
    expect(parseSearch('a b d e f g k')?.readings[0]).toEqual(['a', 'b', 'd', 'e', 'f']);
    expect(parseSearch('ab'.repeat(50))?.readings[0]?.[0]).toHaveLength(32);
  });
});

describe('school search text', () => {
  test('holds the folded name and aliases; search_aliases marks each alias between pipes', () => {
    const aliases = ['МУИС', 'muis', 'NUM', 'National University of Mongolia'];
    expect(schoolSearchAliases(aliases)).toBe('|muis|num|natiunal uniuersiti uf mungulia|');
    expect(schoolSearchText('Монгол Улсын Их Сургууль', aliases)).toBe(
      'mungul ulsin ih surguli | muis | num | natiunal uniuersiti uf mungulia'
    );
    expect(schoolSearchAliases(null)).toBe('');
    expect(schoolSearchAliases(['  ', 'Хүрээ', 'хүрээ'])).toBe('|hure|');
  });
});

describe('matchesSearch', () => {
  test('Cyrillic text matches names that contain it, ignoring case', () => {
    const search = query('программ');
    expect(matchesSearch(search, 'Программ хангамж')).toBe(true);
    expect(matchesSearch(search, 'Програм')).toBe(false);
  });

  test('Latin text matches when every typed word is in the folded name', () => {
    expect(matchesSearch(query('programm hangamj'), 'Программ хангамж')).toBe(true);
    expect(matchesSearch(query('hangamj programm'), 'Программ хангамж')).toBe(true);
    expect(matchesSearch(query('huuli'), 'Хууль зүй')).toBe(true);
    expect(matchesSearch(query('huuli'), 'Мэдээлэл, холбооны технологи')).toBe(false);
    expect(matchesSearch(query('***'), 'Хууль зүй')).toBe(false);
  });
});
