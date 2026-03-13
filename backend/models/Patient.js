const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  pid: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  bloodGroup: { type: String, trim: true },
  allergies: [{ type: String }],
  languages: [{ type: String }],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate PID before validation
patientSchema.pre('validate', async function (next) {
  if (this.isNew && !this.pid) {
    const count = await mongoose.model('Patient').countDocuments();
    this.pid = `PID-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
