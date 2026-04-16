const { prisma } = require("../../lib/prisma");

class AppRepository {
  async findByAppId(appId) {
    return prisma.app.findUnique({
      where: { appId },
      include: { config: true },
    });
  }

  async createApp({ appId, name, appKeyHash, status, config }) {
    return prisma.app.create({
      data: {
        appId,
        name,
        appKeyHash,
        status,
        config: {
          create: config,
        },
      },
      include: { config: true },
    });
  }

  async updateApp(appId, data) {
    return prisma.app.update({
      where: { appId },
      data,
      include: { config: true },
    });
  }

  async updateConfig(appId, data) {
    return prisma.appConfig.update({
      where: { appId },
      data,
    });
  }

  async countApps() {
    return prisma.app.count();
  }
}

module.exports = new AppRepository();
