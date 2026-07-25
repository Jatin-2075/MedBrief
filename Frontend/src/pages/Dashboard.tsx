import { useContext, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../Config/Api";
import { AuthContext } from "../Context/AuthContext";
import type { HealthData, User } from "../Config/Types";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import "../Css/Pages/Dashboard.css";

const METRIC_OPTIONS = [
    { value: "hba1c", label: "Blood Sugar (HbA1c)" },
    { value: "fasting_glucose", label: "Fasting Blood Sugar" },
    { value: "blood_pressure", label: "Blood Pressure" },
    { value: "resting_heart_rate", label: "Heart Rate" },
    { value: "spo2", label: "Blood Oxygen (SpO₂)" },
    { value: "ldl_cholesterol", label: "Bad Cholesterol (LDL)" },
    { value: "hdl_cholesterol", label: "Good Cholesterol (HDL)" },
    { value: "triglycerides", label: "Blood Fat (Triglycerides)" },
];

// Native <select> dropdown popups are rendered by the OS, not the page, so
// CSS (background-color/color on <option>) can't reliably restyle them —
// that's why the metric picker's open list was showing up plain white
// regardless of theme. This is a small custom listbox instead, fully
// themeable since it's just regular divs.
function ThemedSelect({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const current = options.find((o) => o.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="themed-select" ref={rootRef}>
            <button
                type="button"
                className="themed-select-trigger"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span>{current?.label ?? "Select…"}</span>
                <svg
                    className={`themed-select-chevron${open ? " open" : ""}`}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open && (
                <ul className="themed-select-menu" role="listbox">
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            role="option"
                            aria-selected={opt.value === value}
                            className={`themed-select-option${opt.value === value ? " selected" : ""}`}
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function AnalysisBlock({
    report,
    onRetrySuccess,
}: {
    report: HealthData;
    onRetrySuccess: (updated: HealthData) => void;
}) {
    const [retrying, setRetrying] = useState(false);
    const [retryError, setRetryError] = useState<string | null>(null);

    const handleRetry = async () => {
        setRetrying(true);
        setRetryError(null);
        try {
            const updated = await API<HealthData>("POST", `/reports/${report.id}/retry-analysis`);
            onRetrySuccess(updated);
        } catch (e: any) {
            setRetryError(e.message || "Retry failed. Try again later.");
        } finally {
            setRetrying(false);
        }
    };

    if (report.analysis_status === "completed" && report.analysis) {
        return (
            <div className="report-analysis">
                <p><strong>Clinical LLM Summary Insight:</strong></p>
                <p style={{ fontSize: "0.9rem", color: "var(--text)", marginBottom: "1rem" }}>
                    {report.analysis.ai_summary ?? "No active metadata synthesis response found."}
                </p>
                <p><strong>Cardiovascular Index Score:</strong> {report.analysis.cardiac_risk_score ?? "N/A"}</p>
                <p><strong>Metabolic Panel Profile:</strong> {report.analysis.metabolic_status ?? "N/A"}</p>
                <p><strong>Renal Metric Filtration Status:</strong> {report.analysis.kidney_status ?? "N/A"}</p>
            </div>
        );
    }

    // Analysis failed
    if (report.analysis_status === "failed") {
        return (
            <div style={{
                marginTop: "1rem",
                padding: "1rem 1.25rem",
                borderRadius: "10px",
                border: "1px solid rgba(251, 113, 133, 0.3)",
                background: "rgba(251, 113, 133, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
            }}>
                <div>
                    <p style={{ color: "var(--critical)", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                        AI analysis failed
                    </p>
                    <p style={{ color: "var(--text-dim)", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                        The report was saved but Gemini could not process it.
                    </p>
                    {retryError && (
                        <p style={{ color: "var(--critical)", fontSize: "0.78rem", margin: "0.25rem 0 0", opacity: 0.85 }}>
                            {retryError}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleRetry}
                    disabled={retrying}
                    style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(251, 113, 133, 0.4)",
                        background: "rgba(251, 113, 133, 0.15)",
                        color: "var(--critical)",
                        fontSize: "0.82rem",
                        cursor: retrying ? "not-allowed" : "pointer",
                        opacity: retrying ? 0.6 : 1,
                        whiteSpace: "nowrap",
                    }}
                >
                    {retrying ? "Retrying…" : "Retry analysis"}
                </button>
            </div>
        );
    }

    return (
        <div style={{
            marginTop: "1rem",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid rgba(242, 184, 75, 0.3)",
            background: "rgba(242, 184, 75, 0.08)",
        }}>
            <p style={{ color: "var(--amber)", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                Analysis pending
            </p>
            <p style={{ color: "var(--text-dim)", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                AI analysis is queued and will appear shortly. Refresh to check.
            </p>
        </div>
    );
}

export default function Dashboard() {
    const authContext = useContext(AuthContext);
    if (!authContext) throw new Error("AuthContext.Provider is required.");

    const { user, setUser, setrole, role } = authContext;
    const navigate = useNavigate();

    const [reports, setReports] = useState<HealthData[]>([]);
    const [selectedReport, setSelectedReport] = useState<HealthData | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [patientId, setPatientId] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingReports, setLoadingReports] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [metric, setMetric] = useState("hba1c");
    const detailSectionRef = useRef<HTMLElement | null>(null);

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
        setrole(null);
        navigate("/login");
    };

    const fetchCurrentUser = async () => {
        try {
            const data = await API<User>("GET", "/auth/me");
            setUser(data);
            setrole(data.role);
        } catch {
            handleLogout();
        }
    };

    const loadReports = async () => {
        setLoadingReports(true);
        try {
            const data = await API<HealthData[]>("GET", "/reports/mydataall");
            setReports(data);
        } catch {
            setMessage("Could not load your reports.");
        } finally {
            setLoadingReports(false);
        }
    };

    const loadReportDetails = async (reportId: string) => {
        setMessage(null);
        setLoadingDetails(true);
        try {
            const data = await API<HealthData>("GET", `/reports/${reportId}`);
            setSelectedReport(data);
        } catch {
            setMessage("Unable to load report details.");
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (!selectedReport || !detailSectionRef.current) return;

        const frame = window.requestAnimationFrame(() => {
            detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [selectedReport]);

    const handleRetrySuccess = (updated: HealthData) => {
        setSelectedReport(updated);
        setReports((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
        );
    };

    useEffect(() => {
        const access = localStorage.getItem("access");
        if (!access) {
            navigate("/login");
            return;
        }
        if (!user) {
            fetchCurrentUser();
        }
    }, [navigate, user]);

    useEffect(() => {
        if (user) loadReports();
    }, [user]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] ?? null;
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        setMessage(null);
        if (!file) {
            setMessage("Please select a PDF file first.");
            return;
        }

        const params = new URLSearchParams();
        if (role === "doctor" && patientId.trim()) {
            params.append("patient_id", patientId.trim());
        }

        const form = new FormData();
        form.append("file", file);

        const url = `/reports/upload${params.toString() ? `?${params.toString()}` : ""}`;

        setLoading(true);
        try {
            const newReport = await API<HealthData>("POST", url, form);
            setReports((prev) => [newReport, ...prev]);

            if (newReport.analysis_status === "failed") {
                setMessage("Report uploaded, but AI analysis failed. You can retry from the report detail view.");
            } else {
                setMessage("Report uploaded successfully.");
            }

            setFile(null);
            setPatientId("");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Upload failed.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (value: string | undefined) => {
        if (!value) return "Unknown";
        return new Date(value).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const chartData = reports
        .filter((report) => report[metric as keyof HealthData] != null)
        .map((report) => ({
            date: new Date(report.created_at ?? "").toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            }),
            [metric]: Number(report[metric as keyof HealthData]),
        }))
        .reverse();

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Clinical Dashboard</h1>
                    <p className="dashboard-welcome">
                        Welcome back, {user?.username ?? "Guest"} {role ? `(${role})` : ""}
                    </p>
                </div>
            </header>

            <section className="dashboard-card">
                <h2 className="dashboard-section-title">Upload Health Report</h2>
                <div className="dashboard-form-group">
                    <label className="dashboard-label">Select Medical Report PDF</label>
                    <input
                        className="dashboard-input"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                    />
                </div>
                {role === "doctor" && (
                    <div className="dashboard-form-group">
                        <label className="dashboard-label">Patient ID (Optional Assignment)</label>
                        <input
                            className="dashboard-input"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            placeholder="Assign to patient UUID token..."
                        />
                    </div>
                )}
                <button
                    className="dashboard-button"
                    type="button"
                    onClick={handleUpload}
                    disabled={loading}
                >
                    {loading ? "Parsing Secure Records…" : "Upload & Analyze"}
                </button>
                {message && <p className={`dashboard-message${message.toLowerCase().includes("failed") || message.toLowerCase().includes("could not") ? " error" : ""}`}>{message}</p>}
            </section>

            <section className="dashboard-card">
                <h2 className="dashboard-section-title">Analytical Vitals & Trends</h2>
                <div className="dashboard-form-group">
                    <label className="dashboard-label">Select Visual Metric Axis</label>
                    <ThemedSelect value={metric} onChange={setMetric} options={METRIC_OPTIONS} />
                </div>
                <div style={{ width: "100%", height: 280, marginTop: "0.5rem" }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} />
                            <YAxis tickLine={false} domain={["auto", "auto"]} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey={metric}
                                stroke="var(--vital, #2dd4bf)"
                                strokeWidth={3}
                                activeDot={{ r: 6, fill: "var(--vital, #2dd4bf)", stroke: "#04120f", strokeWidth: 2 }}
                                dot={{ strokeWidth: 1, r: 3, fill: "var(--vital, #2dd4bf)", stroke: "var(--vital, #2dd4bf)" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className="dashboard-card">
                <h2 className="dashboard-section-title">Chronological Medical Records</h2>
                {loadingReports ? (
                    <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
                        Fetching clinical database blocks…
                    </p>
                ) : reports.length === 0 ? (
                    <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
                        No reports cataloged for this identity profile map.
                    </p>
                ) : (
                    <div className="dashboard-report-list">
                        {reports.map((report) => (
                            <div key={report.id} className="dashboard-report-item">
                                <div className="report-header">
                                    <strong>ID:</strong> {report.id}
                                    {report.analysis_status === "failed" && (
                                        <span style={{
                                            marginLeft: "0.75rem",
                                            fontSize: "0.72rem",
                                            padding: "0.15rem 0.5rem",
                                            borderRadius: "999px",
                                            background: "rgba(251, 113, 133, 0.15)",
                                            color: "var(--critical)",
                                        }}>
                                            Analysis failed
                                        </span>
                                    )}
                                    {report.analysis_status === "pending" && (
                                        <span style={{
                                            marginLeft: "0.75rem",
                                            fontSize: "0.72rem",
                                            padding: "0.15rem 0.5rem",
                                            borderRadius: "999px",
                                            background: "rgba(242, 184, 75, 0.15)",
                                            color: "var(--amber)",
                                        }}>
                                            Pending
                                        </span>
                                    )}
                                </div>
                                <div className="report-row">
                                    <span>Date Logged:</span>
                                    <span>{formatDate(report.created_at)}</span>
                                </div>
                                <div className="report-row">
                                    <span>Blood Pressure:</span>
                                    <span>{report.blood_pressure ?? "N/A"}</span>
                                </div>
                                <button
                                    type="button"
                                    className="report-detail-button"
                                    onClick={() => report.id && loadReportDetails(report.id)}
                                    disabled={loadingDetails}
                                >
                                    {loadingDetails ? "Loading report…" : "Review Report"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {selectedReport && (
                <section className="dashboard-card" ref={detailSectionRef}>
                    <h2 className="dashboard-section-title">Deep Metric Struct Analysis</h2>
                    {loadingDetails ? (
                        <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
                            Compiling clinical insight vectors…
                        </p>
                    ) : (
                        <div className="report-detail">
                            <div className="report-row">
                                <span>Report Reference Node:</span>
                                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.85rem" }}>
                                    {selectedReport.id}
                                </span>
                            </div>
                            <div className="report-row">
                                <span>Timeline Coordinate:</span>
                                <span>{formatDate(selectedReport.created_at)}</span>
                            </div>
                            <div className="report-row">
                                <span>Bad Cholesterol (LDL):</span>
                                <span>{selectedReport.ldl_cholesterol ?? "N/A"} mg/dL</span>
                            </div>
                            <div className="report-row">
                                <span>Good Cholesterol (HDL):</span>
                                <span>{selectedReport.hdl_cholesterol ?? "N/A"} mg/dL</span>
                            </div>
                            <div className="report-row">
                                <span>Serum Triglycerides:</span>
                                <span>{selectedReport.triglycerides ?? "N/A"} mg/dL</span>
                            </div>
                            <div className="report-row">
                                <span>Glycated Hemoglobin (HbA1c):</span>
                                <span>{selectedReport.hba1c ?? "N/A"} %</span>
                            </div>

                            <AnalysisBlock
                                report={selectedReport}
                                onRetrySuccess={handleRetrySuccess}
                            />
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}