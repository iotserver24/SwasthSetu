const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // User identification
  userId: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Professional info (for doctors, pharmacists, lab techs)
  registryId: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Email (primary identifier for all users)
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // Password (optional for professionals using OTP)
  password: {
    type: String,
    minlength: 6,
  },

  // Basic info
  name: {
    type: String,
    required: true,
    trim: true,
  },

  // Role
  role: {
    type: String,
    enum: ['doctor', 'pharmacist', 'lab', 'lab_tech', 'admin'],
    required: true,
  },

  // License status (for professionals)
  licenseStatus: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'PENDING'],
    default: 'PENDING',
  },
  lastLicenseCheck: {
    type: Date,
    default: null,
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },

  // Additional details from registry
  registryDetails: {
    specialization: String,
    qualification: String,
    registrationDate: String,
  },

}, { timestamps: true });

// Indexes
userSchema.index({ registryId: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true });

// Pre-save hook for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate userId before saving for professional users
userSchema.pre('save', async function (next) {
  if (this.isNew && this.registryId && !this.userId) {
    const prefix = this.role === 'doctor' ? 'DOC' :
                   this.role === 'pharmacist' ? 'PHR' :
                   this.role === 'lab' || this.role === 'lab_tech' ? 'LAB' : 'USR';
    const count = await mongoose.models.User.countDocuments({ role: this.role });
    this.userId = `${prefix}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if license is active
userSchema.methods.isLicenseActive = function () {
  return this.licenseStatus === 'ACTIVE';
};

// Safe JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Static method to find by registry ID
userSchema.statics.findByRegistryId = function (registryId) {
  return this.findOne({ registryId });
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Static method to find professional users
userSchema.statics.findProfessionals = function () {
  return this.find({ role: { $in: ['doctor', 'pharmacist', 'lab', 'lab_tech'] } });
};

// Static method to find admins
userSchema.statics.findAdmins = function () {
  return this.find({ role: 'admin' });
};

module.exports = mongoose.model('User', userSchema);