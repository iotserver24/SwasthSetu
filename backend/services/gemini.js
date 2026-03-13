const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

/**
 * Send audio URL + patient context to Gemini for transcription, language detection,
 * and structured clinical summary.
 * @param {string} audioUrl - Public URL of the audio file (from Catbox)
 * @param {object} patientInfo - Basic patient info for context
 * @returns {Promise<object>} { transcript, detectedLanguage, summary }
 */
async function processConsultationAudio(audioUrl, patientInfo = {}) {
  const systemPrompt = `You are a medical AI assistant working in an Indian hospital. 
You will receive an audio recording URL of a doctor-patient consultation. The patient may speak in Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Gujarati, Malayalam, or English.

Your task:
1. Transcribe the audio conversation accurately
2. Detect the language(s) spoken
3. Generate a structured clinical summary in English

Respond ONLY with valid JSON in this exact format:
{
  "transcript": "Full transcription in the original language(s)",
  "detectedLanguage": "Primary language detected (e.g., Hindi, Tamil, English)",
  "summary": {
    "symptoms": ["symptom1", "symptom2"],
    "diagnosis": "Brief diagnosis or suspected condition",
    "clinicalNotes": "Detailed clinical notes from the consultation",
    "prescriptions": [
      {
        "medication": "Drug name",
        "dosage": "e.g., 500mg",
        "frequency": "e.g., Twice daily",
        "duration": "e.g., 7 days"
      }
    ],
    "labTests": [
      {
        "testName": "e.g., Complete Blood Count",
        "instructions": "e.g., Fasting required"
      }
    ],
    "followUp": "Follow-up instructions or next appointment suggestion"
  }
}`;

  const userPrompt = `Patient Info: ${patientInfo.name ? `Name: ${patientInfo.name}, Age: ${patientInfo.age}, Gender: ${patientInfo.gender}` : 'Not provided'}

Audio recording URL: ${audioUrl}

Please transcribe, detect the language, and generate a structured clinical summary from this consultation audio.`;

  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL_ID,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          {
            type: 'image_url',
            image_url: { url: audioUrl },
          },
        ],
      },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '';
  
  // Try to parse as JSON, handle markdown code blocks
  let parsed;
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    // If JSON parsing fails, return raw content as transcript
    parsed = {
      transcript: content,
      detectedLanguage: 'Unknown',
      summary: {
        symptoms: [],
        diagnosis: 'Unable to parse AI response',
        clinicalNotes: content,
        prescriptions: [],
        labTests: [],
        followUp: '',
      },
    };
  }

  return parsed;
}

/**
 * Process text-based consultation (when audio is not available)
 * @param {string} text - Consultation text in any language
 * @param {object} patientInfo - Basic patient info
 * @returns {Promise<object>} { transcript, detectedLanguage, summary }
 */
async function processConsultationText(text, patientInfo = {}) {
  const systemPrompt = `You are a medical AI assistant working in an Indian hospital. 
You will receive text from a doctor-patient consultation. The text may be in Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Gujarati, Malayalam, English, or a mix of languages.

Your task:
1. Detect the language(s) of the input text
2. Generate a structured clinical summary in English

Respond ONLY with valid JSON in this exact format:
{
  "transcript": "The original text as provided",
  "detectedLanguage": "Primary language detected",
  "summary": {
    "symptoms": ["symptom1", "symptom2"],
    "diagnosis": "Brief diagnosis or suspected condition",
    "clinicalNotes": "Detailed clinical notes",
    "prescriptions": [
      {
        "medication": "Drug name",
        "dosage": "e.g., 500mg",
        "frequency": "e.g., Twice daily",
        "duration": "e.g., 7 days"
      }
    ],
    "labTests": [
      {
        "testName": "e.g., Complete Blood Count",
        "instructions": "e.g., Fasting required"
      }
    ],
    "followUp": "Follow-up instructions"
  }
}`;

  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL_ID,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Patient Info: ${patientInfo.name ? `Name: ${patientInfo.name}, Age: ${patientInfo.age}, Gender: ${patientInfo.gender}` : 'Not provided'}\n\nConsultation text:\n${text}`,
      },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '';

  let parsed;
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    parsed = {
      transcript: text,
      detectedLanguage: 'Unknown',
      summary: {
        symptoms: [],
        diagnosis: 'Unable to parse AI response',
        clinicalNotes: content,
        prescriptions: [],
        labTests: [],
        followUp: '',
      },
    };
  }

  return parsed;
}

module.exports = { processConsultationAudio, processConsultationText };
