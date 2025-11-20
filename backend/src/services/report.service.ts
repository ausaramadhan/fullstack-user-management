// src/services/report.service.ts

import { prisma } from '../config/database';

export const getActiveUserReport = async () => {
  // Memanggil Stored Procedure menggunakan $queryRaw
  const result = await prisma.$queryRaw`CALL GetActiveUserCountByRole()`;

  // Hasil dari stored procedure biasanya dikemas dalam array
  return result;
};
