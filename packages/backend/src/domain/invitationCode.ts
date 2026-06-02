import { prisma } from '../lib/prisma.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 8;

/**
 * Generates a random alphanumeric string of 8 characters.
 */
export function generateRandomCode(): string {
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

/**
 * Generates a unique invitation code by checking against existing codes in the database.
 * Retries up to 10 times if a collision occurs.
 */
export async function generateInvitationCode(): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRandomCode();
    const existing = await prisma.pool.findUnique({
      where: { invitationCode: code },
    });
    if (!existing) {
      return code;
    }
  }

  throw new Error('Failed to generate unique invitation code after maximum attempts');
}
