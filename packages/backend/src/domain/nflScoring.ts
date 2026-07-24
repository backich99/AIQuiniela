/**
 * Motor de puntuación para la quiniela NFL.
 * Función pura sin efectos secundarios ni acceso a base de datos.
 */

export type NflPick = 'HOME' | 'AWAY' | 'TIE';

export interface NflScoringInput {
  pick: NflPick;
  homeScore: number;
  awayScore: number;
  league?: string;
}

/**
 * Calculates the points earned for a prediction given the final scores.
 *
 * NFL Rules (spread-based):
 * - HOME correct: homeScore - awayScore >= 4 (clear home win)
 * - AWAY correct: awayScore - homeScore >= 4 (clear away win)
 * - TIE correct: |homeScore - awayScore| <= 3 (close game / effective tie)
 *
 * Liga MX / Soccer Rules (literal):
 * - HOME correct: homeScore > awayScore
 * - AWAY correct: awayScore > homeScore
 * - TIE correct: homeScore === awayScore
 *
 * Returns 1 if the pick is correct, 0 otherwise.
 */
export function calculateNflPoints(input: NflScoringInput): number {
  const { pick, homeScore, awayScore, league } = input;

  // Liga MX uses literal win/draw/loss (no spread)
  if (league === 'LIGA_MX') {
    switch (pick) {
      case 'HOME':
        return homeScore > awayScore ? 1 : 0;
      case 'AWAY':
        return awayScore > homeScore ? 1 : 0;
      case 'TIE':
        return homeScore === awayScore ? 1 : 0;
    }
  }

  // NFL uses spread (difference >= 4 for win, <= 3 for tie)
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
