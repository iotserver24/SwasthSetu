"use client";
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getPatient, dispenseItem, dispenseAll } from "@/services/api";

interface PharmacyItem {
  _id: string;
  medicine: string;
  dosage: string;
  duration: string;
  dispensed: boolean;
  dispensedAt?: string;
}

interface Patient {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  pharmacyItems: PharmacyItem[];
}

export default function PharmacyPage() {
  const [searchId, setSearchId] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dispensing, setDispensing] = useState<Record<string, boolean>>({});
  const [dispensingAll, setDispensingAll] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchId.trim()) return;
    setError(""); setPatient(null); setLoading(true);
    try {
      setPatient(await getPatient(searchId.trim()) as Patient);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleDispense(item: PharmacyItem) {
    setDispensing((p) => ({ ...p, [item._id]: true }));
    try {
      setPatient(await dispenseItem({ patientId: patient!.patientId, medicine: item.medicine }) as Patient);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setDispensing((p) => ({ ...p, [item._id]: false })); }
  }

  async function handleDispenseAll() {
    setDispensingAll(true);
    try {
      setPatient(await dispenseAll({ patientId: patient!.patientId }) as Patient);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setDispensingAll(false); }
  }

  const pendingItems = patient?.pharmacyItems.filter((i) => !i.dispensed) ?? [];
  const doneItems = patient?.pharmacyItems.filter((i) => i.dispensed) ?? [];

  return (
    <DashboardLayout title="Pharmacy" subtitle="Prescription dispensing management">
      {/* Search */}
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
          {/* Patient header */}
          <div
            className="rounded-2xl p-5 flex items-center justify-between gap-4"
            style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
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
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{pendingItems.length}</p>
                <p className="text-[11px] text-slate-400 font-medium">Pending</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{doneItems.length}</p>
                <p className="text-[11px] text-slate-400 font-medium">Dispensed</p>
              </div>
              {pendingItems.length > 0 && (
                <>
                  <div className="w-px h-8 bg-slate-200" />
                  <button
                    onClick={handleDispenseAll}
                    disabled={dispensingAll}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #059669, #047857)", boxShadow: "0 2px 8px rgba(5,150,105,0.3)" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {dispensingAll ? "Processing…" : `Dispense All (${pendingItems.length})`}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Prescription list */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div
              className="px-6 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}
            >
              <p className="text-[13px] font-bold text-slate-700">Prescription List</p>
              <p className="text-[12px] text-slate-400">{patient.pharmacyItems.length} item(s)</p>
            </div>

            {patient.pharmacyItems.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[13px] text-slate-400">No prescriptions for this patient</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                {patient.pharmacyItems.map((item) => (
                  <div key={item._id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={
                          item.dispensed
                            ? { background: "#f0fdf4", border: "1px solid #bbf7d0" }
                            : { background: "#fffbeb", border: "1px solid #fde68a" }
                        }
                      >
                        {item.dispensed ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-slate-800">{item.medicine}</p>
                        <p className="text-[12px] text-slate-400 mt-0.5">{item.dosage} · {item.duration}</p>
                        {item.dispensed && item.dispensedAt && (
                          <p className="text-[11.5px] text-green-600 mt-0.5 font-medium">
                            Dispensed {new Date(item.dispensedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {!item.dispensed ? (
                      <button
                        onClick={() => handleDispense(item)}
                        disabled={dispensing[item._id]}
                        className="px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white transition active:scale-[0.97] disabled:opacity-50 flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
                      >
                        {dispensing[item._id] ? "Processing…" : "Mark as Dispensed"}
                      </button>
                    ) : (
                      <span
                        className="px-3 py-1.5 rounded-xl text-[12px] font-semibold flex-shrink-0"
                        style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
                      >
                        Dispensed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!patient && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-28">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: "#f1f5f9" }}
          >
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-slate-400">Search for a patient</p>
          <p className="text-[13px] text-slate-400 mt-1">Enter a Patient ID to view prescriptions</p>
        </div>
      )}
    </DashboardLayout>
  );
}
