const OpenAI = require('openai');
const fetch = require('node-fetch');
const FormData = require('form-data');

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

/**
 * Transcribe audio using Pollinations Whisper API (scribe model).
 * @param {Buffer} audioBuffer - Raw audio file buffer
 * @param {string} filename - e.g. 'recording.webm'
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(audioBuffer, filename = 'recording.webm') {
  const form = new FormData();
  form.append('file', audioBuffer, { filename, contentType: 'audio/webm' });
  form.append('model', 'scribe');
  form.append('response_format', 'json');

  const response = await fetch('https://gen.pollinations.ai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Whisper transcription failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  return result.text || '';
}

/**
 * Process audio consultation: transcribe with Whisper, then analyze with Gemini.
 * @param {Buffer} audioBuffer - Raw audio file buffer
 * @param {string} audioUrl - Public URL of the uploaded audio (for reference)
 * @param {object} patientInfo - Basic patient info for context
 * @returns {Promise<object>} { transcript, detectedLanguage, summary }
 */
async function processConsultationAudio(audioBuffer, audioUrl, patientInfo = {}) {
  // Step 1: Transcribe audio with Whisper (scribe model)
  console.log('🎤 Transcribing audio with Whisper (scribe)...');
  const transcript = await transcribeAudio(audioBuffer);
  console.log('✅ Transcription complete:', transcript.substring(0, 100) + '...');

  if (!transcript.trim()) {
    return {
      transcript: '',
      detectedLanguage: 'Unknown',
      summary: {
        symptoms: [],
        diagnosis: 'No speech detected in audio',
        clinicalNotes: 'The audio recording did not contain detectable speech.',
        prescriptions: [],
        labTests: [],
        followUp: '',
      },
    };
  }

  // Step 2: Send transcript to Gemini for structured clinical analysis
  console.log('🤖 Analyzing transcript with AI...');
  const result = await processConsultationText(transcript, patientInfo);
  
  // Preserve the original transcript from Whisper (not the AI's version)
  result.transcript = transcript;

  return result;
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
    "followUp": "Follow-up instructions",
    "translatedInstructions": {
      "text": "A friendly summary of the diagnosis, prescriptions, and follow-up, translated directly into the detectedLanguage (e.g. Hindi, Tamil). Talk directly to the patient.",
      "language": "ISO language code of detectedLanguage (e.g. 'hi-IN', 'ta-IN', 'en-US')"
    }
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
        translatedInstructions: {
          text: '',
          language: 'en-US'
        }
      },
    };
  }

  return parsed;
}

module.exports = { processConsultationAudio, processConsultationText };
