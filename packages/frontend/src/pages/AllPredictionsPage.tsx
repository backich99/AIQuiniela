import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

interface MatchInfo {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  result: { homeGoals: number; awayGoals: number } | null;
}

interface ParticipantInfo {
  id: string;
  displayName: string;
  totalPoints: number;
}

interface PredictionData {
  homeGoals: number;
  awayGoals: number;
}

interface AllPredictionsResponse {
  matches: MatchInfo[];
  participants: ParticipantInfo[];
  predictions: Record<string, Record<string, PredictionData>>;
}

export function AllPredictionsPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [data, setData] = useState<AllPredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [poolId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api<AllPredictionsResponse>(`/pools/${poolId}/all-predictions`);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pronósticos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p className="loading-text">Cargando pronósticos...</p></div>;
  if (error) return <div className="page-container"><div className="error-message">{error}</div></div>;
  if (!data) return null;

  const { matches, participants, predictions } = data;

  // Helper: get color class for each part of the prediction
  function getCellContent(participantId: string, match: MatchInfo) {
    const pred = predictions[participantId]?.[match.id];

    // No prediction
    if (!pred) {
      return <span className="pred-cell pred-none">—</span>;
    }

    // No result yet (match started but not finished)
    if (!match.result) {
      return <span className="pred-cell pred-pending">{pred.homeGoals}-{pred.awayGoals}</span>;
    }

    const result = match.result;
    const homeCorrect = pred.homeGoals === result.homeGoals;
    const awayCorrect = pred.awayGoals === result.awayGoals;

    // Check if outcome (win/draw/lose) was predicted correctly
    const predOutcome = Math.sign(pred.homeGoals - pred.awayGoals);
    const resultOutcome = Math.sign(result.homeGoals - result.awayGoals);
    const outcomeCorrect = predOutcome === resultOutcome;

    const homeClass = homeCorrect ? 'correct' : 'incorrect';
    const dashClass = outcomeCorrect ? 'correct' : 'incorrect';
    const awayClass = awayCorrect ? 'correct' : 'incorrect';

    return (
      <span className="pred-cell">
        <span className={`pred-part ${homeClass}`}>{pred.homeGoals}</span>
        <span className={`pred-part ${dashClass}`}>-</span>
        <span className={`pred-part ${awayClass}`}>{pred.awayGoals}</span>
      </span>
    );
  }

  // Short match label
  function matchLabel(match: MatchInfo) {
    const home = match.homeTeam.length > 3 ? match.homeTeam.substring(0, 3).toUpperCase() : match.homeTeam.toUpperCase();
    const away = match.awayTeam.length > 3 ? match.awayTeam.substring(0, 3).toUpperCase() : match.awayTeam.toUpperCase();
    return `${home}-${away}`;
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>📊 Pronósticos de Todos</h1>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">← Volver</Link>
      </header>

      <p className="page-subtitle">
        Solo se muestran partidos que ya iniciaron. 
        <span className="legend">
          <span className="pred-part correct">Verde</span> = acertó |
          <span className="pred-part incorrect"> Rojo</span> = falló |
          <span className="pred-cell pred-none"> Gris</span> = sin pronóstico
        </span>
      </p>

      {matches.length === 0 && (
        <p className="empty-state">Aún no hay partidos iniciados para mostrar.</p>
      )}

      {matches.length > 0 && (
        <div className="predictions-table-wrapper">
          <table className="predictions-table">
            <thead>
              <tr>
                <th className="sticky-col">Participante</th>
                {matches.map(m => (
                  <th key={m.id} className="match-header" title={`${m.homeTeam} vs ${m.awayTeam}`}>
                    {matchLabel(m)}
                  </th>
                ))}
              </tr>
              {/* Result row */}
              <tr className="result-row">
                <td className="sticky-col"><strong>Resultado</strong></td>
                {matches.map(m => (
                  <td key={m.id} className="result-cell">
                    {m.result ? `${m.result.homeGoals}-${m.result.awayGoals}` : '...'}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.id}>
                  <td className="sticky-col participant-name">
                    {p.displayName}
                    <span className="participant-points">({p.totalPoints} pts)</span>
                  </td>
                  {matches.map(m => (
                    <td key={m.id} className="prediction-cell">
                      {getCellContent(p.id, m)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
