import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { syncUser } from '../middleware/syncUser.js';
import { AppError } from '../errors/AppError.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(syncUser);

/**
 * POST /api/pools/:poolId/bonus-predictions
 * Register a bonus prediction.
 * Body: { questionId: string, answer: string }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;
    const { questionId, answer } = req.body;

    const participant = await prisma.participant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (!participant) {
      throw new AppError('NOT_PARTICIPANT', 'No eres participante de esta quiniela', 403);
    }

    const question = await prisma.bonusQuestion.findUnique({ where: { id: questionId } });
    if (!question || question.poolId !== poolId) {
      throw new AppError('QUESTION_NOT_FOUND', 'Pregunta bonus no encontrada', 404);
    }

    // Check deadline
    if (new Date() >= question.deadline) {
      throw new AppError(
        'BONUS_DEADLINE_PASSED',
        'El plazo para pronósticos especiales ha expirado',
        409
      );
    }

    // Check if already answered
    const existing = await prisma.bonusPrediction.findUnique({
      where: { participantId_questionId: { participantId: participant.id, questionId } },
    });

    if (existing) {
      throw new AppError('BONUS_ALREADY_ANSWERED', 'Ya respondiste esta pregunta', 409);
    }

    const bonusPrediction = await prisma.bonusPrediction.create({
      data: {
        participantId: participant.id,
        questionId,
        answer: answer.trim(),
      },
    });

    res.status(201).json(bonusPrediction);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/pools/:poolId/bonus-predictions/me
 * Get my bonus predictions.
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;

    const participant = await prisma.participant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (!participant) {
      throw new AppError('NOT_PARTICIPANT', 'No eres participante de esta quiniela', 403);
    }

    const predictions = await prisma.bonusPrediction.findMany({
      where: { participantId: participant.id },
      include: { question: true },
    });

    res.json(predictions);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/pools/:poolId/bonus-questions
 * Create a bonus question (admin only).
 * Body: { question: string, points?: number, deadline: string }
 */
router.post('/questions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) {
      throw new AppError('POOL_NOT_FOUND', 'Quiniela no encontrada', 404);
    }
    if (pool.adminId !== userId) {
      throw new AppError('NOT_ADMIN', 'Solo el administrador puede realizar esta acción', 403);
    }

    const { question, points = 10, deadline } = req.body;

    if (!question || typeof question !== 'string') {
      throw new AppError('INVALID_QUESTION', 'La pregunta es requerida');
    }
    if (!deadline) {
      throw new AppError('INVALID_DEADLINE', 'La fecha límite es requerida');
    }

    const bonusQuestion = await prisma.bonusQuestion.create({
      data: {
        poolId,
        question: question.trim(),
        points,
        deadline: new Date(deadline),
      },
    });

    res.status(201).json(bonusQuestion);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/pools/:poolId/bonus-questions/:questionId/resolve
 * Set the correct answer and calculate points (admin only).
 * Body: { correctAnswer: string }
 */
router.patch('/questions/:questionId/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;
    const questionId = req.params.questionId as string;

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool || pool.adminId !== userId) {
      throw new AppError('NOT_ADMIN', 'Solo el administrador puede realizar esta acción', 403);
    }

    const { correctAnswer } = req.body;
    if (!correctAnswer || typeof correctAnswer !== 'string') {
      throw new AppError('INVALID_ANSWER', 'La respuesta correcta es requerida');
    }

    // Update the question with the correct answer
    const question = await prisma.bonusQuestion.update({
      where: { id: questionId },
      data: { correctAnswer: correctAnswer.trim() },
    });

    // Calculate points for all predictions on this question
    const predictions = await prisma.bonusPrediction.findMany({
      where: { questionId },
    });

    for (const pred of predictions) {
      const earned =
        pred.answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
          ? question.points
          : 0;

      await prisma.bonusPrediction.update({
        where: { id: pred.id },
        data: { pointsEarned: earned },
      });

      // Update participant totals
      if (earned > 0) {
        await prisma.participant.update({
          where: { id: pred.participantId },
          data: { totalPoints: { increment: earned } },
        });
      }
    }

    res.json({ question, resolvedPredictions: predictions.length });
  } catch (err) {
    next(err);
  }
});

export default router;
