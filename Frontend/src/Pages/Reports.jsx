import React, { useState, useEffect } from "react";
import "../Style/Reports.css";
import Navbar from "../Components/Navbar";
import { toast } from "react-toastify";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("reports")) || [];
    setReports(stored);
    setSelected(stored[0] || null);
  }, []);

  const handleDownload = () => {
    if (!selected?.pdfUrl) return;
    window.open(`http://127.0.0.1:8000${selected.pdfUrl}`, "_blank");
  };

  return (
    <div className="reports_page">
      
      {/* LEFT PANEL */}
      <aside className="reports_sidebar">
        <h2>Your Medical Reports</h2>

        <input
          className="search_input"
          placeholder="Search by report name, doctor..."
        />

        <div className="reports_list">
          {reports.map((r) => (
            <div
              key={r.id}
              className={`report_item ${
                selected?.id === r.id ? "active" : ""
              }`}
              onClick={() => setSelected(r)}
            >
              <div className="report_icon">📄</div>
              <div className="report_meta">
                <p className="report_name">{r.name}</p>
                <p className="report_specialty">{r.specialty}</p>
              </div>
              <span className="report_date">{r.date}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT PANEL */}
      {selected && (
        <main className="report_detail">
          <div className="report_header">
            <div>
              <h3>{selected.type}</h3>
              <p>Date: {selected.date}</p>
            </div>

            <div className="actions">
              <button>Share</button>
              <button>Print</button>
              <button className="primary" onClick={handleDownload}>
                Download
              </button>
            </div>
          </div>

          <div className="report_card">
            {/* 🔮 Prediction */}
            {selected.prediction && (
              <>
                <h4>Predicted Diagnosis</h4>
                <p className="prediction_badge">
                  {selected.prediction}
                </p>
              </>
            )}

            {/* 🧾 Summary */}
            <h4>Summary</h4>
            <p>{selected.summary}</p>

            {/* ❤️ Key Vitals */}
            {selected.vitals && (
              <>
                <h4>Key Vitals</h4>
                <ul>
                  {selected.vitals.bp && (
                    <li>Blood Pressure: {selected.vitals.bp}</li>
                  )}
                  {selected.vitals.heartRate && (
                    <li>Heart Rate: {selected.vitals.heartRate}</li>
                  )}
                  {selected.vitals.spo2 && (
                    <li>SpO₂: {selected.vitals.spo2}</li>
                  )}
                  {selected.vitals.glucose && (
                    <li>Blood Glucose: {selected.vitals.glucose}</li>
                  )}
                  {selected.vitals.bmi && (
                    <li>BMI: {selected.vitals.bmi}</li>
                  )}
                </ul>
              </>
            )}

            <p className="end_note">-- End of Summary --</p>
          </div>

          <p className="file_info">
            Report Type: {selected.type} <br />
            File Size: {selected.size}
          </p>
        </main>
      )}
    </div>
  );
}
