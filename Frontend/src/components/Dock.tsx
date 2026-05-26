/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Activity,
  MessageSquare,
  FileText,
  Pill,
  Calendar,
  User,
  Settings
} from "lucide-react";

interface DockItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Dock() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't render Dock on the full screen Landing Screen ("/")
  if (currentPath === "/") {
    return null;
  }

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dockItems: DockItem[] = [
    { id: "home", label: "Dashboard", path: "/dashboard", icon: Home },
    { id: "activity", label: "Biometrics", path: "/reports", icon: Activity }, // Activity points to Reports or Details
    { id: "chat", label: "AI Clinical Bot", path: "/chat", icon: MessageSquare },
    { id: "reports", label: "Health Reports", path: "/reports", icon: FileText },
    { id: "prescriptions", label: "Prescriptions", path: "/prescriptions", icon: Pill },
    { id: "appointments", label: "Appointments", path: "/appointments", icon: Calendar },
    { id: "profile", label: "Biometric Profile", path: "/profile", icon: User },
    { id: "settings", label: "System Settings", path: "/settings", icon: Settings }
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="pointer-events-auto flex items-end gap-3 sm:gap-4 px-4 sm:px-6 py-3 rounded-3xl bg-med-glass border border-med-border backdrop-blur-xl shrink-0 max-w-full shadow-[0_12px_40px_rgba(0,0,0,0.3)] select-none transition-colors duration-300"
      >
        {dockItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          // Compute macOS-style magnification
          let scale = 1.0;
          let distance = 0;
          if (hoveredIndex !== null) {
            distance = Math.abs(idx - hoveredIndex);
            if (distance === 0) {
              scale = 1.45; // Hovered icon
            } else if (distance === 1) {
              scale = 1.2; // Nearest neighbor
            } else if (distance === 2) {
              scale = 1.05; // Outer neighbor
            }
          }

          return (
            <div
              key={item.id}
              className="relative flex flex-col items-center justify-end"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              <AnimatePresence>
                {hoveredIndex === idx && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: -45, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute whitespace-nowrap bg-med-bg-tertiary border border-med-border shadow-lg text-med-text-main text-[11px] font-medium tracking-tight font-display px-2.5 py-1 rounded-md pointer-events-none"
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon Container */}
              <Link to={item.path}>
                <motion.div
                  animate={{
                    scale,
                    y: hoveredIndex === idx ? -10 : 0
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 18 }}
                  className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border transition-colors duration-300 cursor-pointer ${
                    isActive
                      ? "bg-med-accent border-med-accent text-white shadow-[0_4px_16px_rgba(var(--accent-val),0.4)]"
                      : "bg-med-bg-secondary border-med-border text-med-text-sub hover:text-med-accent hover:border-med-accent/30 hover:bg-med-bg-tertiary"
                  }`}
                  id={`dock-btn-${item.id}`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
              </Link>

              {/* Active Indicator Dot */}
              <div className="h-1.5 flex items-center justify-center mt-1">
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="w-1.5 h-1.5 rounded-full bg-med-accent"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
