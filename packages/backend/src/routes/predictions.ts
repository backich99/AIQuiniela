import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { syncUser } from '../middleware/syncUser.js';
import { AppError } from '../errors/AppError.js';

const router = Router({ mergeParams: true });

// All prediction routes require authentication
router.use(requireAuth);
router.use(syncUser);

/**
 * POST /api/pools/:poolId/predictions
 * Register a prediction for a match.
 * Body: { matchId: string, homeGoals: number, awayGoals: number, penaltyWinner?: string }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;
    const { matchId, homeGoals, awayGoals, penaltyWinner } = req.body;

    // Validate the participant belongs to this pool
    const participant = await prisma.participant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (!participant) {
      throw new AppError('NOT_PARTICIPANT', 'No eres participante de esta quiniela', 403);
    }

    // Validate goals
    if (!Number.isInteger(homeGoals) || homeGoals < 0) {
      throw new AppError('INVALID_GOALS', 'Los goles deben ser números enteros no negativos');
    }
    if (!Number.isInteger(awayGoals) || awayGoals < 0) {
      throw new AppError('INVALID_GOALS', 'Los goles deben ser números enteros no negativos');
    }

    // Get the match and validate it hasn't started
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new AppError('MATCH_NOT_FOUND', 'Partido no encontrado', 404);
    }

    if (new Date() >= match.startTime) {
      throw new AppError(
        'MATCH_ALREADY_STARTED',
        'No se puede pronosticar un partido que ya inició',
        409,
        { matchId, startTime: match.startTime.toISOString() }
      );
    }

    // Validate penalty winner for knockout matches with draw
    if (match.phase !== 'GROUPS' && homeGoals === awayGoals && !penaltyWinner) {
      throw new AppError(
        'PENALTY_WINNER_REQUIRED',
        'Debe indicar el ganador en penales para partidos de eliminación con empate'
      );
    }

    // Check if prediction already exists
    const existing = await prisma.prediction.findUnique({
      where: { participantId_matchId: { participantId: participant.id, matchId } },
    });

    if (existing) {
      throw new AppError(
        'PREDICTION_EXISTS',
        'Ya tienes un pronóstico para este partido. Usa PUT para modificarlo.',
        409
      );
    }

    const prediction = await prisma.prediction.create({
      data: {
        participantId: participant.id,
        matchId,
        homeGoals,
        awayGoals,
        penaltyWinner: penaltyWinner || null,
      },
    });

    res.status(201).json(prediction);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/pools/:poolId/predictions/:matchId
 * Modify an existing prediction.
 * Body: { homeGoals: number, awayGoals: number, penaltyWinner?: string }
 */
router.put('/:matchId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;
    const matchId = req.params.matchId as string;
    const { homeGoals, awayGoals, penaltyWinner } = req.body;

    // Validate participant
    const participant = await prisma.participant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (!participant) {
      throw new AppError('NOT_PARTICIPANT', 'No eres participante de esta quiniela', 403);
    }

    // Validate goals
    if (!Number.isInteger(homeGoals) || homeGoals < 0) {
      throw new AppError('INVALID_GOALS', 'Los goles deben ser números enteros no negativos');
    }
    if (!Number.isInteger(awayGoals) || awayGoals < 0) {
      throw new AppError('INVALID_GOALS', 'Los goles deben ser números enteros no negativos');
    }

    // Get match and validate not started
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new AppError('MATCH_NOT_FOUND', 'Partido no encontrado', 404);
    }

    if (new Date() >= match.startTime) {
      throw new AppError(
        'MATCH_ALREADY_STARTED',
        'No se puede pronosticar un partido que ya inició',
        409,
        { matchId, startTime: match.startTime.toISOString() }
      );
    }

    // Validate penalty winner for knockout
    if (match.phase !== 'GROUPS' && homeGoals === awayGoals && !penaltyWinner) {
      throw new AppError(
        'PENALTY_WINNER_REQUIRED',
        'Debe indicar el ganador en penales para partidos de eliminación con empate'
      );
    }

    const prediction = await prisma.prediction.update({
      where: { participantId_matchId: { participantId: participant.id, matchId } },
      data: {
        homeGoals,
        awayGoals,
        penaltyWinner: penaltyWinner || null,
      },
    });

    res.json(prediction);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/pools/:poolId/predictions/me
 * Get my predictions for a pool.
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

    const predictions = await prisma.prediction.findMany({
      where: { participantId: participant.id },
      include: {
        match: { include: { result: true } },
      },
      orderBy: { match: { startTime: 'asc' } },
    });

    res.json(predictions);
  } catch (err) {
    next(err);
  }
});

export default router;
