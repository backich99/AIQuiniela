import { describe, expect } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import { calculatePoints } from '../domain/scoring.js';

describe('Feature: world-cup-pool, Property 8: Correctitud del motor de puntuación', () => {
  const rulesArb = fc.record({
    exactPoints: fc.integer({ min: 1, max: 20 }),
    partialPoints: fc.integer({ min: 1, max: 20 }),
    oneTeamPoints: fc.integer({ min: 1, max: 20 }),
  });

  fcTest.prop(
    [fc.nat({ max: 10 }), fc.nat({ max: 10 }), fc.nat({ max: 10 }), fc.nat({ max: 10 }), rulesArb],
    { numRuns: 100 }
  )(
    'scoring categories are mutually exclusive and exhaustive',
    (predHome, predAway, resHome, resAway, rules) => {
      const points = calculatePoints(
        { homeGoals: predHome, awayGoals: predAway },
        { homeGoals: resHome, awayGoals: resAway },
        rules
      );

      const isExact = predHome === resHome && predAway === resAway;
      const predOutcome = Math.sign(predHome - predAway);
      const resOutcome = Math.sign(resHome - resAway);
      const isPartial = !isExact && predOutcome === resOutcome;
      const homeCorrect = predHome === resHome;
      const awayCorrect = predAway === resAway;
      const isOneTeam = !isExact && !isPartial && homeCorrect !== awayCorrect;

      if (isExact) {
        expect(points).toBe(rules.exactPoints);
      } else if (isPartial) {
        expect(points).toBe(rules.partialPoints);
      } else if (isOneTeam) {
        expect(points).toBe(rules.oneTeamPoints);
      } else {
        expect(points).toBe(0);
      }
    }
  );

  fcTest.prop(
    [fc.nat({ max: 10 }), fc.nat({ max: 10 }), rulesArb],
    { numRuns: 50 }
  )(
    'exact result always gives exactPoints',
    (home, away, rules) => {
      const points = calculatePoints(
        { homeGoals: home, awayGoals: away },
        { homeGoals: home, awayGoals: away },
        rules
      );
      expect(points).toBe(rules.exactPoints);
    }
  );

  fcTest.prop(
    [fc.nat({ max: 10 }), fc.nat({ max: 10 }), fc.nat({ max: 10 }), fc.nat({ max: 10 }), rulesArb],
    { numRuns: 100 }
  )(
    'result is always one of the four categories (never undefined or NaN)',
    (predHome, predAway, resHome, resAway, rules) => {
      const points = calculatePoints(
        { homeGoals: predHome, awayGoals: predAway },
        { homeGoals: resHome, awayGoals: resAway },
        rules
      );
      expect([rules.exactPoints, rules.partialPoints, rules.oneTeamPoints, 0]).toContain(points);
    }
  );
});
