import { env } from "../config/env.js";

function buildPrompt(transcript) {
  return [
    "You are a clinical summarization assistant.",
    "Extract structured medical data from the conversation.",
    "Return ONLY valid JSON with keys: symptoms, diagnosis, prescriptions, tests, followUpInstructions.",
    "prescriptions should be an array of strings or objects with medicine, dosage, duration.",
    "tests should be an array of strings.",
    "",
    "Transcript:",
    transcript,
  ].join("\n");
}

export async function generateWithProxy(transcript) {
  if (!env.aiProxyBaseUrl) {
    throw new Error("Missing AI_PROXY_BASE_URL in environment.");
  }

  const response = await fetch(`${env.aiProxyBaseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.aiModel || env.aiModelId || "clinical-summarizer",
      model_id: env.aiModelId,
      messages: [
        { role: "system", content: "Return ONLY JSON. No extra text." },
        { role: "user", content: buildPrompt(transcript) },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI proxy error: ${response.status} ${errText}`);
  }

  const data = await response.json();

  const raw =
    data?.structuredSummary ||
    data?.summary ||
    data?.result ||
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text;

  if (!raw) {
    throw new Error("AI proxy returned empty summary.");
  }

  let parsed;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Attempt to extract JSON from text
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }
  } else {
    parsed = raw;
  }

  if (!parsed) {
    throw new Error("Unable to parse AI summary JSON.");
  }

  return parsed;
}
