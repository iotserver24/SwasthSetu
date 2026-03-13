"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PatientCard from "@/components/patient/PatientCard";
import SummaryCard from "@/components/consultation/SummaryCard";
import TranscriptPanel from "@/components/consultation/TranscriptPanel";
import { getPatient } from "@/services/api";

interface Prescription { medicine: string; dosage: string; duration: string; }
interface Consultation {
  _id: string;
  transcript: string;
  symptoms: string[];
  diagnosis: string;
  prescriptions: Prescription[];
  diagnosticTests: string[];
  followUpInstructions: string;
  patientLanguage: string;
  doctorLanguage: string;
  date: string;
}
interface LabResult { _id: string; testName: string; result: string; status: string; uploadedAt: string; }
interface PharmacyItem { _id: string; medicine: string; dosage: string; duration: string; dispensed: boolean; dispensedAt?: string; }
interface Patient {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  createdAt: string;
  consultations: Consultation[];
  labResults: LabResult[];
  pharmacyItems: PharmacyItem[];
}

function parseTranscriptLines(raw: string) {
  return raw.split("\n").filter(Boolean).map((line) => {
    const m = line.match(/^\[(.+?)\]: (.+)$/);
    if (m) return { speaker: m[1], lang: "", text: m[2] };
    return { speaker: "Unknown", lang: "", text: line };
  });
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-3xl font-bold leading-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-[12px] text-slate-400">{sub}</p>}
    </div>
  );
}

export default function PatientRecordPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await getPatient(id) as Patient;
      setPatient(data);
      if (data.consultations.length > 0 && !expanded) {
        setExpanded(data.consultations[data.consultations.length - 1]._id);
      }
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchPatient(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <DashboardLayout title="Patient Record">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-10 h-10 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin mb-4" />
          <p className="text-[14px] text-slate-400 font-medium">Loading patient record…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !patient) {
    return (
      <DashboardLayout title="Patient Record">
        <div className="flex flex-col items-center justify-center py-32">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "#fff1f2", border: "1px solid #fecaca" }}
          >
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-[15px] font-bold text-slate-700 mb-1">{error || "Patient not found"}</p>
          <button onClick={() => router.push("/doctor")} className="text-[13px] text-blue-600 hover:underline mt-1">
            Back to Doctor Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const labPending = patient.labResults.filter((l) => l.status === "pending").length;
  const labDone = patient.labResults.filter((l) => l.status === "completed").length;
  const rxPending = patient.pharmacyItems.filter((p) => !p.dispensed).length;
  const rxDone = patient.pharmacyItems.filter((p) => p.dispensed).length;

  return (
    <DashboardLayout
      title="Patient Record"
      subtitle={`${patient.name} · ${patient.patientId}`}
      headerAction={
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/lab")}
            className="px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition hover:opacity-80"
            style={{ background: "#faf5ff", color: "#7e22ce", border: "1px solid #d8b4fe" }}
          >
            Lab Dashboard
          </button>
          <button
            onClick={() => router.push("/pharmacy")}
            className="px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition hover:opacity-80"
            style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
          >
            Pharmacy Dashboard
          </button>
          <button
            onClick={fetchPatient}
            className="px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition hover:opacity-80 flex items-center gap-1.5"
            style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Patient banner */}
        <PatientCard patient={patient} />

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Consultations" value={patient.consultations.length} color="#1d4ed8" />
          <StatCard
            label="Lab Tests"
            value={`${labDone}/${patient.labResults.length}`}
            sub={labPending > 0 ? `${labPending} pending` : "All complete"}
            color="#7c3aed"
          />
          <StatCard
            label="Prescriptions"
            value={`${rxDone}/${patient.pharmacyItems.length}`}
            sub={rxPending > 0 ? `${rxPending} pending` : "All dispensed"}
            color="#059669"
          />
          <StatCard
            label="Status"
            value={patient.consultations.length > 0 ? "Active" : "New"}
            color={patient.consultations.length > 0 ? "#f59e0b" : "#94a3b8"}
          />
        </div>

        {/* Consultation Timeline */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}
          >
            <p className="text-[13px] font-bold text-slate-700">Consultation History</p>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
            >
              {patient.consultations.length} entry(s)
            </span>
          </div>

          {patient.consultations.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-[13px] text-slate-400">No consultations recorded yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {[...patient.consultations].reverse().map((c, idx) => (
                <div key={c._id}>
                  <button
                    onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                    className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-slate-50 transition"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-800 truncate">
                        {c.diagnosis || "Consultation Record"}
                      </p>
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {new Date(c.date).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        &nbsp;·&nbsp;
                        <span className="text-orange-500 font-medium">{c.patientLanguage}</span>
                        &nbsp;→&nbsp;
                        <span className="text-blue-500 font-medium">{c.doctorLanguage}</span>
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${expanded === c._id ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expanded === c._id && (
                    <div className="px-6 pb-6 space-y-4" style={{ background: "#fafbfc", borderTop: "1px solid #f1f5f9" }}>
                      <div className="pt-4">
                        <TranscriptPanel
                          lines={parseTranscriptLines(c.transcript)}
                          patientLanguage={c.patientLanguage}
                          doctorLanguage={c.doctorLanguage}
                          isLive={false}
                        />
                      </div>
                      <SummaryCard
                        summary={{
                          symptoms: c.symptoms,
                          diagnosis: c.diagnosis,
                          prescriptions: c.prescriptions,
                          diagnosticTests: c.diagnosticTests,
                          followUpInstructions: c.followUpInstructions,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lab Results */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}
          >
            <p className="text-[13px] font-bold text-slate-700">Lab Results</p>
            <button
              onClick={() => router.push("/lab")}
              className="text-[12px] font-semibold text-purple-600 hover:text-purple-800 transition"
            >
              Open Lab →
            </button>
          </div>
          {patient.labResults.length === 0 ? (
            <div className="py-10 text-center"><p className="text-[13px] text-slate-400">No tests ordered</p></div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {patient.labResults.map((lab) => (
                <div key={lab._id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: lab.status === "completed" ? "#22c55e" : "#f59e0b" }}
                    />
                    <div>
                      <p className="text-[13.5px] font-semibold text-slate-700">{lab.testName}</p>
                      {lab.status === "completed" && (
                        <p className="text-[12px] text-green-700 mt-0.5 font-medium">Result: {lab.result}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0"
                    style={
                      lab.status === "completed"
                        ? { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }
                        : { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }
                    }
                  >
                    {lab.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pharmacy Status */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}
          >
            <p className="text-[13px] font-bold text-slate-700">Pharmacy Dispensing Status</p>
            <button
              onClick={() => router.push("/pharmacy")}
              className="text-[12px] font-semibold text-green-600 hover:text-green-800 transition"
            >
              Open Pharmacy →
            </button>
          </div>
          {patient.pharmacyItems.length === 0 ? (
            <div className="py-10 text-center"><p className="text-[13px] text-slate-400">No prescriptions issued</p></div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {patient.pharmacyItems.map((item) => (
                <div key={item._id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13.5px] font-semibold text-slate-700">{item.medicine}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">{item.dosage} · {item.duration}</p>
                    {item.dispensed && item.dispensedAt && (
                      <p className="text-[11.5px] text-green-600 mt-0.5 font-medium">
                        Dispensed {new Date(item.dispensedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0"
                    style={
                      item.dispensed
                        ? { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }
                        : { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }
                    }
                  >
                    {item.dispensed ? "Dispensed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
