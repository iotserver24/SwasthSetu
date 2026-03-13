"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { registerHospital } from "@/services/api";

interface AuthResponse { hospital: { hospitalId: string; name: string; email: string; city?: string; type?: string }; token: string; }

const HOSPITAL_TYPES = ["Government", "Private", "Trust/NGO", "Clinic", "Other"];

export default function RegisterPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", city: "", type: "Private" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) { setError("Hospital name and email are required."); return; }
    setError(""); setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    try {
      const res = await registerHospital({ name: form.name, email: form.email, password: form.password, city: form.city, type: form.type }) as AuthResponse;
      login(res.token, res.hospital);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f1f5f9" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12"
        style={{ background: "linear-gradient(160deg, #0f1c2e 0%, #162840 60%, #1a3050 100%)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SwasthyaSetu</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Register<br />Your Hospital
          </h1>
          <p className="text-slate-400 text-[15px] leading-relaxed mb-8">
            Join SwasthyaSetu and transform your hospital&apos;s clinical workflows with multilingual intelligence.
          </p>

          {/* Steps indicator */}
          <div className="space-y-4">
            {[
              { n: 1, title: "Hospital Details", desc: "Name, email, location, type" },
              { n: 2, title: "Secure Password", desc: "Create a strong password" },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={
                    step >= s.n
                      ? { background: "#3b82f6", color: "#fff" }
                      : { background: "rgba(255,255,255,0.1)", color: "#475569" }
                  }
                >
                  {step > s.n ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.n}
                </div>
                <div>
                  <p className={`text-[13px] font-semibold ${step >= s.n ? "text-white" : "text-slate-500"}`}>{s.title}</p>
                  <p className="text-[12px] text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-[12px]">© 2026 SwasthyaSetu · All rights reserved</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">SwasthyaSetu</span>
          </div>

          {/* Step indicator (mobile) */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={step >= n ? { background: "#1d4ed8", color: "#fff" } : { background: "#e2e8f0", color: "#94a3b8" }}>
                  {n}
                </div>
                {n < 2 && <div className="w-8 h-0.5" style={{ background: step > n ? "#1d4ed8" : "#e2e8f0" }} />}
              </div>
            ))}
          </div>

          <h2 className="text-[26px] font-bold text-slate-800 mb-1">
            {step === 1 ? "Create an account" : "Set your password"}
          </h2>
          <p className="text-slate-400 text-[14px] mb-7">
            {step === 1 ? "Register your hospital on SwasthyaSetu" : "Choose a strong password to secure your account"}
          </p>

          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium mb-5"
              style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#dc2626" }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Hospital Name *</label>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Apollo Hospitals" required
                  className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none transition"
                  style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Official Email *</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="admin@hospital.com" required
                  className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none transition"
                  style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">City</label>
                  <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Mumbai"
                    className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none transition"
                    style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Hospital Type</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none bg-white"
                    style={{ border: "1.5px solid #e2e8f0" }}
                  >
                    {HOSPITAL_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit"
                className="w-full py-3.5 rounded-xl text-[14px] font-bold text-white transition active:scale-[0.98] mt-2"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", boxShadow: "0 4px 16px rgba(29,78,216,0.35)" }}
              >
                Continue →
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none transition pr-12"
                    style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPw ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                </div>
                {/* Password strength bar */}
                {form.password && (
                  <div className="flex gap-1 mt-2">
                    {[1,2,3,4].map((n) => (
                      <div key={n} className="flex-1 h-1 rounded-full" style={{
                        background: form.password.length >= n * 2 + 2
                          ? n <= 1 ? "#ef4444" : n <= 2 ? "#f59e0b" : n <= 3 ? "#3b82f6" : "#22c55e"
                          : "#e2e8f0"
                      }} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Confirm Password *</label>
                <input
                  type={showPw ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none transition"
                  style={{
                    border: `1.5px solid ${form.confirmPassword && form.confirmPassword !== form.password ? "#ef4444" : "#e2e8f0"}`,
                    background: "#fff",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = form.confirmPassword && form.confirmPassword !== form.password ? "#ef4444" : "#e2e8f0")}
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-[12px] text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold transition"
                  style={{ background: "#f1f5f9", color: "#475569" }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3.5 rounded-xl text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", boxShadow: "0 4px 16px rgba(29,78,216,0.35)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : "Create Account"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-[13px] text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
