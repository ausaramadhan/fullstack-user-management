import { prisma, redis } from '../config/database';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createAuditLog } from './audit.service';
import { Parser } from 'json2csv';

export const getAllUsers = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const cacheKey = `users:${JSON.stringify(query)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const where: Prisma.UserWhereInput = {
    deleted_at: null,
    AND: [
      query.q ? { OR: [{ name: { contains: query.q } }, { username: { contains: query.q } }] } : {},
      query.role ? { role: query.role } : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: { id: true, name: true, username: true, role: true, created_at: true },
      orderBy: { [query.sortBy || 'created_at']: query.sortDir || 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  const result = {
    data: users,
    metadata: {
      totalData: total,
      totalPage: Math.ceil(total / limit),
      currentPage: page,
      perPage: limit,
    },
  };

  await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
  return result;
};

export const createUser = async (data: any, actorId: number) => {
  if (data.password !== data.confirm_password) throw new Error('Password tidak cocok');
  const hashed = bcrypt.hashSync(data.password, 10);

  return await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        username: data.username,
        password_hash: hashed,
        role: data.role,
        created_by: actorId.toString(),
      },
    });
    await createAuditLog(tx, actorId, 'CREATE', newUser.id, undefined, newUser);

    // Invalidate cache
    const keys = await redis.keys('users:*');
    if (keys.length > 0) await redis.del(keys);

    return newUser;
  });
};

export const deleteUser = async (id: number, adminPass: string, actorId: number) => {
  const admin = await prisma.user.findUnique({ where: { id: actorId } });
  if (!admin || !bcrypt.compareSync(adminPass, admin.password_hash))
    throw new Error('Password admin salah');

  // Cek user target ada atau tidak sebelum transaksi
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) throw new Error('User tidak ditemukan');

  return await prisma.$transaction(async (tx) => {
    const deleted = await tx.user.update({ where: { id }, data: { deleted_at: new Date() } });
    await createAuditLog(tx, actorId, 'DELETE', id, targetUser, { deleted_at: new Date() });

    // Invalidate cache: cari semua key yang berawalan "users:" dan hapus
    const keys = await redis.keys('users:*');
    if (keys.length > 0) await redis.del(keys);

    return { message: 'User deleted successfully' };
  });
};

export const exportCsv = async (query: any) => {
  const where: Prisma.UserWhereInput = {
    deleted_at: null,
    AND: [
      query.q ? { OR: [{ name: { contains: query.q } }, { username: { contains: query.q } }] } : {},
      query.role ? { role: query.role } : {},
    ],
  };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, username: true, role: true, created_at: true },
  });

  const parser = new Parser({ fields: ['id', 'name', 'username', 'role', 'created_at'] });
  return parser.parse(users);
};

// 1. FIX: Tambahkan Caching di Detail User
export const getUserById = async (id: number) => {
  const cacheKey = `user:${id}`; // Key unik per user

  // A. Cek Redis
  const cachedUser = await redis.get(cacheKey);
  if (cachedUser) return JSON.parse(cachedUser);

  // B. Ambil dari DB jika tidak ada di cache
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) throw new Error('User not found');

  // C. Simpan ke Redis (TTL 60 detik sesuai soal)
  await redis.set(cacheKey, JSON.stringify(user), 'EX', 60);

  return user;
};

// 2. FIX: Update User harus menghapus Cache Detail & List
export const updateUser = async (id: number, data: any, actorId: number) => {
  return await prisma.$transaction(async (tx) => {
    const oldUser = await tx.user.findUnique({ where: { id } });
    if (!oldUser) throw new Error('User not found');

    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        name: data.name,
        username: data.username,
        role: data.role,
        updated_by: actorId.toString(),
      },
    });

    await createAuditLog(tx, actorId, 'UPDATE', id, oldUser, updatedUser);

    // HAPUS CACHE LIST (Agar data di tabel update)
    const keys = await redis.keys('users:*');
    if (keys.length > 0) await redis.del(keys);

    // HAPUS CACHE DETAIL (Agar saat diklik edit lagi datanya baru)
    await redis.del(`user:${id}`);

    return updatedUser;
  });
};
