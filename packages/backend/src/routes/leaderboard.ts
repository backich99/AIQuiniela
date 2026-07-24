import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { syncUser } from '../middleware/syncUser.js';
import { AppError } from '../errors/AppError.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(syncUser);

/**
 * GET /api/pools/:poolId/leaderboard
 * Get the leaderboard for a pool, ordered by totalPoints DESC, then exactCount DESC.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poolId = req.params.poolId as string;

    // Verify pool exists
    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) {
      throw new AppError('POOL_NOT_FOUND', 'Quiniela no encontrada', 404);
    }

    const participants = await prisma.participant.findMany({
      where: { poolId },
      orderBy: [{ totalPoints: 'desc' }, { exactCount: 'desc' }],
      select: {
        id: true,
        displayName: true,
        totalPoints: true,
        exactCount: true,
        partialCount: true,
        bonusPredictions: {
          where: { pointsEarned: { not: null } },
          select: { pointsEarned: true, question: { select: { question: true } }, answer: true },
        },
      },
    });

    // Assign positions and calculate bonus points
    const leaderboard = participants.map((p, index) => {
      const bonusPoints = p.bonusPredictions.reduce((sum, bp) => sum + (bp.pointsEarned ?? 0), 0);
      const bonusDetails = p.bonusPredictions.map(bp => ({
        question: bp.question.question,
        answer: bp.answer,
        points: bp.pointsEarned ?? 0,
      }));
      return {
        position: index + 1,
        id: p.id,
        displayName: p.displayName,
        totalPoints: p.totalPoints,
        exactCount: p.exactCount,
        partialCount: p.partialCount,
        bonusPoints,
        bonusDetails,
      };
    });

    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
});

export default router;
