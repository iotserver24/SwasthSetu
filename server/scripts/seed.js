/**
 * Seed script: creates a demo patient with a complete consultation
 * so you can immediately test the Lab and Pharmacy dashboards.
 *
 * Run:  bun run scripts/seed.js
 */
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import { saveConsultation } from "../services/consultationService.js";
import Patient from "../models/Patient.js";

async function seed() {
  await connectDB();

  // Remove any existing demo patient
  await Patient.deleteOne({ name: "Aarav Sharma" });

  const { patient } = await saveConsultation({
    name: "Aarav Sharma",
    age: 34,
    gender: "Male",
    patientLanguage: "Hindi",
  });

  console.log("\n✅ Demo patient created:");
  console.log(`   Name      : ${patient.name}`);
  console.log(`   Patient ID: ${patient.patientId}`);
  console.log(`   Lab Tests : ${patient.labResults.map((l) => l.testName).join(", ")}`);
  console.log(`   Medicines : ${patient.pharmacyItems.map((p) => p.medicine).join(", ")}`);
  console.log("\nUse this Patient ID in the Lab and Pharmacy dashboards.");

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
