import { describe, it, expect } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import { calculateNflPoints, NflPick } from '../domain/nflScoring.js';

describe('calculateNflPoints - unit tests', () => {
  describe('HOME pick', () => {
    it('returns 1 when home wins by exactly 4', () => {
      expect(calculateNflPoints({ pick: 'HOME', homeScore: 24, awayScore: 20 })).toBe(1);
    });

    it('returns 1 when home wins by more than 4', () => {
      expect(calculateNflPoints({ pick: 'HOME', homeScore: 35, awayScore: 14 })).toBe(1);
    });

    it('returns 0 when home wins by 3 (not enough margin)', () => {
      expect(calculateNflPoints({ pick: 'HOME', homeScore: 17, awayScore: 14 })).toBe(0);
    });

    it('returns 0 when away team wins', () => {
      expect(calculateNflPoints({ pick: 'HOME', homeScore: 10, awayScore: 24 })).toBe(0);
    });

    it('returns 0 when scores are tied', () => {
      expect(calculateNflPoints({ pick: 'HOME', homeScore: 20, awayScore: 20 })).toBe(0);
    });
  });

  describe('AWAY pick', () => {
    it('returns 1 when away wins by exactly 4', () => {
      expect(calculateNflPoints({ pick: 'AWAY', homeScore: 20, awayScore: 24 })).toBe(1);
    });

    it('returns 1 when away wins by more than 4', () => {
      expect(calculateNflPoints({ pick: 'AWAY', homeScore: 7, awayScore: 28 })).toBe(1);
    });

    it('returns 0 when away wins by 3 (not enough margin)', () => {
      expect(calculateNflPoints({ pick: 'AWAY', homeScore: 14, awayScore: 17 })).toBe(0);
    });

    it('returns 0 when home team wins', () => {
      expect(calculateNflPoints({ pick: 'AWAY', homeScore: 30, awayScore: 10 })).toBe(0);
    });

    it('returns 0 when scores are tied', () => {
      expect(calculateNflPoints({ pick: 'AWAY', homeScore: 20, awayScore: 20 })).toBe(0);
    });
  });

  describe('TIE pick', () => {
    it('returns 1 when scores are exactly tied', () => {
      expect(calculateNflPoints({ pick: 'TIE', homeScore: 20, awayScore: 20 })).toBe(1);
    });

    it('returns 1 when difference is 1', () => {
      expect(calculateNflPoints({ pick: 'TIE', homeScore: 21, awayScore: 20 })).toBe(1);
    });

    it('returns 1 when difference is 2', () => {
      expect(calculateNflPoints({ pick: 'TIE', homeScore: 17, awayScore: 19 })).toBe(1);
    });

    it('returns 1 when difference is 3', () => {
      expect(calculateNflPoints({ pick: 'TIE', homeScore: 24, awayScore: 21 })).toBe(1);
    });

    it('returns 0 when difference is 4', () => {
      expect(calculateNflPoints({ pick: 'TIE', homeScore: 24, awayScore: 20 })).toBe(0);
    });

    it('returns 0 when difference is large', () => {
      expect(calculateNflPoints({ pick: 'TIE', homeScore: 42, awayScore: 7 })).toBe(0);
    });
  });
});

describe('calculateNflPoints - property-based tests', () => {
  const pickArb = fc.constantFrom<NflPick>('HOME', 'AWAY', 'TIE');
  const scoreArb = fc.integer({ min: 0, max: 100 });

  /**
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
   */
  fcTest.prop(
    [pickArb, scoreArb, scoreArb],
    { numRuns: 200 }
  )(
    'always returns 0 or 1',
    (pick, homeScore, awayScore) => {
      const result = calculateNflPoints({ pick, homeScore, awayScore });
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(Number.isInteger(result)).toBe(true);
    }
  );

  /**
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
   */
  fcTest.prop(
    [pickArb, scoreArb, scoreArb],
    { numRuns: 200 }
  )(
    'scoring is correct for all random inputs based on difference rules',
    (pick, homeScore, awayScore) => {
      const result = calculateNflPoints({ pick, homeScore, awayScore });
      const diff = homeScore - awayScore;

      // Independently compute expected result
      let expected: number;
      if (pick === 'HOME') {
        expected = diff >= 4 ? 1 : 0;
      } else if (pick === 'AWAY') {
        expected = -diff >= 4 ? 1 : 0;
      } else {
        expected = Math.abs(diff) <= 3 ? 1 : 0;
      }

      expect(result).toBe(expected);
    }
  );

  /**
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
   * The three pick categories are mutually exclusive for any given score:
   * for diff >= 4, only HOME wins; for diff <= -4, only AWAY wins; for |diff| <= 3, only TIE wins.
   */
  fcTest.prop(
    [scoreArb, scoreArb],
    { numRuns: 200 }
  )(
    'exactly one pick category scores a point for any given score pair',
    (homeScore, awayScore) => {
      const homeResult = calculateNflPoints({ pick: 'HOME', homeScore, awayScore });
      const awayResult = calculateNflPoints({ pick: 'AWAY', homeScore, awayScore });
      const tieResult = calculateNflPoints({ pick: 'TIE', homeScore, awayScore });

      // Exactly one of the three should return 1
      expect(homeResult + awayResult + tieResult).toBe(1);
    }
  );
});
