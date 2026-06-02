import { Router } from 'express';
import poolsRouter from './pools.js';
import matchesRouter from './matches.js';
import predictionsRouter from './predictions.js';
import leaderboardRouter from './leaderboard.js';
import bonusRouter from './bonus.js';

const router = Router();

router.use('/pools', poolsRouter);
router.use('/pools/:poolId/predictions', predictionsRouter);
router.use('/pools/:poolId/leaderboard', leaderboardRouter);
router.use('/pools/:poolId/bonus-predictions', bonusRouter);
router.use('/matches', matchesRouter);
router.use('/notifications', Router()); // Placeholder — implemented in task 11

export default router;
