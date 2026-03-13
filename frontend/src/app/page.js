'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { FiMic, FiGlobe, FiUsers, FiActivity, FiShield, FiSearch } from 'react-icons/fi';

const features = [
  { icon: FiMic, title: 'Voice Consultation', desc: 'Record doctor-patient consultations and get instant AI transcription', color: '#06b6d4' },
  { icon: FiGlobe, title: 'Multilingual Support', desc: 'Auto-detect Hindi, Tamil, Telugu, Bengali and 10+ Indian languages', color: '#8b5cf6' },
  { icon: FiUsers, title: 'Patient Records', desc: 'Centralized patient IDs with full consultation history and prescriptions', color: '#10b981' },
  { icon: FiActivity, title: 'Department Workflow', desc: 'Seamlessly route prescriptions to pharmacy and lab tests to laboratory', color: '#f59e0b' },
  { icon: FiShield, title: 'Audit Trail', desc: 'Complete access logs for compliance - who viewed what, when', color: '#ef4444' },
  { icon: FiSearch, title: 'QR Patient ID', desc: 'Emergency-ready QR codes for instant patient identification and lookup', color: '#3b82f6' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        minHeight: '85vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--gradient-hero)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent)',
          top: '10%', right: '15%', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent)',
          bottom: '10%', left: '10%', filter: 'blur(60px)',
        }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏥</div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1 }}>
              <span className="gradient-text">SwasthyaSetu</span>
            </h1>
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 32px', lineHeight: 1.7 }}>
              Multilingual voice-based clinical interaction system. Bridge the language gap between doctors and patients with AI-powered consultations.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {user ? (
                <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                    Get Started →
                  </Link>
                  <Link href="/login" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '48px' }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>
              Everything a Hospital Needs
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              End-to-end clinical workflow from consultation to treatment, powered by AI
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}>
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={i}
                  className="glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  style={{ padding: '28px' }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                    background: `${feat.color}22`, color: feat.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px', fontSize: '1.3rem',
                  }}>
                    <Icon />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{feat.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section style={{ padding: '60px 0 80px', background: 'rgba(255,255,255,0.02)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '48px' }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>How It Works</h2>
          </motion.div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px',
            maxWidth: '900px', margin: '0 auto',
          }}>
            {[
              { step: '01', title: 'Register Patient', desc: 'Create patient record with unique PID and QR code' },
              { step: '02', title: 'Voice Consultation', desc: 'Record multilingual doctor-patient conversation' },
              { step: '03', title: 'AI Processing', desc: 'Gemini AI transcribes, detects language, extracts clinical data' },
              { step: '04', title: 'Auto-Route', desc: 'Prescriptions go to pharmacy, lab orders go to lab' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontWeight: 800, fontSize: '1.1rem',
                }}>
                  {item.step}
                </div>
                <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>{item.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
