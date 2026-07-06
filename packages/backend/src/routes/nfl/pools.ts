import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { AppError } from '../../errors/AppError.js';
import { generateRandomCode } from '../../domain/invitationCode.js';

const router = Router();

/**
 * GET /api/nfl/pools
 * List all NFL pools the authenticated user belongs to.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const participants = await prisma.nflParticipant.findMany({
      where: { userId },
      include: { pool: true },
    });

    const pools = participants.map((p) => ({
      id: p.pool.id,
      name: p.pool.name,
      invitationCode: p.pool.invitationCode,
      season: p.pool.season,
      role: p.pool.adminId === userId ? 'admin' : 'participant',
    }));

    res.json(pools);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/nfl/pools
 * Create a new NFL pool.
 * Body: { name: string }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('INVALID_POOL_NAME', 'El nombre de la quiniela es requerido');
    }

    // Generate unique invitation code (check against NflPool table)
    let invitationCode = generateRandomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.nflPool.findUnique({
        where: { invitationCode },
      });
      if (!existing) break;
      invitationCode = generateRandomCode();
      attempts++;
    }

    const pool = await prisma.nflPool.create({
      data: {
        name: name.trim(),
        invitationCode,
        adminId: userId,
        participants: {
          create: {
            userId,
            displayName: 'Admin',
          },
        },
      },
      include: { participants: true },
    });

    res.status(201).json(pool);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/nfl/pools/join
 * Join an existing NFL pool using an invitation code.
 * Body: { invitationCode: string, displayName: string }
 */
router.post('/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { invitationCode, displayName } = req.body;

    if (!invitationCode || typeof invitationCode !== 'string') {
      throw new AppError('INVALID_INVITATION_CODE', 'El código de invitación no es válido');
    }

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      throw new AppError('INVALID_DISPLAY_NAME', 'El nombre de usuario es requerido');
    }

    const pool = await prisma.nflPool.findUnique({
      where: { invitationCode },
    });

    if (!pool) {
      throw new AppError('INVALID_INVITATION_CODE', 'El código de invitación no es válido');
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.nflParticipant.findUnique({
      where: { userId_poolId: { userId, poolId: pool.id } },
    });

    if (existingParticipant) {
      throw new AppError(
        'ALREADY_PARTICIPANT',
        'Ya eres participante de esta quiniela NFL',
        409
      );
    }

    // Check if display name is unique in the pool
    const existingName = await prisma.nflParticipant.findUnique({
      where: { poolId_displayName: { poolId: pool.id, displayName: displayName.trim() } },
    });

    if (existingName) {
      throw new AppError(
        'DUPLICATE_DISPLAY_NAME',
        'Ya existe un participante con ese nombre en esta quiniela',
        409
      );
    }

    const participant = await prisma.nflParticipant.create({
      data: {
        userId,
        poolId: pool.id,
        displayName: displayName.trim(),
      },
    });

    res.status(201).json({ pool, participant });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/nfl/pools/:poolId
 * Get NFL pool details.
 */
router.get('/:poolId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poolId = req.params.poolId as string;

    const pool = await prisma.nflPool.findUnique({
      where: { id: poolId },
      include: {
        participants: {
          select: { id: true, displayName: true, totalPoints: true },
        },
      },
    });

    if (!pool) {
      throw new AppError('POOL_NOT_FOUND', 'Quiniela NFL no encontrada', 404);
    }

    res.json(pool);
  } catch (err) {
    next(err);
  }
});

export default router;
