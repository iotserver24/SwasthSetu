const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientPid: { type: String, required: true },
  doctorName: { type: String, required: true },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
  }],
  status: {
    type: String,
    enum: ['pending', 'dispensed'],
    default: 'pending',
  },
  dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dispensedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
