import { randomBytes } from 'crypto';

export function generateRefreshToken() {
  return randomBytes(40).toString('hex');
}
