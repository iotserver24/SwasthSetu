'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiUserPlus, FiBriefcase } from 'react-icons/fi';

const roles = [
  { value: 'doctor', label: '🩺 Doctor', desc: 'Conduct consultations and manage patients' },
  { value: 'pharmacy', label: '💊 Pharmacist', desc: 'Dispense prescriptions' },
  { value: 'lab', label: '🔬 Lab Technician', desc: 'Process laboratory tests' },
  { value: 'admin', label: '🛡️ Administrator', desc: 'System administration and audit' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.error('Please select a role');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      toast.success(`Account created! Welcome, ${user.name}`);
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="animate-in"
      style={{
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span style={{ fontSize: '2.5rem' }}>🏥</span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '12px' }}>Create Account</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Join SwasthyaSetu</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            <FiUser style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Full Name
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Dr. Priya Sharma"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            <FiMail style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Email
          </label>
          <input
            type="email"
            className="form-input"
            placeholder="priya@hospital.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            <FiLock style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Password
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="Min 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            <FiBriefcase style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Role
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {roles.map((r) => (
              <div
                key={r.value}
                onClick={() => setForm({ ...form, role: r.value })}
                style={{
                  padding: '14px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: `2px solid ${form.role === r.value ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background: form.role === r.value ? 'rgba(17, 82, 212, 0.1)' : 'var(--bg-glass)',
                  transition: 'var(--transition)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{r.label.split(' ')[0]}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {r.label.split(' ').slice(1).join(' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{
            width: '100%',
            justifyContent: 'center',
            marginTop: '8px',
            padding: '14px',
          }}
        >
          {loading ? (
            <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
          ) : (
            <>
              <FiUserPlus /> Create Account
            </>
          )}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
          Sign In
        </Link>
      </p>
    </div>
  );
}
