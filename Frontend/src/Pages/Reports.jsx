import { useEffect, useState } from "react";
import "../Style/reports.css";
import { API_BASE_URL } from "../config/api";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    fetch(` ${ API_BASE_URL } /api/reports/history/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load reports");
        setReports([]);
        setLoading(false);
      });
  }, []);


  return (
    <div className="reports-page-wrapper">
      <div className="reports-history-container">
        <h1 className="reports-main-title">Reports History</h1>
        <p className="reports-subtitle-text">
          View and download your previously analyzed medical reports.
        </p>

        {loading && <div className="reports-loading-state">Loading reports...</div>}
        {error && <div className="reports-error-message">{error}</div>}

        {!loading && reports.length === 0 && (
          <div className="reports-empty-state">
            No reports uploaded yet.
          </div>
        )}

        <div className="reports-stack-list">
          {Array.isArray(reports) && reports.map(
            (report) => (
            <div className="report-item-card" key={report.id}>
              <div className="report-item-content">
                <h3 className="report-item-filename">{report.filename}</h3>
                <span className="report-item-date">{report.uploaded_at}</span>
                <p className="report-item-summary">
                  {report.final_conclusion || "No summary available"}
                </p>
              </div>

              <div className="report-item-actions">
                <span
                  className={`status-pill-${report.status === "Normal"
                      ? "normal"
                      : "attention"
                    }`}
                >
                  {report.status}
                </span>

                <div className="report-action-group">
                  <a
                    href={` ${ API_BASE_URL } /api/reports/download/${report.id}/`}
                    className="btn-download-action"
                  >
                    Download
                  </a>

                  <button
                    className="btn-share-action"
                    onClick={() => {
                      const url = ` ${ API_BASE_URL } /api/reports/download/${report.id}/`;
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
            </div>
          )
          )}

        </div>
      </div>
    </div>
  );
};

export default Reports;