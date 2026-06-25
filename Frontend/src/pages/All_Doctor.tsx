import { useContext, useEffect, useState } from "react";
import { API } from "../Config/Api";
import type { Doctor } from "../Config/Types";
import { AuthContext } from "../Context/AuthContext";
import "../Css/Pages/Doctors.css";


export default function AllDoctorsList() {
    const authContext = useContext(AuthContext);
    
    if (!authContext) return null;

    const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        const fetchGlobalDirectory = async () => {
            setLoading(true);
            setErrorMessage(null);
            try {
                const data = await API<Doctor[]>("GET", "/personal/doctors");
                setDoctorsList(data || []);
            } catch (error) {
                setErrorMessage("Failed to pull the central clinical registry matrix.");
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalDirectory();
    }, []);

    const filteredDoctors = doctorsList.filter((doc) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (doc.name?.toLowerCase() || "").includes(searchLower) ||
            (doc.specialization?.toLowerCase() || "").includes(searchLower)
        );
    });

    return (
        <div className="doctors-page-container">
            <header className="doctors-page-header">
                <div>
                    <h1 className="doctors-page-title">Medical Practitioner Directory</h1>
                    <p className="doctors-page-subtitle">
                        Browse system-wide registered clinical personnel and professional profiles.
                    </p>
                </div>
            </header>

            <div style={{ marginBottom: "2rem" }}>
                <input
                    type="text"
                    className="doctors-text-input"
                    placeholder="Search specialists by practitioner name or department specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: "100%", maxWidth: "500px", padding: "0.85rem 1rem" }}
                />
            </div>

            {loading ? (
                <div className="doctors-state-alert">
                    <div className="doctors-loader-spin" />
                    <p>Syncing professional roster database files...</p>
                </div>
            ) : errorMessage ? (
                <div className="doctors-state-alert error">
                    <p>{errorMessage}</p>
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="doctors-glass-card doctors-empty-view">
                    <p>No medical practitioner entities matched your query criteria.</p>
                </div>
            ) : (
                <div 
                    className="patients-grid-deck" 
                    style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
                        gap: "1.5rem" 
                    }}
                >
                    {filteredDoctors.map((doc) => (
                        <div key={doc.id} className="patient-profile-card" style={{ display: "flex", flexDirection: "column", justifyContent: "between" }}>
                            <div>
                                <div className="patient-card-header">
                                    <div className="patient-avatar-placeholder" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "#ffffff" }}>
                                        Dr
                                    </div>
                                    <div className="patient-meta-header">
                                        <h3 className="patient-name-label">{doc.name ?? "Specialist Practitioner"}</h3>
                                        <span className="patient-id-badge" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                                            {doc.specialization || "General Medicine"}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ padding: "0 1.25rem 1.25rem 1.25rem", fontSize: "0.88rem", opacity: 0.9, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    <div>
                                        <span style={{ color: "var(--text-muted, #94a3b8)", marginRight: "0.5rem" }}>Secure Email:</span>
                                        <strong>{doc.email ?? "None Provided"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted, #94a3b8)", marginRight: "0.5rem" }}>Telecom Line:</span>
                                        <strong>{doc.phone ?? "None Configured"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted, #94a3b8)", marginRight: "0.5rem" }}>Board License:</span>
                                        <span style={{ fontFamily: "monospace", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                                            {doc.license_number ?? "Pending Check"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "0.75rem", fontFamily: "monospace", opacity: 0.5 }}>
                                Provider UUID: {doc.id}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}