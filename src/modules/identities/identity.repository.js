const { prisma } = require('../../lib/prisma');

class IdentityRepository {
  async upsertIdentity({ appId, identityType, identityValue, metadataJson }) {
    return prisma.identity.upsert({
      where: {
        appId_identityType_identityValue: {
          appId,
          identityType,
          identityValue,
        },
      },
      update: {
        isVerified: true,
        metadataJson,
      },
      create: {
        appId,
        identityType,
        identityValue,
        isVerified: true,
        metadataJson,
      },
    });
  }

  async findByIdAndApp(id, appId) {
    return prisma.identity.findFirst({
      where: { id, appId },
    });
  }

  async countIdentities() {
    return prisma.identity.count();
  }
}

module.exports = new IdentityRepository();
