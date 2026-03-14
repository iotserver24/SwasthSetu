/**
 * OTP Service
 * Sends 6-digit OTP via Brevo SMTP (nodemailer).
 * Falls back to console logging if SMTP credentials are missing.
 */

const crypto   = require('crypto');
const nodemailer = require('nodemailer');
const Otp      = require('../models/Otp');

const OTP_LENGTH         = 6;
const OTP_EXPIRY_MS      = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60  * 1000;      // 1 minute
const MAX_ATTEMPTS       = 5;

// ── Nodemailer transporter (Brevo SMTP) ─────────────────────────────────────

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: false,            // STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// ── HTML email template ──────────────────────────────────────────────────────

function buildHtml(otp, purpose) {
  const label = purpose === 'registration' ? 'Registration' : 'Login';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#06b6d4,#0284c7);padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:1.6rem;letter-spacing:-0.5px">🏥 SwasthyaSetu</h1>
      <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:.9rem">${label} Verification</p>
    </div>
    <div style="padding:40px 32px;text-align:center">
      <p style="color:#374151;font-size:1rem;margin:0 0 24px">Your one-time verification code is:</p>
      <div style="display:inline-block;background:#f0fdfa;border:2px solid #06b6d4;border-radius:10px;padding:18px 40px;margin-bottom:24px">
        <span style="font-size:2.4rem;font-weight:700;letter-spacing:12px;color:#06b6d4">${otp}</span>
      </div>
      <p style="color:#6b7280;font-size:.875rem;margin:0 0 8px">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#9ca3af;font-size:.75rem;margin:0">If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:.7rem;margin:0">SwasthyaSetu · Multilingual Clinical Workflow System</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Core send helper ─────────────────────────────────────────────────────────

async function dispatchEmail(email, otp, purpose) {
  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'SwasthyaSetu';
  const from = `"${fromName}" <${fromEmail}>`;

  if (!transporter) {
    // Dev fallback — log to console
    console.log('\n' + '='.repeat(50));
    console.log(`[OTP] ${purpose.toUpperCase()} code for ${email}: ${otp}`);
    console.log('[OTP] (SMTP not configured — shown in console only)');
    console.log('='.repeat(50) + '\n');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `SwasthyaSetu – Your ${purpose === 'registration' ? 'Registration' : 'Login'} Code: ${otp}`,
      text: `Your SwasthyaSetu verification code is: ${otp}\nExpires in 10 minutes.`,
      html: buildHtml(otp, purpose),
    });

    console.log(`[OTP] Email sent to ${email}. MessageID: ${info.messageId}`);
    if (info.rejected.length > 0) {
      console.warn(`[OTP] Email rejected for: ${info.rejected.join(', ')}`);
    }
  } catch (err) {
    console.error(`[OTP] Failed to send email to ${email}:`, err.message);
    // Log code to console as fallback so the user isn't stuck during testing
    console.log(`[OTP FALLBACK] ${purpose.toUpperCase()} code for ${email}: ${otp}`);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a fresh OTP.
 * Stores OTP + any pendingUserData; deletes previous OTPs for same email+purpose.
 *
 * @param {string} email
 * @param {'registration'|'login'} purpose
 * @param {object} [options]
 *   - pendingUserData  — registration payload (name, hashedPassword, role, registryId…)
 *   - registryId       — for legacy login flow
 *   - userData         — for legacy login flow
 * @returns {{ email, expiresAt, sentAt }}
 */
async function sendOtp(email, purpose, options = {}) {
  const normalized = email.toLowerCase().trim();

  // Resend cooldown check
  const existing = await Otp.findOne({ email: normalized, purpose });
  if (existing) {
    const elapsed = Date.now() - new Date(existing.sentAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw Object.assign(new Error(`Please wait ${wait}s before requesting a new OTP.`), { code: 'COOLDOWN', wait });
    }
    await Otp.deleteMany({ email: normalized, purpose });
  }

  const otp      = crypto.randomInt(0, 999999).toString().padStart(OTP_LENGTH, '0');
  const now      = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  console.log(`[OTP DEBUG] Creating OTP record for ${normalized}. Pending data keys: ${options.pendingUserData ? Object.keys(options.pendingUserData) : 'none'}`);
  await Otp.create({
    email: normalized,
    otp,
    purpose,
    pendingUserData: options.pendingUserData || undefined,
    registryId:     options.registryId     || undefined,
    userData:       options.userData       || undefined,
    sentAt: now,
    createdAt: now,
  });

  await dispatchEmail(normalized, otp, purpose);

  return { email: normalized, expiresAt, sentAt: now };
}

/**
 * Verify OTP. Deletes record on success.
 *
 * @returns {{ valid: true, email, pendingUserData, registryId, userData }}
 *        | {{ valid: false, error: string }}
 */
async function verifyOtp(email, otp, purpose) {
  const normalized = email.toLowerCase().trim();
  const record     = await Otp.findOne({ email: normalized, purpose });

  if (!record) {
    return { valid: false, error: 'OTP not found or expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    return { valid: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  if (record.otp !== String(otp).trim()) {
    record.attempts += 1;
    await record.save();
    return {
      valid: false,
      error: `Incorrect OTP. ${MAX_ATTEMPTS - record.attempts} attempt(s) remaining.`,
    };
  }

  // Success — grab payload and delete
  const payload = {
    email:           normalized,
    pendingUserData: record.pendingUserData,
    registryId:      record.registryId,
    userData:        record.userData,
  };

  await record.deleteOne();
  return { valid: true, ...payload };
}

module.exports = { sendOtp, verifyOtp, OTP_EXPIRY_MS, RESEND_COOLDOWN_MS };