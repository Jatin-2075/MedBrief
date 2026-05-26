/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  Video,
  Plus,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import { useHealthData } from "../hooks/useHealthData";
import { useAuth } from "../hooks/useAuth";
import type { Appointment } from "../types";

export default function Appointments() {
  const { appointments, doctors, bookAppointment } = useHealthData();
  const { currentProfile } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0].id);
  const [appointmentDate, setAppointmentDate] = useState("2026-05-28");
  const [appointmentTime, setAppointmentTime] = useState("09:30");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate our week dates starting on current metric date (May 25, 2026)
  const baseDate = new Date("2026-05-25T00:00:00Z");
  const weekDays = Array.from({ length: 7 }).map((_, idx) => {
    const day = new Date(baseDate.getTime() + idx * 24 * 60 * 60 * 1000);
    return {
      dateString: day.toISOString().split("T")[0],
      dayName: day.toLocaleDateString(undefined, { weekday: "short" }),
      dayNum: day.getDate(),
      monthName: day.toLocaleDateString(undefined, { month: "short" }),
      fullDate: day
    };
  });

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fullTimeStr = `${appointmentDate}T${appointmentTime}:00Z`;
      await bookAppointment(selectedDoctorId, fullTimeStr, notes);
      setIsModalOpen(false);
      setNotes("");
    } catch (err) {
      console.error("Booking failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check which slot appointments occur on a specific date
  const getAppointmentsForDate = (dateStr: string): Appointment[] => {
    return appointments.filter((app) => {
      const appDateOnly = app.start_time.split("T")[0];
      return appDateOnly === dateStr;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="font-mono text-xs text-med-accent tracking-widest font-semibold block mb-1">
            SECURE SCHEDULING ENGINES
          </span>
          <h1 className="text-3xl font-bold font-display tracking-tight text-med-text-main">
            Clinic Appointments
          </h1>
          <p className="text-xs sm:text-sm text-med-text-sub mt-0.5">
            Book medical consultations, attend clinical telehealth, and track follow-ups
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="shimmer-btn flex items-center gap-2 bg-med-accent hover:bg-med-accent-sub text-white px-5 py-3 rounded-xl text-xs font-bold shadow-lg hover-glow active:scale-95 duration-300 transition-all border border-med-accent/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Schedule Consultation
        </button>
      </div>

      {/* Week Calendar matrix grid view using CSS Grid layout */}
      <section className="bg-med-bg-tertiary border border-med-border rounded-3xl p-6 shadow-sm mb-8 select-none">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-mono tracking-widest text-med-text-sub uppercase">
            WEEKLY CLINIC SLOTS: MAY 25 – MAY 31, 2026
          </h3>

          <div className="flex gap-1">
            <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Active Session
            </span>
          </div>
        </div>

        {/* CSS Calendar Grid matrix of 7 days */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dateApps = getAppointmentsForDate(day.dateString);
            const isToday = day.dayNum === 25; // May 25 is simulated current day

            return (
              <div
                key={day.dateString}
                className={`min-h-48 rounded-2xl border p-4 flex flex-col justify-between ${
                  isToday
                    ? "bg-med-accent/4 border-med-accent shadow-sm"
                    : "bg-med-bg-secondary/40 border-med-border/70"
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between border-b border-med-border/40 pb-2 mb-2">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-med-text-sub uppercase tracking-wider block">
                      {day.dayName}
                    </span>
                    <span className="text-xs font-mono text-med-text-sub block">
                      {day.monthName}
                    </span>
                  </div>

                  <span className={`w-8 h-8 rounded-full font-bold font-mono text-xs flex items-center justify-center ${
                    isToday ? "bg-med-accent text-white" : "text-med-text-main"
                  }`}>
                    {day.dayNum}
                  </span>
                </div>

                {/* Day Slot list */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-32 pr-1 no-scrollbar">
                  {dateApps.map((app) => {
                    const isCompleted = app.status === "completed";
                    const isCancelled = app.status === "cancelled";
                    const statusColor = isCompleted
                      ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
                      : isCancelled
                      ? "border-red-500/20 text-red-500 bg-red-500/5"
                      : "border-med-accent/20 text-med-accent bg-med-accent/5";

                    const shortDocName = app.doctor_name.replace("Dr. ", "");

                    return (
                      <div
                        key={app.id}
                        className={`p-2 rounded-xl border text-[11px] leading-snug cursor-pointer hover:scale-[1.02] transition-transform ${statusColor}`}
                        title={app.notes}
                      >
                        <div className="font-semibold flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          Doc: {shortDocName}
                        </div>
                        <div className="font-mono text-[10px] mt-0.5 text-med-text-sub">
                          {new Date(app.start_time).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {dateApps.length === 0 && (
                    <div className="h-full flex items-center justify-center text-[10px] font-mono text-med-text-sub/40 py-8 italic uppercase text-center">
                      no appointments
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* List Feed of Scheduled Consultations */}
      <h3 className="text-base font-bold font-display text-med-text-main mb-4 select-none">
        Consultation Agenda List
      </h3>

      <div className="space-y-4">
        {appointments
          .filter((app) => app.profile_id === currentProfile?.id || !currentProfile)
          .map((app) => {
            const isCompleted = app.status === "completed";
            const isCancelled = app.status === "cancelled";

            let iconStyle = "bg-med-accent/10 border-med-accent/20 text-med-accent";
            if (isCompleted) {
              iconStyle = "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
            } else if (isCancelled) {
              iconStyle = "bg-red-500/10 border-red-500/20 text-red-500";
            }

            return (
              <div
                key={app.id}
                className="bg-med-bg-tertiary border border-med-border p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover-glow shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${iconStyle} select-none`}>
                    <Calendar className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-med-text-main">
                      Interactive Telehealth with {app.doctor_name}
                    </h4>
                    <p className="text-xs text-med-text-sub mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-mono bg-med-bg-secondary px-2 py-0.5 rounded text-[11px]">
                        {new Date(app.start_time).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                      <span className="font-mono bg-med-bg-secondary px-2 py-0.5 rounded text-[11px]">
                        {new Date(app.start_time).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </p>

                    <p className="text-xs text-med-text-sub mt-2 leading-relaxed">
                      <strong className="text-[11px] font-mono text-med-accent uppercase">Notes:</strong> "{app.notes || "Standard clinical vitals audit review."}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className={`text-[10px] font-bold font-mono tracking-wide uppercase px-2.5 py-1 rounded-full border ${
                    isCompleted
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : isCancelled
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : "bg-med-accent/10 text-med-accent border-med-accent/20 animate-pulse"
                  }`}>
                    {app.status}
                  </span>

                  {app.meeting_link && !isCancelled && !isCompleted && (
                    <a
                      href={app.meeting_link}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="px-4 py-2 bg-med-accent hover:bg-med-accent-sub text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover-glow transition-all cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      Join Google Meet
                    </a>
                  )}
                </div>
              </div>
            );
          })}

        {appointments.length === 0 && (
          <div className="p-12 text-center text-med-text-sub bg-med-bg-tertiary border border-med-border rounded-3xl">
            No consultations recorded. Use the "Schedule Consultation" button to log a virtual visit.
          </div>
        )}
      </div>

      {/* Modal Appointment Booking details */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-med-bg-secondary border border-med-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 p-6"
            >
              <header className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold font-display text-med-text-main flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-med-accent" />
                  Request Clinic Visit
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded bg-med-bg-tertiary border border-med-border text-med-text-sub hover:text-med-text-main"
                >
                  Close
                </button>
              </header>

              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                    Consulting Clinician
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                      Choose Date
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                      Hour Time Slot
                    </label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                    Clinical Brief Focus Goals / Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Discuss fasting glucose recovery metrics or statin lipid panel progress"
                    className="w-full px-3 py-2 text-sm bg-med-bg-tertiary border border-med-border rounded-xl text-med-text-main h-20"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-med-accent hover:bg-med-accent-sub text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shimmer-btn"
                >
                  {isSubmitting ? "Processing visit slot..." : "Lock Weekly Consult Visit"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
