/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  Heart,
  Flame,
  Droplet,
  Compass,
  Calendar,
  Pill,
  MessageSquare,
  FileText,
  User,
  TrendingDown,
  ArrowRight,
  Target,
  ArrowBigRightDash
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useHealthData } from "../hooks/useHealthData";
import type { HealthReport } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, currentProfile } = useAuth();
  const { reports, appointments, analyses, prescriptions } = useHealthData();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  if (!currentUser || !currentProfile) return null;

  // Filter patient's specific health records
  const patientReports = reports
    .filter((r) => r.user_id === currentUser.id || currentUser.role === "Doctor")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // chronological order

  const latestReport = patientReports.length > 0 ? patientReports[patientReports.length - 1] : null;

  // 1. Sparkline data builders
  const bpmSpark = patientReports.map((r) => ({ value: r.resting_heart_rate }));
  const pressureSpark = patientReports.map((r) => {
    const sysObj = parseInt(r.blood_pressure.split("/")[0]) || 120;
    return { value: sysObj };
  });
  const hba1cSpark = patientReports.map((r) => ({ value: r.hba1c }));
  const spo2Spark = patientReports.map((r) => ({ value: r.spo2 }));

  // Fallback defaults if no reports uploaded yet
  const statsList = [
    {
      title: "Resting Heart Rate",
      value: latestReport ? `${latestReport.resting_heart_rate} bpm` : "72 bpm",
      unit: "bpm",
      status: latestReport && latestReport.resting_heart_rate > 80 ? "Elevated" : "Optimal",
      statusColor: latestReport && latestReport.resting_heart_rate > 80 ? "text-amber-500" : "text-emerald-500",
      icon: Heart,
      iconColor: "text-red-500",
      sparkData: bpmSpark.length > 0 ? bpmSpark : [{ value: 72 }, { value: 70 }, { value: 74 }, { value: 71 }],
      strokeColor: "#ef4444"
    },
    {
      title: "Blood Pressure",
      value: latestReport ? latestReport.blood_pressure : "120/80",
      unit: "mmHg",
      status: latestReport && parseInt(latestReport.blood_pressure.split("/")[0]) >= 135 ? "High (Stage 1)" : "Normal",
      statusColor: latestReport && parseInt(latestReport.blood_pressure.split("/")[0]) >= 135 ? "text-red-500" : "text-emerald-500",
      icon: TrendingDown,
      iconColor: "text-violet-500",
      sparkData: pressureSpark.length > 0 ? pressureSpark : [{ value: 130 }, { value: 125 }, { value: 122 }, { value: 118 }],
      strokeColor: "#8b5cf6"
    },
    {
      title: "HbA1c Glucose",
      value: latestReport ? `${latestReport.hba1c}%` : "5.4%",
      unit: "%",
      status: latestReport && latestReport.hba1c >= 6.5 ? "Diabetic Range" : latestReport && latestReport.hba1c >= 5.7 ? "Pre-diabetic Range" : "Optimal",
      statusColor: latestReport && latestReport.hba1c >= 6.5 ? "text-red-500" : latestReport && latestReport.hba1c >= 5.7 ? "text-amber-500" : "text-emerald-500",
      icon: Droplet,
      iconColor: "text-blue-500",
      sparkData: hba1cSpark.length > 0 ? hba1cSpark : [{ value: 6.8 }, { value: 6.2 }, { value: 5.9 }, { value: 5.4 }],
      strokeColor: "#3b82f6"
    },
    {
      title: "Vitals SpO2 Status",
      value: latestReport ? `${latestReport.spo2}%` : "99%",
      unit: "%",
      status: latestReport && latestReport.spo2 < 95 ? "Sub-optimal" : "Saturated",
      statusColor: latestReport && latestReport.spo2 < 95 ? "text-red-500" : "text-emerald-500",
      icon: Flame,
      iconColor: "text-emerald-500",
      sparkData: spo2Spark.length > 0 ? spo2Spark : [{ value: 96 }, { value: 98 }, { value: 98 }, { value: 99 }],
      strokeColor: "#10b981"
    }
  ];

  // Get next 2 active appointments
  const upcomingAppointments = appointments
    .filter((a) => a.profile_id === currentProfile.id && a.status === "scheduled")
    .slice(0, 2);

  // Get recent activity (last 3 reports)
  const recentReports = [...reports]
    .filter((r) => r.user_id === currentUser.id || currentUser.role === "Doctor")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // latest first
    .slice(0, 3);

  // Count active prescriptions
  const activeCount = prescriptions.filter((p) => p.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Greetings Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 select-none"
      >
        <div>
          <span className="font-mono text-xs text-med-accent tracking-widest font-semibold block mb-1">
            CLINICAL REPORT PORTAL
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-med-text-main tracking-tight">
            Good morning, {currentProfile.name}
          </h1>
          <p className="text-sm text-med-text-sub mt-0.5">
            Today is Monday, May 25, 2026 • Secure patient channel active
          </p>
        </div>

        {/* BMI fast metric indicator */}
        <div className="bg-med-bg-secondary border border-med-border p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-med-accent/10 flex items-center justify-center text-med-accent">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono tracking-wider text-med-text-sub uppercase">Height & Weight BMI</div>
            <div className="text-xs font-semibold text-med-text-main">
              {currentProfile.height}cm • {currentProfile.weight}kg (
              {((currentProfile.weight / Math.pow(currentProfile.height / 100, 2))).toFixed(1)} BMI)
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid: 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsList.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-med-bg-tertiary border border-med-border p-6 rounded-2xl flex flex-col justify-between hover-glow shadow-sm"
            >
              <div className="flex justify-between items-start mb-3 select-none">
                <div>
                  <span className="text-xs text-med-text-sub font-medium font-display uppercase tracking-wide block">
                    {stat.title}
                  </span>
                  <div className="text-2xl font-bold text-med-text-main font-mono mt-1">
                    {stat.value}
                  </div>
                </div>
                <div className={`w-9 h-9 rounded-xl bg-med-bg-secondary flex items-center justify-center ${stat.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Sparkline & Status */}
              <div className="flex items-end justify-between mt-4">
                <span className={`text-[11px] font-semibold tracking-wider ${stat.statusColor} uppercase`}>
                  ● {stat.status}
                </span>

                {/* Micro Recharts sparkline */}
                <div className="w-24 h-10 select-none pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stat.sparkData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={stat.strokeColor}
                        strokeWidth={1.8}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Grid: Quick Actions & Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Span: Quick Actions + Appointments */}
        <div className="lg:col-span-8 space-y-8">
          {/* Quick Actions Panel */}
          <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold font-display text-med-text-main mb-4 select-none">
              Quick Diagnostic Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/reports?action=add"
                className="flex items-center gap-4 p-4 rounded-2xl bg-med-bg-secondary border border-med-border hover:border-med-accent hover_glow transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-med-text-main">Record Lipid/Sugar</h4>
                  <p className="text-[11px] text-med-text-sub mt-0.5">Upload lab sheet report</p>
                </div>
              </Link>

              <Link
                to="/chat"
                className="flex items-center gap-4 p-4 rounded-2xl bg-med-bg-secondary border border-med-border hover:border-med-accent hover_glow transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-med-text-main">Clinical AI chat</h4>
                  <p className="text-[11px] text-med-text-sub mt-0.5">Diagnose metrics instantly</p>
                </div>
              </Link>

              <Link
                to="/prescriptions"
                className="flex items-center gap-4 p-4 rounded-2xl bg-med-bg-secondary border border-med-border hover:border-med-accent hover_glow transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-med-text-main">Prescriptions</h4>
                  <p className="text-[11px] text-med-text-sub mt-0.5">Verify {activeCount} active drug doses</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Activity Feed: Recent Health Reports */}
          <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold font-display text-med-text-main select-none">
                Biomedical Record History
              </h3>
              <Link to="/reports" className="text-xs text-med-accent font-semibold flex items-center gap-1 hover:underline">
                View database database <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentReports.map((item, index) => {
                const associatedAnalysis = analyses.find((a) => a.report_id === item.id);
                const riskColor =
                  associatedAnalysis?.cardiac_risk_score.includes("High")
                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                    : associatedAnalysis?.cardiac_risk_score.includes("Borderline")
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-green-500/10 text-green-500 border border-green-500/20";

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-med-bg-secondary border border-med-border rounded-2xl gap-3"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-med-bg-tertiary flex flex-col items-center justify-center border border-med-border select-none">
                        <span className="text-[10px] font-mono text-med-text-sub uppercase">
                          {new Date(item.created_at).toLocaleString("default", { month: "short" })}
                        </span>
                        <span className="text-sm font-bold text-med-text-main font-mono -mt-1">
                          {new Date(item.created_at).getDate()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-med-text-main">
                          Vascular Panel Vitals Scan
                        </h4>
                        <p className="text-xs text-med-text-sub mt-0.5">
                          SYS/DIA: {item.blood_pressure} mmHg • HbA1c: {item.hba1c}% • LDL: {item.ldl_cholesterol} mg/dL
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {associatedAnalysis && (
                        <span className={`text-[10px] font-semibold tracking-wider font-display shrink-0 uppercase px-2.5 py-1 rounded-full ${riskColor}`}>
                          {associatedAnalysis.cardiac_risk_score.split(" ")[0]}
                        </span>
                      )}
                      <Link
                        to={`/reports?report=${item.id}`}
                        className="p-1 px-3 text-xs font-semibold text-med-accent hover:text-med-text-main hover:bg-med-accent/10 border border-med-accent/20 rounded-lg transition-all flex items-center gap-1 shrink-0"
                      >
                        Inspect
                        <ArrowBigRightDash className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {recentReports.length === 0 && (
                <div className="text-center py-8 text-med-text-sub text-xs">
                  No medical reports logged yet. Let's upload a clinical panel standard spreadsheet!
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Span: Upcoming Appointments & Attending Doctor */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold font-display text-med-text-main mb-4 select-none">
              Clinician Consultations
            </h3>

            <div className="space-y-4">
              {upcomingAppointments.map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-med-bg-secondary border border-med-border rounded-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-med-accent/10 rounded-bl-[40px] pointer-events-none" />
                  <Calendar className="w-8 h-8 text-med-accent mb-2" />
                  <h4 className="text-sm font-bold text-med-text-main">{app.doctor_name}</h4>
                  <p className="text-[11px] text-med-text-sub mt-1">
                    {new Date(app.start_time).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric"
                    })}
                  </p>
                  <p className="text-xs font-mono font-medium text-med-accent mt-0.5">
                    {new Date(app.start_time).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>

                  <p className="text-[11px] text-med-text-sub mt-3 italic line-clamp-2">
                    "{app.notes}"
                  </p>

                  {app.meeting_link && (
                    <a
                      href={app.meeting_link}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="mt-4 w-full py-2 px-3 text-center rounded-xl bg-med-accent text-white hover:bg-med-accent-sub text-xs font-semibold hover-glow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Join Google Meet
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}

              {upcomingAppointments.length === 0 && (
                <div className="text-center py-10 bg-med-bg-secondary border border-dashed border-med-border rounded-2xl text-med-text-sub text-xs select-none">
                  No upcoming virtual clinic slots. Click Calendar to book a consultation!
                </div>
              )}

              <Link
                to="/appointments"
                className="block text-center py-3 w-full bg-med-bg-secondary border border-med-border hover:border-med-accent/35 rounded-xl text-xs font-semibold text-med-text-main hover:bg-med-bg-tertiary transition-all"
              >
                Browse clinician agenda
              </Link>
            </div>
          </section>

          {/* Quick Doctor Profile Reference */}
          <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm text-center">
            <h3 className="text-sm font-mono tracking-widest text-med-text-sub uppercase mb-3 select-none">
              Primary Medical Officer
            </h3>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-med-accent overflow-hidden mb-3 relative">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150"
                  alt="Dr Sarah Jenkins"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-base font-bold text-med-text-main">Dr. Sarah Jenkins, MD</h4>
              <p className="text-xs text-med-accent font-medium font-display mt-0.5">
                Cardiology & Arterial Specialist
              </p>
              <div className="mt-4 py-2 px-3 bg-med-bg-secondary border border-med-border rounded-xl text-[10px] text-med-text-sub font-mono uppercase tracking-wide">
                MEMBER ID: #MED-9428-SK
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
