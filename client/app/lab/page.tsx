"use client";
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getPatient, updateLabResult } from "@/services/api";

interface LabResult {
  _id: string;
  testName: string;
  result: string;
  status: "pending" | "completed";
  uploadedAt: string;
}

interface Patient {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  labResults: LabResult[];
}

export default function LabPage() {
  const [searchId, setSearchId] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultInputs, setResultInputs] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchId.trim()) return;
    setError(""); setPatient(null); setLoading(true);
    try {
      const data = await getPatient(searchId.trim()) as Patient;
      setPatient(data);
      const init: Record<string, string> = {};
      data.labResults.forEach((r) => { init[r._id] = r.result || ""; });
      setResultInputs(init);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleUpload(lab: LabResult) {
    const result = resultInputs[lab._id];
    if (!result?.trim()) return;
    setUpdating((p) => ({ ...p, [lab._id]: true }));
    setUpdateErrors((p) => ({ ...p, [lab._id]: "" }));
    try {
      const updated = await updateLabResult({ patientId: patient!.patientId, testName: lab.testName, result: result.trim() }) as Patient;
      setPatient(updated);
    } catch (e: unknown) { setUpdateErrors((p) => ({ ...p, [lab._id]: (e as Error).message })); }
    finally { setUpdating((p) => ({ ...p, [lab._id]: false })); }
  }

  const pending = patient?.labResults.filter((l) => l.status === "pending").length ?? 0;
  const done = patient?.labResults.filter((l) => l.status === "completed").length ?? 0;

  return (
    <DashboardLayout title="Laboratory" subtitle="Diagnostic test results management">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Search by Patient ID (e.g. PID-XXXXXXXX)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13.5px] font-mono focus:outline-none transition"
            style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div
          className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium"
          style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#dc2626" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {patient && (
        <div className="space-y-5">
          {/* Patient summary */}
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold text-slate-800">{patient.name}</p>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                >
                  {patient.patientId}
                </span>
              </div>
              <p className="text-[13px] text-slate-400 mt-0.5">{patient.age} yrs · {patient.gender}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{pending}</p>
                <p className="text-[11px] text-slate-400 font-medium">Pending</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{done}</p>
                <p className="text-[11px] text-slate-400 font-medium">Completed</p>
              </div>
            </div>
          </div>

          {/* Test list */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div
              className="px-6 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}
            >
              <p className="text-[13px] font-bold text-slate-700">Ordered Diagnostic Tests</p>
              <p className="text-[12px] text-slate-400">{patient.labResults.length} test(s)</p>
            </div>

            {patient.labResults.length === 0 ? (
              <div className="py-14 text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p className="text-[13px] text-slate-400">No tests ordered for this patient</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                {patient.labResults.map((lab) => (
                  <div key={lab._id} className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      {/* Status dot */}
                      <div className="flex-shrink-0 mt-1">
                        <span
                          className="inline-flex w-2.5 h-2.5 rounded-full"
                          style={{ background: lab.status === "completed" ? "#22c55e" : "#f59e0b" }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[14px] font-semibold text-slate-800">{lab.testName}</p>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase"
                            style={
                              lab.status === "completed"
                                ? { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }
                                : { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }
                            }
                          >
                            {lab.status}
                          </span>
                        </div>

                        {lab.status === "completed" ? (
                          <div className="mt-2">
                            <p className="text-[12px] text-slate-400 mb-1">
                              Result uploaded {new Date(lab.uploadedAt).toLocaleString()}
                            </p>
                            <div
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium"
                              style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {lab.result}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex items-center gap-2">
                            <input
                              type="text"
                              value={resultInputs[lab._id] || ""}
                              onChange={(e) => setResultInputs((p) => ({ ...p, [lab._id]: e.target.value }))}
                              placeholder="Enter result (e.g. Hb: 12.4 g/dL)"
                              className="flex-1 max-w-xs px-3.5 py-2 rounded-xl text-[13px] focus:outline-none transition"
                              style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                              onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                              onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                            />
                            <button
                              onClick={() => handleUpload(lab)}
                              disabled={updating[lab._id] || !resultInputs[lab._id]?.trim()}
                              className="px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white transition active:scale-[0.97] disabled:opacity-40"
                              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                            >
                              {updating[lab._id] ? "Uploading…" : "Upload Result"}
                            </button>
                          </div>
                        )}
                        {updateErrors[lab._id] && (
                          <p className="text-[12px] text-red-500 mt-1">{updateErrors[lab._id]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!patient && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-28 text-slate-300">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: "#f1f5f9" }}
          >
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-slate-400">Search for a patient</p>
          <p className="text-[13px] text-slate-400 mt-1">Enter a Patient ID to view ordered tests</p>
        </div>
      )}
    </DashboardLayout>
  );
}
