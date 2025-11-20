import { login, refreshToken } from '../services/auth.service';
import { prisma, redis } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../config/database', () => ({
    prisma: { user: { findUnique: jest.fn() } },
    redis: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
}));

jest.mock('bcryptjs', () => ({ compareSync: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

describe('AuthService', () => {
    beforeEach(() => jest.clearAllMocks());

    // --- LOGIN TEST ---
    describe('login', () => {
        // Input sekarang berupa satu objek
        const input = { username: 'admin', password: 'password123' };

        it('should login successfully', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, password_hash: 'hash', role: 'admin' });
            (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
            
            await login(input);
            expect(redis.set).toHaveBeenCalled();
        });
        
        it('should throw error on invalid credentials', async () => {
             (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
             await expect(login(input)).rejects.toThrow('username atau password salah');
        });
    });

    // --- REFRESH TOKEN TEST ---
    describe('refreshToken', () => {
        it('should rotate tokens successfully', async () => {
            (redis.get as jest.Mock).mockResolvedValue('1');
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: 'admin' });
            
            await refreshToken('old_token');
            
            expect(redis.del).toHaveBeenCalledWith('refresh_token:old_token');
            expect(redis.set).toHaveBeenCalled();
        });
    });
});