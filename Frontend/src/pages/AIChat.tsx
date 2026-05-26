/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Send,
  Sparkles,
  RefreshCw,
  User,
  HeartPulse,
  Brain,
  ShieldCheck,
  Info
} from "lucide-react";
import { useHealthData } from "../hooks/useHealthData";
import { useAuth } from "../hooks/useAuth";
import type { ChatMessage } from "../types";

export default function AIChat() {
  const { chatMessages, sendChatMessage, clearChatHistory, reports } = useHealthData();
  const { currentUser } = useAuth();

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Suggested clinically smart quick prompts
  const suggestionChips = [
    "Explain my HbA1c Level",
    "What does my cardiac risk mean?",
    "Summarize my latest report",
    "What is Atorvastatin?"
  ];

  // Auto scroll to latest message when logs change or typing finishes
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return;
    setInputMessage("");
    setIsTyping(true);

    try {
      await sendChatMessage(msg);
    } catch (err) {
      console.error("Chat failure", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32 h-[85vh] flex flex-col">
      {/* Top Navigation / Status Header */}
      <header className="bg-med-bg-tertiary border border-med-border p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-sm select-none shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-med-accent rounded-xl flex items-center justify-center text-white glow-accent">
            <Brain className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold font-display text-med-text-main">
                BriefCore Clinical AI Engine
              </h1>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] sm:text-xs text-med-text-sub font-mono uppercase tracking-wider">
              Secure HIPAA-aligned biometric consult
            </p>
          </div>
        </div>

        <button
          onClick={clearChatHistory}
          className="text-xs font-semibold text-med-text-sub hover:text-red-500 flex items-center gap-1 bg-med-bg-secondary border border-med-border hover:border-red-500/20 py-2 px-3 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Chat History
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 bg-med-bg-tertiary border border-med-border rounded-3xl p-4 sm:p-6 flex flex-col overflow-hidden shadow-sm relative">
        
        {/* Dynamic Patient Biometrics Quick banner */}
        {reports.length > 0 && (
          <div className="bg-med-bg-secondary border border-med-border px-4 py-2 text-[10px] font-mono rounded-xl mb-4 text-med-text-sub flex justify-between items-center select-none shrink-0">
            <span>📡 METRIC COUPLING: ACTIVE</span>
            <span>LAST REPORT: HbA1c {reports[reports.length - 1].hba1c}% • LDL {reports[reports.length - 1].ldl_cholesterol} mg/dL</span>
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 mb-4 shrink-0 select-none">
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSendMessage(chip)}
              className="py-1.5 px-3 rounded-lg border border-med-border bg-med-bg-secondary hover:border-med-accent hover_glow text-[11px] font-semibold text-med-text-sub hover:text-med-accent transition-all cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Scrolling Chat log container */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
          
          {/* Welcome greeting on mount */}
          <div className="chat-bubble flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-lg bg-med-accent/10 flex items-center justify-center text-med-accent shrink-0 select-none border border-med-accent/20">
              <Sparkles className="w-4 h-4 text-med-accent" />
            </div>
            <div className="p-4 rounded-2xl bg-med-bg-secondary border border-med-border text-xs sm:text-sm text-med-text-main leading-relaxed shadow-sm">
              <p className="font-bold font-display mb-1 text-med-text-main">
                Hello {currentUser?.username || "Guest"}!
              </p>
              I am your diagnostic analyzer. I inspect blood pressures, HbA1c values, renal filters (eGFR), and lipid panels. How can I help clarify your laboratory results today?
            </div>
          </div>

          {/* Dynamic Map of Messages */}
          {chatMessages.map((msg) => (
            <React.Fragment key={msg.id}>
              {/* User message block */}
              <div className="flex justify-end pr-2">
                <div className="flex gap-3 max-w-[85%] items-start justify-end flex-row-reverse">
                  <div className="w-8 h-8 rounded-lg bg-med-bg-secondary border border-med-border flex items-center justify-center text-med-text-sub shrink-0 select-none">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-med-accent text-white text-xs sm:text-sm leading-relaxed shadow-sm font-medium border border-med-accent/20">
                    {msg.user_query}
                  </div>
                </div>
              </div>

              {/* AI message block */}
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-med-accent/10 flex items-center justify-center text-med-accent shrink-0 select-none border border-med-accent/20">
                  <Sparkles className="w-4 h-4 text-med-accent" />
                </div>
                <div className="p-4 rounded-2xl bg-med-bg-secondary border border-med-border text-xs sm:text-sm text-med-text-main leading-relaxed shadow-sm space-y-2">
                  {/* Robust markdown formatting with list rendering if response includes bullets */}
                  {msg.ai_response.split("\n").map((line, idx) => {
                    if (line.startsWith("- ")) {
                      return (
                        <li key={idx} className="list-disc ml-4 pl-1">
                          {line.replace("- ", "").replace(/\*\*(.*?)\*\*/g, (_, p1) => `<strong>${p1}</strong>`)}
                          {/* Inject simple strong replacements for premium highlighting */}
                        </li>
                      );
                    }
                    return (
                      <p
                        key={idx}
                        dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-med-accent/10 flex items-center justify-center text-med-accent shrink-0 select-none border border-med-accent/20">
                  <Sparkles className="w-4 h-4 text-med-accent animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-med-bg-secondary border border-med-border flex items-center justify-center min-w-16 shadow-sm">
                  <div className="flex gap-1.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-med-text-sub animate-[bounce_1.4s_infinite_0s]" />
                    <span className="w-2 h-2 rounded-full bg-med-text-sub animate-[bounce_1.4s_infinite_0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-med-text-sub animate-[bounce_1.4s_infinite_0.4s]" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Form Message input bar */}
        <form onSubmit={handleFormSubmit} className="mt-4 pt-4 border-t border-med-border shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Clinical AI: 'Explain my lipid panel' or 'How can I lower HbA1c?'"
              className="w-full pl-4 pr-14 py-3.5 text-sm bg-med-bg-secondary border border-med-border focus:ring-1 focus:ring-med-accent focus:outline-none focus:border-transparent rounded-2xl text-med-text-main"
              disabled={isTyping}
              required
            />
            <button
              type="submit"
              disabled={isTyping || !inputMessage.trim()}
              className="absolute right-2 p-2.5 bg-med-accent hover:bg-med-accent-sub text-white rounded-xl transition-all hover-glow cursor-pointer disabled:opacity-40 disabled:hover:scale-100 active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] text-med-text-sub font-mono tracking-wide text-center mt-3 select-none flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            BriefCore interprets bio-chemistry statically under clinical guidance. Consult medical personnel for medical emergencies.
          </div>
        </form>

      </div>
    </div>
  );
}
