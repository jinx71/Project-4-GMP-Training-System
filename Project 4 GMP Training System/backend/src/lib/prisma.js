const { PrismaClient } = require('@prisma/client');

// Single shared client instance
const prisma = new PrismaClient();

module.exports = prisma;
