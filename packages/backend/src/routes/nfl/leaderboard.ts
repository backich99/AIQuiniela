import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../errors/AppError.js';

const router = Router({ mergeParams: true });

/**
 * GET /api/nfl/pools/:poolId/leaderboard
 * Get the NFL leaderboard for a pool.
 * Query params: week (optional) — if provided, shows points for that week only.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poolId = req.params.poolId as string;
    const weekParam = req.query.week as string | undefined;

    // Verify pool exists
    const pool = await prisma.nflPool.findUnique({ where: { id: poolId } });
    if (!pool) {
      throw new AppError('POOL_NOT_FOUND', 'Quiniela NFL no encontrada', 404);
    }

    if (!weekParam) {
      // Total leaderboard
      const participants = await prisma.nflParticipant.findMany({
        where: { poolId },
        orderBy: { totalPoints: 'desc' },
        select: {
          id: true,
          displayName: true,
          totalPoints: true,
        },
      });

      const leaderboard = participants.map((p, index) => ({
        position: index + 1,
        ...p,
      }));

      res.json(leaderboard);
    } else {
      // Weekly leaderboard
      const week = parseInt(weekParam, 10);

      const participants = await prisma.nflParticipant.findMany({
        where: { poolId },
        include: {
          predictions: {
            where: {
              match: { week },
              pointsEarned: { not: null },
            },
          },
        },
      });

      const weeklyScores = participants
        .map((p) => ({
          id: p.id,
          displayName: p.displayName,
          weekPoints: p.predictions.reduce((sum, pred) => sum + (pred.pointsEarned ?? 0), 0),
        }))
        .sort((a, b) => b.weekPoints - a.weekPoints)
        .map((p, index) => ({ position: index + 1, ...p }));

      res.json(weeklyScores);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
