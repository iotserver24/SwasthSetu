import { saveConsultation, generateTranscriptPreview } from "../services/consultationService.js";

export async function saveConsultationHandler(req, res) {
  try {
    const { patientId, name, age, gender, patientLanguage, rawTranscript } = req.body;

    if (!name || !age || !gender) {
      return res.status(400).json({ success: false, message: "name, age, and gender are required" });
    }

    const result = await saveConsultation({ patientId, name, age, gender, patientLanguage, rawTranscript });

    return res.status(201).json({
      success: true,
      data: {
        patientId: result.patient.patientId,
        patient: result.patient,
        consultation: result.consultation,
        summary: result.summary,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function previewTranscriptHandler(req, res) {
  try {
    const { patientLanguage } = req.query;
    const transcript = await generateTranscriptPreview(patientLanguage || "Hindi");
    return res.json({ success: true, data: transcript });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
