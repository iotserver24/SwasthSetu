'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiUser, FiPhone, FiMail, FiMapPin, FiHeart, FiActivity, FiFileText, FiPackage, FiDownload, FiPrinter, FiVolume2, FiEdit, FiPlus, FiX, FiCheck, FiMic, FiMicOff, FiSend, FiMessageSquare } from 'react-icons/fi';

export default function PatientDetailPage() {
  const { pid } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [qr, setQr] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Consultation states
  const [consultStep, setConsultStep] = useState(1); // 1=Record/Type, 2=Review/Save
  const [consultMode, setConsultMode] = useState('voice');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [timer, setTimer] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [consultResult, setConsultResult] = useState(null);
  const [editableJson, setEditableJson] = useState('');

  const mediaRecorder = useRef(null);
  const timerRef = useRef(null);
  const chunks = useRef([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      const [pRes, cRes, rxRes, ltRes, qrRes] = await Promise.all([
        api.get(`/patients/${pid}`),
        api.get(`/consultations/patient/${pid}`),
        api.get(`/prescriptions?patientPid=${pid}`),
        api.get(`/labtests?patientPid=${pid}`),
        api.get(`/patients/${pid}/qr`),
      ]);
      setPatient(pRes.data);
      setConsultations(cRes.data);
      setPrescriptions(rxRes.data);
      setLabTests(ltRes.data);
      setQr(qrRes.data.qr);
      // Initialize edit form when patient is loaded
      setEditForm({
        ...pRes.data,
        allergies: pRes.data.allergies?.join(', ') || '',
        languages: pRes.data.languages?.join(', ') || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    if (pid && user) loadData();
  }, [pid, user, loadData]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  
  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const payload = {
        ...editForm,
        allergies: editForm.allergies ? editForm.allergies.split(',').map(s => s.trim()) : [],
        languages: editForm.languages ? editForm.languages.split(',').map(s => s.trim()) : [],
      };
      await api.put(`/patients/${pid}`, payload);
      toast.success('Patient information updated!');
      setShowEditModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);
      setTimer(0);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } catch (err) { toast.error('Microphone access denied'); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') mediaRecorder.current.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const submitConsultAudio = async () => {
    if (!audioBlob) return toast.error('No recording found');
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('patientPid', pid);
      const { data } = await api.post('/consultations/audio/draft', formData);
      setConsultResult(data);
      setEditableJson(JSON.stringify(data.aiSummary, null, 2));
      setConsultStep(2);
    } catch (err) { toast.error(err.response?.data?.error || 'Processing failed'); }
    finally { setProcessing(false); }
  };

  const submitConsultText = async () => {
    if (!textInput.trim()) return toast.error('Please enter notes');
    setProcessing(true);
    try {
      const { data } = await api.post('/consultations/text/draft', { patientPid: pid, text: textInput });
      setConsultResult(data);
      setEditableJson(JSON.stringify(data.aiSummary, null, 2));
      setConsultStep(2);
    } catch (err) { toast.error(err.response?.data?.error || 'Processing failed'); }
    finally { setProcessing(false); }
  };

  const saveFinalConsultation = async () => {
    setProcessing(true);
    try {
      const finalSummary = JSON.parse(editableJson);
      const payload = {
        patientPid: pid,
        audioUrl: consultResult.audioUrl,
        transcript: consultResult.transcript,
        detectedLanguage: consultResult.detectedLanguage,
        aiSummary: finalSummary,
      };
      await api.post('/consultations/save', payload);
      toast.success('Consultation saved!');
      setShowConsultModal(false);
      resetConsultation();
      loadData();
    } catch (err) {
      toast.error(err instanceof SyntaxError ? 'Invalid JSON format' : (err.response?.data?.error || 'Failed to save'));
    } finally { setProcessing(false); }
  };

  const resetConsultation = () => {
    setConsultStep(1);
    setAudioBlob(null);
    setTextInput('');
    setConsultResult(null);
    setEditableJson('');
    setTimer(0);
  };

  const handleDownloadQr = () => {
    if (!qr) return;
    const link = document.createElement('a');
    link.href = qr;
    link.download = `${patient.pid}-${patient.name}.png`;
    link.click();
  };

  const handlePrintQr = () => {
    if (!qr) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print QR - ${patient.pid}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
          <h2>Patient: ${patient.name}</h2>
          <h3>PID: ${patient.pid}</h3>
          <img src="${qr}" style="width:300px;height:300px;margin-top:20px;" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
  };

  const playAudio = (text, lang) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech not supported in this browser.');
      return;
    }
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || 'en-US';
    // Slightly slower rate for clarity
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    toast.success('Playing audio instructions...', { icon: '🔊' });
  };

  if (loading || authLoading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!patient) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}><h2>Patient not found</h2></div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiUser },
    { id: 'consultations', label: 'Consultations', icon: FiActivity },
    { id: 'prescriptions', label: 'Prescriptions', icon: FiFileText },
    { id: 'labtests', label: 'Lab Tests', icon: FiPackage },
  ];

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      {/* Patient Header */}
      <div className="glass-card animate-in" style={{ padding: '28px', marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 800, flexShrink: 0,
        }}>
          {patient.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{patient.name}</h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{patient.pid}</span>
            <span>{patient.age} yrs, {patient.gender}</span>
            {patient.phone && <span><FiPhone size={14} style={{ verticalAlign: 'middle' }} /> {patient.phone}</span>}
            {patient.bloodGroup && <span><FiHeart size={14} style={{ verticalAlign: 'middle' }} /> {patient.bloodGroup}</span>}
          </div>
          {patient.languages?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {patient.languages.map((l, i) => (
                <span key={i} className="badge badge-ordered">{l}</span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
            <FiEdit /> Edit Info
          </button>
          <button className="btn btn-primary" onClick={() => setShowConsultModal(true)}>
            <FiPlus /> New Consultation
          </button>
        </div>

        {qr && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '8px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR" style={{ width: '100px', height: '100px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={handleDownloadQr} title="Download QR Code"><FiDownload /></button>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={handlePrintQr} title="Print QR Code"><FiPrinter /></button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', overflowX: 'auto' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="btn" style={{
              background: tab === t.id ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: tab === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: tab === t.id ? '1px solid var(--border-glow)' : '1px solid transparent',
              padding: '10px 18px', fontSize: '0.85rem',
            }}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '1rem' }}>Personal Info</h3>
            {[
              { label: 'Email', value: patient.email },
              { label: 'Address', value: patient.address },
              { label: 'Allergies', value: patient.allergies?.join(', ') },
            ].filter(i => i.value).map((item, idx) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                <div style={{ fontSize: '0.9rem' }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '1rem' }}>Emergency Contact</h3>
            {patient.emergencyContact?.name ? (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Name</div>
                  <div>{patient.emergencyContact.name}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</div>
                  <div>{patient.emergencyContact.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Relation</div>
                  <div>{patient.emergencyContact.relation}</div>
                </div>
              </>
            ) : <p style={{ color: 'var(--text-muted)' }}>Not provided</p>}
          </div>
          <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '1rem' }}>Quick Stats</h3>
            <div style={{ display: 'flex', gap: '32px' }}>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{consultations.length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consultations</div></div>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{prescriptions.length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prescriptions</div></div>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-success)' }}>{labTests.length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lab Tests</div></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'consultations' && (
        <div>
          {consultations.length === 0 ? (
            <div className="glass-card empty-state"><div className="empty-icon">🩺</div><p>No consultations yet</p></div>
          ) : consultations.map((c) => (
            <div key={c._id} className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span className="badge badge-ordered">{c.detectedLanguage || 'Unknown'}</span>
                  <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {c.transcript && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Transcript</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.transcript}</p>
                </div>
              )}
              {c.aiSummary && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {c.aiSummary.symptoms?.length > 0 && (
                    <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Symptoms</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{c.aiSummary.symptoms.map((s, i) => <span key={i} className="badge badge-pending">{s}</span>)}</div>
                    </div>
                  )}
                  {c.aiSummary.diagnosis && (
                    <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Diagnosis</div>
                      <p style={{ fontSize: '0.9rem' }}>{c.aiSummary.diagnosis}</p>
                    </div>
                  )}
                  {c.aiSummary.clinicalNotes && (
                    <div style={{ gridColumn: 'span 2' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Clinical Notes</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{c.aiSummary.clinicalNotes}</p>
                    </div>
                  )}
                  {c.aiSummary.followUp && (
                    <div style={{ gridColumn: 'span 2' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Follow-up</div>
                      <p style={{ fontSize: '0.9rem' }}>{c.aiSummary.followUp}</p>
                    </div>
                  )}
                  {c.aiSummary.translatedInstructions?.text && (
                    <div style={{ gridColumn: 'span 2', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 600 }}>Message for Patient ({c.aiSummary.translatedInstructions.language})</div>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => playAudio(c.aiSummary.translatedInstructions.text, c.aiSummary.translatedInstructions.language)}
                          style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        >
                          <FiVolume2 style={{ marginRight: '6px' }} /> Play Audio
                        </button>
                      </div>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>&quot;{c.aiSummary.translatedInstructions.text}&quot;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'prescriptions' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {prescriptions.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💊</div><p>No prescriptions</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Medications</th><th>Doctor</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {prescriptions.map((rx) => (
                    <tr key={rx._id}>
                      <td>{rx.medications?.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join('; ')}</td>
                      <td>{rx.doctorName}</td>
                      <td><span className={`badge badge-${rx.status}`}>{rx.status}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(rx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'labtests' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {labTests.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔬</div><p>No lab tests</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Test</th><th>Status</th><th>Results</th><th>Date</th></tr></thead>
                <tbody>
                  {labTests.map((t) => (
                    <tr key={t._id}>
                      <td>{t.testName}</td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td>{t.results || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && editForm && (
        <div className="modal-overlay animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>✏️ Edit Patient Details</h2>
              <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setShowEditModal(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleUpdatePatient}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" className="form-input" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={editForm.bloodGroup} onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Allergies (comma separated)</label>
                  <input type="text" className="form-input" value={editForm.allergies} onChange={e => setEditForm({...editForm, allergies: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Emergency Contact</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <input type="text" className="form-input" placeholder="Name" value={editForm.emergencyContact?.name} onChange={e => setEditForm({...editForm, emergencyContact: {...editForm.emergencyContact, name: e.target.value}})} />
                        <input type="text" className="form-input" placeholder="Phone" value={editForm.emergencyContact?.phone} onChange={e => setEditForm({...editForm, emergencyContact: {...editForm.emergencyContact, phone: e.target.value}})} />
                    </div>
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={processing}>
                    {processing ? 'Updating...' : <><FiCheck /> Save Changes</>}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Consultation Modal */}
      {showConsultModal && (
        <div className="modal-overlay animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '700px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>🩺 {consultStep === 1 ? 'New Consultation' : 'Review AI Draft'}</h2>
              <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setShowConsultModal(false); resetConsultation(); }}><FiX size={20} /></button>
            </div>

            {consultStep === 1 ? (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  <button className={`btn ${consultMode === 'voice' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setConsultMode('voice')} style={{ flex: 1, justifyContent: 'center' }}>
                    <FiMic /> Voice
                  </button>
                  <button className={`btn ${consultMode === 'text' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setConsultMode('text')} style={{ flex: 1, justifyContent: 'center' }}>
                    <FiMessageSquare /> Text
                  </button>
                </div>

                {consultMode === 'voice' ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    {recording && <div className="recorder-timer" style={{ fontSize: '2rem', marginBottom: '20px' }}>{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</div>}
                    <button 
                      className={`recorder-btn ${recording ? 'recording' : 'idle'}`}
                      style={{ margin: '0 auto 20px', width: '80px', height: '80px' }}
                      onClick={recording ? stopRecording : startRecording}
                    >
                      {recording ? <FiMicOff size={32} /> : <FiMic size={32} />}
                    </button>
                    <p style={{ color: 'var(--text-secondary)' }}>{recording ? 'Recording... click to stop' : audioBlob ? 'captured!' : 'click to record'}</p>
                    {audioBlob && !recording && (
                      <button className="btn btn-primary" onClick={submitConsultAudio} style={{ width: '100%', marginTop: '24px' }} disabled={processing}>
                        {processing ? 'Processing...' : 'Generate AI Draft'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea className="form-textarea" rows={8} placeholder="Enter consultation notes..." value={textInput} onChange={e => setTextInput(e.target.value)} />
                    <button className="btn btn-primary" onClick={submitConsultText} style={{ width: '100%', marginTop: '20px' }} disabled={processing || !textInput.trim()}>
                      {processing ? 'Processing...' : 'Generate AI Draft'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <textarea className="form-textarea" rows={12} style={{ fontFamily: 'monospace', fontSize: '13px' }} value={editableJson} onChange={e => setEditableJson(e.target.value)} />
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button className="btn btn-success" onClick={saveFinalConsultation} style={{ flex: 1 }} disabled={processing}>
                    {processing ? 'Saving...' : 'Confirm & Save'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setConsultStep(1)}>Back</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
