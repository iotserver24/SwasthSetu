# User Guide

This guide explains how to use the different modules in SwasthyaSetu based on your user role.

## Doctors

### 1. Registering a Patient
Before a consultation can occur, the patient must exist in the system.
1. Click **Register Patient** in the top navigation.
2. Fill out the demographic details.
3. Upon success, the system will display the patient's ID (e.g., `PID-000004`) and a QR Code. You can print this QR code or have the patient take a photo of it.

### 2. Scanning a Patient
When a patient returns, you don't need to search manually.
1. Click **QR Scan** in the navigation menu.
2. Hold the patient's QR code up to your webcam or device camera.
3. You will be instantly redirected to their medical record, showing all past consultations, prescriptions, and lab tests.

### 3. Conducting an AI Voice Consultation
1. Navigate to an existing patient's profile or click **New Consultation** from the Dashboard.
2. Make sure you have selected the correct Patient ID (PID).
3. Click the red **Microphone** icon to start recording.
4. Speak naturally. You can speak in English, Kannada, Hindi, or any of the 90+ supported languages. *Example: "The patient has a fever and headache. Diagnosis is viral fever. Give Paracetamol 500mg. Order a CBC."*
5. Click the Stop icon. The audio will upload and process (this takes 5-15 seconds).
6. Review the AI-generated structured data. Notice how it separated your speech into Symptoms, Diagnosis, and specific Medication orders!

---

## Pharmacists

Your dashboard focuses exclusively on medication fulfillment.
1. Go to your **Dashboard**.
2. You will see a real-time list of all `Pending` prescriptions ordered by doctors across the hospital.
3. When a patient arrives at the pharmacy counter, look up their name or scan their QR code.
4. Hand over the medication, then click **Mark as Dispensed** on the specific prescription block.
5. The prescription moves out of your active queue, and the doctor can see that the medicine was successfully provided.

---

## Laboratory Technicians

Your interface is designed to track diagnostic sample lifecycles.
1. Go to your **Dashboard**.
2. Review the list of ordered tests (e.g., "Complete Blood Count", "Lipid Panel").
3. Use the dropdown menu on an active order to update its status:
   - `ordered` → Doctor just placed the request.
   - `sample-collected` → You drew blood / took the sample.
   - `in-progress` → Sample is in the machine.
   - `completed` → Test is done.
4. Once you select `completed`, a text box will appear allowing you to enter the final medical results. These results instantly appear on the doctor's and patient's unified record.

---

## Administrators

Admins ensure the system is running smoothly and securely.
1. Go to **Audit Logs**.
2. This screen shows a read-only, chronological list of exactly *who* did *what* and *when*. 
3. If Dr. Smith opens Patient XYZ's records, an entry `READ Patient` is logged. This ensures absolute compliance with hospital privacy policies.
