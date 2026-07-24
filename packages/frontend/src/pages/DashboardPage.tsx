import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const ADMIN_EMAIL = 'backich99@gmail.com';

interface Pool {
  id: string;
  name: string;
  invitationCode: string;
  role: 'admin' | 'participant';
}

interface NflPool {
  id: string;
  name: string;
  invitationCode: string;
  league: string;
  role: 'admin' | 'participant';
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pools, setPools] = useState<Pool[]>([]);
  const [nflPools, setNflPools] = useState<NflPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      setLoading(true);
      const [wcData, nflData] = await Promise.all([
        api<Pool[]>('/pools'),
        api<NflPool[]>('/nfl/pools').catch(() => [] as NflPool[]),
      ]);
      setPools(wcData);
      setNflPools(nflData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las quinielas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Separate NFL pools by league
  const ligaMxPools = nflPools.filter(p => p.league === 'LIGA_MX');
  const nflOnlyPools = nflPools.filter(p => p.league === 'NFL');

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>🏆 AIQuiniela</h1>
        <div className="header-actions">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleLogout} className="btn btn-secondary">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {loading && <p>Cargando quinielas...</p>}
        {error && <div className="error-message">{error}</div>}

        {/* 1. Liga MX ⚽ */}
        {ligaMxPools.length > 0 && (
          <section className="pools-list">
            <h2>⚽ Liga MX</h2>
            {ligaMxPools.map((pool) => (
              <div key={pool.id} className="pool-card">
                <div className="pool-info">
                  <h3>{pool.name}</h3>
                  <span className="pool-role">
                    {pool.role === 'admin' ? '👑 Admin' : '⚽ Participante'}
                  </span>
                </div>
                <div className="pool-actions">
                  <Link to={`/nfl/pools/${pool.id}/matches`} className="btn btn-sm">
                    Partidos
                  </Link>
                  <Link to={`/nfl/pools/${pool.id}/leaderboard`} className="btn btn-sm">
                    Tabla
                  </Link>
                  {isAdmin && (
                    <Link to={`/nfl/admin/${pool.id}`} className="btn btn-sm">
                      Admin
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 2. NFL 🏈 */}
        {nflOnlyPools.length > 0 && (
          <section className="pools-list" style={{ marginTop: '2rem' }}>
            <h2>🏈 NFL</h2>
            {nflOnlyPools.map((pool) => (
              <div key={pool.id} className="pool-card">
                <div className="pool-info">
                  <h3>{pool.name}</h3>
                  <span className="pool-role">
                    {pool.role === 'admin' ? '👑 Admin' : '🏈 Participante'}
                  </span>
                </div>
                <div className="pool-actions">
                  <Link to={`/nfl/pools/${pool.id}/matches`} className="btn btn-sm">
                    Partidos
                  </Link>
                  <Link to={`/nfl/pools/${pool.id}/leaderboard`} className="btn btn-sm">
                    Tabla
                  </Link>
                  {isAdmin && (
                    <Link to={`/nfl/admin/${pool.id}`} className="btn btn-sm">
                      Admin
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 3. Mundial 🏆 */}
        {pools.length > 0 && (
          <section className="pools-list" style={{ marginTop: '2rem' }}>
            <h2>🏆 Mundial</h2>
            {pools.map((pool) => (
              <div key={pool.id} className="pool-card">
                <div className="pool-info">
                  <h3>{pool.name}</h3>
                  <span className="pool-role">
                    {pool.role === 'admin' ? '👑 Admin' : '🏆 Participante'}
                  </span>
                </div>
                <div className="pool-actions">
                  <Link to={`/pools/${pool.id}/matches`} className="btn btn-sm">
                    Partidos
                  </Link>
                  <Link to={`/pools/${pool.id}/leaderboard`} className="btn btn-sm">
                    Tabla
                  </Link>
                  <Link to={`/pools/${pool.id}/bonus`} className="btn btn-sm">
                    Bonus
                  </Link>
                  <Link to={`/pools/${pool.id}/pronosticos`} className="btn btn-sm">
                    Pronósticos
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="btn btn-sm">
                      Admin
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
