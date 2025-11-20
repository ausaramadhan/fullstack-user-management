import { PrismaClient, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Seed Process...');

  // ==============================
  // 1. Create Admin Account
  // ==============================
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin123' },
    update: {},
    create: {
      name: 'Administrator',
      username: 'admin123',
      password_hash: adminPasswordHash,
      role: Role.admin,
      created_by: 'system',
    }
  });

  console.log(' Admin created:', admin.username);

  // ==============================
  // 2. Create 5000 Dummy Users
  // ==============================
  console.log(' Seeding 5000 dummy users... (please wait)');

  const users: any[] = [];
  const dummyPasswordHash = bcrypt.hashSync('password123', 10);

  for (let i = 0; i < 5000; i++) {
    users.push({
      name: faker.person.fullName(),
      username: faker.internet.username() + '_' + i,
      password_hash: dummyPasswordHash,
      role: Role.user,
      created_by: String(admin.id),
      updated_by: null,
      created_at: faker.date.past(),
      updated_at: new Date(),
    });
  }

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log('✅ 5000 Users created.');

  console.log(' Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error while seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

