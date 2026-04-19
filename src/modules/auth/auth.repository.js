const { prisma } = require('../../lib/prisma');

class AuthRepository {
  async createRefreshToken(data) {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshTokenByHash(tokenHash) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { identity: true },
    });
  }

  async revokeRefreshToken(id) {
    return prisma.refreshToken.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllForIdentity(identityId, appId) {
    return prisma.refreshToken.updateMany({
      where: {
        identityId,
        appId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async countActiveRefreshTokens() {
    return prisma.refreshToken.count({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async deleteExpiredRefreshTokens(before) {
    return prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: before },
      },
    });
  }

  async deleteRevokedRefreshTokens(before) {
    return prisma.refreshToken.deleteMany({
      where: {
        isRevoked: true,
        revokedAt: { lt: before },
      },
    });
  }
}

module.exports = new AuthRepository();
