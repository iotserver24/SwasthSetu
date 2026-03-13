/**
 * Transcript adapter interface.
 * Replace `mockTranscriptAdapter` with a real STT provider (e.g. AssemblyAI, Deepgram)
 * by implementing the same `process(rawInput)` signature.
 */

const MOCK_TRANSCRIPTS = [
  {
    patientLanguage: "Hindi",
    doctorLanguage: "English",
    lines: [
      { speaker: "Patient", lang: "Hindi", text: "Doctor saab, mujhe teen dinon se bukhaar hai aur sir mein dard ho raha hai." },
      { speaker: "Doctor", lang: "English", text: "I see. How high is the fever? Any chills or body aches?" },
      { speaker: "Patient", lang: "Hindi", text: "Haan, raat ko bahut thand lagti hai aur poora badan dard karta hai. Naak se paani bhi aa raha hai." },
      { speaker: "Doctor", lang: "English", text: "Sounds like flu symptoms. Any cough or difficulty breathing?" },
      { speaker: "Patient", lang: "Hindi", text: "Thodi si khansi hai lekin saans lene mein takleef nahi hai." },
      { speaker: "Doctor", lang: "English", text: "Alright. I'll prescribe paracetamol and an antihistamine. I want you to get a CBC blood test done as well." },
    ],
  },
  {
    patientLanguage: "Tamil",
    doctorLanguage: "English",
    lines: [
      { speaker: "Patient", lang: "Tamil", text: "Doctor, enakku rendu naalaa stomach vali irukku, saaptaa vomiting aaguthu." },
      { speaker: "Doctor", lang: "English", text: "Since how many days? Any fever or loose motions?" },
      { speaker: "Patient", lang: "Tamil", text: "Rendu naal. Kanja fever irukku, loose motions illa." },
      { speaker: "Doctor", lang: "English", text: "Likely gastroenteritis. I'll prescribe ORS and antacids. Let's do a stool culture test." },
    ],
  },
];

/**
 * Returns a mock transcript object.
 * @param {object} input - { patientLanguage?, rawAudio? }
 * @returns {{ lines: Array, patientLanguage: string, doctorLanguage: string, fullText: string }}
 */
export function mockTranscriptAdapter(input = {}) {
  const lang = (input.patientLanguage || "Hindi").toLowerCase();
  const sample = MOCK_TRANSCRIPTS.find(
    (t) => t.patientLanguage.toLowerCase() === lang
  ) || MOCK_TRANSCRIPTS[0];

  const fullText = sample.lines
    .map((l) => `[${l.speaker}]: ${l.text}`)
    .join("\n");

  return {
    lines: sample.lines,
    patientLanguage: sample.patientLanguage,
    doctorLanguage: sample.doctorLanguage,
    fullText,
  };
}

export const transcriptAdapter = mockTranscriptAdapter;
