import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

interface BonusPrediction {
  id: string | null;
  questionId: string;
  question: string;
  answer: string | null;
  deadline: string;
  opensAt: string | null;
  options: string[];
  points: number;
  correctAnswer: string | null;
  pointsEarned: number | null;
  status: 'pending' | 'correct' | 'incorrect' | 'unanswered';
}

export function BonusPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const [bonusPredictions, setBonusPredictions] = useState<BonusPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBonusPredictions();
  }, [poolId]);

  const loadBonusPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api<BonusPrediction[]>(`/pools/${poolId}/bonus-predictions/me`);
      setBonusPredictions(data);

      const initialForm: Record<string, string> = {};
      for (const bp of data) {
        initialForm[bp.questionId] = bp.answer ?? '';
      }
      setFormState(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar predicciones bonus');
    } finally {
      setLoading(false);
    }
  };

  const isDeadlinePassed = (deadline: string) => new Date(deadline) <= new Date();
  const isNotYetOpen = (opensAt: string | null) => opensAt ? new Date(opensAt) > new Date() : false;
  const isOpen = (bp: BonusPrediction) => !isDeadlinePassed(bp.deadline) && !isNotYetOpen(bp.opensAt);

  const handleSubmit = async (questionId: string) => {
    const answer = formState[questionId]?.trim();
    if (!answer) {
      setFormErrors({ ...formErrors, [questionId]: 'La respuesta es requerida' });
      return;
    }

    setFormErrors({ ...formErrors, [questionId]: '' });
    setSubmitting(questionId);
    setSuccessMsg(null);

    try {
      await api(`/pools/${poolId}/bonus-predictions`, {
        method: 'POST',
        body: { questionId, answer },
      });
      setSuccessMsg('Respuesta guardada correctamente');
      await loadBonusPredictions();
    } catch (err) {
      setFormErrors({ ...formErrors, [questionId]: err instanceof Error ? err.message : 'Error al guardar' });
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusBadge = (bp: BonusPrediction) => {
    if (!bp.answer) return <span className="badge badge-neutral">Sin respuesta</span>;
    if (bp.correctAnswer === null) return <span className="badge badge-pending">Pendiente</span>;
    if (bp.pointsEarned && bp.pointsEarned > 0) return <span className="badge badge-correct">✓ Correcto (+{bp.pointsEarned} pts)</span>;
    return <span className="badge badge-incorrect">✗ Incorrecto</span>;
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>🎯 Predicciones Bonus</h1>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">← Volver</Link>
      </header>

      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}
      {loading && <p className="loading-text">Cargando predicciones bonus...</p>}

      {!loading && bonusPredictions.length === 0 && (
        <p className="empty-state">No hay preguntas bonus disponibles para esta quiniela.</p>
      )}

      {!loading && bonusPredictions.length > 0 && (
        <div className="bonus-list">
          {bonusPredictions.map((bp) => {
            const deadlinePassed = isDeadlinePassed(bp.deadline);
            const notYetOpen = isNotYetOpen(bp.opensAt);
            const open = isOpen(bp);
            const questionError = formErrors[bp.questionId];

            return (
              <div key={bp.questionId} className="bonus-card">
                <div className="bonus-header">
                  <h3>{bp.question}</h3>
                  {getStatusBadge(bp)}
                </div>
                {bp.opensAt && (
                  <p className="bonus-deadline">
                    Abre: {new Date(bp.opensAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                    {notYetOpen && <span className="deadline-passed"> (aún no disponible)</span>}
                  </p>
                )}
                <p className="bonus-deadline">
                  Cierra: {new Date(bp.deadline).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                  {deadlinePassed && <span className="deadline-passed"> (expirada)</span>}
                </p>
                <p className="bonus-points">Puntos: {bp.points}</p>

                {bp.answer && (
                  <p className="bonus-answer">Tu respuesta: <strong>{bp.answer}</strong></p>
                )}

                {open && (
                  <div className="bonus-form">
                    {bp.options.length > 0 ? (
                      <select
                        value={formState[bp.questionId] ?? ''}
                        onChange={(e) => setFormState({ ...formState, [bp.questionId]: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        {bp.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Tu respuesta..."
                        value={formState[bp.questionId] ?? ''}
                        onChange={(e) => setFormState({ ...formState, [bp.questionId]: e.target.value })}
                      />
                    )}
                    {questionError && <span className="inline-error">{questionError}</span>}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSubmit(bp.questionId)}
                      disabled={submitting === bp.questionId}
                    >
                      {submitting === bp.questionId ? 'Guardando...' : bp.answer ? 'Actualizar' : 'Enviar'}
                    </button>
                  </div>
                )}

                {notYetOpen && !bp.answer && (
                  <p className="match-status">Esta pregunta aún no está abierta.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
