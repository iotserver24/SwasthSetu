"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  {
    href: "/doctor",
    label: "Doctor Consultation",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    badge: null,
  },
  {
    href: "/lab",
    label: "Laboratory",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    badge: null,
  },
  {
    href: "/pharmacy",
    label: "Pharmacy",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    badge: null,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { hospital, logout } = useAuth();

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-[260px] flex flex-col z-50"
      style={{ backgroundColor: "#0f1c2e" }}
    >
      {/* Logo area */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight tracking-tight">SwasthyaSetu</p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Clinical Workflow</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 mb-5" style={{ height: "1px", backgroundColor: "#1e2d42" }} />

      {/* Nav label */}
      <p className="px-6 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
        Navigation
      </p>

      {/* Nav items */}
      <nav className="px-3 space-y-0.5 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                active
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              style={active ? { background: "rgba(59,130,246,0.15)", color: "#93c5fd" } : {}}
            >
              <span
                className={`flex-shrink-0 transition-colors ${active ? "" : "text-slate-500"}`}
                style={active ? { color: "#60a5fa" } : {}}
              >
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#60a5fa" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom hospital block */}
      <div className="mx-4 mb-5 space-y-2">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: "#162032", border: "1px solid #1e2d42" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #1e40af, #1d4ed8)" }}
          >
            {hospital?.name?.charAt(0)?.toUpperCase() ?? "H"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-slate-200 truncate">
              {hospital?.name ?? "Hospital"}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {hospital?.hospitalId ?? "—"}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-medium transition"
          style={{ color: "#64748b" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
