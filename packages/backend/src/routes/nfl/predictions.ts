import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { AppError } from '../../errors/AppError.js';
import { NflPick } from '../../domain/nflScoring.js';

const router = Router({ mergeParams: true });

const VALID_PICKS: NflPick[] = ['HOME', 'AWAY', 'TIE'];

/**
 * POST /api/nfl/pools/:poolId/predictions
 * Create a prediction for an NFL match.
 * Body: { matchId: string, pick: 'HOME' | 'AWAY' | 'TIE' }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;
    const { matchId, pick } = req.body;

    // Validate pick
    if (!pick || !VALID_PICKS.includes(pick)) {
      throw new AppError(
        'INVALID_PICK',
        'El pronóstico debe ser HOME, AWAY o TIE'
      );
    }

    // Validate participant belongs to this pool
    const participant = await prisma.nflParticipant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (!participant) {
      throw new AppError('NOT_PARTICIPANT', 'No eres participante de esta quiniela NFL', 403);
    }

    // Get match and validate not started
    const match = await prisma.nflMatch.findUnique({ where: { id: matchId } });
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

    // Check if prediction already exists
    const existing = await prisma.nflPrediction.findUnique({
      where: { participantId_matchId: { participantId: participant.id, matchId } },
    });

    if (existing) {
      throw new AppError(
        'PREDICTION_EXISTS',
        'Ya tienes un pronóstico para este partido. Usa PUT para modificarlo.',
        409
      );
    }

    const prediction = await prisma.nflPrediction.create({
      data: {
        participantId: participant.id,
        matchId,
        pick,
      },
    });

    res.status(201).json(prediction);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/nfl/pools/:poolId/predictions/:matchId
 * Update an existing NFL prediction.
 * Body: { pick: 'HOME' | 'AWAY' | 'TIE' }
 */
router.put('/:matchId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;
    const matchId = req.params.matchId as string;
    const { pick } = req.body;

    // Validate pick
    if (!pick || !VALID_PICKS.includes(pick)) {
      throw new AppError(
        'INVALID_PICK',
        'El pronóstico debe ser HOME, AWAY o TIE'
      );
    }

    // Validate participant
    const participant = await prisma.nflParticipant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (!participant) {
      throw new AppError('NOT_PARTICIPANT', 'No eres participante de esta quiniela NFL', 403);
    }

    // Get match and validate not started
    const match = await prisma.nflMatch.findUnique({ where: { id: matchId } });
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

    const prediction = await prisma.nflPrediction.update({
      where: { participantId_matchId: { participantId: participant.id, matchId } },
      data: { pick },
    });

    res.json(prediction);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/nfl/pools/:poolId/predictions/me
 * Get my NFL predictions for this pool.
 * Query params: week (optional)
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;
    const weekParam = req.query.week as string | undefined;

    const participant = await prisma.nflParticipant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    if (!participant) {
      throw new AppError('NOT_PARTICIPANT', 'No eres participante de esta quiniela NFL', 403);
    }

    const matchWhere = weekParam ? { week: parseInt(weekParam, 10) } : {};

    const predictions = await prisma.nflPrediction.findMany({
      where: {
        participantId: participant.id,
        match: matchWhere,
      },
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
