import { PrismaClient } from '@prisma/client';

// Menerima transaction client (tx) agar log tersimpan hanya jika transaksi utama sukses
export const createAuditLog = async (
  tx: any,
  actorId: number,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entityId: number,
  before: any,
  after: any,
) => {
  await tx.auditLog.create({
    data: {
      actor_id: actorId,
      entity: 'User',
      entity_id: entityId,
      action: action,
      // PERBAIKAN: Gunakan undefined jika data kosong, bukan null.
      before: before ? JSON.stringify(before) : undefined,
      after: after ? JSON.stringify(after) : undefined,
    },
  });
};
