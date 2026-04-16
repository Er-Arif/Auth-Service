const { PrismaClient } = require("@prisma/client");

const prisma = global.__authServicePrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__authServicePrisma = prisma;
}

module.exports = { prisma };
