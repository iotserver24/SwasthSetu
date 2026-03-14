/**
 * OTP Service
 * Handles OTP generation, sending via email (Brevo), and verification
 * Development mode: logs OTP to console
 * Production mode: sends via Brevo email API
 */

const crypto = require('crypto');
const Otp = require('../models/Otp');

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_OTP_ATTEMPTS = 3;

// Brevo API configuration
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Generate a random OTP
 * @returns {string} - 6-digit OTP
 */
function generateOtp() {
  return crypto.randomInt(0, 999999).toString().padStart(OTP_LENGTH, '0');
}

/**
 * Send OTP via Brevo email
 * @param {string} email - The email address
 * @param {string} otp - The OTP code
 * @param {string} purpose - 'registration' or 'login'
 */
async function sendOtpViaBrevo(email, otp, purpose) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@swasthyasetu.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'SwasthyaSetu';

  if (!brevoApiKey) {
    console.error('[OTP] Brevo API key not configured, falling back to console');
    await logOtpToConsole(email, otp, purpose);
    return;
  }

  const purposeText = purpose === 'registration' ? 'Account Registration' : 'Account Login';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>SwasthyaSetu - Verification Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #06b6d4; margin: 0;">🏥 SwasthyaSetu</h1>
        </div>
        
        <h2 style="color: #1f2937; text-align: center;">${purposeText} Verification</h2>
        
        <p style="color: #4b5563; font-size: 16px; text-align: center;">
          Your verification code is:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #06b6d4; background-color: #f0fdfa; padding: 15px 30px; border-radius: 8px; border: 2px solid #06b6d4;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          This code will expire in <strong>5 minutes</strong>.
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          If you did not request this code, please ignore this email.<br>
          This is an automated message from SwasthyaSetu Healthcare System.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: `SwasthyaSetu - ${purposeText} Verification Code`,
        htmlContent: htmlContent,
        textContent: `Your SwasthyaSetu ${purposeText} verification code is: ${otp}. This code will expire in 5 minutes.`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[OTP] Brevo API error:', error);
      throw new Error('Failed to send email');
    }

    console.log(`[OTP] Email sent successfully to ${email}`);
  } catch (error) {
    console.error('[OTP] Failed to send email via Brevo:', error.message);
    // Fallback to console logging
    await logOtpToConsole(email, otp, purpose);
  }
}

/**
 * Log OTP to console (development/mock mode)
 * @param {string} email - Email address
 * @param {string} otp - The OTP code
 * @param {string} purpose - Purpose of OTP
 */
async function logOtpToConsole(email, otp, purpose) {
  console.log('='.repeat(50));
  console.log(`[OTP SERVICE] ${purpose.toUpperCase()} OTP`);
  console.log(`Email: ${email}`);
  console.log(`OTP: ${otp}`);
  console.log(`Valid for: ${OTP_EXPIRY_SECONDS / 60} minutes`);
  console.log('='.repeat(50));
}

/**
 * Send OTP to an email address
 * @param {string} email - The email address to send OTP to
 * @param {string} purpose - 'registration' or 'login'
 * @param {object} options - Additional data to store with OTP
 * @returns {Promise<object>} - OTP record with reference
 */
async function sendOtp(email, purpose, options = {}) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Invalidate any existing OTPs for this email/purpose
  await Otp.deleteMany({ email: normalizedEmail, purpose });

  // Generate new OTP
  const otp = generateOtp();
  const expiry = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

  // Store OTP in database
  const otpRecord = await Otp.create({
    email: normalizedEmail,
    otp,
    purpose,
    registryId: options.registryId,
    userData: options.userData,
    createdAt: new Date(),
  });

  // Send OTP via email or console
  const useRealEmail = process.env.BREVO_API_KEY && process.env.SMS_PROVIDER_ENABLED !== 'false';

  if (useRealEmail) {
    await sendOtpViaBrevo(normalizedEmail, otp, purpose);
  } else {
    await logOtpToConsole(normalizedEmail, otp, purpose);
  }

  return {
    email: normalizedEmail,
    purpose,
    expiresAt: expiry,
    otpReference: otpRecord._id,
  };
}

/**
 * Verify OTP
 * @param {string} email - Email address
 * @param {string} otp - The OTP code to verify
 * @param {string} purpose - 'registration' or 'login'
 * @returns {Promise<object>} - Verification result
 */
async function verifyOtp(email, otp, purpose) {
  const normalizedEmail = email.toLowerCase().trim();

  // Find OTP record
  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose,
  });

  if (!otpRecord) {
    return {
      valid: false,
      error: 'OTP expired or not found. Please request a new OTP.',
    };
  }

  // Check attempt limit
  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await Otp.deleteMany({ email: normalizedEmail, purpose });
    return {
      valid: false,
      error: 'Maximum OTP attempts exceeded. Please request a new OTP.',
    };
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return {
      valid: false,
      error: `Invalid OTP. ${MAX_OTP_ATTEMPTS - otpRecord.attempts} attempts remaining.`,
    };
  }

  // Valid OTP - return stored data
  const userData = otpRecord.userData;
  const registryId = otpRecord.registryId;

  // Clean up used OTP
  await Otp.deleteMany({ email: normalizedEmail, purpose });

  return {
    valid: true,
    email: normalizedEmail,
    registryId,
    userData,
  };
}

/**
 * Invalidate all OTPs for an email
 * @param {string} email - Email address
 * @param {string} purpose - Optional: specific purpose
 */
async function invalidateOtps(email, purpose = null) {
  const normalizedEmail = email.toLowerCase().trim();
  const query = { email: normalizedEmail };
  if (purpose) query.purpose = purpose;
  await Otp.deleteMany(query);
}

/**
 * Generate and return OTP for testing purposes
 * Only available in development mode
 * @param {string} email - Email address
 * @param {string} purpose - Purpose
 * @returns {Promise<object>} - OTP details
 */
async function getOtpForTesting(email, purpose) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This function is not available in production');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otpRecord = await Otp.findOne({ email: normalizedEmail, purpose });

  if (!otpRecord) {
    return { error: 'No OTP found for this email address' };
  }

  return {
    email: normalizedEmail,
    purpose,
    otp: otpRecord.otp,
    attempts: otpRecord.attempts,
  };
}

module.exports = {
  sendOtp,
  verifyOtp,
  invalidateOtps,
  getOtpForTesting,
  OTP_EXPIRY_SECONDS,
  MAX_OTP_ATTEMPTS,
};