import { createPatient, getPatientById } from "../services/patientService.js";
import { recordAccess } from "../services/auditService.js";

export async function createPatientHandler(req, res) {
  try {
    const { name, age, gender } = req.body;
    if (!name || !age || !gender) {
      return res.status(400).json({ success: false, message: "name, age, and gender are required" });
    }
    const patient = await createPatient({ name, age, gender });
    return res.status(201).json({ success: true, data: patient });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPatientHandler(req, res) {
  try {
    const { id } = req.params;
    const patient = await getPatientById(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    recordAccess({ actorId: req.actorId, patientId: patient.patientId }).catch((err) => {
      console.error("Audit log failed:", err.message);
    });
    return res.json({ success: true, data: patient });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
