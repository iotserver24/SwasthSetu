'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';

export default function LoginPage() {
  const { loginAdmin } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await loginAdmin(form.email, form.password);
      if (userData) {
        toast.success(`Welcome back, ${userData.name}!`);
        router.replace('/dashboard');
      }
    } catch (err) {
      console.error('[Login Error]', err.response?.data?.error || err.message);
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="animate-in"
      style={{
        width: '100%',
        maxWidth: '420px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span style={{ fontSize: '2.5rem' }}>🏥</span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '12px' }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Sign in to SwasthyaSetu
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            <FiMail style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Email
          </label>
          <input
            type="email"
            className="form-input"
            placeholder="doctor@hospital.com"
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
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
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
              <FiLogIn /> Sign In
            </>
          )}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
          Register
        </Link>
      </p>
    </div>
  );
}
