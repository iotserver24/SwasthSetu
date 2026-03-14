'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FiUser, FiShield, FiMail, FiLock, FiCheckCircle, FiArrowRight, FiLoader, FiBriefcase } from 'react-icons/fi';

const REGISTRY_PREFIXES = {
  NMC: { label: 'National Medical Council', role: 'Doctor', emoji: '🩺', color: '#3b82f6' },
  PCI: { label: 'Pharmacy Council of India', role: 'Pharmacist', emoji: '💊', color: '#10b981' },
  PMC: { label: 'Paramedical Council', role: 'Lab Technician', emoji: '🔬', color: '#8b5cf6' },
};

function detectPrefix(id) {
  const up = id.toUpperCase();
  for (const prefix of Object.keys(REGISTRY_PREFIXES)) {
    if (up.startsWith(prefix)) return prefix;
  }
  return null;
}

// Steps: 1 = identity, 2 = email+password
export default function RegisterPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const [step, setStep] = useState(1);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [name, setName] = useState('');
  const [registryId, setRegistryId] = useState('');
  const [registryInfo, setRegistryInfo] = useState(null); // { role, registryName, licenseStatus, name }

  // Step 2 state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const prefix = detectPrefix(registryId);
  const registryMeta = prefix ? REGISTRY_PREFIXES[prefix] : null;

  // Step 1 — verify registry ID + name
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your full name');
    if (!registryId.trim()) return toast.error('Please enter your Registry ID');
    if (!prefix) return toast.error('Registry ID must start with NMC, PCI, or PMC');

    setVerifying(true);
    setRegistryInfo(null);
    try {
      const { data } = await api.get(`/auth/registry/${registryId.trim().toUpperCase()}`);

      if (data.isRegistered) {
        toast.error('This Registry ID is already registered. Please log in instead.');
        return;
      }

      if (data.licenseStatus !== 'ACTIVE') {
        toast.error(`License status: ${data.licenseStatus}. Please contact your professional registry.`);
        return;
      }

      // Name check (loose — we just show a warning, backend will enforce on submit)
      setRegistryInfo(data);
      toast.success('Registry ID verified! ✅');
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not verify Registry ID. Please check and try again.';
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  // Step 2 — submit registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setSubmitting(true);
    try {
      // Use the register-professional endpoint. OTP is not yet implemented so we
      // fall back to the legacy /register endpoint for now.
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        role: registryInfo.role,        // role comes from registry verification
        registryId: registryId.trim().toUpperCase(),
      });

      // Store token and log user in
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Refresh user context by hitting /me
        window.location.href = '/dashboard';
      } else {
        toast.success('Account created! Please log in.');
        router.push('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700,
              background: step > s ? 'var(--accent-success)' : step === s ? 'var(--accent-primary)' : 'var(--bg-glass)',
              color: step >= s ? 'white' : 'var(--text-muted)',
              border: step < s ? '2px solid var(--border-color)' : 'none',
              transition: 'var(--transition)',
            }}>
              {step > s ? <FiCheckCircle size={16} /> : s}
            </div>
            <span style={{ fontSize: '0.8rem', color: step === s ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === s ? 600 : 400 }}>
              {s === 1 ? 'Verify Identity' : 'Account Setup'}
            </span>
            {s < 2 && <div style={{ width: '40px', height: '2px', background: step > s ? 'var(--accent-success)' : 'var(--border-color)', borderRadius: '2px' }} />}
          </div>
        ))}
      </div>

      {/* ─── STEP 1: Registry ID + Name ─── */}
      {step === 1 && (
        <form onSubmit={handleVerify}>
          <div style={{
            background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Enter your professional registry ID to verify your credentials:
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              {Object.entries(REGISTRY_PREFIXES).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <span>{v.emoji}</span>
                  <span style={{ fontWeight: 600 }}>{k}</span>
                  <span style={{ color: 'var(--text-muted)' }}>— {v.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiUser style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Full Name
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="As registered with your council (e.g. Dr. Priya Sharma)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Name will be verified against your registry record.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiShield style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Registry ID
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="NMC123456 / PCI123456 / PMC123456"
              value={registryId}
              onChange={(e) => setRegistryId(e.target.value.toUpperCase())}
              required
              style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
            />
            {registryMeta && (
              <div style={{
                marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <span>{registryMeta.emoji}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: registryMeta.color }}>
                  {registryMeta.label}
                </span>
                <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>{registryMeta.role}</span>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={verifying}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '14px' }}>
            {verifying ? (
              <><FiLoader style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
            ) : (
              <><FiShield /> Verify Registry ID <FiArrowRight style={{ marginLeft: '4px' }} /></>
            )}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            💡 <strong>Test IDs:</strong> NMC123456, PCI123456, PMC123456
          </p>
        </form>
      )}

      {/* ─── STEP 2: Email + Password ─── */}
      {step === 2 && (
        <form onSubmit={handleRegister}>
          {/* Verified identity summary */}
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <FiCheckCircle size={28} color="var(--accent-success)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {registryId} · {registryInfo?.registryName}
              </div>
              <span className="badge badge-completed" style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                ✅ Verified &amp; Active
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiMail style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Hospital / Work Email
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="priya@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              An OTP will be sent to this email for verification (coming soon).
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiLock style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '14px' }}>
            {submitting
              ? <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Creating Account...</>
              : <><FiBriefcase /> Create Account</>
            }
          </button>

          <button type="button" onClick={() => setStep(1)}
            style={{
              width: '100%', marginTop: '10px', background: 'none', border: 'none',
              color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer',
            }}>
            ← Back to identity verification
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
          Sign In
        </Link>
      </p>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
