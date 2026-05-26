/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  password?: string; // Opt out of sharing password in client payloads
  role: string; // "Patient" | "Doctor"
}

export interface Profile {
  id: string;
  user_id: string;
  doctor_id?: string;
  name: string;
  age: number;
  gender: 1 | 2 | 3; // 1 = Male, 2 = Female, 3 = Other/Non-binary
  weight: number; // in kg
  height: number; // in cm
}

export interface HealthReport {
  id: string;
  user_id: string;
  created_at: string;
  ldl_cholesterol: number;
  hdl_cholesterol: number;
  triglycerides: number;
  hba1c: number;
  fasting_glucose: number;
  haemoglobin: number;
  wbc_count: number;
  platelet_count: number;
  alt_ast: number;
  egfr: number;
  resting_heart_rate: number;
  blood_pressure: string; // e.g. "120/80"
  spo2: number;
}

export interface MedicalAnalysis {
  id: string;
  report_id: string;
  cardiac_risk_score: string; // "Low (Normal)" | "Borderline (Amber)" | "High Risk (Red)"
  metabolic_status: string;    // "Optimal" | "Impared Glucose Tolerance" | "Diabetic Indication"
  kidney_status: string;       // "Normal Filtration" | "Mild Reduction" | "Moderate Reduction" | "Severely Decreased"
  ai_summary?: string;
  created_at: string;
}

export interface Medicine {
  id: number;
  name: string;
  brand: string;
  strength: string;
  dosage_form: string; // "Tablet" | "Capsule" | "Injection" | "Inhaler"
}

export interface Prescription {
  id: string;
  doctor_id: string;
  doctor_name: string; // For convenient display mapping
  profile_id: string;
  medicine_id: number;
  medicine_detail?: Medicine; // Populated dynamically
  dosage_instructions: string;
  duration: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  doctor_name: string; // For display mapping
  profile_id: string;
  profile_name: string; // For doctor view mapping
  start_time: string;
  end_time: string;
  status: string; // "scheduled" | "completed" | "cancelled"
  meeting_link?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  user_query: string;
  ai_response: string;
  timestamp: string;
  session_id: string;
}

export type Theme = "Midnight Violet" | "Arctic Blue";

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar_url?: string;
}
