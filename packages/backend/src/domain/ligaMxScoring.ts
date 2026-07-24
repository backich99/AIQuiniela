/**
 * Motor de puntuación para la quiniela Liga MX.
 * Función pura sin efectos secundarios ni acceso a base de datos.
 */

export type LigaMxPick = 'HOME' | 'AWAY' | 'TIE';

export interface LigaMxScoringInput {
  pick: LigaMxPick;
  homeGoals: number;
  awayGoals: number;
}

/**
 * Calculates the points earned for a Liga MX prediction given the final scores.
 *
 * Rules:
 * - HOME correct: homeGoals > awayGoals (home win)
 * - AWAY correct: awayGoals > homeGoals (away win)
 * - TIE correct: homeGoals === awayGoals (literal draw)
 *
 * Returns 1 if the pick is correct, 0 otherwise.
 */
export function calculateLigaMxPoints(input: LigaMxScoringInput): number {
  const { pick, homeGoals, awayGoals } = input;

  switch (pick) {
    case 'HOME':
      return homeGoals > awayGoals ? 1 : 0;
    case 'AWAY':
      return awayGoals > homeGoals ? 1 : 0;
    case 'TIE':
      return homeGoals === awayGoals ? 1 : 0;
  }
}
