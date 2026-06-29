import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { syncUser } from '../middleware/syncUser.js';
import { AppError } from '../errors/AppError.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(syncUser);

/**
 * GET /api/pools/:poolId/all-predictions
 * Returns all predictions from all participants for matches that have already started.
 * Used for the cross-comparison table.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poolId = req.params.poolId as string;

    // Verify pool exists
    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) {
      throw new AppError('POOL_NOT_FOUND', 'Quiniela no encontrada', 404);
    }

    const now = new Date();

    // Get matches that have already started, ordered by startTime
    const matches = await prisma.match.findMany({
      where: { startTime: { lte: now } },
      include: { result: true },
      orderBy: { startTime: 'asc' },
    });

    // Get all participants in this pool
    const participants = await prisma.participant.findMany({
      where: { poolId },
      select: { id: true, displayName: true, totalPoints: true },
      orderBy: { totalPoints: 'desc' },
    });

    // Get all predictions for started matches from participants in this pool
    const participantIds = participants.map(p => p.id);
    const predictions = await prisma.prediction.findMany({
      where: {
        participantId: { in: participantIds },
        matchId: { in: matches.map(m => m.id) },
      },
    });

    // Build a lookup: participantId -> matchId -> prediction
    const predMap: Record<string, Record<string, { homeGoals: number; awayGoals: number }>> = {};
    for (const pred of predictions) {
      if (!predMap[pred.participantId]) {
        predMap[pred.participantId] = {};
      }
      predMap[pred.participantId][pred.matchId] = {
        homeGoals: pred.homeGoals,
        awayGoals: pred.awayGoals,
      };
    }

    res.json({
      matches: matches.map(m => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        phase: m.phase,
        startTime: m.startTime,
        result: m.result ? { homeGoals: m.result.homeGoals, awayGoals: m.result.awayGoals } : null,
      })),
      participants: participants.map(p => ({
        id: p.id,
        displayName: p.displayName,
        totalPoints: p.totalPoints,
      })),
      predictions: predMap,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
