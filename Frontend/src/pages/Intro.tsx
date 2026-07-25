import { useEffect, useRef, useState, useCallback } from "react";

interface FeatureItem {
    icon: React.ReactNode;
    tag: string;
    title: string;
    desc: string;
    bullets: string[];
    accent: string;
    accentSoft: string;
    side: "left" | "right";
}

interface StatItem {
    value: string;
    label: string;
}

interface StepItem {
    step: string;
    title: string;
    desc: string;
    color: string;
}

/* ---------- theme tokens ---------- */
const COLOR_BG = "#070a0f";
const COLOR_TEXT = "#e6edf3";
const COLOR_MUTED = "#7c8a9a";
const COLOR_VITAL = "#2dd4bf"; // steady / normal telemetry
const COLOR_VITAL_SOFT = "rgba(45, 212, 191, 0.10)";
const COLOR_CRITICAL = "#fb7185"; // alert / escalation
const COLOR_CRITICAL_SOFT = "rgba(251, 113, 133, 0.12)";
const COLOR_INFO = "#38bdf8";
const COLOR_INFO_SOFT = "rgba(56, 189, 248, 0.10)";
const COLOR_AMBER = "#f2b84b";
const COLOR_AMBER_SOFT = "rgba(242, 184, 75, 0.10)";

/* ---------- small scroll utilities ---------- */

function useScrollProgress() {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const doc = document.documentElement;
                const max = doc.scrollHeight - doc.clientHeight;
                setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
            });
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);
    return progress;
}

/** Parallax offset for an element based on its position relative to viewport center. */
function useParallax(strength = 20) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [offset, setOffset] = useState(0);
    useEffect(() => {
        let raf = 0;
        const update = () => {
            const el = ref.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                const viewportCenter = window.innerHeight / 2;
                const elCenter = rect.top + rect.height / 2;
                const delta = (viewportCenter - elCenter) / window.innerHeight;
                setOffset(delta * strength);
            }
            raf = requestAnimationFrame(update);
        };
        raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    }, [strength]);
    return { ref, offset };
}

/** Counts a numeric prefix up from 0 once `trigger` becomes true, keeping any suffix (%, +, s, bpm...). */
function useCountUp(rawValue: string, trigger: boolean, duration = 900) {
    const [display, setDisplay] = useState<string>(rawValue.replace(/[0-9.]+/, "0"));
    const started = useRef(false);
    useEffect(() => {
        if (!trigger || started.current) return;
        started.current = true;
        const match = rawValue.match(/([<>]?)(\d+(?:\.\d+)?)(.*)/);
        if (!match) {
            setDisplay(rawValue);
            return;
        }
        const [, prefix, numStr, suffix] = match;
        const target = parseFloat(numStr);
        const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
        const start = performance.now();
        let raf = 0;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const val = target * eased;
            setDisplay(`${prefix}${val.toFixed(decimals)}${suffix}`);
            if (t < 1) raf = requestAnimationFrame(tick);
            else setDisplay(rawValue);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [trigger, rawValue, duration]);
    return display;
}

/* ---------- ECG scroll-progress trace (signature element) ---------- */

function EcgProgressBar({ progress }: { progress: number }) {
    // one repeatable heartbeat unit, 300 units wide, baseline y=25
    const unit = "L36,25 L46,15 L54,25 L64,25 L74,-2 L82,52 L90,10 L98,25 L110,25 L300,25";
    const copies = 8;
    let d = "M0,25 ";
    for (let i = 0; i < copies; i++) {
        d += unit.replace(/(-?\d+(?:\.\d+)?),/g, (_m, num) => `${(parseFloat(num) + i * 300).toString()},`);
    }
    const color = progress > 0.85 ? COLOR_CRITICAL : progress > 0.45 ? COLOR_AMBER : COLOR_VITAL;
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "34px",
                zIndex: 200,
                background: "linear-gradient(180deg, rgba(7,10,15,0.9) 0%, rgba(7,10,15,0) 100%)",
                pointerEvents: "none",
            }}
        >
            <svg
                viewBox={`0 -5 ${300 * copies} 60`}
                preserveAspectRatio="none"
                style={{ width: "100%", height: "100%", display: "block" }}
            >
                <path d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
                <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={100}
                    strokeDasharray={100}
                    strokeDashoffset={100 - progress * 100}
                    style={{ transition: "stroke 0.4s ease" }}
                />
            </svg>
        </div>
    );
}

export default function Intro() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isExiting, setIsExiting] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const scrollProgress = useScrollProgress();

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 1.8 + 0.8;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.2 - 0.15;
                this.opacity = Math.random() * 0.25 + 0.1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = height;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = COLOR_VITAL;
                ctx.globalAlpha = this.opacity;
                ctx.fill();
            }
        }

        const particles: Particle[] = Array.from({ length: 45 }, () => new Particle());

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.globalAlpha = 1;
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
    }, []);

    const handleLoginSelect = useCallback((role: "Patient" | "Doctor") => {
        setIsExiting(true);
        setTimeout(() => {
            window.location.href = `/login?role=${role}`;
        }, 550);
    }, []);

    const features: FeatureItem[] = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
            ),
            tag: "Smart Docs",
            title: "PDF Report Simplifier",
            desc: "Upload any lab result or discharge summary. MedBrief parses the biomarkers and turns them into a plain-language read of what your results mean, without the wait for a follow-up call.",
            bullets: ["Lab result interpretation", "Medication dosage explained", "Diagnosis in plain language"],
            accent: COLOR_VITAL,
            accentSoft: COLOR_VITAL_SOFT,
            side: "left",
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            ),
            tag: "Secure Messaging",
            title: "Doctor–Patient Chat",
            desc: "Real-time messaging between patients and their care team over an encrypted channel, with sub-100ms delivery so a question never sits unanswered.",
            bullets: ["End-to-end encrypted", "File & image sharing", "Delivery & read status"],
            accent: COLOR_INFO,
            accentSoft: COLOR_INFO_SOFT,
            side: "right",
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    <path d="M9 10h.01M15 10h.01" />
                </svg>
            ),
            tag: "AI Assistant",
            title: "Clinical AI Copilot",
            desc: "A Gemini-powered assistant that helps patients understand symptoms and know when to seek care, while helping clinicians draft notes and weigh differentials faster.",
            bullets: ["Symptom checker & triage", "Differential diagnosis hints", "Clinical note drafting"],
            accent: COLOR_AMBER,
            accentSoft: COLOR_AMBER_SOFT,
            side: "left",
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
            tag: "Health Records",
            title: "Unified Patient Dashboard",
            desc: "One timeline for every visit, prescription, and test. Patients and doctors both get contextual access to the full history, structured and always current.",
            bullets: ["Full visit history timeline", "Prescription tracking", "Referral & follow-up alerts"],
            accent: "#a78bfa",
            accentSoft: "rgba(167, 139, 250, 0.10)",
            side: "right",
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            ),
            tag: "Critical Alerts",
            title: "Critical Alert Escalation",
            desc: "When a biomarker crosses a critical threshold, MedBrief doesn't wait for a login. It emails the assigned doctor immediately, escalating to a second on-call contact if there's no response in time.",
            bullets: ["Threshold-based email alerts", "On-call escalation on no response", "Full escalation audit trail"],
            accent: COLOR_CRITICAL,
            accentSoft: COLOR_CRITICAL_SOFT,
            side: "left",
        },
    ];

    const stats: StatItem[] = [
        { value: "10+", label: "Early users onboarded" },
        { value: "30%", label: "API latency cut via caching" },
        { value: "<30s", label: "Critical alert dispatch" },
        { value: "<2s", label: "AI response time" },
    ];

    const steps: StepItem[] = [
        { step: "01", title: "Create account", desc: "Sign up as a patient or clinician in under 60 seconds.", color: COLOR_VITAL },
        { step: "02", title: "Connect records", desc: "Upload past reports or link your existing EMR system.", color: COLOR_INFO },
        { step: "03", title: "AI processing", desc: "Instant summaries, risk insights, and threshold monitoring.", color: COLOR_AMBER },
        { step: "04", title: "Stay covered", desc: "Message your care team and get alerted the moment something needs attention.", color: COLOR_CRITICAL },
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

                @keyframes mbLetterIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                .mb-letter { display: inline-block; opacity: 0; animation: mbLetterIn 0.6s cubic-bezier(.16,1,.3,1) forwards; }

                @keyframes mbPing { 0% { transform: scale(0.8); opacity: 0.9; } 80%, 100% { transform: scale(1.6); opacity: 0; } }
                .mb-intro-pr { position: absolute; inset: 0; border-radius: 50%; animation: mbPing 2.4s cubic-bezier(0,0,0.2,1) infinite; }

                @keyframes mbBeat { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.18); } 30% { transform: scale(1); } 45% { transform: scale(1.1); } 60% { transform: scale(1); } }
                .mb-heart { animation: mbBeat 1.8s ease-in-out infinite; }

                @keyframes floatArrow { 0%, 100% { transform: translateY(0); opacity: .6; } 50% { transform: translateY(6px); opacity: 1; } }
                .mb-scroll-hint svg { animation: floatArrow 2s ease-in-out infinite; }

                @keyframes blinkDot { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
                .status-dot { animation: blinkDot 1.6s ease-in-out infinite; }

                .nav-link { background: none; border: none; color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: .72rem; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; cursor: pointer; padding: .35rem .6rem; border-radius: .5rem; transition: color .2s, background .2s; }
                .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }

                .shimmer-btn { position: relative; overflow: hidden; }
                .shimmer-btn::after { content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.25), transparent); transform: skewX(-20deg); transition: left .6s ease; }
                .shimmer-btn:hover::after { left: 120%; }
                .shimmer-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
                .btn-o:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.2) !important; }

                .feat-card { transition: border-color .3s ease, background .3s ease; }
                .feat-card:hover { border-color: rgba(255,255,255,0.08) !important; background: rgba(255,255,255,0.02) !important; }
                .bullet-item { transition: transform .2s ease, color .2s ease; }
                .feat-card:hover .bullet-item { transform: translateX(3px); color: #fff !important; }

                @media (max-width: 720px) {
                    .feat-card { flex-direction: column !important; text-align: center; }
                    .feat-card > div:last-child { text-align: left; }
                }
                @media (max-width: 640px) {
                    .mb-ctas { flex-direction: column !important; }
                    .nav-pill { gap: .6rem !important; padding: .5rem 1rem !important; }
                    .nav-link { font-size: .62rem !important; }
                }
            `}</style>

            <EcgProgressBar progress={scrollProgress} />

            <nav
                className="nav-pill"
                style={{
                    position: "fixed",
                    top: "1.5rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "9999px",
                    background: "rgba(7, 10, 15, 0.8)",
                    border: "1px solid rgba(45, 212, 191, 0.16)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    zIndex: 150,
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    opacity: scrollY > 60 ? 1 : 0,
                    pointerEvents: scrollY > 60 ? "all" : "none",
                    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
            >
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="status-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: COLOR_VITAL, boxShadow: `0 0 6px ${COLOR_VITAL}` }} />
                    <span style={{ color: COLOR_VITAL, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.05em" }}>MEDBRIEF</span>
                </span>
                <div style={{ width: "1px", height: "1rem", background: "rgba(255,255,255,0.15)" }} />
                <button className="nav-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Modules</button>
                <button className="nav-link" onClick={() => document.getElementById("stats")?.scrollIntoView({ behavior: "smooth" })}>Telemetry</button>
                <button className="nav-link" onClick={() => document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" })}>Get Started</button>
            </nav>

            <div
                className="intro-wrapper-root"
                style={{
                    backgroundColor: COLOR_BG,
                    width: "100%",
                    minHeight: "100vh",
                    color: COLOR_TEXT,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    overflowX: "hidden",
                    boxSizing: "border-box",
                    transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    opacity: isExiting ? 0 : 1,
                    transform: isExiting ? "scale(0.96) translateY(-8px)" : "scale(1) translateY(0)",
                }}
            >
                <section style={{ position: "relative", width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "4.5rem 1.5rem 2rem", boxSizing: "border-box" }}>
                    <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />

                    <div style={{ position: "absolute", top: "30%", left: "50%", transform: `translate(-50%, calc(-50% + ${scrollY * 0.08}px))`, width: "40rem", height: "40rem", borderRadius: "50%", background: `radial-gradient(circle, ${COLOR_VITAL_SOFT} 0%, transparent 65%)`, pointerEvents: "none", zIndex: 1 }} />

                    <div />

                    <div style={{ zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${scrollY * 0.12}px)`, opacity: Math.max(0, 1 - scrollY / 500) }}>

                        <div style={{ position: "relative", width: "7.5rem", height: "7.5rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
                            <div className="mb-intro-pr" style={{ border: `1px solid ${COLOR_VITAL}80`, animationDelay: "0s" }} />
                            <div className="mb-intro-pr" style={{ border: `1px solid ${COLOR_VITAL}4d`, animationDelay: "0.6s" }} />
                            <div className="mb-intro-pr" style={{ border: `1px solid ${COLOR_VITAL}33`, animationDelay: "1.2s" }} />
                            <div style={{ width: "3.75rem", height: "3.75rem", borderRadius: "50%", backgroundColor: "#0e2f2a", border: `1px solid ${COLOR_VITAL}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2, boxShadow: `0 0 30px ${COLOR_VITAL_SOFT}` }}>
                                <svg className="mb-heart" style={{ width: "1.75rem", height: "1.75rem" }} viewBox="0 0 24 24" fill="none" stroke={COLOR_VITAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12h3l2-7 4 14 2-7h7" />
                                </svg>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.12em", color: COLOR_VITAL, textTransform: "uppercase" }}>
                            <span className="status-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: COLOR_VITAL }} />
                            System status: online
                        </div>

                        <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(3.2rem, 8vw, 4.8rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 1rem 0", background: `linear-gradient(135deg, #ffffff 30%, ${COLOR_VITAL} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "flex", gap: "1px" }}>
                            {"MedBrief".split("").map((char, i) => (
                                <span key={i} className="mb-letter" style={{ animationDelay: `${0.4 + i * 0.06}s` }}>{char}</span>
                            ))}
                        </h1>

                        <p className="mb-sub" style={{ fontSize: "clamp(1rem, 2.5vw, 1.15rem)", color: COLOR_MUTED, fontWeight: 400, letterSpacing: "0.01em", textAlign: "center", maxWidth: "30rem", margin: "0 auto 3rem", padding: "0 1rem", lineHeight: 1.5 }}>
                            Your intelligent, AI-guided clinical health engine, watching every biomarker so nothing critical slips through.
                        </p>

                        <div className="mb-ctas" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "1.25rem", width: "100%", maxWidth: "32rem", padding: "0 1rem", justifyContent: "center", boxSizing: "border-box" }}>
                            <button onClick={() => handleLoginSelect("Patient")} className="shimmer-btn btn-p" style={{ flex: "1 1 160px", padding: "1rem 1.75rem", fontSize: "0.9rem", fontWeight: 600, color: "#04211d", backgroundColor: COLOR_VITAL, border: `1px solid ${COLOR_VITAL}`, borderRadius: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer", transition: "all 0.2s" }}>
                                Patient Portal
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </button>
                            <button onClick={() => handleLoginSelect("Doctor")} className="shimmer-btn btn-o" style={{ flex: "1 1 160px", padding: "1rem 1.75rem", fontSize: "0.9rem", fontWeight: 600, color: "#e5e7eb", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
                                Clinician Portal
                            </button>
                        </div>

                        <div className="mb-scroll-hint" style={{ marginTop: "4rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
                            <span>Scroll to explore</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                        </div>
                    </div>

                    <div className="mb-foot" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", userSelect: "none", zIndex: 10, marginTop: "2rem", textAlign: "center" }}>
                        <span>SECURE MEDICAL CHANNELS</span><span>•</span><span>HIPAA-ALIGNED ACCESS CONTROL</span><span>•</span><span>CRITICAL ALERT ENGINE ACTIVE</span>
                    </div>
                </section>

                <section id="features" style={{ maxWidth: "900px", margin: "0 auto", padding: "8rem 1.5rem", boxSizing: "border-box" }}>
                    <div style={{ textAlign: "center", marginBottom: "5rem" }}>
                        <div className="section-tag" style={{ display: "inline-block", padding: "0.35rem 0.85rem", borderRadius: "2rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", background: COLOR_VITAL_SOFT, color: COLOR_VITAL, marginBottom: "1rem" }}>Monitored Modules</div>
                        <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 1.25rem 0" }}>
                            Everything your healthcare<br />
                            <span style={{ background: `linear-gradient(90deg, ${COLOR_VITAL}, ${COLOR_INFO})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>journey requires</span>
                        </h2>
                        <p style={{ color: COLOR_MUTED, fontSize: "1rem", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>
                            One platform connecting patients, clinicians, and tailored AI models so context, and critical values, are never lost.
                        </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        {features.map((f, i) => (
                            <FeatureCard key={i} feature={f} index={i} />
                        ))}
                    </div>
                </section>

                <section id="stats" style={{ background: "linear-gradient(180deg, rgba(10,15,18,0.4) 0%, rgba(7,10,15,0.8) 100%)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "6rem 1.5rem", boxSizing: "border-box" }}>
                    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                            <div className="section-tag" style={{ display: "inline-block", padding: "0.35rem 0.85rem", borderRadius: "2rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", background: COLOR_INFO_SOFT, color: COLOR_INFO, marginBottom: "1rem" }}>Live Telemetry</div>
                            <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Engine validation metrics</h2>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
                            {stats.map((s, i) => (
                                <StatCard key={i} stat={s} delay={i * 0.1} />
                            ))}
                        </div>
                    </div>
                </section>

                <section style={{ maxWidth: "900px", margin: "0 auto", padding: "8rem 1.5rem", boxSizing: "border-box" }}>
                    <div style={{ textAlign: "center", marginBottom: "4.5rem" }}>
                        <div className="section-tag" style={{ display: "inline-block", padding: "0.35rem 0.85rem", borderRadius: "2rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", background: COLOR_AMBER_SOFT, color: COLOR_AMBER, marginBottom: "1rem" }}>Onboarding Sequence</div>
                        <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Onboarded in minutes</h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
                        {steps.map((s, i) => (
                            <HowItWorksCard key={i} s={s} delay={i * 0.1} />
                        ))}
                    </div>
                </section>

                <section id="cta" style={{ padding: "4rem 1.5rem 8rem", boxSizing: "border-box", display: "flex", justifyContent: "center" }}>
                    <CtaSection onPatient={() => handleLoginSelect("Patient")} onDoctor={() => handleLoginSelect("Doctor")} />
                </section>
            </div>
        </>
    );
}

function FeatureCard({ feature: f, index }: { feature: FeatureItem; index: number }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    const { ref: parallaxRef, offset } = useParallax(14);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                setVisible(true);
                obs.disconnect();
            }
        }, { threshold: 0.12 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const isRight = f.side === "right";
    const isCritical = f.tag === "Critical Alerts";

    return (
        <div
            ref={(node) => {
                ref.current = node;
                parallaxRef.current = node;
            }}
            className="feat-card"
            style={{
                display: "flex",
                flexDirection: isRight ? "row-reverse" : "row",
                gap: "2.5rem",
                padding: "2.5rem",
                background: "rgba(255, 255, 255, 0.01)",
                border: isCritical ? `1px solid ${COLOR_CRITICAL}33` : "1px solid rgba(255, 255, 255, 0.03)",
                borderRadius: "1.5rem",
                alignItems: "center",
                flexWrap: "wrap",
                boxSizing: "border-box",
                opacity: visible ? 1 : 0,
                transform: visible ? `translateY(${offset}px)` : "translateY(40px)",
                transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                transitionDelay: visible ? "0s" : `${index * 0.05}s`,
            }}
        >
            <div
                className="feat-icon-wrap"
                style={{
                    background: f.accentSoft,
                    color: f.accent,
                    width: "4.5rem",
                    height: "4.5rem",
                    borderRadius: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 8px 30px -10px ${f.accentSoft}`,
                    border: `1px solid rgba(255,255,255,0.02)`,
                    flexShrink: 0,
                }}
            >
                {f.icon}
            </div>

            <div style={{ flex: "1 1 300px" }}>
                <div style={{ display: "inline-block", padding: "0.25rem 0.65rem", borderRadius: "2rem", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", background: f.accentSoft, color: f.accent, marginBottom: "0.75rem" }}>
                    {f.tag}
                </div>
                <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 0.75rem 0", color: "#ffffff" }}>{f.title}</h3>
                <p style={{ fontSize: "0.925rem", color: COLOR_MUTED, lineHeight: 1.65, margin: "0 0 1.25rem 0" }}>{f.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {f.bullets.map((b: string, i: number) => (
                        <div key={i} className="bullet-item" style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.75)" }}>
                            <div className="bullet-dot" style={{ width: "5px", height: "5px", borderRadius: "50%", background: f.accent, boxShadow: `0 0 8px ${f.accent}`, flexShrink: 0 }} />
                            {b}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ stat, delay }: { stat: StatItem; delay: number }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    const animatedValue = useCountUp(stat.value, visible);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                setVisible(true);
                obs.disconnect();
            }
        }, { threshold: 0.1 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{
                padding: "2rem 1.5rem",
                background: "rgba(255,255,255,0.01)",
                border: "1px solid rgba(255,255,255,0.03)",
                borderRadius: "1.25rem",
                textAlign: "center",
                boxSizing: "border-box",
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.92)",
                transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                transitionDelay: `${delay}s`,
            }}
        >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.35rem", fontWeight: 700, letterSpacing: "-0.02em", background: `linear-gradient(135deg, ${COLOR_VITAL} 0%, ${COLOR_INFO} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {animatedValue}
            </div>
            <div style={{ fontSize: "0.8rem", color: COLOR_MUTED, marginTop: "0.5rem", fontWeight: 500, letterSpacing: "0.02em" }}>
                {stat.label}
            </div>
        </div>
    );
}

function HowItWorksCard({ s, delay }: { s: StepItem; delay: number }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                setVisible(true);
                obs.disconnect();
            }
        }, { threshold: 0.1 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{
                padding: "2rem",
                background: "rgba(10, 12, 17, 0.5)",
                border: "1px solid rgba(255,255,255,0.02)",
                borderRadius: "1.25rem",
                boxSizing: "border-box",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(25px)",
                transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)`,
                transitionDelay: `${delay}s`,
            }}
        >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.75rem", fontWeight: 700, color: s.color, opacity: 0.5, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
                {s.step}
            </div>
            <h4 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#ffffff" }}>{s.title}</h4>
            <p style={{ fontSize: "0.875rem", color: COLOR_MUTED, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
        </div>
    );
}

function CtaSection({ onPatient, onDoctor }: { onPatient: () => void; onDoctor: () => void }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                setVisible(true);
                obs.disconnect();
            }
        }, { threshold: 0.1 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                maxWidth: "720px",
                textAlign: "center",
                padding: "4rem 2rem",
                background: `radial-gradient(ellipse at top, ${COLOR_VITAL_SOFT} 0%, rgba(7,10,15,0) 70%)`,
                border: `1px solid ${COLOR_VITAL}26`,
                borderRadius: "2rem",
                boxSizing: "border-box",
                boxShadow: "0 20px 50px -20px rgba(0,0,0,0.7)",
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.96)",
                transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
        >
            <div style={{ width: "3.25rem", height: "3.25rem", borderRadius: "50%", background: "#0e2f2a", border: `1px solid ${COLOR_VITAL}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.75rem", boxShadow: `0 0 25px ${COLOR_VITAL_SOFT}` }}>
                <svg style={{ width: "1.5rem", height: "1.5rem" }} viewBox="0 0 24 24" fill="none" stroke={COLOR_VITAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h3l2-7 4 14 2-7h7" />
                </svg>
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 1rem 0", lineHeight: 1.2 }}>
                Transform your digital<br />healthcare experience
            </h2>
            <p style={{ color: COLOR_MUTED, fontSize: "0.95rem", maxWidth: "480px", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
                Join the patients and clinicians already using MedBrief for simplified reports, secure messaging, and alerts the moment a value turns critical.
            </p>
            <div style={{ display: "flex", gap: "1.25rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={onPatient} className="shimmer-btn btn-p" style={{ padding: "0.95rem 2.25rem", fontSize: "0.9rem", fontWeight: 600, color: "#04211d", backgroundColor: COLOR_VITAL, border: `1px solid ${COLOR_VITAL}`, borderRadius: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}>
                    Start as Patient
                </button>
                <button onClick={onDoctor} className="shimmer-btn btn-o" style={{ padding: "0.95rem 2.25rem", fontSize: "0.9rem", fontWeight: 600, color: "#e5e7eb", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}>
                    Join as Clinician
                </button>
            </div>
        </div>
    );
}