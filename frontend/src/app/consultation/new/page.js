'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiMic, FiMicOff, FiSend, FiSearch, FiMessageSquare, FiChevronRight, FiVolume2 } from 'react-icons/fi';

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
  const [editableJson, setEditableJson] = useState('');
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
      const { data } = await api.post('/consultations/audio/draft', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setResult(data);
      // Initialize the editable JSON string with the AI's summary
      setEditableJson(JSON.stringify(data.aiSummary, null, 2));
      setStep(3);
      toast.success('AI Draft generated successfully!');
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
      const { data } = await api.post('/consultations/text/draft', {
        patientPid: selectedPatient.pid,
        text: textInput,
      }, { timeout: 120000 });
      setResult(data);
      setEditableJson(JSON.stringify(data.aiSummary, null, 2));
      setStep(3);
      toast.success('AI Draft generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const speakInstructions = () => {
    if (!result?.aiSummary?.translatedInstructions?.text) {
      return toast.error('No spoken instructions available');
    }

    const { text, language } = result.aiSummary.translatedInstructions;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language || 'en-US';

    // Try to find a voice that matches the language
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(language.split('-')[0])) || voices[0];
    if (voice) utterance.voice = voice;

    window.speechSynthesis.cancel(); // Stop any current speech
    window.speechSynthesis.speak(utterance);
    toast.success(`Speaking in ${result.detectedLanguage}...`);
  };

  const saveFinalConsultation = async () => {
    setProcessing(true);
    try {
      // Parse the doctor's edited JSON
      const finalSummary = JSON.parse(editableJson);
      
      const payload = {
        patientPid: result.patientPid,
        audioUrl: result.audioUrl,
        transcript: result.transcript,
        detectedLanguage: result.detectedLanguage,
        aiSummary: finalSummary,
      };

      const { data } = await api.post('/consultations/save', payload);
      toast.success('Consultation saved permanently!');
      router.push(`/patients/${data.patientPid}`);
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error('Invalid JSON format. Please check your edits.');
      } else {
        toast.error(err.response?.data?.error || 'Failed to save consultation');
      }
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
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'center', overflowX: 'auto', paddingBottom: '8px' }}>
        {['Select Patient', 'Capture Data', 'Review & Save'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
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
            <button className={`btn ${mode === 'voice' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('voice')} style={{ flex: 1, justifyContent: 'center' }}>
              <FiMic /> Voice
            </button>
            <button className={`btn ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('text')} style={{ flex: 1, justifyContent: 'center' }}>
              <FiMessageSquare /> Text
            </button>
          </div>

          {mode === 'voice' && (
            <div className="glass-card" style={{ padding: '40px' }}>
              <div className="recorder-container">
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                  {recording ? 'Recording... Speak clearly into the microphone' : audioBlob ? 'Recording captured! Click Generate Draft.' : 'Click the microphone to start recording'}
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
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexDirection: 'column', width: '100%', maxWidth: '300px' }}>
                    <button className="btn btn-primary" onClick={submitAudio} disabled={processing}>
                      {processing ? <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Generating AI Draft...</> : <><FiSend /> Generate AI Draft</>}
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setAudioBlob(null); setTimer(0); }}>Discard & Re-record</button>
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
                  placeholder="Type or paste the consultation conversation here..."
                  value={textInput} onChange={(e) => setTextInput(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full" onClick={submitText} disabled={processing || !textInput.trim()}>
                {processing ? <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Generating AI Draft...</> : <><FiSend /> Generate AI Draft</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review & Edit Draft */}
      {step === 3 && result && (
        <div className="animate-in">
          <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span> Review AI Draft
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Please review and edit the structured JSON below before saving permanently.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-ordered">{result.detectedLanguage}</span>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={speakInstructions}
                  title="Speak instructions to patient"
                  style={{ padding: '6px 10px' }}
                >
                  <FiVolume2 /> Listen
                </button>
              </div>
            </div>

            {result.transcript && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Original Transcript</div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{result.transcript}</p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--accent-primary)' }}>Editable Clinical Data (JSON Format)</label>
              <textarea 
                className="form-textarea" 
                rows={15}
                style={{ fontFamily: 'monospace', fontSize: '14px', background: '#0f172a', color: '#f8fafc', borderColor: 'var(--accent-primary)' }}
                value={editableJson} 
                onChange={(e) => setEditableJson(e.target.value)} 
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                * Ensure the format remains valid JSON. Changes here will be permanently saved.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={saveFinalConsultation} disabled={processing} style={{ flex: 1, minWidth: '200px', justifyContent: 'center' }}>
                {processing ? 'Saving...' : '💾 Confirm & Save Consultation'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setStep(2); }} style={{ flexShrink: 0 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
