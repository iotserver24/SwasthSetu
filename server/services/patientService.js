import { nanoid } from "nanoid";
import Patient from "../models/Patient.js";

export async function createPatient({ name, age, gender }) {
  const patientId = "PID-" + nanoid(8).toUpperCase();
  const patient = await Patient.create({ patientId, name, age, gender });
  return patient;
}

export async function getPatientById(patientId) {
  return Patient.findOne({ patientId });
}

export async function getOrCreatePatient({ patientId, name, age, gender }) {
  if (patientId) {
    const existing = await Patient.findOne({ patientId });
    if (existing) return existing;
  }
  return createPatient({ name, age, gender });
}
