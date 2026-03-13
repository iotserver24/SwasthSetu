\"use client\";
import { useEffect, useMemo, useRef, useState } from \"react\";
import { useRouter } from \"next/navigation\";
import DashboardLayout from \"@/components/layout/DashboardLayout\";
import TranscriptPanel from \"@/components/consultation/TranscriptPanel\";
import SummaryCard from \"@/components/consultation/SummaryCard\";
import { saveConsultation } from \"@/services/api\";

type Stage = \"idle\" | \"recording\" | \"transcript-ready\" | \"summary-ready\" | \"saved\";

interface TranscriptLine { speaker: string; lang: string; text: string; }
interface Prescription { medicine: string; dosage: string; duration: string; }
interface Summary {
  symptoms: string[];
  diagnosis: string;
  prescriptions: Prescription[];
  tests: string[];
  followUpInstructions: string;
}

const LANGUAGES = [\"Hindi\", \"Tamil\", \"Bengali\", \"Telugu\", \"Marathi\", \"Kannada\", \"Gujarati\", \"English\"];

function parseTranscriptLines(raw: string): TranscriptLine[] {
  return raw
    .split(\"\\n\")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(Patient|Doctor)\\s*[:\\-]\\s*(.+)$/i);
      if (match) {
        const speaker = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
        return { speaker, lang: \"\", text: match[2] };
      }
      return { speaker: \"Patient\", lang: \"\", text: line };
    });
}

export default function DoctorPage() {
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [stage, setStage] = useState<Stage>(\"idle\");
  const [patientLanguage, setPatientLanguage] = useState(\"Hindi\");
  const [name, setName] = useState(\"\");
  const [age, setAge] = useState(\"\");
  const [gender, setGender] = useState(\"Male\");
  const [existingPid, setExistingPid] = useState(\"\");

  const [transcriptText, setTranscriptText] = useState(\"\");
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState(\"audio/webm\");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [savedPatientId, setSavedPatientId] = useState(\"\");
  const [error, setError] = useState(\"\");
  const [loading, setLoading] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const transcriptLines = useMemo(() => parseTranscriptLines(transcriptText), [transcriptText]);

  function reset() {
    setStage(\"idle\");
    setTranscriptText(\"\");
    setSummary(null);
    setSavedPatientId(\"\");
    setError(\"\");
    setAudioBase64(null);
    setRecordingSeconds(0);
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (stage === \"recording\") {
      timer = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stage]);

  async function startRecording() {
    setError(\"\");
    setRecordingSeconds(0);
    setTranscriptText(\"\");
    setAudioBase64(null);
    setStage(\"recording\");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setAudioMimeType(mediaRecorder.mimeType || \"audio/webm\");

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(\",\")[1];
          setAudioBase64(base64);
          setStage(\"transcript-ready\");
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
    } catch (err) {
      setStage(\"idle\");
      setError(\"Microphone access denied or unavailable.\");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function handleGenerateSummary() {
    if (!name.trim() || !age || !gender) {
      setError(\"Fill in patient name, age, and gender first.\");
      return;
    }

    if (!transcriptText.trim() && !audioBase64) {
      setError(\"Provide a transcript or record audio to continue.\");
      return;
    }

    setError(\"\");
    setLoading(true);
    try {
      const data = (await saveConsultation({
        patientId: existingPid.trim() || undefined,
        name: name.trim(),
        age: parseInt(age),
        gender,
        patientLanguage,
        transcript: transcriptText.trim() || undefined,
        audioBase64: transcriptText.trim() ? undefined : audioBase64 || undefined,
        audioMimeType,
      })) as { patientId: string; transcript: string; structuredSummary: Summary };

      setTranscriptText(data.transcript);
      setSummary(data.structuredSummary);
      setSavedPatientId(data.patientId);
      setStage(\"summary-ready\");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout
      title="Doctor Consultation"
      subtitle="Multilingual patient consultation workflow"
      headerAction={
        stage !== "idle" ? (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New Consultation
          </button>
        ) : undefined
      }
    >
      {error && (
        <div
          className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium"
          style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#dc2626" }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
        {/* ── LEFT: Patient form + controls ─────────────── */}
        <div className="space-y-4">

          {/* Patient info card */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-4">Patient Information</p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] focus:outline-none transition"
                  style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Age *</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Years"
                    min={1} max={120}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] focus:outline-none transition"
                    style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] focus:outline-none transition bg-[#f8fafc]"
                    style={{ border: "1.5px solid #e2e8f0" }}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Existing Patient ID</label>
                <input
                  type="text"
                  value={existingPid}
                  onChange={(e) => setExistingPid(e.target.value)}
                  placeholder="PID-XXXXXXXX (optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-mono focus:outline-none transition"
                  style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Patient Language</label>
                <select
                  value={patientLanguage}
                  onChange={(e) => setPatientLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] focus:outline-none transition bg-[#f8fafc]"
                  style={{ border: "1.5px solid #e2e8f0" }}
                >
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Consultation Controls */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-4">Consultation Controls</p>

            {/* IDLE — Start button + mic */}
            {stage === "idle" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <button
                  onClick={startRecording}
                  disabled={loading}
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                    boxShadow: "0 8px 24px rgba(37,99,235,0.4)",
                  }}
                >
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-slate-700">Start Consultation</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">Tap the mic to begin recording</p>
                </div>
              </div>
            )}

            {stage === "idle" && transcriptText.trim() && (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium"
                  style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Transcript text detected
                </div>
                <button
                  onClick={handleGenerateSummary}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-[13.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {loading ? "Generating..." : "Generate Clinical Summary"}
                </button>
              </div>
            )}

            {/* RECORDING */}
            {stage === "recording" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mic-active"
                  style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 8px 24px rgba(220,38,38,0.4)" }}
                  onClick={stopRecording}
                >
                  <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="recording-dot w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <p className="text-[14px] font-semibold text-red-600">Recording...</p>
                  </div>
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    Capturing consultation · {recordingSeconds}s
                  </p>
                  <button
                    onClick={stopRecording}
                    className="mt-2 text-[12px] text-slate-500 hover:text-slate-700 underline"
                  >
                    Stop Recording
                  </button>
                </div>
              </div>
            )}

            {/* TRANSCRIPT READY */}
            {stage === "transcript-ready" && (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Audio captured successfully
                </div>
                <button
                  onClick={handleGenerateSummary}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-[13.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {loading ? "Generating..." : "Generate Clinical Summary"}
                </button>
              </div>
            )}

            {/* SUMMARY READY */}
            {stage === "summary-ready" && (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium"
                  style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Summary generated
                </div>
                <button
                  onClick={() => setStage("saved")}
                  className="w-full py-3 rounded-xl text-[13.5px] font-semibold text-white transition active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #059669, #047857)",
                    boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Consultation
                </button>
              </div>
            )}

            {/* SAVED */}
            {stage === "saved" && savedPatientId && (
              <div className="space-y-3">
                <div
                  className="rounded-xl p-4"
                  style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0" }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-green-600 mb-1">Consultation Saved</p>
                  <p className="text-[12px] text-slate-500 mb-2">Patient ID generated</p>
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2" style={{ border: "1px solid #d1fae5" }}>
                    <span className="text-[15px] font-bold text-slate-800 font-mono tracking-wider">{savedPatientId}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(savedPatientId)}
                      className="text-slate-400 hover:text-blue-600 transition p-0.5"
                      title="Copy"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/patient/${savedPatientId}`)}
                  className="w-full py-3 rounded-xl text-[13.5px] font-semibold text-white transition active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                    boxShadow: "0 4px 14px rgba(29,78,216,0.3)",
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Patient Record
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Transcript + Summary ────────────────── */}
        <div className="space-y-5">
          {/* Transcript editor */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Transcript</p>
              <button
                onClick={() => setTranscriptText("")}
                className="text-[12px] text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            </div>
            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Paste or edit the transcript here. If empty, audio will be transcribed by Sarvam."
              className="w-full min-h-[120px] rounded-xl px-4 py-3 text-[13px] focus:outline-none"
              style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
            />
            <p className="text-[11.5px] text-slate-400 mt-2">
              Tip: You can type or paste a transcript instead of recording audio.
            </p>
          </div>

          <TranscriptPanel
            lines={transcriptLines}
            patientLanguage={patientLanguage}
            doctorLanguage={"English"}
            isLive={stage === "recording"}
          />
          {summary && <SummaryCard summary={summary} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
