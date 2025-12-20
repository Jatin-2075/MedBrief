import { useEffect, useState } from "react";
import "../Style/reports.css";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/reports/history/")
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load reports");
        setLoading(false);
      });
  }, []);

  return (
    <div className="page">
      <div className="history-container">
        <h1>Reports History</h1>
        <p className="subtitle">
          View and download your previously analyzed medical reports.
        </p>

        {loading && <p>Loading reports...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && reports.length === 0 && (
          <div className="empty-state">
            No reports uploaded yet.
          </div>
        )}

        <div className="reports-list">
          {reports.map((report) => (
            <div className="report-card" key={report.id}>
              <div className="report-info">
                <h3>{report.filename}</h3>
                <span className="date">{report.uploaded_at}</span>
                <p className="summary">
                  {report.final_conclusion || "No summary available"}
                </p>
              </div>

              <div className="report-actions">
                <span
                  className={`status ${report.status === "Normal"
                      ? "normal"
                      : "attention"
                    }`}
                >
                  {report.status}
                </span>

                <a
                  href={`http://127.0.0.1:8000/api/reports/download/${report.id}/`}
                  className="btn primary"
                >
                  Download
                </a>

                <button
                  className="btn secondary"
                  onClick={() => {
                    const url = `http://127.0.0.1:8000/api/reports/download/${report.id}/`;

                    if (navigator.share) {
                      navigator.share({
                        title: "Medical Report Summary",
                        text: "Here is my medical report summary.",
                        url: url,
                      });
                    } else {
                      navigator.clipboard.writeText(url);
                      alert("Download link copied to clipboard");
                    }
                  }}
                >
                  Share
                </button>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;