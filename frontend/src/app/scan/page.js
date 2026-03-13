'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCamera, FiSearch, FiX } from 'react-icons/fi';

export default function ScanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [manualPid, setManualPid] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const html5QrRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    return () => { if (html5QrRef.current?.isScanning) html5QrRef.current.stop().catch(() => {}); };
  }, [user, authLoading, router]);

  const startScanner = async () => {
    const { Html5Qrcode } = await import('html5-qrcode');
    html5QrRef.current = new Html5Qrcode('qr-reader');
    setScanning(true);
    try {
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text) => {
          let pid = text;
          try { pid = JSON.parse(text).pid || text; } catch {}
          await html5QrRef.current.stop();
          setScanning(false);
          lookupPatient(pid);
        },
        () => {}
      );
    } catch {
      toast.error('Camera access denied');
      setScanning(false);
    }
  };

  const lookupPatient = async (pid) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/patients/${pid}`);
      setPatient(data);
      toast.success(`Found: ${data.name}`);
    } catch {
      toast.error('Patient not found');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="page-header animate-in">
        <h1 className="page-title">📷 QR Scanner</h1>
        <p className="page-subtitle">Scan patient QR or search by PID</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px' }}>
        <div className="glass-card animate-in" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Scan QR Code</h3>
          <div id="qr-reader" style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '16px', minHeight: scanning ? '300px' : '0' }} />
          {!scanning ? (
            <button className="btn btn-primary" onClick={startScanner} style={{ width: '100%', justifyContent: 'center' }}><FiCamera /> Start Scanner</button>
          ) : (
            <button className="btn btn-danger" onClick={async () => { await html5QrRef.current?.stop(); setScanning(false); }} style={{ width: '100%', justifyContent: 'center' }}><FiX /> Stop</button>
          )}
        </div>
        <div className="glass-card animate-in" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Manual Search</h3>
          <form onSubmit={(e) => { e.preventDefault(); if (manualPid.trim()) lookupPatient(manualPid.trim()); }}>
            <div className="form-group">
              <label className="form-label">Patient ID</label>
              <input type="text" className="form-input" placeholder="PID-000001" value={manualPid} onChange={(e) => setManualPid(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : <><FiSearch /> Search</>}
            </button>
          </form>
        </div>
      </div>
      {patient && (
        <div className="glass-card animate-in" style={{ maxWidth: '800px', padding: '24px', marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800 }}>{patient.name.charAt(0)}</div>
              <div>
                <h3 style={{ fontWeight: 600 }}>{patient.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{patient.pid}</span> · {patient.age} yrs · {patient.gender}</p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => router.push(`/patients/${patient.pid}`)}>View Full Record →</button>
          </div>
        </div>
      )}
    </div>
  );
}
