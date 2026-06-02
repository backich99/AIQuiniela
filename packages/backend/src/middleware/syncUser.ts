import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from './auth.js';

/**
 * Middleware that ensures the authenticated Supabase user exists in the local User table.
 * If it's the user's first request after registering in Supabase, it creates the record.
 * Must be used AFTER requireAuth middleware.
 */
export async function syncUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, userEmail } = req as AuthenticatedRequest;

    // Upsert: create if not exists, do nothing if already exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {}, // No-op if user already exists
      create: {
        id: userId,
        email: userEmail,
      },
    });

    next();
  } catch (err) {
    next(err);
  }
}
