const mongoose = require('mongoose');

const OTP_TTL_SECONDS = 600; // 10 minutes

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['registration', 'login'],
    required: true,
  },
  // For registration: hold the pending user payload so we can create the user after verification
  pendingUserData: {
    type: mongoose.Schema.Types.Mixed,
  },
  // For login (legacy flow)
  registryId: { type: String },
  userData: { type: mongoose.Schema.Types.Mixed },
  attempts: {
    type: Number,
    default: 0,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: OTP_TTL_SECONDS, // Auto-delete after 10 minutes
  },
});

// TTL index for auto-deletion
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: OTP_TTL_SECONDS });

module.exports = mongoose.model('Otp', otpSchema);