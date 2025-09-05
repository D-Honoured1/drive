/**
 * Prisma client singleton.
 * Import this file where you need Prisma.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
