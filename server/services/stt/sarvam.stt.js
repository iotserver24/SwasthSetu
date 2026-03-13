import { env } from "../config/env.js";

export async function transcribeWithSarvam(audioBuffer, mimeType = "audio/webm") {
  if (!env.sarvamApiKey) {
    throw new Error("Missing SARVAM_API_KEY in environment.");
  }

  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  form.append("file", blob, "audio.webm");

  const response = await fetch(`${env.sarvamBaseUrl}/v1/speech/transcribe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.sarvamApiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sarvam STT error: ${response.status} ${errText}`);
  }

  const data = await response.json();

  // Accept multiple possible response shapes
  const transcript =
    data.transcript ||
    data.text ||
    data?.results?.[0]?.text ||
    data?.result?.text;

  if (!transcript) {
    throw new Error("Sarvam STT returned empty transcript.");
  }

  return transcript;
}
