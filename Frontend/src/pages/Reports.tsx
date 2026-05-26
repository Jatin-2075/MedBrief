/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  FileText,
  Activity,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  Sparkles,
  Info,
  ShieldCheck,
  TrendingUp,
  Award
} from "lucide-react";
import { useHealthData } from "../hooks/useHealthData";
import { useAuth } from "../hooks/useAuth";
import type { HealthReport } from "../types";

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { reports, analyses, addHealthReport } = useHealthData();
  const { currentUser } = useAuth();

  // Fetch URL query parameters for dynamic state driving
  const actionParam = searchParams.get("action");
  const reportParam = searchParams.get("report");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Form states matching standard ranges
  const [ldl, setLdl] = useState(110);
  const [hdl, setHdl] = useState(50);
  const [triglycerides, setTriglycerides] = useState(150);
  const [hba1c, setHba1c] = useState(5.8);
  const [glucose, setGlucose] = useState(105);
  const [haemoglobin, setHaemoglobin] = useState(14.2);
  const [wbc, setWbc] = useState(6.5);
  const [platelets, setPlatelets] = useState(240);
  const [altAst, setAltAst] = useState(30);
  const [egfr, setEgfr] = useState(90);
  const [hr, setHr] = useState(72);
  const [bp, setBp] = useState("120/80");
  const [spo2, setSpo2] = useState(98);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger Action or Expansion from Query parameters on mount
  useEffect(() => {
    if (actionParam === "add") {
      setIsModalOpen(true);
      // Strip action param so modal doesn't reopen upon secondary triggers
      setSearchParams({});
    }
  }, [actionParam, setSearchParams]);

  useEffect(() => {
    if (reportParam) {
      setExpandedReportId(reportParam);
      // Wait for layout rendering and smoothly scroll expanded report into view
      setTimeout(() => {
        const item = document.getElementById(`report-row-${reportParam}`);
        if (item) {
          item.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      setSearchParams({});
    }
  }, [reportParam, setSearchParams]);

  // Quick Biomedical Preset Templates to streamline user testing
  const applyTemplate = (type: "healthy" | "borderline" | "elevated") => {
    if (type === "healthy") {
      setLdl(85); setHdl(62); setTriglycerides(110); setHba1c(5.2); setGlucose(88);
      setHaemoglobin(14.8); setWbc(6.2); setPlatelets(260); setAltAst(22); setEgfr(98);
      setHr(62); setBp("114/72"); setSpo2(99);
    } else if (type === "borderline") {
      setLdl(134); setHdl(44); setTriglycerides(182); setHba1c(6.2); setGlucose(115);
      setHaemoglobin(13.9); setWbc(7.4); setPlatelets(225); setAltAst(38); setEgfr(82);
      setHr(76); setBp("134/84"); setSpo2(97);
    } else if (type === "elevated") {
      setLdl(172); setHdl(34); setTriglycerides(258); setHba1c(7.4); setGlucose(152);
      setHaemoglobin(12.8); setWbc(8.8); setPlatelets(205); setAltAst(54); setEgfr(68);
      setHr(84); setBp("146/94"); setSpo2(95);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addHealthReport({
        ldl_cholesterol: Number(ldl),
        hdl_cholesterol: Number(hdl),
        triglycerides: Number(triglycerides),
        hba1c: Number(hba1c),
        fasting_glucose: Number(glucose),
        haemoglobin: Number(haemoglobin),
        wbc_count: Number(wbc),
        platelet_count: Number(platelets),
        alt_ast: Number(altAst),
        egfr: Number(egfr),
        resting_heart_rate: Number(hr),
        blood_pressure: bp,
        spo2: Number(spo2)
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to add report", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  // Sort reports chronologically for graphs, and reverse-chronological for tables
  const user_id = currentUser ? currentUser.id : "user-patient-001";
  const userReports = reports
    .filter((r) => r.user_id === user_id || currentUser?.role === "Doctor")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const displayedReports = [...userReports].reverse(); // Latest reports first in the visual grid

  // Prepare dual Y-axis graph data over last 5 reports
  const trendData = userReports.slice(-5).map((r) => {
    return {
      date: new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      HbA1c: r.hba1c,
      LDL: r.ldl_cholesterol
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="font-mono text-xs text-med-accent tracking-widest font-semibold block mb-1">
            LABORATORY RECORD CHANNELS
          </span>
          <h1 className="text-3xl font-bold font-display tracking-tight text-med-text-main">
            Physiological Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-med-text-sub mt-0.5">
            Compare lab reports, analyze organ performance indices, and track bio-trends
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="shimmer-btn flex items-center gap-2 bg-med-accent hover:bg-med-accent-sub text-white px-5 py-3 rounded-xl text-xs font-bold shadow-lg hover-glow active:scale-95 duration-300 transition-all border border-med-accent/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Lab Report Panel
        </button>
      </div>

      {/* Dual Axis Trend Visualization */}
      {trendData.length >= 2 ? (
        <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 select-none">
            <div>
              <h3 className="text-base font-bold font-display text-med-text-main flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-med-accent" />
                Vascular & Glycemic Recovery Trajectory
              </h3>
              <p className="text-xs text-med-text-sub">
                Correlating LDL Lipoproteins (mg/dL) against HbA1c ratios (%) across last {trendData.length} panels
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-violet-500 block" />
                HbA1c (%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500 block" />
                LDL (mg/dL)
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-80 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" stroke="var(--text-sub-val)" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#7c3aed" fontSize={11} tickLine={false} domain={[4, 'auto']} label={{ value: 'HbA1c %', angle: -90, position: 'insideLeft', style: { fill: '#7c3aed', fontSize: 10, fontWeight: 'bold' } }} />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} tickLine={false} domain={[60, 'auto']} label={{ value: 'LDL mg/dL', angle: 90, position: 'insideRight', style: { fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' } }} />
                <ChartTooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary-val)', borderColor: 'var(--border-accent-val)', borderRadius: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="HbA1c" stroke="#7c3aed" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="LDL" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : (
        <div className="p-10 text-center bg-med-bg-tertiary rounded-3xl border border-med-border mb-8 text-med-text-sub text-xs">
          Enter at least 2 laboratory reports to draft the vascular progress indicators.
        </div>
      )}

      {/* Reports Table List */}
      <section className="bg-med-bg-tertiary border border-med-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-med-border flex justify-between items-center sm:items-center">
          <h3 className="text-base font-bold font-display text-med-text-main">
            Diagnostic Panel Matrix
          </h3>
          <span className="text-[10px] font-mono tracking-wider text-white bg-med-accent px-2.5 py-1 rounded-md uppercase select-none">
            {displayedReports.length} Panels Logged
          </span>
        </div>

        <div className="divide-y divide-med-border">
          {displayedReports.map((item, index) => {
            const analysis = analyses.find((a) => a.report_id === item.id);
            const isExpanded = expandedReportId === item.id;

            // Risk configurations values
            const riskColor =
              analysis?.cardiac_risk_score.includes("High")
                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                : analysis?.cardiac_risk_score.includes("Borderline")
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                : "bg-green-500/10 text-green-500 border border-green-500/20";

            return (
              <div
                key={item.id}
                id={`report-row-${item.id}`}
                className="transition-colors hover:bg-med-bg-secondary/40"
              >
                {/* Main Header Row */}
                <div
                  onClick={() => toggleRow(item.id)}
                  className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-med-bg-secondary flex flex-col items-center justify-center border border-med-border select-none">
                      <span className="text-[9px] font-mono text-med-text-sub uppercase">
                        {new Date(item.created_at).toLocaleString("default", { month: "short" })}
                      </span>
                      <span className="text-base font-extrabold text-med-text-main font-mono -mt-1.5">
                        {new Date(item.created_at).getDate()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-med-text-sub font-mono uppercase tracking-wide">
                        REPORT ID: #{item.id.toUpperCase()}
                      </h4>
                      <p className="text-xs text-med-text-main font-semibold mt-0.5">
                        Scan Vitals: BP {item.blood_pressure} • SpO2 {item.spo2}% • RHR {item.resting_heart_rate} bpm
                      </p>
                    </div>
                  </div>

                  {/* Badges indicators */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {analysis && (
                      <span className={`text-[10px] font-bold tracking-wider font-display shrink-0 uppercase px-3 py-1 rounded-full ${riskColor}`}>
                        {analysis.cardiac_risk_score}
                      </span>
                    )}

                    <div className="text-med-text-sub self-end md:self-auto">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-med-bg-secondary/20 p-6 border-t border-med-border space-y-6"
                    >
                      {/* Biomarker Grids */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">LDL Cholesterol</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.ldl_cholesterol} <span className="text-xs text-med-text-sub">mg/dL</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">HDL Cholesterol</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.hdl_cholesterol} <span className="text-xs text-med-text-sub">mg/dL</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">Triglycerides</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.triglycerides} <span className="text-xs text-med-text-sub">mg/dL</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">HbA1c Level</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.hba1c}%</span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">Fasting Glucose</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.fasting_glucose} <span className="text-xs text-med-text-sub">mg/dL</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">Glomerular (eGFR)</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.egfr} <span className="text-xs text-med-text-sub">mL/min</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">Haemoglobin</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.haemoglobin} <span className="text-xs text-med-text-sub">g/dL</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">WBC Count</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.wbc_count} <span className="text-xs text-med-text-sub">k/uL</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">Platelet Count</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.platelet_count} <span className="text-xs text-med-text-sub">k/uL</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">AST / ALT Levels</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.alt_ast} <span className="text-xs text-med-text-sub">U/L</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">Systolic BP</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.blood_pressure.split('/')[0]} <span className="text-xs text-med-text-sub">mmHg</span></span>
                        </div>
                        <div className="bg-med-bg-secondary/40 border border-med-border/50 p-3 rounded-xl">
                          <span className="text-[10px] text-med-text-sub font-mono uppercase tracking-wider block">Diastolic BP</span>
                          <span className="text-base font-bold font-mono text-med-text-main">{item.blood_pressure.split('/')[1] || "80"} <span className="text-xs text-med-text-sub">mmHg</span></span>
                        </div>
                      </div>

                      {/* AI Medical Analysis block */}
                      {analysis ? (
                        <div className="bg-med-bg-secondary border border-med-border p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start">
                          <div className="w-10 h-10 rounded-xl bg-med-accent/10 flex items-center justify-center shrink-0 text-med-accent select-none">
                            <Sparkles className="w-5 h-5 text-med-accent" />
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2.5 items-center select-none">
                              <span className="text-xs font-semibold text-med-text-main">
                                BriefCore AI Diagnostic Evaluation:
                              </span>
                              <span className="text-[10px] font-mono bg-violet-500/15 border border-violet-500/20 text-violet-500 px-2.5 py-0.5 rounded">
                                Metabolic: {analysis.metabolic_status}
                              </span>
                              <span className="text-[10px] font-mono bg-blue-500/15 border border-blue-500/20 text-blue-500 px-2.5 py-0.5 rounded">
                                Kidneys: {analysis.kidney_status}
                              </span>
                            </div>

                            <p className="text-xs text-med-text-sub leading-relaxed">
                              {analysis.ai_summary}
                            </p>

                            <div className="text-[10px] font-mono text-med-text-sub flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              Calculations verified against standard AHA/ADA medical ranges. Not a replacement for emergency care.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-amber-500 italic">
                          AI clinical summation compiling...
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {displayedReports.length === 0 && (
            <div className="p-12 text-center text-med-text-sub text-xs">
              No diagnostic panels uploaded in local database. Click "Add Lab Report Panel" to record figures!
            </div>
          )}
        </div>
      </section>

      {/* Upload/Add Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              className="bg-med-bg-secondary border border-med-border w-full max-w-3xl rounded-[28px] overflow-hidden shadow-2xl relative z-10 max-h-[85vh] flex flex-col"
            >
              <header className="p-6 border-b border-med-border flex justify-between items-center bg-med-bg-tertiary select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-med-accent rounded-xl flex items-center justify-center text-white">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-med-text-main">
                      Log New Diagnostic Lab Sheet
                    </h3>
                    <p className="text-[11px] text-med-text-sub">
                      Enter physical parameters below to trigger BriefCore AI report summaries
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg bg-med-bg-secondary border border-med-border text-med-text-sub hover:text-med-text-main cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              {/* Presets aid panel */}
              <div className="px-6 py-3 border-b border-med-border bg-med-bg-secondary/40 flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-[10px] font-mono text-med-text-sub uppercase flex items-center gap-1 select-none">
                  <Sparkles className="w-3.5 h-3.5 text-med-accent" />
                  Simulate medical states:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => applyTemplate("healthy")}
                    type="button"
                    className="py-1 px-3 bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-semibold text-green-500 hover:bg-green-500/20 transition-all cursor-pointer"
                  >
                    Set Ideal Vitals
                  </button>
                  <button
                    onClick={() => applyTemplate("borderline")}
                    type="button"
                    className="py-1 px-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-semibold text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    Set Borderline Warns
                  </button>
                  <button
                    onClick={() => applyTemplate("elevated")}
                    type="button"
                    className="py-1 px-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-semibold text-red-500 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    Set Diabetic/Cardio Plaque range
                  </button>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handleCreateReport} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Visual Field sections */}
                <div>
                  <h4 className="text-xs font-mono text-med-accent tracking-wider uppercase mb-3 select-none">
                    SECTION A: LIPID CORE & GLYCEMIC INDICES
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        LDL Cholesterol (mg/dL)
                      </label>
                      <input
                        type="number"
                        value={ldl}
                        onChange={(e) => setLdl(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        HDL Cholesterol (mg/dL)
                      </label>
                      <input
                        type="number"
                        value={hdl}
                        onChange={(e) => setHdl(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        Triglycerides (mg/dL)
                      </label>
                      <input
                        type="number"
                        value={triglycerides}
                        onChange={(e) => setTriglycerides(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        HbA1c Glucose Ratio (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={hba1c}
                        onChange={(e) => setHba1c(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        Fasting Glucose (mg/dL)
                      </label>
                      <input
                        type="number"
                        value={glucose}
                        onChange={(e) => setGlucose(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        Haemoglobin (g/dL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={haemoglobin}
                        onChange={(e) => setHaemoglobin(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono text-med-accent tracking-wider uppercase mb-3 select-none">
                    SECTION B: METABOLIC VITALS & ORGAN reserves
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        Glomerular (eGFR) (mL/min)
                      </label>
                      <input
                        type="number"
                        value={egfr}
                        onChange={(e) => setEgfr(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        Blood Pressure (mmHg)
                      </label>
                      <input
                        type="text"
                        value={bp}
                        onChange={(e) => setBp(e.target.value)}
                        placeholder="120/80"
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        Pulse / Heart Rate (bpm)
                      </label>
                      <input
                        type="number"
                        value={hr}
                        onChange={(e) => setHr(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        Oxygen Saturation (SpO2) (%)
                      </label>
                      <input
                        type="number"
                        value={spo2}
                        onChange={(e) => setSpo2(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        WBC Immune Count (k/uL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={wbc}
                        onChange={(e) => setWbc(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        Platelet Serum Count (k/uL)
                      </label>
                      <input
                        type="number"
                        value={platelets}
                        onChange={(e) => setPlatelets(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                        AST / ALT Transaminase (U/L)
                      </label>
                      <input
                        type="number"
                        value={altAst}
                        onChange={(e) => setAltAst(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-med-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-med-bg-tertiary border border-med-border rounded-xl text-xs font-semibold text-med-text-main cursor-pointer"
                  >
                    Discard Changes
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-med-accent hover:bg-med-accent-sub text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shimmer-btn"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Compile & Diagnose
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
