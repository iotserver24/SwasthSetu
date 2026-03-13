const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ss_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "API error");
  return json.data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function registerHospital(payload: {
  name: string; email: string; password: string; city?: string; type?: string;
}) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export function loginHospital(payload: { email: string; password: string }) {
  return request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export function getMe() {
  return request("/auth/me");
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export function createPatient(payload: { name: string; age: number; gender: string }) {
  return request("/patient", { method: "POST", body: JSON.stringify(payload) });
}

export function getPatient(patientId: string) {
  return request(`/patient/${patientId}`);
}

// ─── Consultation ─────────────────────────────────────────────────────────────

export function saveConsultation(payload: {
  patientId?: string;
  name: string;
  age: number;
  gender: string;
  patientLanguage: string;
  rawTranscript?: string;
}) {
  return request("/consultation", { method: "POST", body: JSON.stringify(payload) });
}

export function previewTranscript(patientLanguage: string) {
  return request(`/consultation/transcript/preview?patientLanguage=${encodeURIComponent(patientLanguage)}`);
}

// ─── Lab ──────────────────────────────────────────────────────────────────────

export function updateLabResult(payload: { patientId: string; testName: string; result: string }) {
  return request("/lab/update", { method: "POST", body: JSON.stringify(payload) });
}

// ─── Pharmacy ─────────────────────────────────────────────────────────────────

export function dispenseItem(payload: { patientId: string; medicine: string }) {
  return request("/pharmacy/update", { method: "POST", body: JSON.stringify(payload) });
}

export function dispenseAll(payload: { patientId: string }) {
  return request("/pharmacy/dispense-all", { method: "POST", body: JSON.stringify(payload) });
}
