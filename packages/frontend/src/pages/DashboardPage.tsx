import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface Pool {
  id: string;
  name: string;
  invitationCode: string;
  role: 'admin' | 'participant';
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      setLoading(true);
      const data = await api<Pool[]>('/pools');
      setPools(data);
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

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>🏆 AIQuiniela - Mundial 2026</h1>
        <div className="header-actions">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleLogout} className="btn btn-secondary">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-actions">
          <Link to="/pools/create" className="btn btn-primary">
            Crear Quiniela
          </Link>
          <Link to="/pools/join" className="btn btn-secondary">
            Unirse a Quiniela
          </Link>
        </section>

        <section className="pools-list">
          <h2>Mis Quinielas</h2>

          {loading && <p>Cargando quinielas...</p>}

          {error && <div className="error-message">{error}</div>}

          {!loading && pools.length === 0 && (
            <p className="empty-state">
              No estás en ninguna quiniela aún. ¡Crea una o únete con un código de
              invitación!
            </p>
          )}

          {pools.map((pool) => (
            <div key={pool.id} className="pool-card">
              <div className="pool-info">
                <h3>{pool.name}</h3>
                <span className="pool-role">
                  {pool.role === 'admin' ? '👑 Administrador' : '⚽ Participante'}
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
                {pool.role === 'admin' && (
                  <Link to={`/admin`} className="btn btn-sm">
                    Admin
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
