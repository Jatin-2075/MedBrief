import { useContext, useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../Config/Api";
import { AuthContext } from "../Context/AuthContext";
import type { HealthData, User } from "../Config/Types";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import "../Css/Pages/Dashboard.css";

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
                <p style={{ fontSize: "0.9rem", color: "#e5e7eb", marginBottom: "1rem" }}>
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
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
            }}>
                <div>
                    <p style={{ color: "#f87171", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                        AI analysis failed
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                        The report was saved but Gemini could not process it.
                    </p>
                    {retryError && (
                        <p style={{ color: "#fca5a5", fontSize: "0.78rem", margin: "0.25rem 0 0" }}>
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
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#fca5a5",
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
            border: "1px solid rgba(251, 191, 36, 0.3)",
            background: "rgba(251, 191, 36, 0.08)",
        }}>
            <p style={{ color: "#fbbf24", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                Analysis pending
            </p>
            <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
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
                {message && <p className="dashboard-message">{message}</p>}
            </section>

            <section className="dashboard-card">
                <h2 className="dashboard-section-title">Analytical Vitals & Trends</h2>
                <div className="dashboard-form-group">
                    <label className="dashboard-label">Select Visual Metric Axis</label>
                    <select
                        className="dashboard-input"
                        value={metric}
                        onChange={(e) => setMetric(e.target.value)}
                    >
                        <option value="hba1c">Blood Sugar (HbA1c)</option>
                        <option value="fasting_glucose">Fasting Blood Sugar</option>
                        <option value="blood_pressure">Blood Pressure</option>
                        <option value="resting_heart_rate">Heart Rate</option>
                        <option value="spo2">Blood Oxygen (SpO₂)</option>
                        <option value="ldl_cholesterol">Bad Cholesterol (LDL)</option>
                        <option value="hdl_cholesterol">Good Cholesterol (HDL)</option>
                        <option value="triglycerides">Blood Fat (Triglycerides)</option>
                    </select>
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
                                stroke="#a78bfa"
                                strokeWidth={3}
                                activeDot={{ r: 6 }}
                                dot={{ strokeWidth: 1, r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className="dashboard-card">
                <h2 className="dashboard-section-title">Chronological Medical Records</h2>
                {loadingReports ? (
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                        Fetching clinical database blocks…
                    </p>
                ) : reports.length === 0 ? (
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
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
                                            background: "rgba(239,68,68,0.15)",
                                            color: "#f87171",
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
                                            background: "rgba(251,191,36,0.15)",
                                            color: "#fbbf24",
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
                                >
                                    Review Framework
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {selectedReport && (
                <section className="dashboard-card">
                    <h2 className="dashboard-section-title">Deep Metric Struct Analysis</h2>
                    {loadingDetails ? (
                        <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                            Compiling clinical insight vectors…
                        </p>
                    ) : (
                        <div className="report-detail">
                            <div className="report-row">
                                <span>Report Reference Node:</span>
                                <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
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