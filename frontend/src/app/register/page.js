'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FiUser, FiMail, FiCheckCircle, FiShield, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

const REGISTRY_INFO = {
  NMC: { name: 'National Medical Council', role: 'doctor', icon: '🩺' },
  PCI: { name: 'Pharmacy Council of India', role: 'pharmacist', icon: '💊' },
  PMC: { name: 'Paramedical Council', role: 'lab', icon: '🔬' },
};

const ROLE_LABELS = {
  doctor: { label: 'Doctor', icon: '🩺', color: '#06b6d4' },
  pharmacist: { label: 'Pharmacist', icon: '💊', color: '#8b5cf6' },
  lab: { label: 'Lab Technician', icon: '🔬', color: '#f59e0b' },
};

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Form data
  const [form, setForm] = useState({
    name: '',
    registryId: '',
    email: '',
    otp: '',
  });
  
  // Registry verification data
  const [registryData, setRegistryData] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Detect registry type from ID
  const getRegistryType = (id) => {
    if (id?.toUpperCase().startsWith('NMC')) return 'NMC';
    if (id?.toUpperCase().startsWith('PCI')) return 'PCI';
    if (id?.toUpperCase().startsWith('PMC')) return 'PMC';
    return null;
  };

  // Step 1: Verify registry ID
  const handleVerifyRegistry = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!form.registryId.trim()) {
      toast.error('Please enter your registry ID');
      return;
    }

    const registryType = getRegistryType(form.registryId);
    if (!registryType) {
      toast.error('Invalid registry ID format. Must start with NMC, PCI, or PMC');
      return;
    }

    setVerifying(true);
    try {
      const { data } = await api.get(`/auth/registry/${form.registryId.toUpperCase()}`);
      
      if (!data.valid) {
        toast.error('Registry ID not found');
        return;
      }

      if (data.isRegistered) {
        setIsRegistered(true);
        toast.error('This registry ID is already registered');
        return;
      }

      if (data.licenseStatus !== 'ACTIVE') {
        toast.error('Your professional license is not active. Please contact your registry.');
        return;
      }

      setRegistryData({
        ...data,
        registryType,
        registryId: form.registryId.toUpperCase(),
      });
      setStep(2);
      toast.success('Registry verified! Role assigned: ' + ROLE_LABELS[data.role]?.label);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify registry ID');
    } finally {
      setVerifying(false);
    }
  };

  // Step 2: Send OTP to email
  const handleSendOtp = async () => {
    if (!form.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register-professional', {
        registryId: registryData.registryId,
        name: form.name,
        email: form.email,
      });

      setStep(3);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP and complete registration
  const handleVerifyOtp = async () => {
    if (!form.otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    if (form.otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-registration', {
        email: form.email,
        otp: form.otp,
      });

      setAuth(data.token, data.user);
      setStep(4);
      toast.success('Registration successful!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP (re-send via register-professional so OTP has full data)
  const handleResendOtp = async () => {
    if (!registryData?.registryId || !form.name || !form.email) return;
    setLoading(true);
    try {
      await api.post('/auth/register-professional', {
        registryId: registryData.registryId,
        name: form.name,
        email: form.email,
      });
      toast.success('OTP resent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'var(--gradient-hero)',
    }}>
      <div className="glass-card animate-in" style={{
        width: '100%', maxWidth: '520px', padding: '40px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '2.5rem' }}>🏥</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '12px' }}>
            {step === 4 ? 'Welcome!' : 'Create Professional Account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {step === 4 ? 'Your account has been created' : 'SwasthyaSetu Healthcare Platform'}
          </p>
        </div>

        {/* Progress Steps */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                width: '40px', height: '4px', borderRadius: '2px',
                background: s <= step ? 'var(--accent-primary)' : 'var(--border-color)',
                transition: 'var(--transition)',
              }} />
            ))}
          </div>
        )}

        {/* Step 1: Name and Registry ID */}
        {step === 1 && (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
              Enter your professional details to verify your identity
            </p>

            <div className="form-group">
              <label className="form-label"><FiUser style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Full Name (as per registry)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Dr. Ravi Kumar"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={verifying}
              />
            </div>

            <div className="form-group">
              <label className="form-label"><FiShield style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Professional Registry ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="NMC123456"
                value={form.registryId}
                onChange={(e) => setForm({ ...form, registryId: e.target.value.toUpperCase() })}
                style={{ textTransform: 'uppercase' }}
                disabled={verifying}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                NMC for Doctors • PCI for Pharmacists • PMC for Lab Technicians
              </p>
            </div>

            <button
              onClick={handleVerifyRegistry}
              className="btn btn-primary"
              disabled={verifying}
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '14px' }}
            >
              {verifying ? (
                <><span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> Verifying...</>
              ) : (
                <><FiArrowRight style={{ marginRight: '8px' }} /> Verify Registry</>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Show verified info, enter email */}
        {step === 2 && registryData && (
          <div>
            {/* Verified Registry Info */}
            <div style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FiCheckCircle style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Registry Verified</span>
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Registry: </span>
                  <span style={{ fontWeight: 500 }}>{registryData.registryName}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ID: </span>
                  <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{registryData.registryId}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Name: </span>
                  <span style={{ fontWeight: 500 }}>{form.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Role: </span>
                  <span style={{
                    fontWeight: 600,
                    color: ROLE_LABELS[registryData.role]?.color || 'var(--text-primary)',
                  }}>
                    {ROLE_LABELS[registryData.role]?.icon} {ROLE_LABELS[registryData.role]?.label || registryData.role}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#22c55e',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}>
                    Auto-assigned
                  </span>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="form-group">
              <label className="form-label"><FiMail style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="doctor@hospital.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                We'll send a verification OTP to this email
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
              >
                <FiArrowLeft style={{ marginRight: '8px' }} /> Back
              </button>
              <button
                onClick={handleSendOtp}
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 2, justifyContent: 'center', padding: '14px' }}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /></>
                ) : (
                  <><FiArrowRight style={{ marginRight: '8px' }} /> Send OTP</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Enter OTP */}
        {step === 3 && (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
              Enter the 6-digit code sent to <strong>{form.email}</strong>
            </p>

            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="123456"
                maxLength={6}
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
                style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '8px', fontFamily: 'monospace' }}
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              className="btn btn-primary"
              disabled={loading || form.otp.length !== 6}
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '14px' }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> Verifying...</>
              ) : (
                <><FiCheckCircle style={{ marginRight: '8px' }} /> Verify & Create Account</>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={handleResendOtp}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Didn't receive the code? Resend OTP
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Change email address
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <FiCheckCircle style={{ fontSize: '40px', color: '#22c55e' }} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Account Created!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Your professional account has been successfully registered.
            </p>

            <div style={{
              background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '16px',
              marginBottom: '24px', textAlign: 'left',
            }}>
              <div style={{ fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Role: </span>
                  <strong>{ROLE_LABELS[registryData?.role]?.icon} {ROLE_LABELS[registryData?.role]?.label}</strong>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Email: </span>
                  <strong>{form.email}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>License: </span>
                  <strong style={{ color: '#22c55e' }}>Active ✓</strong>
                </div>
              </div>
            </div>

            <button
              onClick={goToDashboard}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Footer */}
        {step < 4 && (
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}