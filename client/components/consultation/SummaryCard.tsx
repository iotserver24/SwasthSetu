interface Prescription {
  medicine: string;
  dosage: string;
  duration: string;
}

interface Summary {
  symptoms: string[];
  diagnosis: string;
  prescriptions: Prescription[];
  diagnosticTests: string[];
  followUpInstructions: string;
}

interface Props {
  summary: Summary;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-blue-500">{icon}</span>
      <h3 className="text-[12.5px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
    </div>
  );
}

export default function SummaryCard({ summary }: Props) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      {/* Banner */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)" }}
      >
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
          <svg className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-[14px] leading-tight">Clinical Summary</p>
          <p className="text-blue-200 text-[11.5px] mt-0.5">AI-generated structured output</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Diagnosis */}
        <div>
          <SectionHeader
            title="Diagnosis"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <div
            className="px-4 py-3 rounded-xl text-[14px] font-medium text-slate-800 leading-relaxed"
            style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}
          >
            {summary.diagnosis}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <SectionHeader
            title="Reported Symptoms"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <div className="flex flex-wrap gap-2">
            {summary.symptoms.map((s, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fdba74" }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Prescriptions */}
        <div>
          <SectionHeader
            title="Prescriptions"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <div className="space-y-2.5">
            {summary.prescriptions.map((rx, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "#16a34a", color: "#fff" }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-slate-800">{rx.medicine}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">{rx.dosage} &nbsp;·&nbsp; {rx.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Tests */}
        <div>
          <SectionHeader
            title="Diagnostic Tests Ordered"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
          />
          <div className="flex flex-wrap gap-2">
            {summary.diagnosticTests.map((t, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                style={{ background: "#faf5ff", color: "#7e22ce", border: "1px solid #d8b4fe" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Follow-up */}
        <div>
          <SectionHeader
            title="Follow-up Instructions"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <p
            className="px-4 py-3 rounded-xl text-[13.5px] leading-relaxed text-slate-700"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            {summary.followUpInstructions}
          </p>
        </div>
      </div>
    </div>
  );
}
