/**
 * Motor de puntuación para la quiniela NFL.
 * Función pura sin efectos secundarios ni acceso a base de datos.
 */

export type NflPick = 'HOME' | 'AWAY' | 'TIE';

export interface NflScoringInput {
  pick: NflPick;
  homeScore: number;
  awayScore: number;
}

/**
 * Calculates the points earned for an NFL prediction given the final scores.
 *
 * Rules:
 * - HOME correct: homeScore - awayScore >= 4 (clear home win)
 * - AWAY correct: awayScore - homeScore >= 4 (clear away win)
 * - TIE correct: |homeScore - awayScore| <= 3 (close game / effective tie)
 *
 * Returns 1 if the pick is correct, 0 otherwise.
 */
export function calculateNflPoints(input: NflScoringInput): number {
  const { pick, homeScore, awayScore } = input;
  const diff = homeScore - awayScore;

  switch (pick) {
    case 'HOME':
      return diff >= 4 ? 1 : 0;
    case 'AWAY':
      return -diff >= 4 ? 1 : 0;
    case 'TIE':
      return Math.abs(diff) <= 3 ? 1 : 0;
  }
}
