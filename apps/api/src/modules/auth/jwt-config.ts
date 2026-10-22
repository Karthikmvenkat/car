import { randomBytes } from 'crypto';

const developmentSecret = randomBytes(32).toString('hex');

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.trim().length < 32 || /change[-_ ]?in[-_ ]?production|change[-_ ]?me|your[-_ ]?(jwt|secret)|dev[-_ ]?secret/i.test(secret)) {
      throw new Error('Production requires a strong JWT_SECRET of at least 32 characters');
    }
  }
  // Development without configuration uses a per-process key, never a known
  // signing key. Restarts deliberately invalidate locally issued tokens.
  return secret || developmentSecret;
}
