'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiMic, FiMicOff, FiSend, FiSearch, FiMessageSquare, FiChevronRight } from 'react-icons/fi';

export default function NewConsultationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=select patient, 2=record, 3=result
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'
  const [textInput, setTextInput] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [timer, setTimer] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const mediaRecorder = useRef(null);
  const timerRef = useRef(null);
  const chunks = useRef([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'doctor')) router.push('/dashboard');
  }, [user, authLoading, router]);

  const searchPatients = async (q) => {
    setPatientSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    try {
      const { data } = await api.get(`/patients?search=${q}`);
      setPatients(data.patients || []);
    } catch (err) { console.error(err); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.current.start();
      setRecording(true);
      setTimer(0);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const submitAudio = async () => {
    if (!audioBlob) return toast.error('No recording found');
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('patientPid', selectedPatient.pid);
      const { data } = await api.post('/consultations/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setResult(data);
      setStep(3);
      toast.success('Consultation processed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const submitText = async () => {
    if (!textInput.trim()) return toast.error('Please enter consultation text');
    setProcessing(true);
    try {
      const { data } = await api.post('/consultations/text', {
        patientPid: selectedPatient.pid,
        text: textInput,
      }, { timeout: 120000 });
      setResult(data);
      setStep(3);
      toast.success('Consultation processed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (authLoading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="page-header animate-in">
        <h1 className="page-title">🩺 New Consultation</h1>
        <p className="page-subtitle">Record or type a consultation, AI will transcribe and generate structured records</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'center' }}>
        {['Select Patient', 'Record / Type', 'Review Results'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700,
              background: step > i + 1 ? 'var(--accent-success)' : step === i + 1 ? 'var(--gradient-primary)' : 'var(--bg-glass)',
              color: step >= i + 1 ? 'white' : 'var(--text-muted)',
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.85rem', color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === i + 1 ? 600 : 400 }}>{s}</span>
            {i < 2 && <FiChevronRight style={{ color: 'var(--text-muted)' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Patient */}
      {step === 1 && (
        <div className="glass-card animate-in" style={{ maxWidth: '600px', padding: '32px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>Search Patient</h3>
          <div className="form-group">
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-input" style={{ paddingLeft: '40px' }}
                placeholder="Search by name, PID, or phone..."
                value={patientSearch} onChange={(e) => searchPatients(e.target.value)} />
            </div>
          </div>
          {patients.length > 0 && (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {patients.map((p) => (
                <div key={p._id} onClick={() => { setSelectedPatient(p); setStep(2); }}
                  style={{
                    padding: '14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: '1px solid var(--border-color)', marginBottom: '8px',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.background = 'var(--bg-glass)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.pid} · {p.age}yrs · {p.gender}</div>
                    </div>
                    <FiChevronRight />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Record/Type */}
      {step === 2 && selectedPatient && (
        <div className="animate-in">
          <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 600 }}>{selectedPatient.name}</span>
              <span style={{ marginLeft: '12px', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>{selectedPatient.pid}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>Change</button>
          </div>

          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button className={`btn ${mode === 'voice' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('voice')}>
              <FiMic /> Voice Recording
            </button>
            <button className={`btn ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('text')}>
              <FiMessageSquare /> Text Input
            </button>
          </div>

          {mode === 'voice' && (
            <div className="glass-card" style={{ padding: '40px' }}>
              <div className="recorder-container">
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                  {recording ? 'Recording... Speak clearly into the microphone' : audioBlob ? 'Recording captured! Click Process to analyze.' : 'Click the microphone to start recording the consultation'}
                </p>

                {recording && (
                  <div className="recorder-wave">
                    <span /><span /><span /><span /><span />
                  </div>
                )}

                {recording && <div className="recorder-timer">{formatTime(timer)}</div>}

                <button
                  className={`recorder-btn ${recording ? 'recording' : 'idle'}`}
                  onClick={recording ? stopRecording : startRecording}
                >
                  {recording ? <FiMicOff size={28} /> : <FiMic size={28} />}
                </button>

                {audioBlob && !recording && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button className="btn btn-secondary" onClick={() => { setAudioBlob(null); setTimer(0); }}>Re-record</button>
                    <button className="btn btn-primary" onClick={submitAudio} disabled={processing}>
                      {processing ? <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Processing...</> : <><FiSend /> Process with AI</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'text' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <div className="form-group">
                <label className="form-label">Enter consultation notes (any language)</label>
                <textarea className="form-textarea" rows={6}
                  placeholder="Type or paste the consultation conversation here... You can use Hindi, Tamil, Telugu, or any Indian language."
                  value={textInput} onChange={(e) => setTextInput(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={submitText} disabled={processing || !textInput.trim()}>
                {processing ? <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Processing...</> : <><FiSend /> Process with AI</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <div className="animate-in">
          <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 600 }}>AI Consultation Summary</h3>
              <span className="badge badge-ordered">{result.detectedLanguage}</span>
            </div>

            {result.transcript && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Transcript</div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{result.transcript}</p>
              </div>
            )}

            {result.aiSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {result.aiSummary.symptoms?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Symptoms</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {result.aiSummary.symptoms.map((s, i) => <span key={i} className="badge badge-pending">{s}</span>)}
                    </div>
                  </div>
                )}
                {result.aiSummary.diagnosis && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Diagnosis</div>
                    <p style={{ fontWeight: 600 }}>{result.aiSummary.diagnosis}</p>
                  </div>
                )}
                {result.aiSummary.clinicalNotes && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Clinical Notes</div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.aiSummary.clinicalNotes}</p>
                  </div>
                )}
                {result.aiSummary.prescriptions?.length > 0 && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Prescriptions (auto-sent to Pharmacy)</div>
                    <div className="table-wrapper">
                      <table className="table">
                        <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
                        <tbody>
                          {result.aiSummary.prescriptions.map((p, i) => (
                            <tr key={i}><td>{p.medication}</td><td>{p.dosage}</td><td>{p.frequency}</td><td>{p.duration}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {result.aiSummary.labTests?.length > 0 && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Lab Tests (auto-sent to Lab)</div>
                    <div className="table-wrapper">
                      <table className="table">
                        <thead><tr><th>Test</th><th>Instructions</th></tr></thead>
                        <tbody>
                          {result.aiSummary.labTests.map((t, i) => (
                            <tr key={i}><td>{t.testName}</td><td>{t.instructions || '—'}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {result.aiSummary.followUp && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Follow-up</div>
                    <p>{result.aiSummary.followUp}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => router.push(`/patients/${result.patientPid}`)}>View Patient Record →</button>
            <button className="btn btn-secondary" onClick={() => { setStep(1); setResult(null); setAudioBlob(null); setTextInput(''); setSelectedPatient(null); setPatientSearch(''); setPatients([]); }}>New Consultation</button>
          </div>
        </div>
      )}
    </div>
  );
}
