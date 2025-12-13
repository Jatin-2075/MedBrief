import React, { useState, useRef } from "react";
import cloudIcon from "../images/cloud_icon_1.png";
import FileIcon from "../images/file_icon.jpg";
import "../Style/Upload.css";

export default function Upload() {
  const [fileName, setFileName] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);


  const fileInputRef = useRef(null);

  // ---- optional local history (demo / offline support) ----
  const saveReportToHistory = (file, summaryText, pdfUrl) => {
    const reports = JSON.parse(localStorage.getItem("reports")) || [];

    const newReport = {
      id: crypto.randomUUID(),
      name: file.name,
      type: "Medical Report",
      specialty: "General",
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      summary: summaryText,
      pdfUrl: pdfUrl, // ✅ store PDF link
    };

    reports.unshift(newReport);
    localStorage.setItem("reports", JSON.stringify(reports));
  };


  // ---- upload handler ----
  const handlePDFUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF and DOCX files allowed!");
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("Max size is 10MB.");
      return;
    }

    // reset UI
    setFileName(file.name);
    setSummary(null);
    setPdfUrl(null); // ✅ add this
    setProgress(0);
    setError(null);
    setIsUploading(true);


    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      "http://127.0.0.1:8000/api/summarize_report/"
    );

    // JWT auth
    const token = localStorage.getItem("access_token");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    // progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);

      if (xhr.status < 200 || xhr.status >= 300) {
        setError(`Upload failed (status ${xhr.status}).`);
        return;
      }

      try {
        const res = JSON.parse(xhr.responseText);

        setSummary(res.summary || "No summary returned.");
        setPdfUrl(res.pdf_url || null);

        saveReportToHistory(
          file,
          res.summary || "",
          res.pdf_url || null
        );
      } catch (err) {
        setError("Invalid server response.");
      }
    };




    xhr.onerror = () => {
      setIsUploading(false);
      setError("Upload failed. Please try again.");
    };

    xhr.send(form);
  };

  // ---- download summary as text (frontend copy) ----
  const handleDownload = () => {
    if (!pdfUrl) {
      alert("Summary PDF not available yet.");
      return;
    }

    // Open PDF in new tab OR trigger download
    const link = document.createElement("a");
    link.href = `http://127.0.0.1:8000${pdfUrl}`;
    link.download = `${fileName.replace(/\.[^/.]+$/, "")}_summary.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div>
      <div className="title_container">
        <h1>Summarising New Report</h1>
        <p>
          Upload your medical report to generate key findings and
          recommendations.
        </p>
      </div>

      <div className="main_upload_container">
        <div
          className="upload_container"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" ? fileInputRef.current?.click() : null
          }
        >
          <img
            src={cloudIcon}
            alt="upload cloud"
            className="cloud_icon_1"
          />
          <h4>Drag & Drop or Click to Upload</h4>
          <p className="file_formats">
            Supported formats: PDF, DOCX. Max size: 10MB
          </p>

          <input
            className="file_input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handlePDFUpload}
            style={{ display: "none" }}
          />
        </div>

        {/* File + Progress */}
        {fileName && (
          <div className="file_progress_container">
            <div className="mini_container_1">
              <img
                src={FileIcon}
                alt="file icon"
                className="file_icon"
              />
            </div>

            <div className="mini_container_2">
              <p className="file_name">File: {fileName}</p>
              <p className="upload_status">
                {isUploading ? "Uploading..." : "Uploaded"}
              </p>

              <div className="progress_bar">
                <div
                  className="progress_fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div style={{ minWidth: 72, textAlign: "right" }}>
              <p className="progress">{progress}%</p>
            </div>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      {/* GENERATED SUMMARY */}
      {summary && (
        <div className="generated_summary_container">
          <div className="container_general">
            <div className="container_1">
              <h2>Generated Summary</h2>
              <p>Based on: {fileName}</p>
            </div>

            <div className="container_2">
              <button
                className="share-button"
                onClick={() =>
                  navigator.share?.({ text: summary })
                }
              >
                Share
              </button>

              <button
                className="Download-button"
                onClick={handleDownload}
              >
                Download Summary
              </button>
            </div>
          </div>

          <div className="container_3">
            <pre>{summary}</pre>
          </div>

          <div className="container_4">
            <h3>Recommendations</h3>
            <ul className="recommendation_list">
              <li>
                <span className="dot yellow"></span>
                <strong>Dietary Adjustments:</strong> Reduce
                sugar intake and eat more fiber-rich foods.
              </li>
              <li>
                <span className="dot green"></span>
                <strong>Supplementation:</strong> Consider
                Vitamin-D after medical advice.
              </li>
              <li>
                <span className="dot blue"></span>
                <strong>Follow-up:</strong> Schedule a follow-up
                check in 3 months.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
