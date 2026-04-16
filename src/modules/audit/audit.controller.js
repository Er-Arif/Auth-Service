const auditService = require("./audit.service");
const { successResponse } = require("../../utils/response");

class AuditController {
  async listLogs(req, res) {
    const result = await auditService.listLogs(req.validated.query);
    res.status(200).json(
      successResponse({
        message: "Audit logs fetched successfully",
        data: result,
      }),
    );
  }
}

module.exports = new AuditController();
