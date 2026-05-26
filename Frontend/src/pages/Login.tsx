/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { HeartPulse, Key, Mail, ShieldAlert, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, currentUser } = useAuth();

  // Determine initial role from URL params
  const paramRole = searchParams.get("role");
  const [role, setRole] = useState<"Patient" | "Doctor">(
    paramRole === "Doctor" ? "Doctor" : "Patient"
  );

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  // Handle default user loads for demo ease
  const handleAutofill = () => {
    if (role === "Patient") {
      setUsername("alex");
      setPassword("password123");
    } else {
      setUsername("sarah");
      setPassword("password123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!username) {
      setErrorMessage("Please enter a username.");
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (!email.includes("@")) {
          setErrorMessage("Please enter a valid email address.");
          setIsLoading(false);
          return;
        }
        const success = await register(username, email, password, role);
        if (success) {
          setSuccessMessage("Account created successfully! Booting core dashboard...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
        } else {
          setErrorMessage("Email already registered with another user.");
          setIsLoading(false);
        }
      } else {
        const success = await login(username, password, role);
        if (success) {
          setSuccessMessage("Credentials authorized! Decrypting health channels...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1200);
        } else {
          setErrorMessage("Authentication failed. Please verify credentials.");
          setIsLoading(false);
        }
      }
    } catch (err) {
      setErrorMessage("Service failure. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 py-12">
      {/* Decorative background glows */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full opacity-10 bg-med-accent blur-[100px]" />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full opacity-10 bg-med-accent-sub blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-med-glass border border-med-border p-8 rounded-[30px] shadow-2xl backdrop-blur-md relative"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="w-12 h-12 bg-med-accent rounded-2xl flex items-center justify-center text-white shadow-lg mb-3">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-med-text-main">
            {isRegisterMode ? "Create MedBrief Account" : "Access Portal"}
          </h2>
          <p className="text-xs text-med-text-sub mt-1">
            HIPAA-grade decentralized diagnostic logging
          </p>
        </div>

        {/* Slidable Role Selector pill switch */}
        <div className="relative flex p-1 bg-med-bg-secondary rounded-xl items-center border border-med-border mb-6">
          <button
            type="button"
            onClick={() => {
              setRole("Patient");
              setUsername("");
            }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg relative z-10 transition-colors duration-300 ${
              role === "Patient" ? "text-white" : "text-med-text-sub"
            }`}
          >
            Patient Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("Doctor");
              setUsername("");
            }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg relative z-10 transition-colors duration-300 ${
              role === "Doctor" ? "text-white" : "text-med-text-sub"
            }`}
          >
            Doctor Portal
          </button>
          <motion.div
            layoutId="role-background"
            className="absolute top-1 bottom-1 rounded-lg bg-med-accent shadow-sm"
            style={{
              left: role === "Patient" ? "4px" : "calc(50% + 2px)",
              right: role === "Patient" ? "calc(50% + 2px)" : "4px"
            }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          />
        </div>

        {/* Autofill Demo Aid Trigger */}
        <div className="mb-6 flex justify-between items-center bg-med-bg-secondary border border-med-border p-3 rounded-xl">
          <span className="text-[10px] font-mono text-med-text-sub">
            ⚡ QUICK SIGN-IN (DEMO ACCOUNTS)
          </span>
          <button
            onClick={handleAutofill}
            type="button"
            className="text-[11px] font-semibold text-med-accent hover:text-med-accent-sub font-display cursor-pointer"
          >
            Autofill for {role}
          </button>
        </div>

        {/* Feedback alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-3 rounded-xl flex items-center gap-2 mb-4"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-green-500/10 border border-green-500/20 text-green-500 text-xs px-4 py-3 rounded-xl flex items-center gap-2 mb-4"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth form fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input with labels */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-med-text-sub">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or alias"
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-med-bg-secondary border border-med-border focus:outline-none focus:ring-2 focus:ring-med-accent focus:border-transparent transition-all text-med-text-main"
              required
            />
          </div>

          {/* Optional Email field in register mode */}
          {isRegisterMode && (
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-med-text-sub">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Secure email"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-med-bg-secondary border border-med-border focus:outline-none focus:ring-2 focus:ring-med-accent focus:border-transparent transition-all text-med-text-main"
                required
              />
            </div>
          )}

          {/* Password Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-med-text-sub">
              <Key className="w-4 h-4" />
            </span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Security Key/Password"
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-med-bg-secondary border border-med-border focus:outline-none focus:ring-2 focus:ring-med-accent focus:border-transparent transition-all text-med-text-main"
              required
            />
          </div>

          {/* Form Actions Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-med-accent hover:bg-med-accent-sub hover-glow active:scale-95 duration-300 transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer shimmer-btn"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isRegisterMode ? "Create Account" : "Authorize Portal Access"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Account Mode Footer links */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            type="button"
            className="text-xs text-med-accent font-medium hover:underline cursor-pointer"
          >
            {isRegisterMode
              ? "Already registered? Go to portal sign-in"
              : "Register fresh diagnostics channel account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
