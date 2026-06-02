import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

type MatchPhase = 'GROUPS' | 'R16' | 'QF' | 'SF' | 'FINAL';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  group: string | null;
  phase: MatchPhase;
  startTime: string;
  result?: {
    homeGoals: number;
    awayGoals: number;
  } | null;
}

interface Prediction {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  penaltyWinner: string | null;
  pointsEarned: number | null;
}

const PHASES: { value: MatchPhase; label: string }[] = [
  { value: 'GROUPS', label: 'Grupos' },
  { value: 'R16', label: 'Octavos' },
  { value: 'QF', label: 'Cuartos' },
  { value: 'SF', label: 'Semifinal' },
  { value: 'FINAL', label: 'Final' },
];

export function MatchesPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filterTeam, setFilterTeam] = useState<string>('');

  // Prediction form state
  const [formState, setFormState] = useState<Record<string, { homeGoals: string; awayGoals: string; penaltyWinner: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [poolId, filterPhase, filterGroup, filterTeam]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterPhase) params.set('phase', filterPhase);
      if (filterGroup) params.set('group', filterGroup);
      if (filterTeam) params.set('team', filterTeam);

      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const [matchesResponse, predictionsData] = await Promise.all([
        api<{ matches: Match[]; pagination: unknown }>(`/matches${queryStr}`),
        api<Prediction[]>(`/pools/${poolId}/predictions/me`).catch(() => [] as Prediction[]),
      ]);

      const matchesData = matchesResponse.matches ?? [];
      setMatches(matchesData);

      const predMap: Record<string, Prediction> = {};
      for (const p of predictionsData) {
        predMap[p.matchId] = p;
      }
      setPredictions(predMap);

      // Initialize form state for matches without predictions
      const newFormState: typeof formState = {};
      for (const m of matchesData) {
        const existing = predMap[m.id];
        newFormState[m.id] = {
          homeGoals: existing ? String(existing.homeGoals) : '',
          awayGoals: existing ? String(existing.awayGoals) : '',
          penaltyWinner: existing?.penaltyWinner ?? '',
        };
      }
      setFormState(newFormState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar partidos');
    } finally {
      setLoading(false);
    }
  };

  const isMatchStarted = (match: Match) => new Date(match.startTime) <= new Date();

  const isKnockout = (phase: MatchPhase) => phase !== 'GROUPS';

  const handleSubmitPrediction = async (matchId: string) => {
    const form = formState[matchId];
    if (!form) return;

    // Validate
    const homeGoals = parseInt(form.homeGoals, 10);
    const awayGoals = parseInt(form.awayGoals, 10);

    if (isNaN(homeGoals) || homeGoals < 0) {
      setFormErrors({ ...formErrors, [matchId]: 'Goles local debe ser un número >= 0' });
      return;
    }
    if (isNaN(awayGoals) || awayGoals < 0) {
      setFormErrors({ ...formErrors, [matchId]: 'Goles visitante debe ser un número >= 0' });
      return;
    }

    const match = matches.find((m) => m.id === matchId);
    if (match && isKnockout(match.phase) && homeGoals === awayGoals && !form.penaltyWinner) {
      setFormErrors({ ...formErrors, [matchId]: 'En eliminatoria con empate, selecciona ganador en penales' });
      return;
    }

    setFormErrors({ ...formErrors, [matchId]: '' });
    setSubmitting(matchId);
    setSuccessMsg(null);

    try {
      const body: Record<string, unknown> = { matchId, homeGoals, awayGoals };
      if (match && isKnockout(match.phase) && homeGoals === awayGoals) {
        body.penaltyWinner = form.penaltyWinner;
      }

      const existing = predictions[matchId];
      if (existing) {
        await api(`/pools/${poolId}/predictions/${matchId}`, { method: 'PUT', body });
      } else {
        await api(`/pools/${poolId}/predictions`, { method: 'POST', body });
      }

      setSuccessMsg(`Pronóstico guardado para el partido`);
      // Reload predictions
      const predictionsData = await api<Prediction[]>(`/pools/${poolId}/predictions/me`);
      const predMap: Record<string, Prediction> = {};
      for (const p of predictionsData) {
        predMap[p.matchId] = p;
      }
      setPredictions(predMap);
    } catch (err) {
      setFormErrors({ ...formErrors, [matchId]: err instanceof Error ? err.message : 'Error al guardar' });
    } finally {
      setSubmitting(null);
    }
  };

  const handleFormChange = (matchId: string, field: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value },
    }));
  };

  // Group matches by phase
  const matchesByPhase = PHASES.reduce<Record<string, Match[]>>((acc, p) => {
    acc[p.value] = matches.filter((m) => m.phase === p.value);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>⚽ Partidos</h1>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">← Volver</Link>
      </header>

      {/* Filters */}
      <div className="filters-bar">
        <div className="form-group filter-item">
          <label>Fase</label>
          <select value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)}>
            <option value="">Todas</option>
            {PHASES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group filter-item">
          <label>Grupo</label>
          <input
            type="text"
            placeholder="Ej: A"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          />
        </div>
        <div className="form-group filter-item">
          <label>Equipo</label>
          <input
            type="text"
            placeholder="Ej: México"
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}
      {loading && <p className="loading-text">Cargando partidos...</p>}

      {!loading && matches.length === 0 && (
        <p className="empty-state">No se encontraron partidos con los filtros seleccionados.</p>
      )}

      {!loading && PHASES.map((phase) => {
        const phaseMatches = matchesByPhase[phase.value];
        if (!phaseMatches || phaseMatches.length === 0) return null;

        return (
          <section key={phase.value} className="phase-section">
            <h2 className="phase-title">{phase.label}</h2>
            <div className="matches-grid">
              {phaseMatches.map((match) => {
                const started = isMatchStarted(match);
                const pred = predictions[match.id];
                const form = formState[match.id];
                const matchError = formErrors[match.id];

                return (
                  <div key={match.id} className="match-card">
                    <div className="match-info">
                      <span className="match-teams">{match.homeTeam} vs {match.awayTeam}</span>
                      <span className="match-date">
                        {new Date(match.startTime).toLocaleString('es-MX', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      {match.group && <span className="match-group">Grupo {match.group}</span>}
                    </div>

                    {/* Show result if played */}
                    {match.result && (
                      <div className="match-result">
                        <span className="result-score">
                          Resultado: {match.result.homeGoals} - {match.result.awayGoals}
                        </span>
                        {pred && (
                          <span className="prediction-result">
                            Tu pronóstico: {pred.homeGoals} - {pred.awayGoals}
                            {pred.pointsEarned !== null && (
                              <strong> (+{pred.pointsEarned} pts)</strong>
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Prediction form if not started */}
                    {!started && form && (
                      <div className="prediction-form">
                        <div className="prediction-inputs">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={form.homeGoals}
                            onChange={(e) => handleFormChange(match.id, 'homeGoals', e.target.value)}
                            className="goal-input"
                            aria-label={`Goles ${match.homeTeam}`}
                          />
                          <span className="vs-separator">-</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={form.awayGoals}
                            onChange={(e) => handleFormChange(match.id, 'awayGoals', e.target.value)}
                            className="goal-input"
                            aria-label={`Goles ${match.awayTeam}`}
                          />
                        </div>

                        {/* Penalty winner selector for knockout draws */}
                        {isKnockout(match.phase) && form.homeGoals && form.awayGoals && form.homeGoals === form.awayGoals && (
                          <div className="penalty-selector">
                            <label>Ganador en penales:</label>
                            <select
                              value={form.penaltyWinner}
                              onChange={(e) => handleFormChange(match.id, 'penaltyWinner', e.target.value)}
                            >
                              <option value="">Seleccionar...</option>
                              <option value={match.homeTeam}>{match.homeTeam}</option>
                              <option value={match.awayTeam}>{match.awayTeam}</option>
                            </select>
                          </div>
                        )}

                        {matchError && <span className="inline-error">{matchError}</span>}

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSubmitPrediction(match.id)}
                          disabled={submitting === match.id}
                        >
                          {submitting === match.id ? 'Guardando...' : pred ? 'Actualizar' : 'Guardar'}
                        </button>
                      </div>
                    )}

                    {/* If started and no result yet */}
                    {started && !match.result && pred && (
                      <div className="match-result">
                        <span className="prediction-result">
                          Tu pronóstico: {pred.homeGoals} - {pred.awayGoals}
                        </span>
                        <span className="match-status">Partido en juego / Pendiente resultado</span>
                      </div>
                    )}

                    {started && !match.result && !pred && (
                      <div className="match-result">
                        <span className="match-status">Sin pronóstico - Partido ya iniciado</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
