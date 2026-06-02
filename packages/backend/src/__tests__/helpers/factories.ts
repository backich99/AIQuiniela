/**
 * Test data factories for creating plain objects matching Prisma models.
 * These helpers return simple objects without database interaction,
 * useful for unit and property-based testing of pure functions.
 */

import { randomUUID } from 'crypto';

// Enums matching Prisma schema
export type MatchPhase = 'GROUPS' | 'R16' | 'QF' | 'SF' | 'FINAL';

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserData {
  id: string;
  email: string;
  createdAt: Date;
}

export function createUser(overrides: Partial<UserData> = {}): UserData {
  return {
    id: randomUUID(),
    email: `user-${randomUUID().slice(0, 8)}@test.com`,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Pool ────────────────────────────────────────────────────────────────────

export interface PoolData {
  id: string;
  name: string;
  invitationCode: string;
  adminId: string;
  createdAt: Date;
}

export function createPool(overrides: Partial<PoolData> = {}): PoolData {
  return {
    id: randomUUID(),
    name: `Quiniela ${randomUUID().slice(0, 4)}`,
    invitationCode: generateAlphanumeric(8),
    adminId: randomUUID(),
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── ScoringRules ────────────────────────────────────────────────────────────

export interface ScoringRulesData {
  id: string;
  poolId: string;
  exactPoints: number;
  partialPoints: number;
  oneTeamPoints: number;
}

export function createScoringRules(overrides: Partial<ScoringRulesData> = {}): ScoringRulesData {
  return {
    id: randomUUID(),
    poolId: randomUUID(),
    exactPoints: 5,
    partialPoints: 3,
    oneTeamPoints: 1,
    ...overrides,
  };
}

// ─── Participant ─────────────────────────────────────────────────────────────

export interface ParticipantData {
  id: string;
  userId: string;
  poolId: string;
  displayName: string;
  totalPoints: number;
  exactCount: number;
  partialCount: number;
  joinedAt: Date;
}

export function createParticipant(overrides: Partial<ParticipantData> = {}): ParticipantData {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    poolId: randomUUID(),
    displayName: `Player ${randomUUID().slice(0, 4)}`,
    totalPoints: 0,
    exactCount: 0,
    partialCount: 0,
    joinedAt: new Date(),
    ...overrides,
  };
}

// ─── Match ───────────────────────────────────────────────────────────────────

export interface MatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  group: string | null;
  phase: MatchPhase;
  startTime: Date;
}

export function createMatch(overrides: Partial<MatchData> = {}): MatchData {
  return {
    id: randomUUID(),
    homeTeam: 'Mexico',
    awayTeam: 'Argentina',
    group: 'A',
    phase: 'GROUPS',
    startTime: new Date('2026-06-11T18:00:00Z'),
    ...overrides,
  };
}

// ─── MatchResult ─────────────────────────────────────────────────────────────

export interface MatchResultData {
  id: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  penaltyWinner: string | null;
  recordedAt: Date;
}

export function createMatchResult(overrides: Partial<MatchResultData> = {}): MatchResultData {
  return {
    id: randomUUID(),
    matchId: randomUUID(),
    homeGoals: 2,
    awayGoals: 1,
    penaltyWinner: null,
    recordedAt: new Date(),
    ...overrides,
  };
}

// ─── Prediction ──────────────────────────────────────────────────────────────

export interface PredictionData {
  id: string;
  participantId: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  penaltyWinner: string | null;
  pointsEarned: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createPrediction(overrides: Partial<PredictionData> = {}): PredictionData {
  const now = new Date();
  return {
    id: randomUUID(),
    participantId: randomUUID(),
    matchId: randomUUID(),
    homeGoals: 1,
    awayGoals: 0,
    penaltyWinner: null,
    pointsEarned: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── BonusQuestion ───────────────────────────────────────────────────────────

export interface BonusQuestionData {
  id: string;
  poolId: string;
  question: string;
  correctAnswer: string | null;
  points: number;
  deadline: Date;
}

export function createBonusQuestion(overrides: Partial<BonusQuestionData> = {}): BonusQuestionData {
  return {
    id: randomUUID(),
    poolId: randomUUID(),
    question: '¿Quién será el campeón?',
    correctAnswer: null,
    points: 10,
    deadline: new Date('2026-06-10T00:00:00Z'),
    ...overrides,
  };
}

// ─── BonusPrediction ─────────────────────────────────────────────────────────

export interface BonusPredictionData {
  id: string;
  participantId: string;
  questionId: string;
  answer: string;
  pointsEarned: number | null;
  createdAt: Date;
}

export function createBonusPrediction(overrides: Partial<BonusPredictionData> = {}): BonusPredictionData {
  return {
    id: randomUUID(),
    participantId: randomUUID(),
    questionId: randomUUID(),
    answer: 'Brazil',
    pointsEarned: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
