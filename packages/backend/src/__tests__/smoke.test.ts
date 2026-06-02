import { describe, test, expect } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import { createUser, createPool, createScoringRules } from './helpers/factories.js';

describe('Smoke test - Vitest framework', () => {
  test('vitest works', () => {
    expect(1 + 1).toBe(2);
  });

  test('test factories create valid objects', () => {
    const user = createUser();
    expect(user.id).toBeDefined();
    expect(user.email).toContain('@');

    const pool = createPool();
    expect(pool.invitationCode).toHaveLength(8);

    const rules = createScoringRules();
    expect(rules.exactPoints).toBe(5);
    expect(rules.partialPoints).toBe(3);
    expect(rules.oneTeamPoints).toBe(1);
  });
});

describe('Smoke test - fast-check integration', () => {
  fcTest.prop([fc.integer()])('integers are numbers', (n) => {
    expect(typeof n).toBe('number');
    expect(Number.isFinite(n)).toBe(true);
  });

  fcTest.prop([fc.string()])('strings have non-negative length', (s) => {
    expect(s.length).toBeGreaterThanOrEqual(0);
  });
});
