import { useEffect, useState } from "react";
import "../Style/reports.css";
import { API_BASE_URL } from "../config/api";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/reports/history/`, {
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

  const downloadReport = async (reportId) => {
    setDownloadingId(reportId);
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(
        `${API_BASE_URL}/api/reports/download/${reportId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Download failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Medical_Report_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download report. Please try again.");
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  const shareReport = async (reportId, filename) => {
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(
        `${API_BASE_URL}/api/reports/download/${reportId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch report");
      }

      const blob = await res.blob();
      const file = new File(
        [blob],
        filename || `Medical_Report_${reportId}.pdf`,
        { type: "application/pdf" }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Medical Report Summary",
          text: "Here is my medical report summary.",
        });
      } else if (navigator.share) {
        const shareUrl = `${window.location.origin}/reports/${reportId}`;
        await navigator.share({
          title: "Medical Report Summary",
          text: "Here is my medical report summary.",
          url: shareUrl,
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || `Medical_Report_${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        alert("Sharing not supported. File downloaded instead.");
      }
    } catch (err) {
      alert("Failed to share report. Please try again.");
      console.error(err);
    }
  };

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
          {Array.isArray(reports) &&
            reports.map((report) => (
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
                    className={`status-pill-${
                      report.status === "Normal" ? "normal" : "attention"
                    }`}
                  >
                    {report.status}
                  </span>

                  <div className="report-action-group">
                    <button
                      className="btn-download-action"
                      onClick={() => downloadReport(report.id)}
                      disabled={downloadingId === report.id}
                    >
                      {downloadingId === report.id ? "Downloading..." : "Download"}
                    </button>

                    <button
                      className="btn-share-action"
                      onClick={() => shareReport(report.id, report.filename)}
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;