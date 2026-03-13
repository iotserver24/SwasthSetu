import { updateLabResult } from "../services/labService.js";

export async function updateLabResultHandler(req, res) {
  try {
    const { patientId, testName, result } = req.body;
    if (!patientId || !testName || !result) {
      return res.status(400).json({ success: false, message: "patientId, testName, and result are required" });
    }
    const patient = await updateLabResult({ patientId, testName, result });
    return res.json({ success: true, data: patient });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}
