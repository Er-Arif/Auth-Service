const auditRepository = require("./audit.repository");

class AuditService {
  async logEvent(data) {
    return auditRepository.create(data);
  }

  async listLogs(query) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const { items, total } = await auditRepository.list(
      {
        appId: query.app_id,
        eventType: query.event_type,
        targetType: query.target_type,
        targetValue: query.target_value,
        status: query.status,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      },
      page,
      limit,
    );

    return {
      items: items.map((item) => ({
        id: item.id,
        app_id: item.appId,
        event_type: item.eventType,
        target_type: item.targetType,
        target_value: item.targetValue,
        ip_address: item.ipAddress,
        device_id: item.deviceId,
        status: item.status,
        message: item.message,
        metadata: item.metadataJson,
        created_at: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    };
  }
}

module.exports = new AuditService();
