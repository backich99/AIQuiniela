import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

interface NflPoolInfo {
  id: string;
  name: string;
  invitationCode: string;
}

interface NflMatchAdmin {
  id: string;
  homeTeam: string;
  awayTeam: string;
  week: number;
  startTime: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

export function NflAdminPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<NflPoolInfo | null>(null);
  const [matches, setMatches] = useState<NflMatchAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Result form
  const [selectedMatch, setSelectedMatch] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [submittingResult, setSubmittingResult] = useState(false);

  // Sync
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, [poolId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [poolData, matchesData] = await Promise.all([
        api<NflPoolInfo>(`/nfl/pools/${poolId}`),
        api<NflMatchAdmin[]>(`/nfl/pools/${poolId}/matches/all`),
      ]);

      setPool(poolData);
      setMatches(matchesData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    const home = parseInt(homeScore, 10);
    const away = parseInt(awayScore, 10);

    if (isNaN(home) || home < 0 || isNaN(away) || away < 0) {
      setError('Los puntos deben ser números no negativos');
      return;
    }

    setSubmittingResult(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api(`/nfl/pools/${poolId}/matches/${selectedMatch}/result`, {
        method: 'POST',
        body: { homeScore: home, awayScore: away },
      });
      setSuccessMsg('Resultado registrado correctamente');
      setSelectedMatch('');
      setHomeScore('');
      setAwayScore('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar resultado');
    } finally {
      setSubmittingResult(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api(`/nfl/pools/${poolId}/sync`, { method: 'POST' });
      setSuccessMsg('Sincronización con ESPN completada');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="page-container"><p className="loading-text">Cargando...</p></div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>⚙️ Admin NFL</h1>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">← Volver</Link>
      </header>

      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      {/* Invitation code */}
      {pool && (
        <section className="admin-section">
          <h2>Código de Invitación</h2>
          <div className="invitation-code">
            <span className="code-display">{pool.invitationCode}</span>
            <p className="code-hint">Comparte este código para que otros se unan a la quiniela NFL</p>
          </div>
        </section>
      )}

      {/* ESPN Sync */}
      <section className="admin-section">
        <h2>Sincronización ESPN</h2>
        <p style={{ marginBottom: '0.75rem', color: '#6b7280', fontSize: '0.9rem' }}>
          Sincroniza los resultados de la NFL desde ESPN.
        </p>
        <button
          className="btn btn-primary"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? 'Sincronizando...' : '🔄 Sincronizar con ESPN'}
        </button>
      </section>

      {/* Register/correct result */}
      <section className="admin-section">
        <h2>Registrar / Corregir Resultado</h2>
        <form onSubmit={handleSubmitResult}>
          <div className="form-group">
            <label>Partido:</label>
            <select value={selectedMatch} onChange={(e) => setSelectedMatch(e.target.value)}>
              <option value="">Seleccionar partido...</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  Sem {m.week}: {m.homeTeam} vs {m.awayTeam}
                  {m.homeScore !== null ? ` [${m.homeScore}-${m.awayScore}]` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Puntos Local:</label>
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Puntos Visitante:</label>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submittingResult || !selectedMatch}>
            {submittingResult ? 'Registrando...' : 'Registrar Resultado'}
          </button>
        </form>
      </section>
    </div>
  );
}
