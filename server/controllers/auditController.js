import { getAccessLogsForPatient } from "../services/auditService.js";

export async function getPatientAuditHandler(req, res) {
  try {
    const { id } = req.params;
    const logs = await getAccessLogsForPatient(id);
    return res.json({ success: true, data: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

