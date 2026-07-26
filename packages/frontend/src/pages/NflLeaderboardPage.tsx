import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { NflWeekNav } from '../components/nfl/NflWeekNav';

interface NflLeaderboardEntry {
  position: number;
  displayName: string;
  userId: string;
  totalPoints: number;
}

export function NflLeaderboardPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { user } = useAuth();
  const [entries, setEntries] = useState<NflLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = overall
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    loadLeaderboard();
  }, [poolId, selectedWeek]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const weekParam = selectedWeek > 0 ? `?week=${selectedWeek}` : '';
      const data = await api<NflLeaderboardEntry[]>(`/nfl/pools/${poolId}/leaderboard${weekParam}`);

      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la tabla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>🏆 Tabla NFL</h1>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">← Volver</Link>
      </header>

      <div className="nfl-leaderboard-controls">
        <button
          className={`btn btn-sm ${selectedWeek === 0 ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedWeek(0)}
        >
          General
        </button>
      </div>

      <NflWeekNav
        currentWeek={currentWeek}
        selectedWeek={selectedWeek || currentWeek}
        onWeekChange={(week) => setSelectedWeek(week)}
      />

      {error && <div className="error-message">{error}</div>}
      {loading && <p className="loading-text">Cargando tabla...</p>}

      {!loading && entries.length === 0 && (
        <p className="empty-state">No hay participantes aún en esta quiniela.</p>
      )}

      {!loading && entries.length > 0 && (
        <div className="table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.userId}
                  className={entry.userId === user?.id ? 'current-user-row' : ''}
                >
                  <td className="position-cell">{entry.position}</td>
                  <td>{entry.displayName}</td>
                  <td className="points-cell"><strong>{entry.totalPoints}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
