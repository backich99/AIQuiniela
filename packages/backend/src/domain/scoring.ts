/**
 * Motor de puntuación para la quiniela.
 * Función pura sin efectos secundarios ni acceso a base de datos.
 */

export interface PredictionInput {
  homeGoals: number;
  awayGoals: number;
}

export interface ResultInput {
  homeGoals: number;
  awayGoals: number;
}

export interface ScoringRulesInput {
  exactPoints: number;
  partialPoints: number;
  oneTeamPoints: number;
}

/**
 * Calculates the points earned for a prediction given the official result.
 *
 * Categories are mutually exclusive and evaluated in priority order:
 * 1. Exact result (both teams' goals match) → exactPoints
 * 2. Partial result (correct winner/draw but not exact goals) → partialPoints
 * 3. One team correct (exactly one team's goals match but not the overall result) → oneTeamPoints
 * 4. Nothing matches → 0
 */
export function calculatePoints(
  prediction: PredictionInput,
  result: ResultInput,
  rules: ScoringRulesInput
): number {
  const { homeGoals: predHome, awayGoals: predAway } = prediction;
  const { homeGoals: resHome, awayGoals: resAway } = result;

  // 1. Exact result
  if (predHome === resHome && predAway === resAway) {
    return rules.exactPoints;
  }

  // 2. Partial result (correct outcome: home win / away win / draw)
  const predOutcome = Math.sign(predHome - predAway);
  const resOutcome = Math.sign(resHome - resAway);
  if (predOutcome === resOutcome) {
    return rules.partialPoints;
  }

  // 3. One team's goals correct (but not the overall result)
  const homeCorrect = predHome === resHome;
  const awayCorrect = predAway === resAway;
  if (homeCorrect !== awayCorrect) {
    // Exactly one team's goals are correct
    return rules.oneTeamPoints;
  }

  // 4. Nothing matches
  return 0;
}
