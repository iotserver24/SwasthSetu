const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientPid: { type: String, required: true },
  testName: { type: String, required: true },
  instructions: { type: String },
  orderedBy: { type: String, required: true },
  status: {
    type: String,
    enum: ['ordered', 'sample-collected', 'in-progress', 'completed'],
    default: 'ordered',
  },
  results: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('LabTest', labTestSchema);
