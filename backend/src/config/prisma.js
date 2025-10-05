const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Prisma v5 removed $use middleware; guard to avoid crashes in dev restarts
if (typeof prisma.$use === 'function') {
  prisma.$use(async (params, next) => {
    return next(params);
  });
}

module.exports = prisma;
