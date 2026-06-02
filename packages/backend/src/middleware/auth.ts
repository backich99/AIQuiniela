import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../errors/AppError.js';

/**
 * Extends the Express Request to include authenticated user info.
 */
export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
}

/**
 * Middleware that verifies the Supabase JWT from the Authorization header.
 * Extracts userId and email from the validated token and attaches them to the request.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'AUTH_REQUIRED',
        'Debes iniciar sesión para realizar esta acción',
        401
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw new AppError(
        'TOKEN_EXPIRED',
        'Tu sesión ha expirado, por favor inicia sesión nuevamente',
        401
      );
    }

    // Attach user info to request
    (req as AuthenticatedRequest).userId = user.id;
    (req as AuthenticatedRequest).userEmail = user.email || '';

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(
        new AppError(
          'AUTH_REQUIRED',
          'Debes iniciar sesión para realizar esta acción',
          401
        )
      );
    }
  }
}
