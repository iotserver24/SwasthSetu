import mongoose from "mongoose";

const ConsultationSchema = new mongoose.Schema({
  transcript: { type: String, default: "" },
  symptoms: [{ type: String }],
  diagnosis: { type: String, default: "" },
  prescriptions: [
    {
      medicine: String,
      dosage: String,
      duration: String,
    },
  ],
  tests: [{ type: String }],
  diagnosticTests: [{ type: String }],
  followUpInstructions: { type: String, default: "" },
  patientLanguage: { type: String, default: "Hindi" },
  doctorLanguage: { type: String, default: "English" },
  createdAt: { type: Date, default: Date.now },
  date: { type: Date, default: Date.now },
});

const LabResultSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  result: { type: String, default: "" },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  uploadedAt: { type: Date, default: Date.now },
});

const PharmacyItemSchema = new mongoose.Schema({
  medicine: { type: String, required: true },
  dosage: { type: String, default: "" },
  duration: { type: String, default: "" },
  dispensed: { type: Boolean, default: false },
  dispensedAt: { type: Date },
});

const PatientSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    consultations: [ConsultationSchema],
    labResults: [LabResultSchema],
    pharmacyItems: [PharmacyItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Patient", PatientSchema);
