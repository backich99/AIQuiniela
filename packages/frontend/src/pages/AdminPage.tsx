import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Pool {
  id: string;
  name: string;
  invitationCode: string;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  phase: string;
  startTime: string;
  result?: {
    homeGoals: number;
    awayGoals: number;
  } | null;
}

interface BonusQuestion {
  id: string;
  question: string;
  points: number;
  deadline: string;
  correctAnswer: string | null;
}

export function AdminPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [bonusQuestions, setBonusQuestions] = useState<BonusQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Result form
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [resultHome, setResultHome] = useState('');
  const [resultAway, setResultAway] = useState('');
  const [submittingResult, setSubmittingResult] = useState(false);

  // Scoring form
  const [exactPoints, setExactPoints] = useState('5');
  const [partialPoints, setPartialPoints] = useState('3');
  const [oneTeamPoints, setOneTeamPoints] = useState('1');
  const [submittingScoring, setSubmittingScoring] = useState(false);

  // Bonus question form
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionPoints, setNewQuestionPoints] = useState('10');
  const [newQuestionDeadline, setNewQuestionDeadline] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Resolve bonus form
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    if (selectedPool) {
      loadPoolData();
    }
  }, [selectedPool]);

  const loadPools = async () => {
    try {
      const data = await api<Pool[]>('/pools');
      setPools(data);
      if (data.length > 0) {
        setSelectedPool(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar quinielas');
    } finally {
      setLoading(false);
    }
  };

  const loadPoolData = async () => {
    try {
      setError(null);
      const [matchesResponse, bonusData] = await Promise.all([
        api<{ matches: Match[]; pagination: unknown }>('/matches?limit=100'),
        api<BonusQuestion[]>(`/pools/${selectedPool}/bonus-predictions/questions`).catch(() => [] as BonusQuestion[]),
      ]);
      setMatches(matchesResponse.matches ?? []);
      setBonusQuestions(bonusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    const homeGoals = parseInt(resultHome, 10);
    const awayGoals = parseInt(resultAway, 10);

    if (isNaN(homeGoals) || homeGoals < 0 || isNaN(awayGoals) || awayGoals < 0) {
      setError('Los goles deben ser números no negativos');
      return;
    }

    setSubmittingResult(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const match = matches.find((m) => m.id === selectedMatch);
      const method = match?.result ? 'PUT' : 'POST';
      await api(`/matches/${selectedMatch}/result`, {
        method,
        body: { homeGoals, awayGoals },
      });
      setSuccessMsg('Resultado registrado correctamente');
      setResultHome('');
      setResultAway('');
      setSelectedMatch('');
      await loadPoolData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar resultado');
    } finally {
      setSubmittingResult(false);
    }
  };

  const handleUpdateScoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool) return;

    const exact = parseInt(exactPoints, 10);
    const partial = parseInt(partialPoints, 10);
    const oneTeam = parseInt(oneTeamPoints, 10);

    if ([exact, partial, oneTeam].some((v) => isNaN(v) || v < 0)) {
      setError('Los puntos deben ser números no negativos');
      return;
    }

    setSubmittingScoring(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api(`/pools/${selectedPool}/scoring`, {
        method: 'PATCH',
        body: { exact, partial, oneTeam },
      });
      setSuccessMsg('Reglas de puntuación actualizadas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar reglas');
    } finally {
      setSubmittingScoring(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !newQuestion.trim() || !newQuestionDeadline) return;

    setSubmittingQuestion(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api(`/pools/${selectedPool}/bonus-questions`, {
        method: 'POST',
        body: {
          question: newQuestion.trim(),
          points: parseInt(newQuestionPoints, 10),
          deadline: new Date(newQuestionDeadline).toISOString(),
        },
      });
      setSuccessMsg('Pregunta bonus creada');
      setNewQuestion('');
      setNewQuestionPoints('10');
      setNewQuestionDeadline('');
      await loadPoolData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear pregunta');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleResolveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !selectedQuestion || !correctAnswer.trim()) return;

    setSubmittingResolve(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api(`/pools/${selectedPool}/bonus-questions/${selectedQuestion}/resolve`, {
        method: 'POST',
        body: { correctAnswer: correctAnswer.trim() },
      });
      setSuccessMsg('Pregunta bonus resuelta');
      setSelectedQuestion('');
      setCorrectAnswer('');
      await loadPoolData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resolver pregunta');
    } finally {
      setSubmittingResolve(false);
    }
  };

  const currentPool = pools.find((p) => p.id === selectedPool);

  if (loading) return <div className="page-container"><p className="loading-text">Cargando...</p></div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>⚙️ Panel de Administración</h1>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">← Volver</Link>
      </header>

      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      {/* Pool selector */}
      {pools.length > 1 && (
        <div className="form-group">
          <label>Quiniela:</label>
          <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)}>
            {pools.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Invitation code */}
      {currentPool && (
        <section className="admin-section">
          <h2>Código de Invitación</h2>
          <div className="invitation-code">
            <span className="code-display">{currentPool.invitationCode}</span>
            <p className="code-hint">Comparte este código para que otros se unan a tu quiniela</p>
          </div>
        </section>
      )}

      {/* Register match result */}
      <section className="admin-section">
        <h2>Registrar Resultado de Partido</h2>
        <form onSubmit={handleSubmitResult}>
          <div className="form-group">
            <label>Partido:</label>
            <select value={selectedMatch} onChange={(e) => setSelectedMatch(e.target.value)}>
              <option value="">Seleccionar partido...</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.homeTeam} vs {m.awayTeam} ({m.phase})
                  {m.result ? ` [${m.result.homeGoals}-${m.result.awayGoals}]` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Goles Local:</label>
              <input
                type="number"
                min="0"
                value={resultHome}
                onChange={(e) => setResultHome(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Goles Visitante:</label>
              <input
                type="number"
                min="0"
                value={resultAway}
                onChange={(e) => setResultAway(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submittingResult || !selectedMatch}>
            {submittingResult ? 'Registrando...' : 'Registrar Resultado'}
          </button>
        </form>
      </section>

      {/* Scoring rules */}
      <section className="admin-section">
        <h2>Reglas de Puntuación</h2>
        <form onSubmit={handleUpdateScoring}>
          <div className="form-row">
            <div className="form-group">
              <label>Resultado Exacto:</label>
              <input
                type="number"
                min="0"
                value={exactPoints}
                onChange={(e) => setExactPoints(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Resultado Parcial:</label>
              <input
                type="number"
                min="0"
                value={partialPoints}
                onChange={(e) => setPartialPoints(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Un Equipo:</label>
              <input
                type="number"
                min="0"
                value={oneTeamPoints}
                onChange={(e) => setOneTeamPoints(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submittingScoring}>
            {submittingScoring ? 'Actualizando...' : 'Actualizar Reglas'}
          </button>
        </form>
      </section>

      {/* Create bonus question */}
      <section className="admin-section">
        <h2>Crear Pregunta Bonus</h2>
        <form onSubmit={handleCreateQuestion}>
          <div className="form-group">
            <label>Pregunta:</label>
            <input
              type="text"
              placeholder="Ej: ¿Quién será el campeón?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Puntos:</label>
              <input
                type="number"
                min="1"
                value={newQuestionPoints}
                onChange={(e) => setNewQuestionPoints(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Fecha límite:</label>
              <input
                type="datetime-local"
                value={newQuestionDeadline}
                onChange={(e) => setNewQuestionDeadline(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submittingQuestion || !newQuestion.trim()}>
            {submittingQuestion ? 'Creando...' : 'Crear Pregunta'}
          </button>
        </form>
      </section>

      {/* Resolve bonus question */}
      <section className="admin-section">
        <h2>Resolver Pregunta Bonus</h2>
        <form onSubmit={handleResolveQuestion}>
          <div className="form-group">
            <label>Pregunta:</label>
            <select value={selectedQuestion} onChange={(e) => setSelectedQuestion(e.target.value)}>
              <option value="">Seleccionar pregunta...</option>
              {bonusQuestions.filter((q) => !q.correctAnswer).map((q) => (
                <option key={q.id} value={q.id}>{q.question} ({q.points} pts)</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Respuesta correcta:</label>
            <input
              type="text"
              placeholder="Ej: Argentina"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submittingResolve || !selectedQuestion}>
            {submittingResolve ? 'Resolviendo...' : 'Resolver'}
          </button>
        </form>
      </section>

      {/* Existing bonus questions */}
      {bonusQuestions.length > 0 && (
        <section className="admin-section">
          <h2>Preguntas Bonus Existentes</h2>
          <div className="bonus-list">
            {bonusQuestions.map((q) => (
              <div key={q.id} className="bonus-card">
                <h3>{q.question}</h3>
                <p>Puntos: {q.points} | Límite: {new Date(q.deadline).toLocaleString('es-MX')}</p>
                {q.correctAnswer && <p><strong>Respuesta: {q.correctAnswer}</strong></p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
