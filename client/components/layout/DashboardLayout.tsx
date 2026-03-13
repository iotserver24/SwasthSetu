import Sidebar from "@/components/navigation/Sidebar";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export default function DashboardLayout({ title, subtitle, children, headerAction }: Props) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f1f5f9" }}>
      <Sidebar />

      <main className="flex-1" style={{ marginLeft: "260px" }}>
        {/* Top bar */}
        <header
          className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between"
          style={{
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold text-slate-800 tracking-tight leading-tight">{title}</h1>
            {subtitle && <p className="text-[12.5px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </header>

        {/* Page content */}
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
