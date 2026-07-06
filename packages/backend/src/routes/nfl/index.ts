import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { syncUser } from '../../middleware/syncUser.js';
import poolsRouter from './pools.js';
import matchesRouter from './matches.js';
import predictionsRouter from './predictions.js';
import leaderboardRouter from './leaderboard.js';
import adminRouter from './admin.js';

const router = Router();

// All NFL routes require authentication
router.use(requireAuth);
router.use(syncUser);

router.use('/pools', poolsRouter);
router.use('/pools/:poolId/matches', matchesRouter);
router.use('/pools/:poolId/predictions', predictionsRouter);
router.use('/pools/:poolId/leaderboard', leaderboardRouter);
router.use('/admin', adminRouter);

export default router;
