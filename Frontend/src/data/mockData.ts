/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AuthUser, Profile, HealthReport, MedicalAnalysis, Medicine, Prescription, Appointment, ChatMessage, Doctor } from "../types";

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: "doc-001",
    name: "Dr. Sarah Jenkins",
    specialty: "Cardiology & Primary Health",
    avatar_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150"
  },
  {
    id: "doc-002",
    name: "Dr. Michael Chang",
    specialty: "Endocrinology & Metabolic Care",
    avatar_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150&h=150"
  },
  {
    id: "doc-003",
    name: "Dr. Alisha Patel",
    specialty: "General Medicine & Renal Diagnostics",
    avatar_url: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150&h=150"
  }
];

export const MOCK_MEDICINES: Medicine[] = [
  {
    id: 1,
    name: "Atorvastatin",
    brand: "Lipitor",
    strength: "20mg",
    dosage_form: "Tablet"
  },
  {
    id: 2,
    name: "Metformin",
    brand: "Glucophage",
    strength: "500mg",
    dosage_form: "Tablet"
  },
  {
    id: 3,
    name: "Lisinopril",
    brand: "Zestril",
    strength: "10mg",
    dosage_form: "Tablet"
  },
  {
    id: 4,
    name: "Amlodipine",
    brand: "Norvasc",
    strength: "5mg",
    dosage_form: "Tablet"
  },
  {
    id: 5,
    name: "Levothyroxine",
    brand: "Synthroid",
    strength: "50mcg",
    dosage_form: "Tablet"
  },
  {
    id: 6,
    name: "Albuterol",
    brand: "ProAir HFA",
    strength: "90mcg",
    dosage_form: "Inhaler"
  }
];

export const MOCK_USERS: AuthUser[] = [
  {
    id: "user-patient-001",
    username: "alex",
    email: "alex.rivers@gmail.com",
    password: "password123",
    role: "Patient"
  },
  {
    id: "user-doctor-001",
    username: "sarah",
    email: "jenkins@medbrief.org",
    password: "password123",
    role: "Doctor"
  }
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: "prof-patient-001",
    user_id: "user-patient-001",
    doctor_id: "doc-001",
    name: "Alex Rivers",
    age: 42,
    gender: 1, // Male
    weight: 84.5, // kg
    height: 182 // cm
  },
  {
    id: "prof-doctor-001",
    user_id: "user-doctor-001",
    name: "Dr. Sarah Jenkins",
    age: 48,
    gender: 2, // Female
    weight: 60.0,
    height: 168
  }
];

export const MOCK_REPORTS: HealthReport[] = [
  {
    id: "rep-001",
    user_id: "user-patient-001",
    created_at: "2025-07-15T09:00:00Z",
    ldl_cholesterol: 168,
    hdl_cholesterol: 36,
    triglycerides: 242,
    hba1c: 7.2,
    fasting_glucose: 148,
    haemoglobin: 13.2,
    wbc_count: 8.4,
    platelet_count: 215,
    alt_ast: 46,
    egfr: 82,
    resting_heart_rate: 82,
    blood_pressure: "145/92",
    spo2: 96
  },
  {
    id: "rep-002",
    user_id: "user-patient-001",
    created_at: "2025-09-15T08:30:00Z",
    ldl_cholesterol: 154,
    hdl_cholesterol: 38,
    triglycerides: 210,
    hba1c: 6.9,
    fasting_glucose: 132,
    haemoglobin: 13.8,
    wbc_count: 7.9,
    platelet_count: 220,
    alt_ast: 42,
    egfr: 84,
    resting_heart_rate: 78,
    blood_pressure: "138/88",
    spo2: 97
  },
  {
    id: "rep-003",
    user_id: "user-patient-001",
    created_at: "2025-11-20T10:00:00Z",
    ldl_cholesterol: 132,
    hdl_cholesterol: 41,
    triglycerides: 185,
    hba1c: 6.5,
    fasting_glucose: 122,
    haemoglobin: 14.1,
    wbc_count: 7.2,
    platelet_count: 240,
    alt_ast: 38,
    egfr: 89,
    resting_heart_rate: 74,
    blood_pressure: "132/84",
    spo2: 98
  },
  {
    id: "rep-004",
    user_id: "user-patient-001",
    created_at: "2026-02-10T09:15:00Z",
    ldl_cholesterol: 112,
    hdl_cholesterol: 46,
    triglycerides: 146,
    hba1c: 5.9,
    fasting_glucose: 105,
    haemoglobin: 14.4,
    wbc_count: 6.8,
    platelet_count: 248,
    alt_ast: 32,
    egfr: 92,
    resting_heart_rate: 68,
    blood_pressure: "124/80",
    spo2: 99
  },
  {
    id: "rep-005",
    user_id: "user-patient-001",
    created_at: "2026-05-18T08:00:00Z", // Latest (1 week before simulated time 2026-05-25)
    ldl_cholesterol: 92,
    hdl_cholesterol: 52,
    triglycerides: 118,
    hba1c: 5.4,
    fasting_glucose: 92,
    haemoglobin: 14.8,
    wbc_count: 6.2,
    platelet_count: 255,
    alt_ast: 24,
    egfr: 96,
    resting_heart_rate: 62,
    blood_pressure: "116/74",
    spo2: 99
  }
];

export const MOCK_ANALYSES: MedicalAnalysis[] = [
  {
    id: "ana-001",
    report_id: "rep-001",
    cardiac_risk_score: "High Risk (Red)",
    metabolic_status: "Diabetic Indication",
    kidney_status: "Mild Reduction",
    created_at: "2025-07-15T12:00:00Z",
    ai_summary: "Initial diagnostic scan flags critical warnings. Elevated LDL Cholesterol (168 mg/dL) combined with hypertension of 145/92 indicates high cardiac risk. Metabolic profile is in diabetic range with HbA1c at 7.2%. Glomerular filtration shows mild functional decline at 82 mL/min/1.73m². Clinical therapy is strongly recommended: request Statin and glucose managing protocols."
  },
  {
    id: "ana-002",
    report_id: "rep-002",
    cardiac_risk_score: "High Risk (Red)",
    metabolic_status: "Diabetic Indication",
    kidney_status: "Mild Reduction",
    created_at: "2025-09-15T12:00:00Z",
    ai_summary: "Marginal improvements registered. Blood pressure dropped to 138/88, but overall cardiovascular threat remains high due to persistent dyslipidemia (LDL 154 mg/dL). Metabolic glycemic load is still elevated (HbA1c 6.9%), signaling sustained insulin resistance. Kidney filtration remains stable with slight improvement (eGFR 84)."
  },
  {
    id: "ana-003",
    report_id: "rep-003",
    cardiac_risk_score: "Borderline (Amber)",
    metabolic_status: "Diabetic Indication",
    kidney_status: "Mild Reduction",
    created_at: "2025-11-20T14:00:00Z",
    ai_summary: "Patient initiated Atorvastatin 20mg and Metformin 500mg daily. Positive therapeutic response documented: LDL dropped by 22 points to 132 mg/dL. Metabolic index decreased to 6.5% (the diabetic diagnostic threshold). Renal performance indicators demonstrate favorable stabilization at 89 mL/min. Cardiovascular score downgraded from High Risk to Borderline."
  },
  {
    id: "ana-004",
    report_id: "rep-004",
    cardiac_risk_score: "Borderline (Amber)",
    metabolic_status: "Optimal",
    kidney_status: "Normal Filtration",
    created_at: "2026-02-10T13:00:00Z",
    ai_summary: "Substantial health progress achieved. Highly successful adherence to metabolic and lipid protocols is reflected. HbA1c is now at 5.9% (Pre-diabetic zone), representing excellent glycemic recovery. LDL is highly close to target at 112 mg/dL. Renal filtration (eGFR 92) has fully returned to the optimal tier. Keep up active physical exercise and lipid restriction."
  },
  {
    id: "ana-005",
    report_id: "rep-005",
    cardiac_risk_score: "Low (Normal)",
    metabolic_status: "Optimal",
    kidney_status: "Normal Filtration",
    created_at: "2026-05-18T11:00:00Z",
    ai_summary: "Outstanding full patient recovery! All health targets have been met. LDL is at an ideal level of 92 mg/dL (45% drop from baseline). HbA1c is at a perfectly normal non-diabetic range of 5.4%. Blood pressure is fully normalized at 116/74. Renal reserves are pristine at eGFR 96. Medication status is under highly stable control. Recommend continuing current maintenance doses."
  }
];

export const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "pres-001",
    doctor_id: "doc-001",
    doctor_name: "Dr. Sarah Jenkins",
    profile_id: "prof-patient-001",
    medicine_id: 1, // Atorvastatin
    dosage_instructions: "Take 1 tablet (20mg) every evening before bedtime. Avoid Grapefruit.",
    duration: "180 Days",
    start_date: "2025-11-20",
    end_date: "2026-05-20",
    is_active: true
  },
  {
    id: "pres-002",
    doctor_id: "doc-002",
    doctor_name: "Dr. Michael Chang",
    profile_id: "prof-patient-001",
    medicine_id: 2, // Metformin
    dosage_instructions: "Take 1 tablet (500mg) twice daily with breakfast and dinner. Monitor hydration.",
    duration: "180 Days",
    start_date: "2025-11-20",
    end_date: "2026-05-20",
    is_active: true
  },
  {
    id: "pres-003",
    doctor_id: "doc-001",
    doctor_name: "Dr. Sarah Jenkins",
    profile_id: "prof-patient-001",
    medicine_id: 3, // Lisinopril
    dosage_instructions: "Take 1 tablet (10mg) in the morning for hypertension management. Keep a daily BP journal.",
    duration: "90 Days",
    start_date: "2026-04-15",
    end_date: "2026-07-15",
    is_active: true
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "app-001",
    doctor_id: "doc-001",
    doctor_name: "Dr. Sarah Jenkins",
    profile_id: "prof-patient-001",
    profile_name: "Alex Rivers",
    start_time: "2026-05-28T09:30:00Z", // Thursday (3 days from 2026-05-25)
    end_time: "2026-05-28T10:00:00Z",
    status: "scheduled",
    meeting_link: "https://meet.google.com/medbrief-jen-cardio",
    notes: "6-Month full lipid panel progress review. Discuss potential lowering of Statin dose."
  },
  {
    id: "app-002",
    doctor_id: "doc-002",
    doctor_name: "Dr. Michael Chang",
    profile_id: "prof-patient-001",
    profile_name: "Alex Rivers",
    start_time: "2026-06-02T14:15:00Z", // Next week
    end_time: "2026-06-02T15:00:00Z",
    status: "scheduled",
    meeting_link: "https://meet.google.com/medbrief-cha-endo",
    notes: "Metabolic review. Examine HbA1c stabilization trends."
  }
];

export const MOCK_CHAT: ChatMessage[] = [
  {
    id: "msg-001",
    user_id: "user-patient-001",
    user_query: "Hi, can you explain what my HbA1c level of 7.2% means?",
    ai_response: "Hello Alex! An HbA1c level of 7.2% indicates that your average blood sugar over the past 2 to 3 months has been elevated. In clinical guidelines, an HbA1c of 6.5% or higher indicates a **Diabetic Indication**. This means your system is experiencing insulin resistance. Don't worry, through combined therapies, structured exercise, and proper nutrition, this can be reversed—which we see happening in your later reports!",
    timestamp: "2025-07-15T15:00:00Z",
    session_id: "session-init"
  },
  {
    id: "msg-002",
    user_id: "user-patient-001",
    user_query: "What is Atorvastatin and why was it prescribed?",
    ai_response: "Atorvastatin (brand Lipitor) is a statin medication. It was prescribed to lower your LDL ('bad') cholesterol, which was elevated at 168 mg/dL in your initial lab test. It works by inhibiting a liver enzyme responsible for making cholesterol, helping clear excess lipids from your arterial walls to heavily reduce cardiac stroke or plaque risks. Combined with dietary moderation, it has driven your LDL down to a brilliant 92 mg/dL!",
    timestamp: "2025-11-21T09:30:00Z",
    session_id: "session-init"
  }
];
