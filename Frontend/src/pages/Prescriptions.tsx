/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Pill,
  Clock,
  User,
  ShieldPlus,
  Plus,
  Compass,
  Sparkles,
  Info,
  CalendarDays,
  FileCheck2
} from "lucide-react";
import { useHealthData } from "../hooks/useHealthData";
import { useAuth } from "../hooks/useAuth";
import type { Prescription, Medicine } from "../types";

export default function Prescriptions() {
  const { prescriptions, medicines, doctors, addPrescription } = useHealthData();
  const { currentUser, currentProfile } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState<number>(1);
  const [instructions, setInstructions] = useState("");
  const [duration, setDuration] = useState("90 Days");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: map medicine details onto prescription records
  const compilePrescriptions = (): Prescription[] => {
    return prescriptions.map((p) => {
      const med = medicines.find((m) => m.id === p.medicine_id);
      return {
        ...p,
        medicine_detail: med
      };
    });
  };

  const activePrescriptions = compilePrescriptions();

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addPrescription({
        medicine_id: Number(selectedMedicineId),
        dosage_instructions: instructions,
        duration: duration,
        start_date: startDate,
        end_date: new Date(new Date(startDate).getTime() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      });

      setIsModalOpen(false);
      setInstructions("");
    } catch (err) {
      console.error("Prescription creation failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="font-mono text-xs text-med-accent tracking-widest font-semibold block mb-1">
            ACTIVE PHARMACOTHERAPY REGISTER
          </span>
          <h1 className="text-3xl font-bold font-display tracking-tight text-med-text-main">
            Prescriptions Ledger
          </h1>
          <p className="text-xs sm:text-sm text-med-text-sub mt-0.5">
            Monitor chemical dosing, administration directions, and physician approvals
          </p>
        </div>

        {/* Doctor portal triggers new prescriptions */}
        {currentUser?.role === "Doctor" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="shimmer-btn flex items-center gap-2 bg-med-accent hover:bg-med-accent-sub text-white px-5 py-3 rounded-xl text-xs font-bold shadow-lg hover-glow active:scale-95 duration-300 transition-all border border-med-accent/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Issue New Prescription
          </button>
        )}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activePrescriptions.map((item, idx) => {
          const med = item.medicine_detail;
          const isExpired = !item.is_active || (item.end_date && new Date(item.end_date).getTime() < new Date("2026-05-25").getTime());

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-med-bg-tertiary border border-med-border p-6 rounded-2xl flex flex-col justify-between hover-glow shadow-sm relative overflow-hidden"
            >
              {/* Top Accent Ribbon */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${isExpired ? "bg-gray-500" : "bg-med-accent"}`} />

              <div className="space-y-4">
                {/* Medicine Title & Dosage Form */}
                <div className="flex justify-between items-start pt-2">
                  <div>
                    <h3 className="text-base font-bold text-med-text-main font-display">
                      {med?.name || "Target Compound"}
                    </h3>
                    <p className="text-xs text-med-text-sub font-mono">
                      Brand: {med?.brand} • {med?.strength}
                    </p>
                  </div>

                  <span className={`text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                    isExpired
                      ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse"
                  }`}>
                    {isExpired ? "Expired" : "Active"}
                  </span>
                </div>

                {/* Dosing Instructions block */}
                <div className="p-3.5 rounded-xl bg-med-bg-secondary border border-med-border text-xs text-med-text-sub leading-normal">
                  <span className="font-mono text-[9px] text-med-accent uppercase font-bold block mb-1">
                    Administration Guidelines:
                  </span>
                  "{item.dosage_instructions}"
                </div>

                {/* Metadata timelines */}
                <div className="flex gap-4 border-t border-med-border/40 pt-4 text-xs select-none">
                  <div className="flex items-center gap-1.5 text-med-text-sub">
                    <Clock className="w-3.5 h-3.5 text-med-accent shrink-0" />
                    <span>Duration: <strong className="text-med-text-main font-mono">{item.duration}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-med-text-sub">
                    <CalendarDays className="w-3.5 h-3.5 text-med-accent shrink-0" />
                    <span>Starts: <strong className="text-med-text-main font-mono">{item.start_date}</strong></span>
                  </div>
                </div>
              </div>

              {/* Prescribing Doctor Attribution */}
              <div className="flex items-center gap-3 border-t border-med-border/40 pt-4 mt-4 bg-med-bg-secondary/20 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="w-8 h-8 rounded-full bg-med-accent/10 border border-med-accent/20 flex items-center justify-center text-med-accent text-xs font-bold shrink-0">
                  <ShieldPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-med-text-sub block uppercase tracking-wide">Authorized By</span>
                  <p className="text-xs font-semibold text-med-text-main">{item.doctor_name}</p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {activePrescriptions.length === 0 && (
          <div className="col-span-full py-16 text-center text-med-text-sub bg-med-bg-tertiary rounded-3xl border border-med-border">
            No drugs recorded. Doctors can prescribe medications by using Doctor Portal.
          </div>
        )}
      </div>

      {/* Modal issuing (Doctor Role Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="bg-med-bg-secondary border border-med-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 p-6">
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold font-display text-med-text-main flex items-center gap-2">
                <Pill className="w-5 h-5 text-med-accent" />
                Prescribe Medication Dosing
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-med-text-sub hover:text-med-text-main"
              >
                Close
              </button>
            </header>

            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div>
                <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                  Select Compound Formulation
                </label>
                <select
                  value={selectedMedicineId}
                  onChange={(e) => setSelectedMedicineId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main font-mono"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.brand} • {m.strength})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                  Administration Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take 1 tablet daily in the evening. Avoid saturated fats."
                  className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main h-20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                    Therapy Cycle Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="90 Days"
                    className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                    Therapy Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-med-accent hover:bg-med-accent-sub text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shimmer-btn"
              >
                {isSubmitting ? "Issuing..." : "Authorize Prescription"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
