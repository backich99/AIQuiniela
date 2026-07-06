import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { AppError } from '../../errors/AppError.js';
import { syncNflResults, recalculateNflPoints } from '../../services/nflEspnSync.js';

const router = Router();

/**
 * POST /api/nfl/admin/results
 * Register a result for an NFL match (admin only).
 * Body: { matchId: string, homeScore: number, awayScore: number }
 */
router.post('/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { matchId, homeScore, awayScore } = req.body;

    // Check admin permission
    const adminPools = await prisma.nflPool.findMany({
      where: { adminId: userId },
      select: { id: true },
    });

    if (adminPools.length === 0) {
      throw new AppError('NOT_ADMIN', 'Solo el administrador puede realizar esta acción', 403);
    }

    // Find match
    const match = await prisma.nflMatch.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new AppError('MATCH_NOT_FOUND', 'Partido no encontrado', 404);
    }

    // Validate match has started
    if (new Date() < match.startTime) {
      throw new AppError(
        'MATCH_NOT_STARTED',
        'No se puede registrar resultado de un partido que no ha comenzado',
        409
      );
    }

    // Validate scores
    if (!Number.isInteger(homeScore) || homeScore < 0) {
      throw new AppError('INVALID_SCORE', 'El marcador debe ser un entero no negativo');
    }
    if (!Number.isInteger(awayScore) || awayScore < 0) {
      throw new AppError('INVALID_SCORE', 'El marcador debe ser un entero no negativo');
    }

    // Check if result already exists
    const existingResult = await prisma.nflResult.findUnique({
      where: { matchId },
    });

    if (existingResult) {
      throw new AppError(
        'RESULT_EXISTS',
        'Este partido ya tiene un resultado registrado. Use PUT para modificar.',
        409
      );
    }

    // Create result
    const result = await prisma.nflResult.create({
      data: { matchId, homeScore, awayScore },
    });

    // Recalculate points
    await recalculateNflPoints(matchId);

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/nfl/admin/results/:matchId
 * Correct an NFL match result (admin only). Recalculates all affected points.
 * Body: { homeScore: number, awayScore: number }
 */
router.put('/results/:matchId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const matchId = req.params.matchId as string;
    const { homeScore, awayScore } = req.body;

    // Check admin
    const adminPools = await prisma.nflPool.findMany({
      where: { adminId: userId },
      select: { id: true },
    });

    if (adminPools.length === 0) {
      throw new AppError('NOT_ADMIN', 'Solo el administrador puede realizar esta acción', 403);
    }

    // Validate scores
    if (!Number.isInteger(homeScore) || homeScore < 0) {
      throw new AppError('INVALID_SCORE', 'El marcador debe ser un entero no negativo');
    }
    if (!Number.isInteger(awayScore) || awayScore < 0) {
      throw new AppError('INVALID_SCORE', 'El marcador debe ser un entero no negativo');
    }

    // Update result
    const result = await prisma.nflResult.update({
      where: { matchId },
      data: { homeScore, awayScore },
    });

    // Recalculate points
    await recalculateNflPoints(matchId);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/nfl/admin/sync
 * Trigger manual ESPN NFL sync (admin only).
 */
router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    // Check admin
    const adminPools = await prisma.nflPool.findMany({
      where: { adminId: userId },
      select: { id: true },
    });

    if (adminPools.length === 0) {
      throw new AppError('NOT_ADMIN', 'Solo el administrador puede sincronizar resultados', 403);
    }

    const result = await syncNflResults();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
