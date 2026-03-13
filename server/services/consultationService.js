import { getOrCreatePatient } from "./patientService.js";
import { getSttProvider } from "./stt/stt.interface.js";
import { getSummarizerProvider } from "./ai/summarizer.interface.js";

function normalizeSummary(summary) {
  return {
    symptoms: summary.symptoms || [],
    diagnosis: summary.diagnosis || "",
    prescriptions: summary.prescriptions || [],
    tests: summary.tests || summary.diagnosticTests || [],
    followUpInstructions: summary.followUpInstructions || "",
  };
}

function normalizePrescriptions(prescriptions) {
  if (!Array.isArray(prescriptions)) return [];
  return prescriptions.map((rx) => {
    if (typeof rx === "string") {
      return { medicine: rx, dosage: "", duration: "" };
    }
    return {
      medicine: rx.medicine || rx.name || "Prescription",
      dosage: rx.dosage || "",
      duration: rx.duration || "",
    };
  });
}

export async function saveConsultation({
  patientId,
  name,
  age,
  gender,
  patientLanguage,
  transcript,
  audioBuffer,
  audioMimeType,
}) {
  const patient = await getOrCreatePatient({ patientId, name, age, gender });

  let transcriptText = transcript?.trim();
  if (!transcriptText && audioBuffer) {
    const sttProvider = getSttProvider();
    transcriptText = await sttProvider(audioBuffer, audioMimeType);
  }

  if (!transcriptText) {
    throw new Error("Transcript is required (text or audio).");
  }

  const summarizer = getSummarizerProvider();
  const rawSummary = await summarizer(transcriptText);
  const summary = normalizeSummary(rawSummary);
  const prescriptions = normalizePrescriptions(summary.prescriptions);

  const consultation = {
    transcript: transcriptText,
    symptoms: summary.symptoms,
    diagnosis: summary.diagnosis,
    prescriptions,
    tests: summary.tests,
    followUpInstructions: summary.followUpInstructions,
    patientLanguage: patientLanguage || "Unknown",
    doctorLanguage: "English",
    createdAt: new Date(),
  };

  patient.consultations.push(consultation);

  // Merge prescriptions into pharmacy items (avoid exact duplicates)
  for (const rx of prescriptions) {
    const exists = patient.pharmacyItems.some((p) => p.medicine === rx.medicine);
    if (!exists) {
      patient.pharmacyItems.push({ medicine: rx.medicine, dosage: rx.dosage, duration: rx.duration });
    }
  }

  // Merge diagnostic tests into lab results (avoid exact duplicates)
  for (const test of summary.tests) {
    const exists = patient.labResults.some((l) => l.testName === test);
    if (!exists) {
      patient.labResults.push({ testName: test, status: "pending" });
    }
  }

  await patient.save();

  return { patient, consultation, transcript: transcriptText, structuredSummary: summary };
}
