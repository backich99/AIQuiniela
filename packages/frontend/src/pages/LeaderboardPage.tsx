import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface LeaderboardEntry {
  position: number;
  displayName: string;
  userId: string;
  totalPoints: number;
  exactCount: number;
  partialCount: number;
}

export function LeaderboardPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [poolId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api<LeaderboardEntry[]>(`/pools/${poolId}/leaderboard`);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la tabla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>🏆 Tabla de Posiciones</h1>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">← Volver</Link>
      </header>

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
                <th>Exactos</th>
                <th>Parciales</th>
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
                  <td>{entry.exactCount}</td>
                  <td>{entry.partialCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
