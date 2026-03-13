import { dispensePharmacyItem, dispenseAll } from "../services/pharmacyService.js";

export async function dispenseItemHandler(req, res) {
  try {
    const { patientId, medicine } = req.body;
    if (!patientId || !medicine) {
      return res.status(400).json({ success: false, message: "patientId and medicine are required" });
    }
    const patient = await dispensePharmacyItem({ patientId, medicine });
    return res.json({ success: true, data: patient });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}

export async function dispenseAllHandler(req, res) {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ success: false, message: "patientId is required" });
    }
    const patient = await dispenseAll({ patientId });
    return res.json({ success: true, data: patient });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}
