'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FiUser, FiShield, FiMail, FiLock, FiCheckCircle, FiArrowRight, FiRotateCcw, FiBriefcase } from 'react-icons/fi';

const REGISTRY_PREFIXES = {
  NMC: { label: 'National Medical Council', role: 'Doctor', emoji: '🩺' },
  PCI: { label: 'Pharmacy Council of India', role: 'Pharmacist', emoji: '💊' },
  PMC: { label: 'Paramedical Council', role: 'Lab Technician', emoji: '🔬' },
};

function detectPrefix(id) {
  const up = (id || '').toUpperCase();
  return Object.keys(REGISTRY_PREFIXES).find(p => up.startsWith(p)) || null;
}

const STEPS = ['Verify Identity', 'Account Setup', 'Email OTP'];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [step, setStep] = useState(1);
  const [verifying, setVerifying]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Step 1
  const [name, setName]             = useState('');
  const [registryId, setRegistryId] = useState('');
  const [registryInfo, setRegistryInfo] = useState(null);

  // Step 2
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3 — OTP
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining
  const otpRefs                     = useRef([]);
  const cooldownTimer               = useRef(null);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownTimer.current = setInterval(() => {
      setResendCooldown(s => {
        if (s <= 1) { clearInterval(cooldownTimer.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownTimer.current);
  }, [resendCooldown]);

  // ── Step 1: verify registry ─────────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!name.trim())      return toast.error('Please enter your full name');
    if (!registryId.trim()) return toast.error('Please enter your Registry ID');
    if (!detectPrefix(registryId)) return toast.error('Registry ID must start with NMC, PCI, or PMC');
    setVerifying(true);
    try {
      const { data } = await api.get(`/auth/registry/${registryId.trim().toUpperCase()}`);
      if (data.isRegistered) { toast.error('Registry ID already registered. Please log in.'); return; }
      if (data.licenseStatus !== 'ACTIVE') { toast.error(`License is ${data.licenseStatus}. Contact your council.`); return; }
      setRegistryInfo(data);
      toast.success('Registry verified ✅');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not verify Registry ID.');
    } finally { setVerifying(false); }
  };

  // ── Step 2: send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (password.length < 6)          return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword)  return toast.error('Passwords do not match');
    setSubmitting(true);
    try {
      await api.post('/auth/send-registration-otp', {
        name, registryId: registryId.trim().toUpperCase(), email, password,
      });
      toast.success('OTP sent! Check your email.');
      setResendCooldown(60);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP.');
    } finally { setSubmitting(false); }
  };

  // ── Step 3: verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) return toast.error('Please enter the 6-digit OTP');
    setVerifyingOtp(true);
    try {
      const { data } = await api.post('/auth/verify-registration-otp', { email, otp: otpValue });
      if (data.token) {
        setAuth(data.token, data.user);
        toast.success('Account created! Welcome 🎉');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally { setVerifyingOtp(false); }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post('/auth/resend-registration-otp', { email });
      toast.success('OTP resent!');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      const wait = err.response?.data?.wait;
      if (wait) setResendCooldown(wait);
      toast.error(err.response?.data?.error || 'Could not resend OTP.');
    }
  };

  // Helper: handle OTP box input
  const handleOtpInput = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  // Paste handler — spread all 6 digits
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const next = ['', '', '', '', '', ''];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  return (
    <div className="animate-in" style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span style={{ fontSize: '2.5rem' }}>🏥</span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '12px' }}>Professional Registration</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Verify your credentials to join SwasthyaSetu
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '28px' }}>
        {STEPS.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
                background: step > s ? 'var(--accent-success)' : step === s ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: step >= s ? 'white' : 'var(--text-muted)',
                border: step < s ? '2px solid var(--border-color)' : 'none',
                transition: 'var(--transition)',
                flexShrink: 0,
              }}>
                {step > s ? <FiCheckCircle size={14} /> : s}
              </div>
              <span style={{ fontSize: '0.75rem', color: step === s ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === s ? 600 : 400, whiteSpace: 'nowrap' }}>
                {label}
              </span>
              {s < STEPS.length && (
                <div style={{ width: '28px', height: '2px', background: step > s ? 'var(--accent-success)' : 'var(--border-color)', borderRadius: '2px', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Registry + Name ── */}
      {step === 1 && (
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label">
              <FiUser style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Full Name
            </label>
            <input type="text" className="form-input"
              placeholder="As registered with your council"
              value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">
              <FiShield style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Registry ID
            </label>
            <input type="text" className="form-input"
              placeholder="NMC123456 / PCI123456 / PMC123456"
              value={registryId} onChange={e => setRegistryId(e.target.value.toUpperCase())}
              required style={{ fontFamily: 'monospace', letterSpacing: '1px' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={verifying}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '14px' }}>
            {verifying
              ? <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Verifying...</>
              : <><FiShield /> Verify Registry ID <FiArrowRight style={{ marginLeft: '4px' }} /></>}
          </button>
        </form>
      )}

      {/* ── STEP 2: Email + Password ── */}
      {step === 2 && (
        <form onSubmit={handleSendOtp}>
          {/* Verified identity summary */}
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <FiCheckCircle size={26} color="var(--accent-success)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {registryId} · {registryInfo?.registryName}
              </div>
              <span className="badge badge-completed" style={{ fontSize: '0.65rem', marginTop: '4px' }}>✅ Verified &amp; Active</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiMail style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Hospital / Work Email
            </label>
            <input type="email" className="form-input" placeholder="priya@hospital.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">
              <FiLock style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Password
            </label>
            <input type="password" className="form-input" placeholder="Min 6 characters"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">
              <FiLock style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Confirm Password
            </label>
            <input type="password" className="form-input" placeholder="Re-enter your password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              style={{ borderColor: confirmPassword && confirmPassword !== password ? 'var(--accent-danger)' : undefined }} />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', marginTop: '4px' }}>Passwords do not match</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '14px' }}>
            {submitting
              ? <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Sending OTP...</>
              : <><FiBriefcase /> Send Verification Code <FiArrowRight style={{ marginLeft: '4px' }} /></>}
          </button>
          <button type="button" onClick={() => setStep(1)}
            style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
            ← Back
          </button>
        </form>
      )}

      {/* ── STEP 3: OTP ── */}
      {step === 3 && (
        <form onSubmit={handleVerifyOtp}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📧</div>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>Check your email</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              We sent a 6-digit code to <strong>{email}</strong>.<br />
              It expires in <strong>10 minutes</strong>.
            </p>
          </div>

          {/* OTP boxes */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}
            onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { otpRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpInput(idx, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(idx, e)}
                style={{
                  width: '52px', height: '60px',
                  textAlign: 'center', fontSize: '1.5rem', fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${digit ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background: 'var(--bg-glass)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  fontFamily: 'monospace',
                }}
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary" disabled={verifyingOtp || otp.join('').length < 6}
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
            {verifyingOtp
              ? <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Verifying...</>
              : <><FiCheckCircle /> Verify &amp; Create Account</>}
          </button>

          {/* Resend */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            {resendCooldown > 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Resend in <strong>{resendCooldown}s</strong>
              </p>
            ) : (
              <button type="button" onClick={handleResendOtp}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <FiRotateCcw size={14} /> Resend OTP
              </button>
            )}
          </div>

          <button type="button" onClick={() => setStep(2)}
            style={{ width: '100%', marginTop: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
            ← Change email
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
          Sign In
        </Link>
      </p>
    </div>
  );
}
