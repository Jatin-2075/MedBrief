/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useState, useEffect, ReactNode } from "react";
import type { AuthUser, Profile, HealthReport, MedicalAnalysis, Prescription, Appointment, ChatMessage, Theme, Doctor, Medicine } from "../types";
import { MedBriefAPI } from "../services/api";
import { MOCK_PROFILES, MOCK_REPORTS, MOCK_ANALYSES, MOCK_PRESCRIPTIONS, MOCK_APPOINTMENTS, MOCK_CHAT, MOCK_DOCTORS, MOCK_MEDICINES } from "../data/mockData";

interface HealthDataContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentUser: AuthUser | null;
  currentProfile: Profile | null;
  doctors: Doctor[];
  medicines: Medicine[];
  reports: HealthReport[];
  analyses: MedicalAnalysis[];
  prescriptions: Prescription[];
  appointments: Appointment[];
  chatMessages: ChatMessage[];
  login: (username: string, password: string, role: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: Partial<Profile>) => Promise<boolean>;
  addHealthReport: (reportData: Omit<HealthReport, "id" | "user_id" | "created_at">) => Promise<HealthReport>;
  bookAppointment: (doctor_id: string, start_time: string, notes: string) => Promise<Appointment>;
  addPrescription: (prescriptionData: Omit<Prescription, "id" | "doctor_id" | "doctor_name" | "profile_id" | "is_active">) => Promise<Prescription>;
  sendChatMessage: (user_query: string) => Promise<string>;
  clearChatHistory: () => void;
}

export const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export function HealthDataProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("medbrief_theme");
    return (saved as Theme) || "Midnight Violet";
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("medbrief_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem("medbrief_auth_token");
  });

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem("medbrief_current_profile");
    return saved ? JSON.parse(saved) : null;
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem("medbrief_profiles");
    return saved ? JSON.parse(saved) : MOCK_PROFILES;
  });

  const [reports, setReports] = useState<HealthReport[]>(() => {
    const saved = localStorage.getItem("medbrief_reports");
    return saved ? JSON.parse(saved) : MOCK_REPORTS;
  });

  const [analyses, setAnalyses] = useState<MedicalAnalysis[]>(() => {
    const saved = localStorage.getItem("medbrief_analyses");
    return saved ? JSON.parse(saved) : MOCK_ANALYSES;
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem("medbrief_prescriptions");
    return saved ? JSON.parse(saved) : MOCK_PRESCRIPTIONS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem("medbrief_appointments");
    return saved ? JSON.parse(saved) : MOCK_APPOINTMENTS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("medbrief_chat_messages");
    return saved ? JSON.parse(saved) : MOCK_CHAT;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem("medbrief_doctors");
    return saved ? JSON.parse(saved) : MOCK_DOCTORS;
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem("medbrief_auth_token");
  });

  // Persist standard lists when they change
  useEffect(() => {
    localStorage.setItem("medbrief_profiles", JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem("medbrief_reports", JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem("medbrief_analyses", JSON.stringify(analyses));
  }, [analyses]);

  useEffect(() => {
    localStorage.setItem("medbrief_prescriptions", JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem("medbrief_appointments", JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem("medbrief_chat_messages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem("medbrief_doctors", JSON.stringify(doctors));
  }, [doctors]);

  // Synchronize dynamic active user profile
  useEffect(() => {
    if (currentUser) {
      const prof = profiles.find((p) => p.user_id === currentUser.id);
      if (prof) {
        setCurrentProfile(prof);
        localStorage.setItem("medbrief_current_profile", JSON.stringify(prof));
      } else {
        const newProf: Profile = {
          id: `prof-${Math.random().toString(36).substr(2, 9)}`,
          user_id: currentUser.id,
          doctor_id: "doc-001",
          name: currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1),
          age: 35,
          gender: 1,
          weight: 75,
          height: 175,
        };
        setProfiles((prev) => [...prev, newProf]);
        setCurrentProfile(newProf);
        localStorage.setItem("medbrief_current_profile", JSON.stringify(newProf));
      }
    } else {
      setCurrentProfile(null);
      localStorage.removeItem("medbrief_current_profile");
    }
  }, [currentUser, profiles]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (authToken) {
      initializeSession();
    }
  }, [authToken]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("medbrief_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const setSession = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem("medbrief_current_user", JSON.stringify(user));
    localStorage.setItem("medbrief_auth_token", token);
  };

  const resetSession = () => {
    setCurrentUser(null);
    setCurrentProfile(null);
    setAuthToken(null);
    localStorage.removeItem("medbrief_current_user");
    localStorage.removeItem("medbrief_current_profile");
    localStorage.removeItem("medbrief_auth_token");
  };

  const calculateAnalysis = (reportId: string, rep: Omit<HealthReport, "id" | "user_id" | "created_at">): MedicalAnalysis => {
    let cardiacPts = 0;
    if (rep.ldl_cholesterol >= 160) cardiacPts += 2;
    else if (rep.ldl_cholesterol >= 130) cardiacPts += 1;

    const bpParts = rep.blood_pressure.split("/");
    const systolic = parseInt(bpParts[0]) || 120;
    const diastolic = parseInt(bpParts[1]) || 80;

    if (systolic >= 140 || diastolic >= 90) cardiacPts += 2;
    else if (systolic >= 130 || diastolic >= 85) cardiacPts += 1;

    if (rep.triglycerides >= 200) cardiacPts += 1;
    if (rep.resting_heart_rate >= 80) cardiacPts += 1;
    if (rep.spo2 < 95) cardiacPts += 2;

    let cardiacScore = "Low (Normal)";
    if (cardiacPts >= 4) {
      cardiacScore = "High Risk (Red)";
    } else if (cardiacPts >= 1) {
      cardiacScore = "Borderline (Amber)";
    }

    let metabolic = "Optimal";
    if (rep.hba1c >= 6.5 || rep.fasting_glucose >= 126) {
      metabolic = "Diabetic Indication";
    } else if (rep.hba1c >= 5.7 || rep.fasting_glucose >= 100) {
      metabolic = "Impaired Glucose Tolerance";
    }

    let kidney = "Normal Filtration";
    if (rep.egfr < 30) {
      kidney = "Severely Decreased";
    } else if (rep.egfr >= 30 && rep.egfr < 60) {
      kidney = "Moderate Reduction";
    } else if (rep.egfr >= 60 && rep.egfr < 90) {
      kidney = "Mild Reduction";
    }

    const statusBP = systolic >= 140 ? "Stage Hypertension" : systolic >= 130 ? "Prehypertension" : "Optimal range";
    const lipidSummary = rep.ldl_cholesterol >= 130 ? "elevated lipoproteins (LDL)" : "healthy lipid clearance";
    const metabolicSummary = rep.hba1c >= 6.5 ? "indicates chronic blood sugar elevation" : rep.hba1c >= 5.7 ? "flags prediabetic metabolic load" : "demonstrates fantastic insulin sensitivity";

    let aiSummaryText = `Comprehensive clinical verification completed. Cardiovascular markers indicate ${cardiacScore} status. Your blood pressure (${rep.blood_pressure}) is graded under ${statusBP}, accompanied by a heart rate of ${rep.resting_heart_rate} bpm and optimal blood oxygen saturation at ${rep.spo2}%. Lipid parameters demonstrate ${lipidSummary} with triglycerides at ${rep.triglycerides} mg/dL. Metabolic performance shows ${metabolicSummary} (HbA1c: ${rep.hba1c}%). Renal reserves have been verified at eGFR ${rep.egfr} mL/min/1.73m² which signifies **${kidney}** kinetics. `;

    if (cardiacScore.includes("High") || metabolic.includes("Diabetic")) {
      aiSummaryText += "Recommendation: Schedule a follow-up metabolic consultation. Prioritize a low-glycemic, sodium-reduced diet. Consider Atorvastatin or glycemic management stabilizers under medical supervision.";
    } else if (cardiacScore.includes("Borderline")) {
      aiSummaryText += "Recommendation: Standard cardiovascular vigilance advised. Maintain routine aerobic activity, reduce saturated fats, and monitor fasting glucose metrics weekly.";
    } else {
      aiSummaryText += "Recommendation: Highly excellent clinical standing! Your biomarkers reflect robust biological stability. Persist with your active physical wellness and dietary patterns.";
    }

    return {
      id: `ana-${Math.random().toString(36).substr(2, 9)}`,
      report_id: reportId,
      cardiac_risk_score: cardiacScore,
      metabolic_status: metabolic,
      kidney_status: kidney,
      ai_summary: aiSummaryText,
      created_at: new Date().toISOString(),
    };
  };

  const calculateAnalysesFromReports = (reportsList: HealthReport[]) => {
    return reportsList.map((report) => calculateAnalysis(report.id, { ...report }));
  };

  const mapAppointment = (appointment: Appointment, profile: Profile | null, allDoctors: Doctor[]) => {
    const doctor = allDoctors.find((d) => d.id === appointment.doctor_id);
    const doctorName = doctor ? doctor.name : `Dr. ${appointment.doctor_id.slice(0, 8)}`;
    const profileName = profile?.name ?? "Patient";
    return {
      ...appointment,
      doctor_name: doctorName,
      profile_name: profileName,
      meeting_link:
        appointment.meeting_link ||
        `https://meet.google.com/medbrief-${doctorName.toLowerCase().replace(/[^a-z]/g, "")}`,
      notes: (appointment as any).notes ?? "",
    };
  };

  const mapPrescription = (prescription: any) => {
    return {
      id: prescription.id,
      doctor_id: prescription.doctor_id,
      doctor_name: `Dr. ${prescription.doctor_id.toString().slice(0, 8)}`,
      profile_id: prescription.profile_id,
      medicine_id: prescription.medicine?.id ?? prescription.medicine_id,
      dosage_instructions: prescription.dosage_instructions,
      duration: prescription.duration,
      start_date: prescription.start_date,
      end_date: prescription.end_date,
      is_active: prescription.is_active,
      medicine_detail: prescription.medicine
        ? {
            id: prescription.medicine.id,
            name: prescription.medicine.name,
            brand: prescription.medicine.brand || prescription.medicine.brand_name || "",
            strength: prescription.medicine.strength,
            dosage_form: prescription.medicine.dosage_form,
          }
        : undefined,
    };
  };

  const mapChatMessage = (message: any) => ({
    id: message.id,
    user_id: message.user_id,
    user_query: message.user_query,
    ai_response: message.ai_response,
    timestamp: typeof message.timestamp === "string" ? message.timestamp : new Date(message.timestamp).toISOString(),
    session_id: message.session_id ?? "session-init",
  });

  const setSession = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem("medbrief_current_user", JSON.stringify(user));
    localStorage.setItem("medbrief_auth_token", token);
  };

  const resetSession = () => {
    setCurrentUser(null);
    setCurrentProfile(null);
    setAuthToken(null);
    setReports([]);
    setAnalyses([]);
    setAppointments([]);
    setPrescriptions([]);
    setChatMessages([]);
    localStorage.removeItem("medbrief_current_user");
    localStorage.removeItem("medbrief_current_profile");
    localStorage.removeItem("medbrief_auth_token");
  };

  const loadAccountData = async (user: AuthUser, token: string) => {
    try {
      const profile = await MedBriefAPI.getProfileByUserId(user.id, token);
      const profileId = profile?.id ?? currentProfile?.id ?? "";
      const [fetchedDoctors, fetchedReports, fetchedAppointments, fetchedPrescriptions, fetchedChat] = await Promise.all([
        MedBriefAPI.getDoctors(token),
        MedBriefAPI.getHealthReports(token),
        profileId ? MedBriefAPI.getAppointments(profileId, token) : Promise.resolve([]),
        profileId ? MedBriefAPI.getPrescriptions(profileId, token) : Promise.resolve([]),
        MedBriefAPI.getChatMessages(user.id, token),
      ]);

      if (profile) {
        setCurrentProfile(profile);
        setProfiles((prev) => {
          const exists = prev.some((p) => p.id === profile.id);
          return exists ? prev.map((p) => (p.id === profile.id ? profile : p)) : [...prev, profile];
        });
      }

      if (Array.isArray(fetchedDoctors)) {
        setDoctors(fetchedDoctors as Doctor[]);
      }

      if (Array.isArray(fetchedReports)) {
        setReports(fetchedReports as HealthReport[]);
        setAnalyses(calculateAnalysesFromReports(fetchedReports as HealthReport[]));
      }

      if (Array.isArray(fetchedAppointments)) {
        setAppointments((fetchedAppointments as Appointment[]).map((appointment) => mapAppointment(appointment, profile ?? currentProfile, fetchedDoctors as Doctor[])));
      }

      if (Array.isArray(fetchedPrescriptions)) {
        setPrescriptions((fetchedPrescriptions as any[]).map(mapPrescription));
      }

      if (Array.isArray(fetchedChat)) {
        setChatMessages((fetchedChat as any[]).map(mapChatMessage));
      }
    } catch (error) {
      console.warn("Failed to load backend account data", error);
    }
  };

  const initializeSession = async () => {
    if (!authToken) return;
    try {
      const user = await MedBriefAPI.me(authToken);
      setSession(user, authToken);
      await loadAccountData(user, authToken);
    } catch (error) {
      resetSession();
      console.error("Unable to restore session", error);
    }
  };

  const login = async (username: string, password: string, role: string): Promise<boolean> => {
    try {
      const tokens = await MedBriefAPI.login(username, password);
      const user = await MedBriefAPI.me(tokens.access_token);
      setSession(user, tokens.access_token);
      await loadAccountData(user, tokens.access_token);
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string, role: string): Promise<boolean> => {
    try {
      await MedBriefAPI.register(username, email, password, role);
      return login(username, password, role);
    } catch (error) {
      console.error("Registration failed", error);
      return false;
    }
  };

  const logout = () => {
    resetSession();
  };

  // Report Action: Add New
  const addHealthReport = async (reportData: Omit<HealthReport, "id" | "user_id" | "created_at">): Promise<HealthReport> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userId = currentUser ? currentUser.id : "user-patient-001";
        const newReportId = `rep-${Math.random().toString(36).substr(2, 9)}`;
        const newReport: HealthReport = {
          ...reportData,
          id: newReportId,
          user_id: userId,
          created_at: new Date().toISOString()
        };

        const analysisObj = calculateAnalysis(newReportId, reportData);

        setReports((prev) => [...prev, newReport]);
        setAnalyses((prev) => [...prev, analysisObj]);
        resolve(newReport);
      }, 800);
    });
  };

  // Calendar Action: Schedule Appointment
  const bookAppointment = async (doctor_id: string, start_time: string, notes: string): Promise<Appointment> => {
    const profileId = currentProfile ? currentProfile.id : undefined;
    const appointmentPayload = {
      doctor_id,
      profile_id: profileId,
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(new Date(start_time).getTime() + 30 * 60 * 1000).toISOString(),
      status: "scheduled",
    };

    if (authToken) {
      try {
        const createdAppointment = await MedBriefAPI.bookAppointment(appointmentPayload, authToken);
        const mapped = mapAppointment(createdAppointment as Appointment, currentProfile, doctors);
        setAppointments((prev) => [...prev, mapped]);
        return mapped;
      } catch (error) {
        console.warn("Appointment API failed, falling back to local state", error);
      }
    }

    const doctor = doctors.find((d) => d.id === doctor_id) || doctors[0];
    const profileName = currentProfile ? currentProfile.name : "Alex Rivers";
    const fallbackAppointment: Appointment = {
      id: `app-${Math.random().toString(36).substr(2, 9)}`,
      doctor_id,
      doctor_name: doctor.name,
      profile_id: profileId ?? "prof-patient-001",
      profile_name: profileName,
      start_time: appointmentPayload.start_time,
      end_time: appointmentPayload.end_time,
      status: "scheduled",
      meeting_link: `https://meet.google.com/medbrief-${doctor.name.toLowerCase().replace(/[^a-z]/g, "")}`,
      notes,
    };
    setAppointments((prev) => [...prev, fallbackAppointment]);
    return fallbackAppointment;
  };

  // Prescriptions Action: Doctors can prescribe meds
  const addPrescription = async (
    prescriptionData: Omit<Prescription, "id" | "doctor_id" | "doctor_name" | "profile_id" | "is_active">
  ): Promise<Prescription> => {
    const pId = currentProfile ? currentProfile.id : "prof-patient-001";
    const docId = currentUser?.role === "Doctor" ? currentUser.id : "doc-001";
    const payload = {
      ...prescriptionData,
      doctor_id: docId,
      doctor_name: currentUser?.username || "Dr. Sarah Jenkins",
      profile_id: pId,
      is_active: true,
    };

    if (authToken) {
      try {
        const created = await MedBriefAPI.createPrescription(payload, authToken);
        const mapped = mapPrescription(Array.isArray(created) ? created[0] : created);
        setPrescriptions((prev) => [...prev, mapped]);
        return mapped;
      } catch (error) {
        console.warn("Prescription API failed, falling back to local state", error);
      }
    }

    const fallbackPrescription: Prescription = {
      ...prescriptionData,
      id: `pres-${Math.random().toString(36).substr(2, 9)}`,
      doctor_id: docId,
      doctor_name: currentUser?.role === "Doctor" ? currentUser.username : `Dr. ${currentUser?.username || "Sarah Jenkins"}`,
      profile_id: pId,
      is_active: true,
    };
    setPrescriptions((prev) => [...prev, fallbackPrescription]);
    return fallbackPrescription;
  };

  // Chat Action: Send message through backend chat API
  const sendChatMessage = async (user_query: string): Promise<string> => {
    const userId = currentUser ? currentUser.id : "user-patient-001";
    const messagePayload = {
      user_query,
      chat_mode: "gemini",
      session_id: undefined,
    };

    if (authToken) {
      try {
        const createdChat = await MedBriefAPI.sendChatMessage(messagePayload, authToken);
        const storedMessage = mapChatMessage(createdChat as any);
        setChatMessages((prev) => [...prev, storedMessage]);
        return storedMessage.ai_response;
      } catch (error) {
        console.warn("Chat API failed, falling back to local response", error);
      }
    }

    const userReports = reports.filter((r) => r.user_id === userId);
    const latestRep = userReports.length > 0 ? userReports[userReports.length - 1] : null;
    let aiReply = "";
    const queryLower = user_query.toLowerCase();

    if (queryLower.includes("hba1c") || queryLower.includes("sugar") || queryLower.includes("glucose") || queryLower.includes("diabetic")) {
      if (latestRep) {
        const hba1cStr = `${latestRep.hba1c}%`;
        const glucStr = `${latestRep.fasting_glucose} mg/dL`;
        if (latestRep.hba1c >= 6.5) {
          aiReply = `Based on your latest report, your HbA1c stands at **${hba1cStr}** with fasting glucose of **${glucStr}**. This falls under the **Diabetic Indication** threshold (>=6.5%). Glycated hemoglobin levels indicate active insulin resistance. Actionable goals include: strictly pacing glucose intake, adopting a regular cardiovascular fitness pattern, and discussing insulin sensitizers like Metformin with Dr. Sarah Jenkins.`;
        } else if (latestRep.hba1c >= 5.7) {
          aiReply = `Your latest HbA1c is **${hba1cStr}** (Fasting Glucose: **${glucStr}**). This is categorized under **Impaired Glucose Tolerance** (the pre-diabetic buffer). This is highly reversible! Strategic lifestyle corrections, low carb adjustments, and mild resistance exercises can significantly restore your normal glycemic profile.`;
        } else {
          aiReply = `Incredible standing! Your Glycated Hemoglobin (HbA1c) is ideal at **${hba1cStr}** with fasting glucose of **${glucStr}**. This represents stellar insulin absorption and optimal cellular sugar burning. Keep preserving your nutrition.`;
        }
      } else {
        aiReply = "Your Glycated Hemoglobin (HbA1c) measures your average glycemic volume over a 3-month window. Below 5.7% is normal, 5.7%-6.4% represents a pre-diabetic window (Impaired Glucose Tolerance), and 6.5% or higher matches a Diabetic Indication. Upload a Health Report to let me analyze your exact metabolic markers!";
      }
    } else if (queryLower.includes("risk") || queryLower.includes("cardiac") || queryLower.includes("heart") || queryLower.includes("cholesterol") || queryLower.includes("ldl") || queryLower.includes("bp")) {
      if (latestRep) {
        const ldl = latestRep.ldl_cholesterol;
        const bp = latestRep.blood_pressure;
        const tg = latestRep.triglycerides;
        aiReply = `Analyzing your current cardiovascular markers:\n- Low-Density Lipoproteins (LDL): **${ldl} mg/dL** (Ideal: < 100)\n- Blood Pressure: **${bp} mmHg** (Normal: < 120/80)\n- Triglycerides: **${tg} mg/dL** (Ideal: < 150)\n\n${ldl >= 130 ? `Your LDL is elevated. Statins like Atorvastatin are commonly used to assist liver clearance. ` : `Your lipids show amazing control. `}\n${bp !== "120/80" && (parseInt(bp.split("/")[0]) >= 130) ? `Your pressure indicates mild arterial load. Maintain hydration and low-sodium nutrition.` : `Your pressure is beautifully balanced.`}`;
      } else {
        aiReply = "Cardiovascular risks are evaluated directly from arterial pressure records, Low-Density Lipids (LDL 'bad' cholesterol), and blood triglycerides. Keeping LDL under 100 mg/dL and pressure below 120/80 mmHg mitigates arterial clotting. Please upload or view a report to let me check your cardiac stats!";
      }
    } else if (queryLower.includes("kidney") || queryLower.includes("egfr") || queryLower.includes("renal")) {
      if (latestRep) {
        const egfr = latestRep.egfr;
        let range = "Normal Filtration";
        if (egfr < 60) range = "Moderate Reduction (Consult doctor)";
        else if (egfr < 90) range = "Mild Reduction (Vigilant protection)";

        aiReply = `Your Glomerular Filtration Rate (eGFR) is currently **${egfr} mL/min/1.73m²**, indicating **${range}**. Renal kinetics represent how cleanly your kidneys filter compounds. Keeping your eGFR above 90 is ideal. Ensure adequate hydration, control blood pressure, and avoid over-the-counter NSAID painkillers which stress filtration capillaries.`;
      } else {
        aiReply = "The estimated Glomerular Filtration Rate (eGFR) monitors renal health. Standard filtration is 90 mL/min/1.73m² or high. Values between 60-89 represent very mild reduction, while indices below 60 indicate the need for therapeutic adjustments. I can analyze your specific kidney metrics as soon as you record a laboratory report.";
      }
    } else if (queryLower.includes("summarize") || queryLower.includes("report") || queryLower.includes("latest") || queryLower.includes("brief")) {
      if (latestRep) {
        const matchingAnalysis = analyses.find((a) => a.report_id === latestRep.id);
        aiReply = `Here is your current clinical diagnostic summary from your latest report recorded on ${new Date(latestRep.created_at).toLocaleDateString()}:\n\n- **Glycemic Control**: HbA1c **${latestRep.hba1c}%** (Fasting Glucose: ${latestRep.fasting_glucose} mg/dL)\n- **Vascular Pressure**: **${latestRep.blood_pressure} mmHg** with pulse rate **${latestRep.resting_heart_rate} bpm**\n- **Kidney Function**: eGFR **${latestRep.egfr}**\n- **Lipid Clearances**: LDL **${latestRep.ldl_cholesterol}** | HDL **${latestRep.hdl_cholesterol}** | Triglycerides **${latestRep.triglycerides}**\n\n**AI Clinical Evaluation**: ${matchingAnalysis?.ai_summary || "Markers denote progressive metabolic improvement. Stay on your current prescription cycle."}`;
      } else {
        aiReply = "You don't have any health reports logged on MedBrief yet! Go to the 'Health Reports' tab and click 'Add New Report' to upload biochemical figures, and I will prepare a comprehensive medical summary for you!";
      }
    } else {
      aiReply = `Hello! I am your MedBrief AI Assistant. I can help interpret complex medical reports, break down lab results, explain prescriptions, and track your health goals.\n\nHere are some suggested topics we could discuss:\n- **\"Explain my HbA1c\"**: Detailed glycemic diagnostics.\n- **\"Cardiovascular risk\"**: Direct study on your cholesterol and blood pressure ratios.\n- **\"Kidney check\"**: Assess kidney filtration rate (eGFR) trends.\n- **\"Summarize my latest report\"**: Compile an instantaneous clinic brief of your vitals.\n\nWhat health metrics can I clarify for you today?`;
    }

    const newUserMsg: ChatMessage = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      user_query,
      ai_response: aiReply,
      timestamp: new Date().toISOString(),
      session_id: "session-init",
    };

    setChatMessages((prev) => [...prev, newUserMsg]);
    return aiReply;
  };

  const clearChatHistory = () => {
    setChatMessages([]);
  };

  return (
    <HealthDataContext.Provider
      value={{
        theme,
        setTheme,
        currentUser,
        currentProfile,
        doctors,
        medicines,
        reports,
        analyses,
        prescriptions,
        appointments,
        chatMessages,
        login,
        register,
        logout,
        updateProfile,
        addHealthReport,
        bookAppointment,
        addPrescription,
        sendChatMessage,
        clearChatHistory
      }}
    >
      {children}
    </HealthDataContext.Provider>
  );
}
