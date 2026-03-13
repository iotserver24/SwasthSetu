'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { FiMail, FiLock, FiLogIn, FiShield, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

export default function LoginPage() {
  const { loginAdmin, verifyLoginOtp, setAuth } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const [form, setForm] = useState({
    registryId: '',
    email: '',
    password: '',
    otp: '',
  });
  const [resending, setResending] = useState(false);

  // Step 1: Professional - send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!form.registryId?.trim()) {
      toast.error('Enter your registry ID');
      return;
    }
    if (!form.email?.trim()) {
      toast.error('Enter your email');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/login', {
        registryId: form.registryId.toUpperCase().trim(),
        email: form.email.trim(),
      });
      setStep(2);
      toast.success('OTP sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Professional - verify OTP and go to dashboard
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!form.otp || form.otp.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const user = await verifyLoginOtp(email, form.otp);
      toast.success(`Welcome back, ${user.name}!`);
      // Full redirect so dashboard loads with auth from localStorage
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
      setLoading(false);
    }
  };

  // Admin login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!form.email?.trim() || !form.password) {
      toast.error('Email and password required');
      return;
    }
    setLoading(true);
    try {
      const user = await loginAdmin(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name}!`);
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  const backToStep1 = () => {
    setStep(1);
    setForm((f) => ({ ...f, otp: '' }));
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'var(--gradient-hero)',
    }}>
      <div className="glass-card animate-in" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '2.5rem' }}>🏥</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '12px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Sign in to SwasthyaSetu</p>
        </div>

        {adminMode ? (
          <>
            <form onSubmit={handleAdminLogin}>
              <div className="form-group">
                <label className="form-label"><FiMail style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="admin@hospital.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label"><FiLock style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '14px' }}>
                {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : <><FiLogIn /> Sign In</>}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => { setAdminMode(false); setForm({ ...form, password: '' }); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                ← Professional login (OTP)
              </button>
            </p>
          </>
        ) : step === 1 ? (
          <>
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label"><FiShield style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Registry ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="NMC123456"
                  value={form.registryId}
                  onChange={(e) => setForm({ ...form, registryId: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label"><FiMail style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="doctor@hospital.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '14px' }}>
                {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : <><FiArrowRight style={{ marginRight: '8px' }} /> Send OTP</>}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setAdminMode(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Admin? Sign in with password
              </button>
            </p>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
              Enter the 6-digit code sent to <strong>{form.email}</strong>
            </p>
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label">Verification Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="123456"
                  maxLength={6}
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
                  style={{ fontSize: '1.25rem', textAlign: 'center', letterSpacing: '6px', fontFamily: 'monospace' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || form.otp.length !== 6}
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '14px' }}>
                {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : <><FiLogIn /> Sign In</>}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '12px' }}>
              <button type="button" onClick={backToStep1} disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.9rem' }}>
                <FiArrowLeft style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Use different email
              </button>
            </p>
            <p style={{ textAlign: 'center', marginTop: '8px' }}>
              <button
                type="button"
                disabled={loading || resending}
                onClick={async () => {
                  setResending(true);
                  try {
                    await api.post('/auth/resend-otp', { email: form.email, purpose: 'login', registryId: form.registryId?.toUpperCase?.()?.trim?.() });
                    toast.success('OTP resent');
                  } catch (e) {
                    toast.error(e.response?.data?.error || 'Failed to resend');
                  } finally {
                    setResending(false);
                  }
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            </p>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
