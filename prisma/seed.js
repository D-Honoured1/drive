/**
 * Seed script for prisma.
 * Creates an admin demo user and a sample folder.
 *
 * Usage:
 *   node prisma/seed.js
 *
 * Make sure DATABASE_URL and ADMIN_PASSWORD (optional) are set in .env
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  const email = 'demo@example.com';

  // only create demo user if not exists
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log('Demo user already exists:', email);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: 'Demo User',
      folders: {
        create: [
          {
            name: 'Documents'
          }
        ]
      }
    },
    include: {
      folders: true
    }
  });

  console.log('Created demo user:', user.email);
  console.log('Password:', adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
