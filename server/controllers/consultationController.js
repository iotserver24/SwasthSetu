import { saveConsultation } from "../services/consultationService.js";

export async function saveConsultationHandler(req, res) {
  try {
    const { patientId, name, age, gender, patientLanguage, transcript, audioBase64, audioMimeType } = req.body;

    if (!name || !age || !gender) {
      return res.status(400).json({ success: false, message: "name, age, and gender are required" });
    }

    if (!transcript && !audioBase64) {
      return res.status(400).json({ success: false, message: "Provide transcript text or audio." });
    }

    const audioBuffer = audioBase64 ? Buffer.from(audioBase64, "base64") : null;

    const result = await saveConsultation({
      patientId,
      name,
      age,
      gender,
      patientLanguage,
      transcript,
      audioBuffer,
      audioMimeType,
    });

    return res.status(201).json({
      success: true,
      data: {
        patientId: result.patient.patientId,
        transcript: result.transcript,
        structuredSummary: result.structuredSummary,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
