import { getAllUsers, createUser, deleteUser } from '../services/user.service';
import { prisma, redis } from '../config/database';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../config/database', () => {
  const mPrisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return {
    prisma: mPrisma,
    redis: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    },
  };
});

jest.mock('../services/audit.service', () => ({ createAuditLog: jest.fn() }));
jest.mock('bcryptjs', () => ({ hashSync: jest.fn(), compareSync: jest.fn() }));

const mockDateString = new Date().toISOString();
const mockUser = {
  id: 1,
  name: 'Test',
  username: 'test',
  role: 'admin',
  created_at: mockDateString,
  updated_at: mockDateString,
};

describe('UserService', () => {
  afterEach(() => jest.clearAllMocks());

  // --- GET ALL USERS ---
  describe('getAllUsers', () => {
    it('should return data from Prisma (Cache Miss)', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await getAllUsers({});
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  // --- CREATE USER ---
  describe('createUser', () => {
    // ... (Tambahkan tes createUser yang sudah ada jika perlu, atau biarkan kosong jika sudah tercover)
  });

  // --- DELETE USER (FOKUS PERBAIKAN) ---
  describe('deleteUser', () => {
    const targetUserId = 10;
    const actorId = 1;
    const adminPassword = 'adminpassword';

    const mockAdminUser = { id: actorId, password_hash: 'hash', role: 'admin' };
    const mockTargetUser = { id: targetUserId, username: 'target' };

    beforeEach(() => {
      jest.clearAllMocks();

      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

      (prisma.user.findUnique as jest.Mock).mockImplementation((params) => {
        if (params.where.id === actorId) return mockAdminUser;
        if (params.where.id === targetUserId) return mockTargetUser;
        return null;
      });

      // FIX: Mock transaction implementation agar menggunakan 'prisma' object yang sama
      // Sehingga 'tx.user.update' yang dipanggil di service adalah 'prisma.user.update' yang kita spy
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (redis.keys as jest.Mock).mockResolvedValue(['users:key1']);
    });

    it('should successfully soft delete and invalidate cache', async () => {
      await deleteUser(targetUserId, adminPassword, actorId);

      // Verifikasi update dipanggil
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: targetUserId },
          data: expect.objectContaining({ deleted_at: expect.any(Date) }),
        }),
      );

      // Verifikasi Cache dihapus
      expect(redis.keys).toHaveBeenCalledWith('users:*');
      expect(redis.del).toHaveBeenCalledWith(['users:key1']);
    });

    it('should throw error if target user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockImplementation((params) => {
        if (params.where.id === actorId) return mockAdminUser;
        return null;
      });

      await expect(deleteUser(targetUserId, adminPassword, actorId)).rejects.toThrow(
        'User tidak ditemukan',
      );
    });
  });
});
