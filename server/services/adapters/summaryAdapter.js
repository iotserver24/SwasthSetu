/**
 * Clinical summary adapter interface.
 * Replace `mockSummaryAdapter` with a real LLM provider (e.g. OpenAI, Gemini)
 * by implementing the same `generate(transcript)` signature.
 */

const MOCK_SUMMARIES = {
  hindi: {
    symptoms: ["Fever for 3 days", "Headache", "Body aches", "Chills", "Runny nose", "Mild cough"],
    diagnosis: "Acute Viral Upper Respiratory Tract Infection (Influenza-like illness)",
    prescriptions: [
      { medicine: "Paracetamol 500mg", dosage: "1 tablet every 6 hours", duration: "5 days" },
      { medicine: "Cetirizine 10mg (Antihistamine)", dosage: "1 tablet at bedtime", duration: "5 days" },
      { medicine: "Vitamin C 500mg", dosage: "1 tablet daily", duration: "7 days" },
    ],
    diagnosticTests: ["Complete Blood Count (CBC)", "Rapid Influenza Antigen Test"],
    followUpInstructions:
      "Rest and adequate fluid intake. Return if fever persists beyond 5 days or breathing difficulty develops. Review CBC results in 2 days.",
  },
  tamil: {
    symptoms: ["Stomach pain for 2 days", "Nausea and vomiting after eating", "Low-grade fever"],
    diagnosis: "Acute Gastroenteritis",
    prescriptions: [
      { medicine: "ORS Sachets", dosage: "1 sachet in 200ml water after each loose stool", duration: "Till symptoms resolve" },
      { medicine: "Pantoprazole 40mg (Antacid)", dosage: "1 tablet before breakfast", duration: "5 days" },
      { medicine: "Domperidone 10mg", dosage: "1 tablet before meals", duration: "3 days" },
    ],
    diagnosticTests: ["Stool Culture and Sensitivity", "Stool Routine Microscopy"],
    followUpInstructions:
      "Maintain light diet (BRAT diet). Ensure adequate hydration. Return if vomiting persists more than 48 hours or blood appears in stool.",
  },
};

/**
 * Generates a structured clinical summary from a transcript.
 * @param {object} transcriptResult - output from transcriptAdapter
 * @returns {object} structured clinical summary
 */
export function mockSummaryAdapter(transcriptResult) {
  const lang = (transcriptResult.patientLanguage || "Hindi").toLowerCase();
  const summary = MOCK_SUMMARIES[lang] || MOCK_SUMMARIES.hindi;
  return { ...summary };
}

export const summaryAdapter = mockSummaryAdapter;
