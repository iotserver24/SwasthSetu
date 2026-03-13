import { transcriptAdapter } from "./adapters/transcriptAdapter.js";
import { summaryAdapter } from "./adapters/summaryAdapter.js";
import { getOrCreatePatient } from "./patientService.js";
import Patient from "../models/Patient.js";

export async function saveConsultation({ patientId, name, age, gender, patientLanguage, rawTranscript }) {
  const patient = await getOrCreatePatient({ patientId, name, age, gender });

  const transcriptResult = transcriptAdapter({ patientLanguage, rawAudio: rawTranscript });
  const summary = summaryAdapter(transcriptResult);

  const consultation = {
    transcript: transcriptResult.fullText,
    symptoms: summary.symptoms,
    diagnosis: summary.diagnosis,
    prescriptions: summary.prescriptions,
    diagnosticTests: summary.diagnosticTests,
    followUpInstructions: summary.followUpInstructions,
    patientLanguage: transcriptResult.patientLanguage,
    doctorLanguage: transcriptResult.doctorLanguage,
    date: new Date(),
  };

  patient.consultations.push(consultation);

  // Merge prescriptions into pharmacy items (avoid exact duplicates)
  for (const rx of summary.prescriptions) {
    const exists = patient.pharmacyItems.some((p) => p.medicine === rx.medicine);
    if (!exists) {
      patient.pharmacyItems.push({ medicine: rx.medicine, dosage: rx.dosage, duration: rx.duration });
    }
  }

  // Merge diagnostic tests into lab results (avoid exact duplicates)
  for (const test of summary.diagnosticTests) {
    const exists = patient.labResults.some((l) => l.testName === test);
    if (!exists) {
      patient.labResults.push({ testName: test, status: "pending" });
    }
  }

  await patient.save();

  return { patient, consultation, transcriptResult, summary };
}

export async function generateTranscriptPreview(patientLanguage) {
  return transcriptAdapter({ patientLanguage });
}
