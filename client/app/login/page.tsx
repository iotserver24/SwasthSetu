"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { loginHospital } from "@/services/api";

interface AuthResponse { hospital: { hospitalId: string; name: string; email: string; city?: string; type?: string }; token: string; }

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await loginHospital({ email, password }) as AuthResponse;
      login(res.token, res.hospital);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f1f5f9" }}>
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12"
        style={{ background: "linear-gradient(160deg, #0f1c2e 0%, #162840 60%, #1a3050 100%)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SwasthyaSetu</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Multilingual<br />Clinical Workflow<br />System
          </h1>
          <p className="text-slate-400 text-[15px] leading-relaxed mb-10">
            Connecting doctors, labs, and pharmacies through intelligent multilingual consultation workflows.
          </p>

          {/* Feature list */}
          {[
            { icon: "🩺", text: "AI-powered multilingual consultation transcripts" },
            { icon: "🔬", text: "Real-time lab test ordering and result upload" },
            { icon: "💊", text: "Integrated pharmacy dispensing management" },
            { icon: "📋", text: "Unified patient records across departments" },
          ].map((f) => (
            <div key={f.text} className="flex items-start gap-3 mb-4">
              <span className="text-xl mt-0.5">{f.icon}</span>
              <p className="text-slate-300 text-[13.5px] leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>

        <p className="text-slate-600 text-[12px]">© 2026 SwasthyaSetu · All rights reserved</p>
      </div>

      {/* Right form panel */}
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

          <h2 className="text-[26px] font-bold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-slate-400 text-[14px] mb-8">Sign in to your hospital account</p>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Hospital Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hospital@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none transition"
                style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl text-[14px] focus:outline-none transition pr-12"
                  style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPw ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{
                background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                boxShadow: "0 4px 16px rgba(29,78,216,0.35)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-[13px] text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-600 font-semibold hover:underline">
              Register your hospital
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
