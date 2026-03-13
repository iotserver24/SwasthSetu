import Patient from "../models/Patient.js";

export async function updateLabResult({ patientId, testName, result }) {
  const patient = await Patient.findOne({ patientId });
  if (!patient) throw new Error(`Patient ${patientId} not found`);

  const labItem = patient.labResults.find((l) => l.testName === testName);
  if (!labItem) throw new Error(`Test "${testName}" not found for patient ${patientId}`);

  labItem.result = result;
  labItem.status = "completed";
  labItem.uploadedAt = new Date();

  await patient.save();
  return patient;
}
