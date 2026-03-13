const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientPid: { type: String, required: true },
  audioUrl: { type: String },
  transcript: { type: String },
  detectedLanguage: { type: String },
  aiSummary: {
    symptoms: [{ type: String }],
    diagnosis: { type: String },
    clinicalNotes: { type: String },
    prescriptions: [{
      medication: String,
      dosage: String,
      frequency: String,
      duration: String,
    }],
    labTests: [{
      testName: String,
      instructions: String,
    }],
    followUp: { type: String },
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'completed',
  },
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
