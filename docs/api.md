# API Reference

The backend Express server exposes a comprehensive REST API under the `/api` route. 
Most routes (except authentication) require a valid JWT passed in the `Authorization: Bearer <token>` header.

## Authentication (`/api/auth`)
- `POST /register`: Register a new hospital staff member.
- `POST /login`: Authenticate and receive a JWT.
- `GET /me`: Get the currently logged-in user profile.

## Patients (`/api/patients`)
*Requires: Doctor or Admin role*
- `POST /`: Register a new patient. Auto-generates PID and QR code.
- `GET /`: List and search patients (supports `?search=` query).
- `GET /:pid`: Get details for a single patient by PID.
- `GET /:pid/qr`: Retrieve just the Base64 QR code image for a patient.

## Consultations (`/api/consultations`)
*Requires: Doctor role*
- `POST /audio`: Upload a `.webm` or `.wav` file (multipart form data, field `audio`) along with `patientPid`. Initiates the AI transcription + analysis pipeline.
- `POST /text`: Fallback/testing route. Accepts JSON with `patientPid` and `text` to bypass audio transcription and jump straight to AI analysis.
- `GET /:id`: Get specific consultation details.
- `GET /patient/:pid`: Get all past consultations for a single patient.

## Prescriptions (`/api/prescriptions`)
*Requires: Pharmacy role (to dispense) or Doctor role (to view)*
- `GET /pending`: Get a list of all prescriptions currently awaiting fulfillment.
- `PATCH /:id/dispense`: Mark a prescription as dispensed.

## Lab Tests (`/api/labtests`)
*Requires: Lab role (to update) or Doctor role (to view)*
- `GET /pending`: Get a list of active lab test orders.
- `PATCH /:id/status`: Update the status of a lab test (e.g., from `ordered` to `completed`) and optionally attach `results`.

## Audit Logs (`/api/audit`)
*Requires: Admin role*
- `GET /`: Retrieve paginated event logs mapping users to the actions they took on patient records.
