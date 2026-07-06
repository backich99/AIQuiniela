import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { NflWeekNav } from '../components/nfl/NflWeekNav';
import { NflMatchCard } from '../components/nfl/NflMatchCard';
import type { NflMatch, NflPrediction } from '../components/nfl/NflMatchCard';

export function NflMatchesPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [matches, setMatches] = useState<NflMatch[]>([]);
  const [predictions, setPredictions] = useState<Record<string, NflPrediction>>({});
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, [poolId, selectedWeek]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api<{
        week: number;
        matches: Array<NflMatch & { myPrediction?: { id: string; pick: string; pointsEarned: number | null } | null }>;
      }>(`/nfl/pools/${poolId}/matches?week=${selectedWeek}`);

      const matchList = data.matches ?? [];
      setMatches(matchList);
      setCurrentWeek(data.week ?? selectedWeek);

      const predMap: Record<string, NflPrediction> = {};
      for (const m of matchList) {
        if (m.myPrediction) {
          predMap[m.id] = { matchId: m.id, pick: m.myPrediction.pick, pointsEarned: m.myPrediction.pointsEarned };
        }
      }
      setPredictions(predMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar partidos NFL');
    } finally {
      setLoading(false);
    }
  };

  const handlePickChange = async (matchId: string, pick: string) => {
    setSavingMatch(matchId);
    try {
      const existing = predictions[matchId];
      if (existing) {
        await api(`/nfl/pools/${poolId}/predictions`, {
          method: 'PUT',
          body: { matchId, pick },
        });
      } else {
        await api(`/nfl/pools/${poolId}/predictions`, {
          method: 'POST',
          body: { matchId, pick },
        });
      }

      setPredictions((prev) => ({
        ...prev,
        [matchId]: { matchId, pick, pointsEarned: null },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar pronóstico');
    } finally {
      setSavingMatch(null);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>🏈 Partidos NFL</h1>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">← Volver</Link>
      </header>

      <NflWeekNav
        currentWeek={currentWeek}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
      />

      {error && <div className="error-message">{error}</div>}
      {loading && <p className="loading-text">Cargando partidos...</p>}

      {!loading && matches.length === 0 && (
        <p className="empty-state">No hay partidos para la semana {selectedWeek}.</p>
      )}

      {!loading && matches.length > 0 && (
        <div className="nfl-matches-grid">
          {matches.map((match) => (
            <NflMatchCard
              key={match.id}
              match={match}
              prediction={predictions[match.id] ?? null}
              onPickChange={handlePickChange}
              saving={savingMatch === match.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
