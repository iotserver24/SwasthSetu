import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    actorId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    accessedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.model("AuditLog", AuditLogSchema);
