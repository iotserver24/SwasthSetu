# SwasthyaSetu — Multilingual Clinical Workflow System

A full-stack hospital dashboard prototype demonstrating multilingual doctor–patient consultations, with real-time transcript simulation, AI-generated structured clinical summaries, and department-specific workflows for Lab and Pharmacy.

---

## Architecture

```
SwasthyaSetu/
├── client/          # Next.js 16 (App Router) + TailwindCSS v4
└── server/          # Express 5 + MongoDB via Mongoose
```

---

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- [MongoDB](https://www.mongodb.com) running locally on port `27017`

Start MongoDB (if using default local install):
```bash
mongod --dbpath /data/db
```

---

## Setup & Run

### 1. Backend (Express API)

```bash
cd server
bun install        # already done after scaffold
bun run dev        # starts on http://localhost:5000 with file watching
```

Environment variables are in `server/.env`:
```
MONGODB_URI=mongodb://127.0.0.1:27017/swasthyasetu
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
```

### 2. Frontend (Next.js)

```bash
cd client
bun install        # already done after scaffold
bun run dev        # starts on http://localhost:3000
```

Environment variables are in `client/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Demo Seed Data

To create a ready-made demo patient you can immediately use in the Lab and Pharmacy dashboards:

```bash
cd server
bun run seed
```

This outputs a Patient ID like `PID-XXXXXXXX` you can paste into any dashboard search.

---

## Pages & Workflow

| Page | URL | Description |
|------|-----|-------------|
| Doctor Consultation | `/doctor` | Start consultation, stream transcript, generate clinical summary, save |
| Patient Record | `/patient/[patientId]` | Full patient timeline: consultations, lab results, pharmacy status |
| Laboratory | `/lab` | Search patient, view ordered tests, upload results |
| Pharmacy | `/pharmacy` | Search patient, view prescriptions, mark as dispensed |

### End-to-End Flow

1. **Doctor Dashboard** (`/doctor`)
   - Fill patient name/age/gender and select language
   - Click **Start Consultation** — transcript streams in line by line
   - Click **Generate Clinical Summary** — sends `POST /consultation`, creates patient + structures summary
   - Click **Save Consultation** → Patient ID is shown → click **View Patient Record**

2. **Lab Dashboard** (`/lab`)
   - Enter the Patient ID from step 1
   - See pending diagnostic test orders
   - Enter result text and click **Upload Result**

3. **Pharmacy Dashboard** (`/pharmacy`)
   - Enter the same Patient ID
   - See all prescription items
   - Click **Mark as Dispensed** per item, or **Dispense All**

4. **Patient Record** (`/patient/[id]`)
   - Shows demographics, consultation history, lab results, and pharmacy status
   - Click **Refresh** to pull latest updates from Lab/Pharmacy

---

## REST API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |
| POST | `/patient` | Create patient (returns unique `patientId`) |
| GET | `/patient/:id` | Get full patient record |
| POST | `/consultation` | Save consultation + generate structured record |
| GET | `/consultation/transcript/preview?patientLanguage=Hindi` | Preview mock transcript |
| POST | `/lab/update` | Upload lab result `{ patientId, testName, result }` |
| POST | `/pharmacy/update` | Dispense medicine `{ patientId, medicine }` |
| POST | `/pharmacy/dispense-all` | Dispense all pending `{ patientId }` |

---

## Extending the AI Adapters

The transcript and clinical summary generation are pluggable:

**`server/services/adapters/transcriptAdapter.js`**
Replace `mockTranscriptAdapter` with a real STT provider:
```js
// Example: swap in AssemblyAI
export async function assemblyAiAdapter(input) {
  const result = await assemblyai.transcripts.transcribe({ audio: input.rawAudio });
  return { lines: parseLines(result.text), fullText: result.text, ... };
}
export const transcriptAdapter = assemblyAiAdapter;
```

**`server/services/adapters/summaryAdapter.js`**
Replace `mockSummaryAdapter` with an LLM call:
```js
// Example: swap in OpenAI
export async function openaiSummaryAdapter(transcriptResult) {
  const response = await openai.chat.completions.create({ ... });
  return JSON.parse(response.choices[0].message.content);
}
export const summaryAdapter = openaiSummaryAdapter;
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS v4 |
| Backend | Node.js, Express 5 |
| Database | MongoDB 7 via Mongoose 9 |
| Package Manager | Bun |
| ID Generation | nanoid |
