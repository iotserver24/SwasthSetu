# SwasthyaSetu Overview

SwasthyaSetu is a comprehensive, multilingual hospital clinical workflow system designed to streamline patient registration, medical consultations, pharmacy dispensing, and laboratory tracking. 

At its core, it leverages AI (Whisper API for audio transcription and Gemini/GPT-4o for clinical analysis) to convert spoken doctor-patient interactions in over 90 languages into structured, actionable medical data.

## Key Features

1. **Multilingual Voice Consultations:** Doctors can record audio notes in their preferred language natively in the browser. The system seamlessly transcribes the audio and extracts structured data (Symptoms, Diagnosis, Prescriptions, Lab Tests) automatically.
2. **Centralized Patient Tracking (PID & QR):** Every patient receives a unique Patient ID (PID) and an auto-generated QR code upon registration, allowing instant lookup of their medical history by simply scanning the code using a device camera.
3. **Role-Based Workflows:**
   - **Doctors:** Register patients, conduct AI-assisted consultations, and review patient histories.
   - **Pharmacy:** View pending prescriptions in real-time and mark medications as dispensed.
   - **Lab Technicians:** View pending lab test orders and update status/results as samples are collected and processed.
   - **Admins:** Oversee system usage and view detailed audit logs for all patient data access.
4. **Automated Department Routing:** Once a doctor finalizes an AI consultation, the generated prescriptions and lab orders are instantly routed to the respective department dashboards without any manual data entry.
5. **Secure Auditing:** Every action that reads or modifies patient records is tracked in a centralized Audit Log to ensure regulatory compliance and data privacy.
6. **Premium Responsive UI:** The frontend is built with Next.js and features a "glassmorphism" design system that is fully responsive, looking great on both desktops and mobile devices.

## Tech Stack Overview
- **Frontend:** Next.js (App Router), React, Tailwind CSS / Custom CSS Modules, Framer Motion
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **AI Services:** Pollinations.ai (Whisper model for transcription, GPT-4o-mini for text processing)
- **File Storage:** Catbox.moe API (Temporary audio storage for transcription)
