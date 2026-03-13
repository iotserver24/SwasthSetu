import AuditLog from "../models/AuditLog.js";

export async function recordAccess({ actorId, patientId, accessedAt = new Date() }) {
  if (!actorId || !patientId) return;
  await AuditLog.create({ actorId, patientId, accessedAt });
}

export async function getAccessLogsForPatient(patientId) {
  if (!patientId) return [];
  return AuditLog.find({ patientId }).sort({ accessedAt: -1 }).lean();
}
