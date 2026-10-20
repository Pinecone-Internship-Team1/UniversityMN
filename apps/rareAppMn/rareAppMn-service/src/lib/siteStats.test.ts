import { describe, expect, test } from 'bun:test';
import { clampStatsDays, dayRange, isVisitorId, trackedPath, ulaanbaatarDay } from './siteStats';

describe('ulaanbaatarDay', () => {
  test('16:00 UTC is already the next day in Ulaanbaatar', () => {
    expect(ulaanbaatarDay(new Date('2026-10-19T15:59:59Z'))).toBe('2026-10-19');
    expect(ulaanbaatarDay(new Date('2026-10-19T16:00:00Z'))).toBe('2026-10-20');
  });
});

describe('dayRange', () => {
  test('oldest first, ends on the last day, crosses month ends', () => {
    expect(dayRange(3, '2026-11-01')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
    expect(dayRange(1, '2026-10-19')).toEqual(['2026-10-19']);
  });
});

describe('clampStatsDays', () => {
  test('defaults to 30 and stays within 1..365', () => {
    expect(clampStatsDays(undefined)).toBe(30);
    expect(clampStatsDays(0)).toBe(1);
    expect(clampStatsDays(7.9)).toBe(7);
    expect(clampStatsDays(10_000)).toBe(365);
  });
});

describe('trackedPath', () => {
  test('keeps the pathname only', () => {
    expect(trackedPath('/schools?tab=majors#x')).toBe('/schools');
    expect(trackedPath('/university/muis/')).toBe('/university/muis');
    expect(trackedPath('/')).toBe('/');
  });
  test('rejects anything that is not a site path', () => {
    expect(trackedPath('https://evil.example/')).toBeNull();
    expect(trackedPath('//evil.example')).toBeNull();
    expect(trackedPath('/a b')).toBeNull();
    expect(trackedPath(`/${'x'.repeat(250)}`)).toBeNull();
  });
});

describe('isVisitorId', () => {
  test('accepts a random UUID, rejects junk', () => {
    expect(isVisitorId('3f2b1c9e-8d7a-4b6c-9e0f-1a2b3c4d5e6f')).toBe(true);
    expect(isVisitorId('short')).toBe(false);
    expect(isVisitorId('<script>alert(1)</script>')).toBe(false);
  });
});
