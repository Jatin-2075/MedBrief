/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Settings,
  Sun,
  Moon,
  Bell,
  Lock,
  Mail,
  ShieldCheck,
  RefreshCcw,
  Volume2,
  Trash2,
  Sliders,
  Check
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationCritical, setNotificationCritical] = useState(true);
  const [notificationWeekly, setNotificationWeekly] = useState(false);
  const [notificationTelemetry, setNotificationTelemetry] = useState(true);

  const [showStatusGlow, setShowStatusGlow] = useState(false);

  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowStatusGlow(true);
    setTimeout(() => setShowStatusGlow(false), 2000);
  };

  const handlePurgeLogs = () => {
    if (confirm("Are you sure you want to clear your local diagnostics history and database?")) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Header */}
      <div className="mb-8 select-none">
        <span className="font-mono text-xs text-med-accent tracking-widest font-semibold block mb-1">
          SYSTEM PREFERENCES PANEL
        </span>
        <h1 className="text-3xl font-bold font-display tracking-tight text-med-text-main">
          System Settings
        </h1>
        <p className="text-xs sm:text-sm text-med-text-sub mt-0.5">
          Calibrate UI color theme mode presets, secure channels, notification triggers, and data clearance
        </p>
      </div>

      <div className="space-y-8">
        {/* Theme customization section */}
        <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="select-none">
            <h3 className="text-base font-bold font-display text-med-text-main flex items-center gap-2">
              <Sliders className="w-4 h-4 text-med-accent" />
              Theme Mode Calibration
            </h3>
            <p className="text-xs text-med-text-sub mt-1">
              Currently using <strong className="text-med-text-main font-mono">{theme}</strong> theme mode values.
            </p>
          </div>

          {/* LARGE pill toggle switch */}
          <div
            onClick={toggleTheme}
            className="pointer-events-auto relative flex w-60 p-1.5 bg-med-bg-secondary rounded-[20px] items-center border border-med-border cursor-pointer select-none"
          >
            {/* Dark option button */}
            <div className="flex-1 text-center py-2 text-xs font-bold font-display flex items-center justify-center gap-1.5 relative z-10 transition-colors duration-300 text-med-text-main">
              <Moon className="w-4 h-4 text-violet-400" />
              Midnight Violet
            </div>

            {/* Light option button */}
            <div className="flex-1 text-center py-2 text-xs font-bold font-display flex items-center justify-center gap-1.5 relative z-10 transition-colors duration-300 text-med-text-main">
              <Sun className="w-4 h-4 text-blue-500" />
              Arctic Blue
            </div>

            {/* Slidable background accent pill selector */}
            <motion.div
              layoutId="theme-active-pill"
              className="absolute top-1.5 bottom-1.5 rounded-[14px] bg-med-accent/10 border border-med-accent/30 shadow-inner"
              style={{
                left: theme === "Midnight Violet" ? "6px" : "calc(50% + 1px)",
                right: theme === "Midnight Violet" ? "calc(50% + 1px)" : "6px"
              }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            />
          </div>
        </section>

        {/* Notifications & Prefs section */}
        <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-med-border pb-4">
            <h3 className="text-base font-bold font-display text-med-text-main flex items-center gap-2 select-none">
              <Bell className="w-4.5 h-4.5 text-med-accent" />
              Telemetry Reports & Communication Alerts
            </h3>

            {showStatusGlow && (
              <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 py-1 px-3.5 rounded-lg flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Alert rules updated!
              </span>
            )}
          </div>

          <form onSubmit={handlePreferencesSave} className="space-y-4">
            <div className="space-y-3">
              {/* Option 1 */}
              <div className="flex items-center justify-between p-3.5 bg-med-bg-secondary border border-med-border rounded-xl">
                <div>
                  <label className="text-xs font-bold text-med-text-main font-display block">
                    Diagnostic Lab Alerts
                  </label>
                  <span className="text-[11px] text-med-text-sub mt-0.5">
                    Trigger push alerts as soon as new clinical summaries are analyzed by BriefCore
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.checked)}
                  className="w-5 h-5 rounded accent-med-accent"
                />
              </div>

              {/* Option 2 */}
              <div className="flex items-center justify-between p-3.5 bg-med-bg-secondary border border-med-border rounded-xl">
                <div>
                  <label className="text-xs font-bold text-med-text-main font-display block">
                    Critical Bio-Threshold Warnings
                  </label>
                  <span className="text-[11px] text-med-text-sub mt-0.5">
                    Receive safety reports when registered lipid or systolic values skip normal guidelines
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notificationCritical}
                  onChange={(e) => setNotificationCritical(e.target.checked)}
                  className="w-5 h-5 rounded accent-med-accent"
                />
              </div>

              {/* Option 3 */}
              <div className="flex items-center justify-between p-3.5 bg-med-bg-secondary border border-med-border rounded-xl">
                <div>
                  <label className="text-xs font-bold text-med-text-main font-display block">
                    Weekly Wellness summaries
                  </label>
                  <span className="text-[11px] text-med-text-sub mt-0.5">
                    Consolidated cardiovascular and glycemic trends briefing dispatched every Monday
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notificationWeekly}
                  onChange={(e) => setNotificationWeekly(e.target.checked)}
                  className="w-5 h-5 rounded accent-med-accent"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-med-border/40 select-none">
              <button
                type="submit"
                className="px-6 py-2.5 bg-med-accent hover:bg-med-accent-sub text-white hover-glow transition-all rounded-xl text-xs font-semibold cursor-pointer shimmer-btn"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </section>

        {/* Account credentials */}
        <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm">
          <h3 className="text-base font-bold font-display text-med-text-main mb-4 flex items-center gap-2 select-none">
            <Lock className="w-4.5 h-4.5 text-med-accent" />
            Security & Identity channels
          </h3>

          <div className="p-4 bg-med-bg-secondary border border-med-border rounded-2xl flex flex-wrap justify-between items-center gap-4 select-none">
            <div>
              <span className="text-[11px] text-med-text-sub font-mono uppercase tracking-wide block">
                Primary encrypted portal session
              </span>
              <p className="text-sm font-semibold text-med-text-main mt-0.5">
                {currentUser?.email || "anonymous@medbrief.org"}
              </p>
            </div>

            <button
              onClick={logout}
              className="py-2.5 px-4 rounded-xl border border-red-500/20 font-semibold bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs transition-all cursor-pointer"
            >
              Terminate Session (Logout)
            </button>
          </div>
        </section>

        {/* Development Controls (Clean database) */}
        <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm">
          <h3 className="text-base font-bold font-display text-med-text-main mb-2 select-none">
            Database Cleansers (Dev Controls)
          </h3>
          <p className="text-xs text-med-text-sub mb-4 select-none">
            Wipe current browser context variables and diagnostic logs. This fully resets all parameters to stock seed settings.
          </p>

          <button
            onClick={handlePurgeLogs}
            className="flex items-center gap-1.5 font-semibold py-2.5 px-5 rounded-xl border border-red-500/20 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white text-xs transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Purge Local Database
          </button>
        </section>
      </div>
    </div>
  );
}
