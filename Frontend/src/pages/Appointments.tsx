import { useContext, useEffect, useState } from "react";
import { API } from "../Config/Api";
import { AuthContext } from "../Context/AuthContext";
import type { Appointment, Doctor, Profile } from "../Config/Types";
import "../Css/Pages/Appointment.css";

const blank = {
    doctor_id: "",
    profile_id: "",
    start_time: "",
    end_time: "",
    typeof: "online" as "online" | "offline",
};

export default function Appointments() {
    const authContext = useContext(AuthContext);
    if (!authContext) throw new Error("AuthContext.Provider is required.");
    const { user } = authContext;

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [record, setRecord] = useState<Doctor | Profile | null>(null);
    const [form, setForm] = useState(blank);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [meetingLinks, setMeetingLinks] = useState<Record<string, string>>({});
    const [actionError, setActionError] = useState<Record<string, string>>({});

    const flash = (text: string, type: "success" | "error") => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    useEffect(() => {
        API<Doctor[]>("GET", "/personal/doctors")
            .then(setDoctors)
            .catch(() => flash("Unable to load doctors.", "error"));
    }, []);

    useEffect(() => {
        if (!user) return;
        const endpoint =
            user.role === "doctor"
                ? `/personal/doctors/user/${user.id}`
                : `/personal/profiles/user/${user.id}`;

        API<Doctor | Profile>("GET", endpoint)
            .then((data) => {
                setRecord(data);
                if (user.role === "doctor") {
                    setForm((p) => ({ ...p, doctor_id: data.id ?? p.doctor_id }));
                } else {
                    setForm((p) => ({ ...p, profile_id: data.id ?? p.profile_id }));
                }
            })
            .catch(() => flash("Unable to load profile.", "error"));
    }, [user]);

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const query =
                user?.role === "doctor"
                    ? `?doctor_id=${record?.id ?? ""}`
                    : record?.id
                    ? `?profile_id=${record.id}`
                    : "";
            const data = await API<Appointment[]>("GET", `/system/appointments${query}`);
            setAppointments(data);
        } catch {
            flash("Unable to load appointments.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && record?.id) loadAppointments();
    }, [user, record]);

    const handleCreate = async () => {
        if (!form.doctor_id || !form.profile_id || !form.start_time || !form.end_time) {
            flash("Doctor, start time, and end time are required.", "error");
            return;
        }
        setSubmitting(true);
        try {
            const data = await API<Appointment>("POST", "/system/appointments", {
                doctor_id: form.doctor_id,
                profile_id: form.profile_id,
                start_time: new Date(form.start_time).toISOString(),
                end_time: new Date(form.end_time).toISOString(),
                typeof: form.typeof,
            });
            setAppointments((prev) => [data, ...prev]);
            setForm((p) => ({ ...p, start_time: "", end_time: "", doctor_id: "" }));
            flash("Appointment request sent. You'll be notified once confirmed.", "success");
        } catch {
            flash("Could not create appointment.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (
        appointmentId: string,
        appt: Appointment,
        status: "approved" | "rejected"
    ) => {
        setActionError((p) => ({ ...p, [appointmentId]: "" }));

        if (status === "approved" && appt.typeof === "online" && !meetingLinks[appointmentId]?.trim()) {
            setActionError((p) => ({
                ...p,
                [appointmentId]: "A meeting link is required for online appointments.",
            }));
            return;
        }

        try {
            const updated = await API<Appointment>(
                "PATCH",
                `/system/appointments/${appointmentId}`,
                {
                    status,
                    meeting_link: meetingLinks[appointmentId] || null,
                }
            );
            setAppointments((prev) =>
                prev.map((a) => (a.id === appointmentId ? updated : a))
            );
        } catch {
            flash("Failed to update appointment.", "error");
        }
    };

    const fmtDate = (dt?: string) =>
        dt
            ? new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
            : "—";

    const statusClass: Record<string, string> = {
        pending: "badge-pending",
        approved: "badge-approved",
        rejected: "badge-rejected",
        completed: "badge-completed",
        cancelled: "badge-cancelled",
    };

    const isDoctor = user?.role === "doctor";

    return (
        <div className="appointments-wrapper-root">
            <div className="page-content">
                <h1 className="page-title">Appointments</h1>

                {!isDoctor && (
                    <div className="appointments-card">
                        <h2 className="section-title">Request an appointment</h2>
                        <div className="form-grid">
                            <label className="form-label">
                                Doctor
                                <select
                                    className="form-input"
                                    value={form.doctor_id}
                                    onChange={(e) => setForm((p) => ({ ...p, doctor_id: e.target.value }))}
                                >
                                    <option value="">Select doctor</option>
                                    {doctors.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.name ?? "Doctor"}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="form-label">
                                Appointment type
                                <select
                                    className="form-input"
                                    value={form.typeof}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            typeof: e.target.value as "online" | "offline",
                                        }))
                                    }
                                >
                                    <option value="online">Online (video call)</option>
                                    <option value="offline">Hospital visit</option>
                                </select>
                            </label>

                            <label className="form-label">
                                Start time
                                <input
                                    className="form-input"
                                    type="datetime-local"
                                    value={form.start_time}
                                    onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                                />
                            </label>

                            <label className="form-label">
                                End time
                                <input
                                    className="form-input"
                                    type="datetime-local"
                                    value={form.end_time}
                                    onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                                />
                            </label>
                        </div>

                        <button className="page-button" onClick={handleCreate} disabled={submitting}>
                            {submitting ? "Sending…" : "Request appointment"}
                        </button>

                        {message && (
                            <p className={`page-message${message.type === "error" ? " page-message--error" : ""}`}>
                                {message.text}
                            </p>
                        )}
                    </div>
                )}

                <section className="appointments-list">
                    <h2 className="section-title">
                        {isDoctor ? "Appointment requests" : "Your appointments"}
                    </h2>

                    {loading ? (
                        <p className="page-message">Loading…</p>
                    ) : appointments.length === 0 ? (
                        <p className="page-message">No appointments found.</p>
                    ) : (
                        <div className="table-card">
                            {appointments.map((app) => (
                                <div key={app.id} className="table-row">
                                    <div className="appt-header">
                                        <span className={`appt-badge ${statusClass[app.status ?? "pending"]}`}>
                                            {app.status}
                                        </span>
                                        <span className="appt-type">{app.typeof}</span>
                                    </div>

                                    <p className="appt-time">
                                        {fmtDate(app.start_time)} → {fmtDate(app.end_time)}
                                    </p>

                                    {app.meeting_link && app.status === "approved" && (
                                        <a
                                            className="appt-link"
                                            href={app.meeting_link}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Join meeting ↗
                                        </a>
                                    )}

                                    {isDoctor && app.status === "pending" && (
                                        <div className="appt-actions">
                                            {app.typeof === "online" && (
                                                <label className="form-label form-label--inline">
                                                    Meeting link
                                                    <input
                                                        className="form-input"
                                                        type="url"
                                                        placeholder="https://meet.google.com/..."
                                                        value={meetingLinks[app.id ?? ""] ?? ""}
                                                        onChange={(e) =>
                                                            setMeetingLinks((p) => ({
                                                                ...p,
                                                                [app.id!]: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </label>
                                            )}

                                            <div className="appt-actions-btns">
                                                <button
                                                    className="page-button page-button--approve"
                                                    onClick={() =>
                                                        app.id && handleStatusUpdate(app.id, app, "approved")
                                                    }
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="page-button page-button--reject"
                                                    onClick={() =>
                                                        app.id && handleStatusUpdate(app.id, app, "rejected")
                                                    }
                                                >
                                                    Reject
                                                </button>
                                            </div>

                                            {actionError[app.id ?? ""] && (
                                                <p className="page-message page-message--error">
                                                    {actionError[app.id ?? ""]}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {isDoctor && message && (
                    <p className={`page-message${message.type === "error" ? " page-message--error" : ""}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
}