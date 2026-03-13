interface TranscriptLine {
  speaker: string;
  lang: string;
  text: string;
}

interface Props {
  lines: TranscriptLine[];
  patientLanguage: string;
  doctorLanguage: string;
  isLive?: boolean;
}

export default function TranscriptPanel({ lines, patientLanguage, doctorLanguage, isLive }: Props) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}
      >
        <div className="flex items-center gap-2.5">
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <span className="recording-dot w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span className="text-[13px] font-semibold text-slate-700">Live Recording</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
              <span className="text-[13px] font-semibold text-slate-700">Consultation Transcript</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}
          >
            Patient · {patientLanguage}
          </span>
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
          >
            Doctor · {doctorLanguage}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "300px" }}>
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-300">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p className="text-[13px] font-medium text-slate-400">Click "Start Consultation" to begin recording</p>
          </div>
        ) : (
          lines.map((line, i) => {
            const isDoctor = line.speaker === "Doctor";
            return (
              <div key={i} className={`transcript-line flex gap-3 ${isDoctor ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                  style={
                    isDoctor
                      ? { background: "#1d4ed8", color: "#fff" }
                      : { background: "#fff3e8", color: "#c2410c", border: "1px solid #fed7aa" }
                  }
                >
                  {isDoctor ? "Dr" : "Pt"}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[78%] ${isDoctor ? "items-end" : "items-start"}`}>
                  <span className="text-[11px] font-medium" style={{ color: "#94a3b8" }}>
                    {line.speaker}{line.lang ? ` · ${line.lang}` : ""}
                  </span>
                  <div
                    className="px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed"
                    style={
                      isDoctor
                        ? { background: "#eff6ff", color: "#1e3a5f", borderRadius: "18px 4px 18px 18px" }
                        : { background: "#fff7ed", color: "#7c2d12", borderRadius: "4px 18px 18px 18px", border: "1px solid #fed7aa" }
                    }
                  >
                    {line.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
