import { prisma, redis } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Login menerima satu objek input agar sesuai dengan tes
export const login = async (input: { username: string; password: string }) => {
  const { username, password } = input;
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw new Error('username atau password salah');
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '60m' });
  const refreshToken = crypto.randomUUID();

  // Simpan refresh token di Redis (7 hari)
  await redis.set(`refresh_token:${refreshToken}`, user.id.toString(), 'EX', 7 * 24 * 60 * 60);

  return {
    token,
    refreshToken,
    user: { id: user.id, name: user.name, role: user.role },
    expiredAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
};

export const refreshToken = async (token: string) => {
  const userId = await redis.get(`refresh_token:${token}`);
  if (!userId) throw new Error('Invalid or expired refresh token');

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) throw new Error('User not found');

  // Hapus token lama (Rotation)
  await redis.del(`refresh_token:${token}`);

  const newToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '60m' });
  const newRefreshToken = crypto.randomUUID();

  await redis.set(`refresh_token:${newRefreshToken}`, user.id.toString(), 'EX', 7 * 24 * 60 * 60);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
    expiredAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
};

export const logout = async (refreshToken: string) => {
  await redis.del(`refresh_token:${refreshToken}`);
};
