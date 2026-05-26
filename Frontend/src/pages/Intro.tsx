/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { HeartPulse, ArrowRight } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export default function Intro() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [activePulse, setActivePulse] = useState(true);

  // Background floating particles canvas logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.3 - 0.2; // slight drift upward
        this.opacity = Math.random() * 0.2 + 0.1;
        this.color = theme === "Midnight Violet" ? "#a78bfa" : "#3b82f6";
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around fields
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = height;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.update();
        p.draw();
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [theme]);

  const handleLoginSelect = (role: "Patient" | "Doctor") => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(`/login?role=${role}`);
    }, 600); // Wait for transition out
  };

  const titleText = "MedBrief";

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-between py-12 transition-colors duration-500"
      style={{
        backgroundColor: theme === "Midnight Violet" ? "#0a0a0f" : "#ffffff"
      }}
    >
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Decorative pulse blur glow at top-center */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-[120px] bg-gradient-to-tr from-med-accent to-med-accent-sub pointer-events-none" />

      {/* Spacing top */}
      <div />

      {/* Main Core Showcase */}
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="z-10 flex flex-col items-center select-none"
          >
            {/* Step 1: Hearts Pulse icon + expanding rings */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
              {activePulse && (
                <>
                  <div className="pulse-ring pulse-ring-1 border border-med-accent w-24 h-24" />
                  <div className="pulse-ring pulse-ring-2 border border-med-accent-sub w-24 h-24" />
                  <div className="pulse-ring pulse-ring-3 border border-med-accent w-24 h-24" />
                </>
              )}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 140,
                  damping: 15,
                  delay: 0.1
                }}
                className="w-16 h-16 rounded-full bg-med-accent text-white flex items-center justify-center glow-accent shadow-lg"
              >
                <HeartPulse className="w-8 h-8 animate-pulse text-white" />
              </motion.div>
            </div>

            {/* Step 2: "MedBrief" Letter stagger typography */}
            <motion.h1
              className="text-5xl sm:text-6xl font-bold tracking-tight font-display mb-3 bg-gradient-to-r from-med-accent to-med-accent-sub bg-clip-text text-transparent flex justify-center"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                    delayChildren: 0.6
                  }
                }
              }}
            >
              {titleText.split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h1>

            {/* Step 3: Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="text-base sm:text-lg text-med-text-sub font-medium tracking-wide max-w-md text-center px-4"
            >
              Your intelligent, AI-guided clinical health engine
            </motion.p>

            {/* Step 4: Login CTAs buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 2.1, type: "spring", stiffness: 100 }}
              className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-md px-6"
            >
              <button
                onClick={() => handleLoginSelect("Patient")}
                className="shimmer-btn flex-1 py-4 px-6 text-sm font-semibold text-white bg-med-accent rounded-xl hover-glow hover:bg-med-accent-sub/90 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 border border-med-accent/30 cursor-pointer"
              >
                Patient Portal
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleLoginSelect("Doctor")}
                className="shimmer-btn flex-1 py-4 px-6 text-sm font-semibold rounded-xl bg-transparent border border-med-accent hover:border-med-accent-sub text-med-text-main hover:bg-med-accent/5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                Clinician Portal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mac-style subtle info row */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 0.5, y: 0 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        className="font-mono text-[10px] tracking-widest text-med-text-sub flex items-center gap-2 select-none"
      >
        <span>SECURE MEDICAL CHANNELS</span>
        <span>•</span>
        <span>HIPAA COMPLIANT INC.</span>
      </motion.div>
    </div>
  );
}
