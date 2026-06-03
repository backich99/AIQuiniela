import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

export function JoinPoolPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code?: string }>();
  const [invitationCode, setInvitationCode] = useState(code || '');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api<{ poolId: string }>('/pools/join', {
        method: 'POST',
        body: {
          invitationCode: invitationCode.trim().toUpperCase(),
          displayName: displayName.trim(),
        },
      });

      navigate(`/pools/${data.poolId}/matches`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al unirse a la quiniela');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Unirse a Quiniela</h1>
        <p className="auth-subtitle">
          Ingresa el código de invitación que te compartieron
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="invitationCode">Código de invitación</label>
            <input
              id="invitationCode"
              type="text"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              placeholder="Ej: ABC12DEF"
              required
              maxLength={8}
              style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Tu nombre en la quiniela</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: Carlos"
              required
            />
            <small>Este nombre aparecerá en la tabla de posiciones.</small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Uniéndose...' : 'Unirse'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/dashboard">← Volver al Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
