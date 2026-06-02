import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { syncUser } from '../middleware/syncUser.js';
import { AppError } from '../errors/AppError.js';
import { calculatePoints } from '../domain/scoring.js';

const router = Router();

// All match routes require authentication
router.use(requireAuth);
router.use(syncUser);

/**
 * GET /api/matches
 * List matches with optional filters: group, phase, team
 * Query params: group, phase, team, page, limit
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { group, phase, team, page = '1', limit = '50' } = req.query;

    const where: Record<string, unknown> = {};

    if (group && typeof group === 'string') {
      where.group = group;
    }

    if (phase && typeof phase === 'string') {
      where.phase = phase;
    }

    if (team && typeof team === 'string') {
      where.OR = [{ homeTeam: team }, { awayTeam: team }];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: { result: true },
        orderBy: { startTime: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.match.count({ where }),
    ]);

    res.json({
      matches,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/:id
 * Get match detail with result if available.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { result: true },
    });

    if (!match) {
      throw new AppError('MATCH_NOT_FOUND', 'Partido no encontrado', 404);
    }

    res.json(match);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/matches/:id/result
 * Register official result (admin only).
 * Body: { homeGoals: number, awayGoals: number, penaltyWinner?: string }
 */
router.post('/:id/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const matchId = req.params.id as string;
    const { homeGoals, awayGoals, penaltyWinner } = req.body;

    // Find the match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new AppError('MATCH_NOT_FOUND', 'Partido no encontrado', 404);
    }

    // Validate match has started
    if (new Date() < match.startTime) {
      throw new AppError(
        'MATCH_NOT_STARTED',
        'No se puede registrar resultado de un partido que no ha comenzado',
        409,
        { matchId, startTime: match.startTime.toISOString() }
      );
    }

    // Validate goals
    if (!Number.isInteger(homeGoals) || homeGoals < 0) {
      throw new AppError('INVALID_GOALS', 'Los goles deben ser números enteros no negativos');
    }
    if (!Number.isInteger(awayGoals) || awayGoals < 0) {
      throw new AppError('INVALID_GOALS', 'Los goles deben ser números enteros no negativos');
    }

    // Check admin permission — find any pool where this user is admin
    const adminPools = await prisma.pool.findMany({
      where: { adminId: userId },
      select: { id: true },
    });

    if (adminPools.length === 0) {
      throw new AppError('NOT_ADMIN', 'Solo el administrador puede realizar esta acción', 403);
    }

    // Check if result already exists
    const existingResult = await prisma.matchResult.findUnique({
      where: { matchId },
    });

    if (existingResult) {
      throw new AppError('RESULT_EXISTS', 'Este partido ya tiene un resultado registrado. Use PUT para modificar.', 409);
    }

    // Create result
    const result = await prisma.matchResult.create({
      data: {
        matchId,
        homeGoals,
        awayGoals,
        penaltyWinner: penaltyWinner || null,
      },
    });

    // Recalculate points for all pools
    await recalculatePointsForMatch(matchId, homeGoals, awayGoals);

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/matches/:id/result
 * Modify official result (admin only). Recalculates all affected points.
 * Body: { homeGoals: number, awayGoals: number, penaltyWinner?: string }
 */
router.put('/:id/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const matchId = req.params.id as string;
    const { homeGoals, awayGoals, penaltyWinner } = req.body;

    // Find the match
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new AppError('MATCH_NOT_FOUND', 'Partido no encontrado', 404);
    }

    // Validate goals
    if (!Number.isInteger(homeGoals) || homeGoals < 0) {
      throw new AppError('INVALID_GOALS', 'Los goles deben ser números enteros no negativos');
    }
    if (!Number.isInteger(awayGoals) || awayGoals < 0) {
      throw new AppError('INVALID_GOALS', 'Los goles deben ser números enteros no negativos');
    }

    // Check admin
    const adminPools = await prisma.pool.findMany({
      where: { adminId: userId },
      select: { id: true },
    });
    if (adminPools.length === 0) {
      throw new AppError('NOT_ADMIN', 'Solo el administrador puede realizar esta acción', 403);
    }

    // Update result
    const result = await prisma.matchResult.update({
      where: { matchId },
      data: { homeGoals, awayGoals, penaltyWinner: penaltyWinner || null },
    });

    // Recalculate all points
    await recalculatePointsForMatch(matchId, homeGoals, awayGoals);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Recalculates points for all predictions on a given match.
 * Updates pointsEarned on each Prediction and recalculates Participant totals.
 */
async function recalculatePointsForMatch(
  matchId: string,
  homeGoals: number,
  awayGoals: number
): Promise<void> {
  // Get all predictions for this match with their participant's pool scoring rules
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    include: {
      participant: {
        include: {
          pool: {
            include: { scoringRules: true },
          },
        },
      },
    },
  });

  const result = { homeGoals, awayGoals };

  for (const prediction of predictions) {
    const rules = prediction.participant.pool.scoringRules || {
      exactPoints: 5,
      partialPoints: 3,
      oneTeamPoints: 1,
    };

    const points = calculatePoints(
      { homeGoals: prediction.homeGoals, awayGoals: prediction.awayGoals },
      result,
      rules
    );

    // Update the prediction's pointsEarned
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { pointsEarned: points },
    });
  }

  // Recalculate totals for affected participants
  const participantIds = [...new Set(predictions.map((p) => p.participantId))];

  for (const participantId of participantIds) {
    const allPredictions = await prisma.prediction.findMany({
      where: { participantId, pointsEarned: { not: null } },
      include: {
        participant: {
          include: { pool: { include: { scoringRules: true } } },
        },
      },
    });

    const rules = allPredictions[0]?.participant.pool.scoringRules || {
      exactPoints: 5,
      partialPoints: 3,
      oneTeamPoints: 1,
    };

    let totalPoints = 0;
    let exactCount = 0;
    let partialCount = 0;

    for (const pred of allPredictions) {
      const earned = pred.pointsEarned!;
      totalPoints += earned;
      if (earned === rules.exactPoints) exactCount++;
      else if (earned === rules.partialPoints) partialCount++;
    }

    // Add bonus points
    const bonusPredictions = await prisma.bonusPrediction.findMany({
      where: { participantId, pointsEarned: { not: null } },
    });
    for (const bp of bonusPredictions) {
      totalPoints += bp.pointsEarned!;
    }

    await prisma.participant.update({
      where: { id: participantId },
      data: { totalPoints, exactCount, partialCount },
    });
  }
}

export default router;
