import { NflPickSelector } from './NflPickSelector';

export interface NflMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  week: number;
  startTime: string;
  result?: { homeScore: number; awayScore: number } | null;
  myPrediction?: { id: string; pick: string; pointsEarned: number | null } | null;
}

export interface NflPrediction {
  matchId: string;
  pick: string; // 'LOCAL' | 'VISITANTE' | 'EMPATE'
  pointsEarned: number | null;
}

interface NflMatchCardProps {
  match: NflMatch;
  prediction?: NflPrediction | null;
  onPickChange: (matchId: string, pick: string) => void;
  saving?: boolean;
}

export function NflMatchCard({ match, prediction, onPickChange, saving }: NflMatchCardProps) {
  const isStarted = new Date(match.startTime) <= new Date();
  const isFinished = match.result !== undefined && match.result !== null;

  const getResultLabel = () => {
    if (!match.result) return null;
    if (match.result.homeScore > match.result.awayScore) return 'LOCAL';
    if (match.result.awayScore > match.result.homeScore) return 'VISITANTE';
    return 'EMPATE';
  };

  const result = getResultLabel();

  return (
    <div className="nfl-match-card">
      <div className="nfl-match-header">
        <span className="nfl-match-teams">
          🏈 {match.homeTeam} vs {match.awayTeam}
        </span>
        <span className="nfl-match-time">
          {new Date(match.startTime).toLocaleString('es-MX', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Show result for finished games */}
      {isFinished && match.result && (
        <div className="nfl-match-result">
          <span className="result-score">
            Resultado: {match.result.homeScore} - {match.result.awayScore}
          </span>
          {prediction && (
            <span className={`nfl-prediction-result ${prediction.pick === result ? 'nfl-pred-correct' : 'nfl-pred-incorrect'}`}>
              Tu pick: {prediction.pick}
              {prediction.pointsEarned !== null && (
                <strong> (+{prediction.pointsEarned} pts)</strong>
              )}
            </span>
          )}
          {!prediction && <span className="match-status">Sin pronóstico</span>}
        </div>
      )}

      {/* Show pick selector for games not started */}
      {!isStarted && (
        <div className="nfl-match-pick">
          <NflPickSelector
            pick={prediction?.pick ?? null}
            onPick={(pick) => onPickChange(match.id, pick)}
            disabled={saving}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
          />
          {saving && <span className="nfl-saving">Guardando...</span>}
        </div>
      )}

      {/* In progress but not finished */}
      {isStarted && !isFinished && (
        <div className="nfl-match-result">
          <span className="match-status">🔴 Partido en juego</span>
          {prediction && (
            <span className="prediction-result">Tu pick: {prediction.pick}</span>
          )}
        </div>
      )}
    </div>
  );
}
