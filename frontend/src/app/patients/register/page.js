'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiUserPlus, FiCheck, FiDownload, FiPrinter } from 'react-icons/fi';

export default function RegisterPatientPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [form, setForm] = useState({
    name: '', age: '', gender: '', phone: '', email: '',
    address: '', bloodGroup: '', allergies: '', languages: '',
    emergencyContact: { name: '', phone: '', relation: '' },
  });

  useEffect(() => {
    if (!authLoading && (!user || !['doctor', 'admin'].includes(user.role))) router.push('/dashboard');
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()) : [],
        languages: form.languages ? form.languages.split(',').map(s => s.trim()) : [],
      };
      const { data: patient } = await api.post('/patients', payload);
      const { data: qr } = await api.get(`/patients/${patient.pid}/qr`);
      setQrData({ pid: patient.pid, name: patient.name, qr: qr.qr });
      toast.success(`Patient ${patient.name} registered! PID: ${patient.pid}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrData?.qr) return;
    const link = document.createElement('a');
    link.href = qrData.qr;
    link.download = `patient-qr-${qrData.pid}.png`;
    link.click();
  };

  const handlePrintQr = () => {
    if (!qrData?.qr) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print QR - ${qrData.pid}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
          <h2>Patient: ${qrData.name}</h2>
          <h3>PID: ${qrData.pid}</h3>
          <img src="${qrData.qr}" style="width:300px;height:300px;margin-top:20px;" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
  };

  if (authLoading) return <div className="loading-screen"><div className="spinner" /></div>;

  if (qrData) {
    return (
      <div className="container" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div className="glass-card animate-in" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Patient Registered</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{qrData.pid}</span> — {qrData.name}
          </p>
          <div style={{
            background: 'white', borderRadius: 'var(--radius-md)', padding: '16px',
            display: 'inline-block', marginBottom: '24px',
          }}>
            <img src={qrData.qr} alt="Patient QR Code" style={{ width: '200px', height: '200px' }} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Scan this QR code to access the patient's records instantly
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadQr}><FiDownload /> Download</button>
            <button className="btn btn-secondary btn-sm" onClick={handlePrintQr}><FiPrinter /> Print</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => { setQrData(null); setForm({ name: '', age: '', gender: '', phone: '', email: '', address: '', bloodGroup: '', allergies: '', languages: '', emergencyContact: { name: '', phone: '', relation: '' } }); }}>
              <FiUserPlus /> Register Another
            </button>
            <button className="btn btn-secondary" onClick={() => router.push(`/patients/${qrData.pid}`)}>
              View Patient →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="page-header animate-in">
        <h1 className="page-title">👤 Register New Patient</h1>
        <p className="page-subtitle">Create a patient record with unique ID and QR code</p>
      </div>

      <div className="glass-card animate-in" style={{ maxWidth: '640px', padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" placeholder="Patient name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Age *</label>
              <input type="number" className="form-input" placeholder="25" min="0" max="150"
                value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input type="tel" className="form-input" placeholder="+91 9876543210"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="patient@email.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select className="form-select" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Languages</label>
              <input type="text" className="form-input" placeholder="Hindi, English, Tamil"
                value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Address</label>
              <input type="text" className="form-input" placeholder="Full address"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Allergies</label>
              <input type="text" className="form-input" placeholder="Penicillin, Peanuts (comma separated)"
                value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '24px 0', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>Emergency Contact</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" placeholder="Contact name"
                  value={form.emergencyContact.name} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-input" placeholder="Phone"
                  value={form.emergencyContact.phone} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} />
              </div>
              <div className="form-group">
                <label className="form-label">Relation</label>
                <input type="text" className="form-input" placeholder="Spouse, Parent..."
                  value={form.emergencyContact.relation} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relation: e.target.value } })} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
            {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : <><FiCheck /> Register Patient</>}
          </button>
        </form>
      </div>
    </div>
  );
}
