const { prisma } = require("../../lib/prisma");

class OtpRepository {
  async createOtp(data) {
    return prisma.otpCode.create({ data });
  }

  async findLatestOtp({ appId, targetType, targetValue, purpose }) {
    return prisma.otpCode.findFirst({
      where: {
        appId,
        targetType,
        targetValue,
        purpose,
        isUsed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async countRecentByTarget({ appId, targetType, targetValue, since }) {
    return prisma.otpCode.count({
      where: {
        appId,
        targetType,
        targetValue,
        createdAt: { gte: since },
      },
    });
  }

  async countRecentByIp({ appId, ipAddress, since }) {
    return prisma.otpCode.count({
      where: {
        appId,
        ipAddress,
        createdAt: { gte: since },
      },
    });
  }

  async incrementAttempts(id) {
    return prisma.otpCode.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }

  async markUsed(id) {
    return prisma.otpCode.update({
      where: { id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });
  }

  async countOtpCodes() {
    return prisma.otpCode.count();
  }

  async deleteExpiredOtps(before) {
    return prisma.otpCode.deleteMany({
      where: {
        expiresAt: { lt: before },
      },
    });
  }
}

module.exports = new OtpRepository();
