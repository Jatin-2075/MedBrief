# MedBrief & Health Tracker: Backend Database Reference

This README documents the actual backend database tables, fields, and relationships for MedBrief & Health Tracker. Use this reference to build frontend screens and API integration.

## Database Tables

### `auth_users`
- Purpose: stores application users and authentication credentials.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `username`: String, unique
- `email`: String, unique
- `password`: String
- `role`: String, default `patient`

Relationships:
- `profile`: one-to-one with `Profile`
- `chat_history`: one-to-many with `ChatMessage`
- `health_reports`: one-to-many with `HealthData`

---

### `Profile`
- Purpose: stores patient profile and baseline health demographics.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `user_id`: UUID, foreign key → `auth_users.id`
- `doctor_id`: UUID, foreign key → `doctors.id`, nullable
- `name`: String
- `age`: Integer
- `gender`: Integer (`1=MALE`, `2=FEMALE`, `3=OTHER`)
- `weight`: Integer (kg)
- `height`: Integer (cm)

Relationships:
- `owner`: belongs to `Auth_User`
- `managed_by_doctor`: belongs to `Doctor`
- `images`: one-to-many with `UserImage` (if used)

---

### `doctors`
- Purpose: stores doctor profiles and specialties.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `user_id`: UUID, foreign key → `auth_users.id`, unique
- `specialization`: String
- `license_number`: String, unique

Relationships:
- `patients`: one-to-many with `Profile`
- `uploaded_images`: one-to-many with `UserImage`
- `prescriptions`: one-to-many with `Prescription`

---

### `medicines`
- Purpose: stores medication catalog entries.
- Primary key: `id` (Integer)

Fields:
- `id`: Integer
- `name`: String, unique
- `brand_name`: String, nullable
- `dosage_form`: String
- `strength`: String
- `description`: String, nullable

Relationships:
- `prescriptions`: one-to-many with `Prescription`

---

### `prescriptions`
- Purpose: stores prescribed medications for a profile.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `doctor_id`: UUID, foreign key → `doctors.id`
- `profile_id`: UUID, foreign key → `Profile.id`
- `medicine_id`: Integer, foreign key → `medicines.id`
- `dosage_instructions`: String
- `duration`: String
- `start_date`: DateTime, defaults to current time
- `end_date`: DateTime, nullable
- `is_active`: Boolean, default `True`

Relationships:
- `doctor`: belongs to `Doctor`
- `profile`: belongs to `Profile`
- `medicine`: belongs to `Medicine`

---

### `appointments`
- Purpose: stores appointment scheduling between doctor and patient.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `doctor_id`: UUID, foreign key → `doctors.id`
- `profile_id`: UUID, foreign key → `Profile.id`
- `start_time`: DateTime
- `end_time`: DateTime
- `status`: String, default `scheduled`
- `meeting_link`: String, nullable
- `notes`: String, nullable

Relationships:
- `doctor`: belongs to `Doctor`
- `profile`: belongs to `Profile`

---

### `audit_logs`
- Purpose: stores audit trails for user actions on patient profiles.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `actor_id`: UUID, foreign key → `auth_users.id`
- `target_profile_id`: UUID, foreign key → `Profile.id`
- `action`: String
- `ip_address`: String, nullable
- `created_at`: DateTime, default current time

Relationships:
- `actor`: belongs to `Auth_User`
- `target_profile`: belongs to `Profile`

---

### `health_reports`
- Purpose: stores raw clinical lab data and vitals.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `user_id`: UUID, foreign key → `auth_users.id`
- `created_at`: DateTime, default current time
- `ldl_cholesterol`: Float
- `hdl_cholesterol`: Float
- `triglycerides`: Float
- `hba1c`: Float
- `fasting_glucose`: Float
- `haemoglobin`: Float
- `wbc_count`: Integer
- `platelet_count`: Integer
- `alt_ast`: Float
- `egfr`: Float
- `resting_heart_rate`: Integer
- `blood_pressure`: String (example `120/80`)
- `spo2`: Float

Relationships:
- `owner`: belongs to `Auth_User`
- `analysis`: one-to-one with `MedicalAnalysis`

---

### `medical_analysis`
- Purpose: stores the health evaluation results and AI summary.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `report_id`: UUID, foreign key → `health_reports.id`
- `cardiac_risk_score`: String
- `metabolic_status`: String
- `kidney_status`: String
- `ai_summary`: String, nullable
- `created_at`: DateTime, default current time

Relationships:
- `report`: belongs to `HealthData`

---

### `health_advice`
- Purpose: stores condition-specific advice content.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `condition_tag`: String
- `advice_title`: String
- `advice_content`: String
- `severity_level`: Integer

---

### `chat_messages`
- Purpose: stores user / AI conversation history.
- Primary key: `id` (UUID)

Fields:
- `id`: UUID
- `user_id`: UUID, foreign key → `auth_users.id`
- `user_query`: String
- `ai_response`: String
- `timestamp`: DateTime, default current time
- `session_id`: UUID, indexed

Relationships:
- `owner`: belongs to `Auth_User`

---

## Relationship Summary
- `auth_users.id` → `Profile.user_id`, `HealthData.user_id`, `ChatMessage.user_id`, `Doctor.user_id`, `AuditLog.actor_id`
- `Profile.id` → `Prescription.profile_id`, `Appointment.profile_id`, `AuditLog.target_profile_id`
- `Doctor.id` → `Prescription.doctor_id`, `Appointment.doctor_id`
- `Medicine.id` → `Prescription.medicine_id`
- `health_reports.id` → `MedicalAnalysis.report_id`

## Frontend Guidance
- Use `auth_users` for login/register and role data.
- Use `Profile` for patient demographic and personal baseline information.
- Use `HealthData` (`health_reports`) for lab and vital sign records.
- Use `MedicalAnalysis` for interpreted results, risk status, and AI summary.
- Use `Prescription` and `Medicine` for medication history and active prescriptions.
- Use `Appointment` for scheduling and calendar events.
- Use `ChatMessage` for chat history and session-based conversations.
- Use `HealthAdvice` for advice and condition-based recommendations.

## Notes
- The backend currently defines these tables in `Backend/Models/`.
- There is no `MedicalReference` table implemented in the current model files.
- Field names should be used exactly as defined when building frontend request/response models.
