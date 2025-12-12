import React, { useState, useRef } from "react";
import cloudIcon from "../images/cloud_icon_1.png";
import FileIcon from "../images/file_icon.jpg";
import "../Style/Upload.css";

import DownloadIcon from "../images/download_icon.png"

export default function Upload() {
  const [fileName, setFileName] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const demoMode = true; // set false when backend ready
  const fileInputRef = useRef(null);

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

    // Reset UI state
    setFileName(file.name);
    setSummary(null);
    setProgress(0);
    setError(null);
    setIsUploading(true);

    if (demoMode) {
      // simulate upload progress
      setTimeout(() => setProgress(20), 200);
      setTimeout(() => setProgress(45), 500);
      setTimeout(() => setProgress(70), 900);
      setTimeout(() => setProgress(95), 1100);
      setTimeout(() => {
        setProgress(100);
        setIsUploading(false);
        setSummary(
          "Demo summary: Blood report indicates near-normal CBC with mild variations. No critical abnormalities detected."
        );
      }, 1400);
      return;
    }

    // REAL upload
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      try {
        const res = JSON.parse(xhr.responseText);
        setSummary(res.summary || "No summary returned.");
      } catch (err) {
        setError("Server error.");
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setError("Upload failed.");
    };

    xhr.send(form);
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}-summary.txt`;
    a.click();
  };

  return (
    <div>
      <div className="title_container">
        <h1>Summarising New Report</h1>
        <p>Upload your medical report to generate key findings and recommendations.</p>
      </div>

      <div className="main_upload_container">
        <div
          className="upload_container"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" ? fileInputRef.current?.click() : null)}
        >
          <img src={cloudIcon} alt="upload cloud" className="cloud_icon_1" />
          <h4>Drag & Drop or Click to Upload</h4>
          <p className="file_formats">Supported formats: PDF, DOCX. Max size: 10MB</p>

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
              <img src={FileIcon} alt="file icon" className="file_icon" />
            </div>

            <div className="mini_container_2">
              <p className="file_name">File: {fileName}</p>
              <p className="upload_status">{isUploading ? "Uploading..." : "Uploaded"}</p>

              {/* Progress bar visible once fileName is set */}
              <div className="progress_bar" aria-hidden={false}>
                <div
                  className="progress_fill"
                  style={{ width: `${progress}%` }}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                />
              </div>
            </div>

            <div style={{ minWidth: 72, textAlign: "right" }}>
              <p className="progress">{progress}%</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <p>Error: {error}</p>}
      </div>

      {/* GENERATED SUMMARY SECTION */}
      {summary && (
        <div class="generated_summary_container" >
          <div className="container_general">
            <div className="container_1">
              <h2>Generated Summary</h2>
              <p>Based on: {fileName}</p>
            </div>

            <div className="container_2">
              <button
                className="share-button"
                onClick={() => navigator.share?.({ text: summary })}
              >
                Share
              </button>

              <button className="Download-button" onClick={handleDownload}>
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
                <strong>Dietary Adjustments:</strong> Reduce intake of sugary foods and refined carbohydrates. Increase fiber-rich foods.
              </li>

              <li>
                <span className="dot green"></span>
                <strong>Supplementation:</strong> Begin a daily Vitamin D supplement as per doctor's advice.
              </li>

              <li>
                <span className="dot blue"></span>
                <strong>Follow-up:</strong> Schedule a follow-up appointment in 3 months.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
