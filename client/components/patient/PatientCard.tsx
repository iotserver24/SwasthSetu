interface PatientInfo {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  createdAt: string;
}

interface Props {
  patient: PatientInfo;
}

export default function PatientCard({ patient }: Props) {
  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-5"
      style={{
        background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
        boxShadow: "0 4px 20px rgba(29,78,216,0.25)",
      }}
    >
      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-white truncate">{patient.name}</h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold"
            style={{ background: "rgba(255,255,255,0.2)", color: "#bfdbfe" }}
          >
            {patient.patientId}
          </span>
          <span className="text-blue-200 text-[13px]">{patient.age} years</span>
          <span className="text-blue-300 text-[13px]">·</span>
          <span className="text-blue-200 text-[13px]">{patient.gender}</span>
          <span className="text-blue-300 text-[13px]">·</span>
          <span className="text-blue-300 text-[12px]">
            Since {new Date(patient.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  );
}
