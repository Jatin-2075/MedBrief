/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { HealthDataProvider } from "./context/HealthDataContext";

// Import all pages and central components
import Dock from "./components/Dock";
import Intro from "./pages/Intro";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import AIChat from "./pages/AIChat";
import Prescriptions from "./pages/Prescriptions";
import Appointments from "./pages/Appointments";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function AnimatedAppLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      {/* Dynamic Route Viewports with Framer Motion Page transitions */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="min-h-[85vh]"
          >
            <Routes location={location}>
              <Route path="/" element={<Intro />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/chat" element={<AIChat />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              {/* Fallback back to entry point */}
              <Route path="*" element={<Intro />} />
            </Routes>
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Persistence Mac-Style Bottom Dock */}
      <Dock />
    </div>
  );
}

export default function App() {
  return (
    <HealthDataProvider>
      <Router>
        <AnimatedAppLayout />
      </Router>
    </HealthDataProvider>
  );
}
