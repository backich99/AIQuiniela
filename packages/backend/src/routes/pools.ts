import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { syncUser } from '../middleware/syncUser.js';
import { generateInvitationCode } from '../domain/invitationCode.js';
import { AppError } from '../errors/AppError.js';

const router = Router();

// All pool routes require authentication
router.use(requireAuth);
router.use(syncUser);

/**
 * GET /api/pools
 * List all pools the authenticated user belongs to.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const participants = await prisma.participant.findMany({
      where: { userId },
      include: {
        pool: {
          include: { scoringRules: true },
        },
      },
    });

    const pools = participants.map((p) => ({
      id: p.pool.id,
      name: p.pool.name,
      invitationCode: p.pool.invitationCode,
      role: p.pool.adminId === userId ? 'admin' : 'participant',
    }));

    res.json(pools);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/pools
 * Create a new pool (quiniela).
 * Body: { name: string, scoringRules?: { exactPoints, partialPoints, oneTeamPoints } }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { name, scoringRules } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('INVALID_POOL_NAME', 'El nombre de la quiniela es requerido');
    }

    const invitationCode = await generateInvitationCode();

    const pool = await prisma.pool.create({
      data: {
        name: name.trim(),
        invitationCode,
        adminId: userId,
        scoringRules: {
          create: {
            exactPoints: scoringRules?.exactPoints ?? 5,
            partialPoints: scoringRules?.partialPoints ?? 3,
            oneTeamPoints: scoringRules?.oneTeamPoints ?? 1,
          },
        },
        // Auto-add the creator as a participant
        participants: {
          create: {
            userId,
            displayName: 'Admin',
          },
        },
      },
      include: {
        scoringRules: true,
      },
    });

    res.status(201).json(pool);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/pools/join
 * Join an existing pool using an invitation code.
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

    const pool = await prisma.pool.findUnique({
      where: { invitationCode },
    });

    if (!pool) {
      throw new AppError('INVALID_INVITATION_CODE', 'El código de invitación no es válido');
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.participant.findUnique({
      where: { userId_poolId: { userId, poolId: pool.id } },
    });

    if (existingParticipant) {
      throw new AppError(
        'ALREADY_PARTICIPANT',
        'Ya eres participante de esta quiniela',
        409
      );
    }

    // Check if display name is unique in the pool
    const existingName = await prisma.participant.findUnique({
      where: { poolId_displayName: { poolId: pool.id, displayName: displayName.trim() } },
    });

    if (existingName) {
      throw new AppError(
        'DUPLICATE_DISPLAY_NAME',
        'Ya existe un participante con ese nombre en esta quiniela',
        409
      );
    }

    const participant = await prisma.participant.create({
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
 * GET /api/pools/:id
 * Get pool details.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const pool = await prisma.pool.findUnique({
      where: { id },
      include: {
        scoringRules: true,
        participants: {
          select: { id: true, displayName: true, totalPoints: true },
        },
      },
    });

    if (!pool) {
      throw new AppError('POOL_NOT_FOUND', 'Quiniela no encontrada', 404);
    }

    res.json(pool);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/pools/:id/scoring
 * Update scoring rules (admin only).
 * Body: { exactPoints?: number, partialPoints?: number, oneTeamPoints?: number }
 */
router.patch('/:id/scoring', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const id = req.params.id as string;
    const { exactPoints, partialPoints, oneTeamPoints } = req.body;

    const pool = await prisma.pool.findUnique({ where: { id } });

    if (!pool) {
      throw new AppError('POOL_NOT_FOUND', 'Quiniela no encontrada', 404);
    }

    if (pool.adminId !== userId) {
      throw new AppError('NOT_ADMIN', 'Solo el administrador puede realizar esta acción', 403);
    }

    // Validate that points are positive integers
    const values = { exactPoints, partialPoints, oneTeamPoints };
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) {
        if (!Number.isInteger(value) || value <= 0) {
          throw new AppError(
            'INVALID_SCORING_RULES',
            `${key} debe ser un entero positivo`
          );
        }
      }
    }

    const scoringRules = await prisma.scoringRules.upsert({
      where: { poolId: id },
      update: {
        ...(exactPoints !== undefined && { exactPoints }),
        ...(partialPoints !== undefined && { partialPoints }),
        ...(oneTeamPoints !== undefined && { oneTeamPoints }),
      },
      create: {
        poolId: id,
        exactPoints: exactPoints ?? 5,
        partialPoints: partialPoints ?? 3,
        oneTeamPoints: oneTeamPoints ?? 1,
      },
    });

    res.json(scoringRules);
  } catch (err) {
    next(err);
  }
});

export default router;
