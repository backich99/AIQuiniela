import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface CreatePoolResponse {
  id: string;
  name: string;
  invitationCode: string;
}

export function CreatePoolPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [exactPoints, setExactPoints] = useState(5);
  const [partialPoints, setPartialPoints] = useState(3);
  const [oneTeamPoints, setOneTeamPoints] = useState(1);
  const [showScoring, setShowScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdPool, setCreatedPool] = useState<CreatePoolResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body: Record<string, unknown> = { name };

      if (showScoring) {
        body.scoring = {
          exactPoints,
          partialPoints,
          oneTeamPoints,
        };
      }

      const data = await api<CreatePoolResponse>('/pools', {
        method: 'POST',
        body,
      });

      setCreatedPool(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la quiniela');
    } finally {
      setLoading(false);
    }
  };

  if (createdPool) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>¡Quiniela Creada! 🎉</h1>
          <p>Tu quiniela <strong>{createdPool.name}</strong> fue creada exitosamente.</p>

          <div className="invitation-code">
            <p>Código de invitación:</p>
            <code className="code-display">{createdPool.invitationCode}</code>
            <p className="code-hint">
              Comparte este código con tus amigos para que se unan.
            </p>
          </div>

          <Link to="/dashboard" className="btn btn-primary">
            Ir al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Crear Quiniela</h1>
        <p className="auth-subtitle">Organiza una nueva quiniela con tus amigos</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre de la quiniela</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Quiniela de la Oficina"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={showScoring}
                onChange={(e) => setShowScoring(e.target.checked)}
              />{' '}
              Personalizar puntuación
            </label>
          </div>

          {showScoring && (
            <div className="scoring-config">
              <div className="form-group">
                <label htmlFor="exactPoints">Puntos por resultado exacto</label>
                <input
                  id="exactPoints"
                  type="number"
                  min={1}
                  value={exactPoints}
                  onChange={(e) => setExactPoints(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="partialPoints">Puntos por resultado parcial</label>
                <input
                  id="partialPoints"
                  type="number"
                  min={1}
                  value={partialPoints}
                  onChange={(e) => setPartialPoints(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="oneTeamPoints">Puntos por acertar goles de un equipo</label>
                <input
                  id="oneTeamPoints"
                  type="number"
                  min={1}
                  value={oneTeamPoints}
                  onChange={(e) => setOneTeamPoints(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Quiniela'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/dashboard">← Volver al Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
