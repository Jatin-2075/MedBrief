/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Scale,
  Ruler,
  TrendingUp,
  Briefcase,
  Contact2,
  Calendar,
  Save,
  Edit2,
  Check,
  Building,
  Target,
  Info
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { currentProfile, updateProfile, currentUser } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states initialized from current profile
  const [name, setName] = useState(currentProfile?.name || "");
  const [age, setAge] = useState(currentProfile?.age || 35);
  const [gender, setGender] = useState<1 | 2 | 3>(currentProfile?.gender || 1);
  const [weight, setWeight] = useState(currentProfile?.weight || 70);
  const [height, setHeight] = useState(currentProfile?.height || 175);

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);

  if (!currentProfile || !currentUser) return null;

  // Calculate live Body Mass Index (BMI)
  const calculateBMI = (): number => {
    const hM = height / 100;
    if (hM === 0) return 0;
    return weight / (hM * hM);
  };

  const bmi = calculateBMI();

  // Determine BMI Category and grading ranges
  const getBMICategory = (val: number) => {
    if (val < 18.5) return { label: "Underweight Range", color: "text-amber-500", progress: "bg-amber-500", border: 'border-amber-500/20' };
    if (val < 25) return { label: "Perfect Optimal Range", color: "text-emerald-500", progress: "bg-emerald-500", border: 'border-emerald-500/20' };
    if (val < 30) return { label: "Overweight Range", color: "text-yellow-500", progress: "bg-yellow-500", border: 'border-yellow-500/20' };
    return { label: "Obese (Elevated Risk)", color: "text-red-500", progress: "bg-red-500", border: 'border-red-500/20' };
  };

  const bmiMeta = getBMICategory(bmi);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        name,
        age: Number(age),
        gender: Number(gender) as 1 | 2 | 3,
        weight: Number(weight),
        height: Number(height)
      });

      setIsEditMode(false);
      setShowSuccessGlow(true);
      setTimeout(() => setShowSuccessGlow(false), 2000);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract initials for the avatar holder
  const getInitials = (userNameStr: string): string => {
    const names = userNameStr.split(" ");
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return userNameStr.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 select-none">
        <div>
          <span className="font-mono text-xs text-med-accent tracking-widest font-semibold block mb-1">
            BIOMETRIC SECURE CREDENTIALING
          </span>
          <h1 className="text-3xl font-bold font-display tracking-tight text-med-text-main">
            Biometric Profile
          </h1>
          <p className="text-xs sm:text-sm text-med-text-sub mt-0.5">
            Audit personal somatic measurements, track BMI quotients, and configure primary physician maps
          </p>
        </div>

        {/* Edit mode toggle button */}
        {!isEditMode ? (
          <button
            onClick={() => setIsEditMode(true)}
            className="flex items-center gap-2 bg-med-bg-tertiary border border-med-border hover:border-med-accent hover:text-med-accent text-med-text-main py-2.5 px-5 rounded-xl text-xs font-semibold hover-glow transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            Edit Somatic Records
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditMode(false);
                // Reset form values to original state
                setName(currentProfile.name);
                setAge(currentProfile.age);
                setGender(currentProfile.gender);
                setWeight(currentProfile.weight);
                setHeight(currentProfile.height);
              }}
              className="px-4 py-2 bg-med-bg-tertiary border border-med-border text-med-text-sub rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Profile Form Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Span: Avatar and Somatic values editor */}
        <div className="lg:col-span-7 bg-med-bg-tertiary border border-med-border rounded-3xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-med-border/45">
              {/* Initials Avatar Plate */}
              <div className="w-20 h-20 rounded-3xl bg-med-accent text-white flex items-center justify-center text-2xl font-extrabold font-display shadow-lg select-none glow-accent uppercase">
                {getInitials(name || currentProfile.name)}
              </div>

              <div className="text-center sm:text-left select-none">
                <h3 className="text-lg font-bold text-med-text-main font-display">{name || currentProfile.name}</h3>
                <p className="text-xs text-med-text-sub font-mono uppercase tracking-wide">
                  Account Role: Security {currentUser.role} • ID: #{currentUser.id.slice(-6).toUpperCase()}
                </p>

                {/* Feedback glow indicator */}
                <AnimatePresence>
                  {showSuccessGlow && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 py-1 px-3 border border-emerald-500/20 rounded-lg flex items-center gap-1.5 justify-center sm:justify-start"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Somatic parameters synchronized!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Grid form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                  Full Account Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-med-bg-secondary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none"
                  disabled={!isEditMode}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                  Biological Age (Years)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-med-bg-secondary border border-med-border rounded-xl text-med-text-main font-mono focus:ring-1 focus:ring-med-accent focus:outline-none"
                  disabled={!isEditMode}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                  Gender Assignment
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full px-4 py-2.5 text-sm bg-med-bg-secondary border border-med-border rounded-xl text-med-text-main focus:ring-1 focus:ring-med-accent focus:outline-none"
                  disabled={!isEditMode}
                >
                  <option value={1}>Male</option>
                  <option value={2}>Female</option>
                  <option value={3}>Other / Non-Binary</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                  Personal Weight (kg)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-med-text-sub text-xs">
                    <Scale className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-med-bg-secondary border border-med-border rounded-xl text-med-text-main font-mono focus:ring-1 focus:ring-med-accent focus:outline-none"
                    disabled={!isEditMode}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-med-text-sub font-mono uppercase tracking-wide block mb-1">
                  Personal Height (cm)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-med-text-sub text-xs">
                    <Ruler className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-med-bg-secondary border border-med-border rounded-xl text-med-text-main font-mono focus:ring-1 focus:ring-med-accent focus:outline-none"
                    disabled={!isEditMode}
                    required
                  />
                </div>
              </div>
            </div>

            {isEditMode && (
              <div className="pt-4 border-t border-med-border/40 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-med-accent hover:bg-med-accent-sub text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer hover-glow shimmer-btn"
                >
                  {isLoading ? (
                    "Saving changes..."
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Biometric Record
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Span: Gauge BMI & Assigned clinician info */}
        <div className="lg:col-span-5 space-y-8 select-none">
          {/* Live body BMI tracker */}
          <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm text-center">
            <h3 className="text-base font-bold font-display text-med-text-main mb-2">Live BMI Quotient</h3>
            <p className="text-xs text-med-text-sub">Body mass index based on live somatic dimensions</p>

            {/* BMI visual value displays */}
            <div className="my-6">
              <span className="text-5xl font-extrabold font-mono tracking-tight bg-gradient-to-r from-med-accent to-med-accent-sub bg-clip-text text-transparent">
                {bmi.toFixed(1)}
              </span>
              <p className={`text-xs font-bold font-display tracking-wider uppercase mt-2 ${bmiMeta.color}`}>
                {bmiMeta.label}
              </p>
            </div>

            {/* Interactive linear progress tracker gauge */}
            <div className="space-y-2 text-left mb-4">
              <div className="h-2 w-full rounded-full bg-med-bg-secondary border border-med-border relative overflow-hidden">
                {/* Dynamically sliding percentage marker representing standard BMI scope of 15 to 35 */}
                <span
                  style={{
                    width: `${Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100))}%`
                  }}
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-300 ${bmiMeta.progress}`}
                />
              </div>

              <div className="flex justify-between text-[9px] font-mono text-med-text-sub uppercase tracking-tight">
                <span>15.0 Underweight</span>
                <span>25.0 Normal</span>
                <span>35.0 High Risk</span>
              </div>
            </div>

            <div className="p-3 bg-med-bg-secondary rounded-xl text-center text-[10px] text-med-text-sub border border-med-border leading-normal flex items-start gap-1.5">
              <Info className="w-4 h-4 text-med-accent shrink-0" />
              Formula uses metric inputs height & weight. Standard normal guidelines are locked between 18.5 and 24.9.
            </div>
          </section>

          {/* Assigned clinician card */}
          <section className="bg-med-bg-tertiary border border-med-border p-6 rounded-3xl shadow-sm">
            <h3 className="text-xs font-mono tracking-widest text-med-text-sub uppercase mb-4 text-center">
              Assigned Clinic Officer
            </h3>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border-2 border-med-accent overflow-hidden mb-3">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150"
                  alt="Dr Sarah Jenkins"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <h4 className="text-sm font-bold text-med-text-main">Dr. Sarah Jenkins, MD</h4>
              <p className="text-[11px] text-med-accent font-semibold font-mono tracking-wider uppercase mt-1">
                Cardiology Specialist
              </p>

              <div className="w-full mt-4 p-3 bg-med-bg-secondary rounded-xl text-left text-xs space-y-1 bg-med-bg-secondary border border-med-border">
                <div className="flex justify-between font-mono text-[10px] text-med-text-sub">
                  <span>CLINIC STATION</span>
                  <span className="text-med-text-main font-semibold">STATION-A4</span>
                </div>
                <div className="flex justify-between font-mono text-[10px] text-med-text-sub">
                  <span>TELEMETRY STACKS</span>
                  <span className="text-med-text-main font-semibold">SECURE VPN</span>
                </div>
                <div className="flex justify-between font-mono text-[10px] text-med-text-sub">
                  <span>SCHEDULING CODE</span>
                  <span className="text-med-text-main font-semibold">MED-CARDIO-JW</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
