const { prisma } = require('../../lib/prisma');

class AuditRepository {
  async create(data) {
    return prisma.auditLog.create({ data });
  }

  async list(filters, page, limit) {
    const where = {
      appId: filters.appId,
      eventType: filters.eventType,
      targetType: filters.targetType,
      targetValue: filters.targetValue,
      status: filters.status,
      createdAt:
        filters.from || filters.to
          ? {
              gte: filters.from,
              lte: filters.to,
            }
          : undefined,
    };

    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}

module.exports = new AuditRepository();
