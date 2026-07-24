import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { getCurrentNflWeek } from '../../domain/nflWeek.js';

const router = Router({ mergeParams: true });

/**
 * GET /api/nfl/pools/:poolId/matches
 * List NFL matches for a given week.
 * Query params: week (optional, defaults to current NFL week)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const poolId = req.params.poolId as string;
    const weekParam = req.query.week as string | undefined;

    const week = weekParam ? parseInt(weekParam, 10) : getCurrentNflWeek();

    // Get the pool to know which league
    const pool = await prisma.nflPool.findUnique({ where: { id: poolId } });
    const league = pool?.league || 'NFL';

    // Get user's participant for this pool to include their predictions
    const participant = await prisma.nflParticipant.findUnique({
      where: { userId_poolId: { userId, poolId } },
    });

    const matches = await prisma.nflMatch.findMany({
      where: { week, league },
      include: {
        result: true,
        predictions: participant
          ? { where: { participantId: participant.id } }
          : false,
      },
      orderBy: { startTime: 'asc' },
    });

    // Map to include user's prediction inline
    const response = matches.map((m) => {
      const pred = Array.isArray(m.predictions) && m.predictions.length > 0
        ? m.predictions[0]
        : null;
      const { predictions: _preds, ...matchData } = m;
      return {
        ...matchData,
        myPrediction: pred
          ? { id: pred.id, pick: pred.pick, pointsEarned: pred.pointsEarned }
          : null,
      };
    });

    res.json({ week, matches: response });
  } catch (err) {
    next(err);
  }
});

export default router;
