import { useEffect, useRef, useState } from "react";

export default function Intro() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isExiting, setIsExiting] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const safeCtx = ctx as CanvasRenderingContext2D;
        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);
        class Particle {
            x: number; y: number; size: number; speedX: number; speedY: number; opacity: number;
            constructor() {
                this.x = Math.random() * width; this.y = Math.random() * height;
                this.size = Math.random() * 2 + 1;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = (Math.random() - 0.5) * 0.3 - 0.2;
                this.opacity = Math.random() * 0.2 + 0.1;
            }
            update() {
                this.x += this.speedX; this.y += this.speedY;
                if (this.x < 0) this.x = width; if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height; if (this.y > height) this.y = height;
            }
            draw() {
                safeCtx.beginPath(); safeCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                safeCtx.fillStyle = "#a78bfa"; safeCtx.globalAlpha = this.opacity; safeCtx.fill();
            }
        }
        const particles: Particle[] = Array.from({ length: 35 }, () => new Particle());
        const handleResize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
        window.addEventListener("resize", handleResize);
        const render = () => {
            ctx.clearRect(0, 0, width, height); ctx.globalAlpha = 1;
            for (const p of particles) { p.update(); p.draw(); }
            animationFrameId = requestAnimationFrame(render);
        };
        render();
        return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener("resize", handleResize); };
    }, []);

    const handleLoginSelect = (role: "Patient" | "Doctor") => {
        setIsExiting(true);
        setTimeout(() => { window.location.href = `/login?role=${role}`; }, 550);
    };

    const features = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "2rem", height: "2rem" }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
            ),
            tag: "Smart Docs",
            title: "PDF Report Simplifier",
            desc: "Upload any medical report, lab result, or discharge summary. Our AI breaks down complex clinical language into plain, easy-to-understand summaries — so patients always know what their results actually mean.",
            bullets: ["Lab result interpretation", "Medication dosage explained", "Diagnosis plain-language summary"],
            accent: "#7c3aed",
            accentSoft: "rgba(124,58,237,0.1)",
            side: "left",
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "2rem", height: "2rem" }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            ),
            tag: "Secure Messaging",
            title: "Doctor–Patient Chat",
            desc: "End-to-end encrypted real-time messaging between patients and their care team. Share files, ask follow-up questions, and receive clinical guidance — all within a HIPAA-compliant channel.",
            bullets: ["End-to-end encrypted", "File & image sharing", "Read receipts & status"],
            accent: "#0ea5e9",
            accentSoft: "rgba(14,165,233,0.1)",
            side: "right",
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "2rem", height: "2rem" }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    <path d="M9 10h.01M15 10h.01" />
                </svg>
            ),
            tag: "AI Assistant",
            title: "Clinical AI Copilot",
            desc: "An intelligent assistant trained on medical knowledge that helps patients understand symptoms, suggests when to seek care, and assists clinicians with differential diagnoses and documentation drafts.",
            bullets: ["Symptom checker & triage", "Differential diagnosis hints", "Clinical note drafting"],
            accent: "#10b981",
            accentSoft: "rgba(16,185,129,0.1)",
            side: "left",
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "2rem", height: "2rem" }}>
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
            tag: "Health Records",
            title: "Unified Patient Dashboard",
            desc: "A single timeline view of every visit, prescription, test, and referral. Patients and doctors both get contextual access to the full medical history — structured, searchable, and always up to date.",
            bullets: ["Full visit history timeline", "Prescription tracking", "Referral & follow-up alerts"],
            accent: "#f59e0b",
            accentSoft: "rgba(245,158,11,0.1)",
            side: "right",
        },
    ];

    const stats = [
        { value: "2+", label: "Reports simplified" },
        { value: "98%", label: "Patient satisfaction" },
        { value: "1", label: "Clinics onboarded" },
        { value: "<2s", label: "AI response time" },
    ];

    return (
        <>
            {/* NAV - Inherits layout styles safely from parent scope */}
            <nav className="nav-pill" style={{ opacity: scrollY > 60 ? 1 : 0, pointerEvents: scrollY > 60 ? "all" : "none" }}>
                <span style={{ color: "#a78bfa", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "-0.01em" }}>MedBrief</span>
                <div style={{ width: "1px", height: "1rem", background: "rgba(255,255,255,0.1)" }} />
                <button className="nav-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Features</button>
                <button className="nav-link" onClick={() => document.getElementById("stats")?.scrollIntoView({ behavior: "smooth" })}>Impact</button>
                <button className="nav-link" onClick={() => document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" })}>Get Started</button>
            </nav>

            {/* Parent class attached right here to scope Intro.css rules safely */}
            <div className="intro-wrapper-root" style={{ backgroundColor: "#0a0a0f", width: "100%", minHeight: "100vh", color: "#ffffff", transition: "opacity 0.5s ease, transform 0.5s ease", opacity: isExiting ? 0 : 1, transform: isExiting ? "scale(0.94)" : "scale(1)" }}>

                {/* ─── HERO ─── */}
                <section style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "3rem 1rem" }}>
                    <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />
                    <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: "32rem", height: "32rem", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

                    <div />

                    <div style={{ zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
                        {/* Icon Ring Assembly */}
                        <div style={{ position: "relative", width: "8rem", height: "8rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
                            <div className="mb-intro-pr" style={{ border: "1px solid #7c3aed", animationDelay: "0s" }} />
                            <div className="mb-intro-pr" style={{ border: "1px solid #a78bfa", animationDelay: "0.6s" }} />
                            <div className="mb-intro-pr" style={{ border: "1px solid #7c3aed", animationDelay: "1.2s" }} />
                            <div className="mb-intro-icon" style={{ width: "4rem", height: "4rem", borderRadius: "50%", backgroundColor: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2 }}>
                                <svg className="mb-heart" style={{ width: "2rem", height: "2rem" }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12h3l2-7 4 14 2-7h7" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" opacity="0.3" />
                                </svg>
                            </div>
                        </div>

                        {/* Title Character Animation */}
                        <h1 style={{ fontSize: "clamp(2.8rem, 6vw, 4rem)", fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(90deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "flex", marginBottom: "0.75rem" }}>
                            {"MedBrief".split("").map((char, i) => (
                                <span key={i} className="mb-letter" style={{ animationDelay: `${0.9 + i * 0.08}s` }}>{char}</span>
                            ))}
                        </h1>

                        <p className="mb-sub" style={{ fontSize: "1.05rem", color: "#9ca3af", fontWeight: 500, letterSpacing: "0.02em", textAlign: "center", maxWidth: "28rem", padding: "0 1rem" }}>
                            Your intelligent, AI-guided clinical health engine
                        </p>

                        {/* Buttons Hooked into Animated Classes */}
                        <div className="mb-ctas" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "1rem", marginTop: "2.5rem", width: "100%", maxWidth: "28rem", padding: "0 1.5rem", justifyContent: "center" }}>
                            <button onClick={() => handleLoginSelect("Patient")} className="shimmer-btn btn-p" style={{ flex: 1, minWidth: "140px", padding: "0.9rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#fff", backgroundColor: "#7c3aed", border: "1px solid rgba(124,58,237,0.4)", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer" }}>
                                Patient Portal
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </button>
                            <button onClick={() => handleLoginSelect("Doctor")} className="shimmer-btn btn-o" style={{ flex: 1, minWidth: "140px", padding: "0.9rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#e5e7eb", backgroundColor: "transparent", border: "1px solid #7c3aed", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                Clinician Portal
                            </button>
                        </div>

                        {/* Scroll hint */}
                        <div className="mb-sub" style={{ marginTop: "3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            <span>Scroll to explore</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "float 1.5s ease-in-out infinite" }}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                        </div>
                    </div>

                    <div className="mb-foot" style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.15em", color: "#4b5563", display: "flex", alignItems: "center", gap: "0.5rem", userSelect: "none", zIndex: 10 }}>
                        <span>SECURE MEDICAL CHANNELS</span><span>•</span><span>HIPAA COMPLIANT INC.</span>
                    </div>
                </section>

                {/* ─── FEATURES ─── */}
                <section id="features" style={{ maxWidth: "860px", margin: "0 auto", padding: "6rem 1.5rem" }}>
                    <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                        <div className="section-tag" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>What we offer</div>
                        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                            Everything your care<br />
                            <span style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>journey needs</span>
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1rem", marginTop: "1rem", maxWidth: "480px", margin: "1rem auto 0" }}>
                            One platform connecting patients, clinicians, and AI — so nothing falls through the cracks.
                        </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {features.map((f, i) => (
                            <FeatureCard key={i} feature={f} index={i} />
                        ))}
                    </div>
                </section>

                {/* ─── STATS ─── */}
                <section id="stats" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "5rem 1.5rem" }}>
                    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                            <div className="section-tag" style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}>By the numbers</div>
                            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>Trusted at scale</h2>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                            {stats.map((s, i) => (
                                <StatCard key={i} stat={s} delay={i * 0.1} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── HOW IT WORKS ─── */}
                <section style={{ maxWidth: "860px", margin: "0 auto", padding: "6rem 1.5rem" }}>
                    <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                        <div className="section-tag" style={{ background: "rgba(14,165,233,0.12)", color: "#38bdf8" }}>Simple process</div>
                        <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>Up and running in minutes</h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                        {[
                            { step: "01", title: "Create your account", desc: "Sign up as a patient or clinician in under 60 seconds.", color: "#7c3aed" },
                            { step: "02", title: "Connect your records", desc: "Upload past reports or link your existing EMR system.", color: "#0ea5e9" },
                            { step: "03", title: "AI does the heavy lifting", desc: "Instant summaries, smart suggestions, and proactive alerts.", color: "#10b981" },
                            { step: "04", title: "Collaborate seamlessly", desc: "Message your care team, share results, track progress.", color: "#f59e0b" },
                        ].map((s, i) => (
                            <HowItWorksCard key={i} s={s} delay={i * 0.12} />
                        ))}
                    </div>
                </section>

                {/* ─── CTA ─── */}
                <section id="cta" style={{ padding: "5rem 1.5rem 7rem" }}>
                    <CtaSection onPatient={() => handleLoginSelect("Patient")} onDoctor={() => handleLoginSelect("Doctor")} />
                </section>

            </div>
        </>
    );
}

/* ── Sub-components ── */

function FeatureCard({ feature: f, index }: { feature: any; index: number }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    const isRight = f.side === "right";
    return (
        <div ref={ref} className={`feat-card${visible ? " visible" : ""}${isRight ? " reverse" : ""}`}
            style={{ flexDirection: isRight ? "row-reverse" : "row", transitionDelay: `${index * 0.08}s` }}>
            <div className="feat-icon-wrap" style={{ background: f.accentSoft, color: f.accent, animationDelay: `${index * 0.3}s` }}>
                {f.icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "2rem", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: f.accentSoft, color: f.accent, marginBottom: "0.6rem" }}>
                    {f.tag}
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "0.6rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: "1rem" }}>{f.desc}</p>
                <div>{f.bullets.map((b: string, i: number) => (
                    <div key={i} className="bullet-item">
                        <div className="bullet-dot" style={{ background: f.accent }} />
                        {b}
                    </div>
                ))}</div>
            </div>
        </div>
    );
}

function StatCard({ stat, delay }: { stat: any; delay: number }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} className={`stat-card${visible ? " visible" : ""}`} style={{ transitionDelay: `${delay}s` }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(90deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{stat.value}</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem", fontWeight: 500 }}>{stat.label}</div>
        </div>
    );
}

function HowItWorksCard({ s, delay }: { s: any; delay: number }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        /* Attached explicit class hook 'process-grid-card' to handle mapped items */
        <div ref={ref} className="process-grid-card" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: s.color, opacity: 0.3, letterSpacing: "-0.04em", marginBottom: "0.75rem" }}>{s.step}</div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{s.title}</h4>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{s.desc}</p>
        </div>
    );
}

function CtaSection({ onPatient, onDoctor }: { onPatient: () => void; onDoctor: () => void }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} className={`cta-section${visible ? " visible" : ""}`} style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center", padding: "3.5rem 2rem", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "2rem" }}>
            <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <svg style={{ width: "1.5rem", height: "1.5rem" }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h3l2-7 4 14 2-7h7" />
                </svg>
            </div>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
                Ready to transform<br />your healthcare experience?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", marginBottom: "2rem", lineHeight: 1.7 }}>
                Join thousands of patients and clinicians already using MedBrief to communicate better and understand more.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={onPatient} className="shimmer-btn btn-p" style={{ padding: "0.9rem 2rem", fontSize: "0.875rem", fontWeight: 600, color: "#fff", backgroundColor: "#7c3aed", border: "1px solid rgba(124,58,237,0.4)", borderRadius: "0.75rem", cursor: "pointer" }}>
                    Start as Patient
                </button>
                <button onClick={onDoctor} className="shimmer-btn btn-o" style={{ padding: "0.9rem 2rem", fontSize: "0.875rem", fontWeight: 600, color: "#e5e7eb", backgroundColor: "transparent", border: "1px solid rgba(124,58,237,0.4)", borderRadius: "0.75rem", cursor: "pointer" }}>
                    Join as Clinician
                </button>
            </div>
        </div>
    );
}