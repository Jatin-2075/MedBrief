import React, { useState, useRef } from "react";
import Navbar from "../Components/Navbar";
import "../Style/Upload.css";

export default function Upload() {
  const [fileName, setFileName] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const demoMode = true; // change to false when backend is ready
  const fileInputRef = useRef(null);

  const handlePDFUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
      // fake progress
      setTimeout(() => setProgress(40), 300);
      setTimeout(() => setProgress(80), 700);
      setTimeout(() => {
        setProgress(100);
        setIsUploading(false);
        setSummary(
          "Demo summary: Blood report indicates near-normal CBC with mild variations. No critical abnormalities detected."
        );
      }, 1200);
      return;
    }

    // REAL upload logic (once backend exists)
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
        setSummary(res.summary);
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

  return (
    <div>
      {/* <Navbar /> */}

      <div className="title_container">
        <h1>Summarising New Report</h1>
        <p>Upload your medical report to generate key findings and recommendations.</p>
      </div>

      {/* Upload Box */}
      <div className="upload_container" onClick={() => fileInputRef.current?.click()}>
        <img src="../images/cloud.png" alt="" className="cloud_icon" />
        <h4 >Drag & Drop or Click to Upload</h4>
        <p class= "file_formats">Supported formats: PDF, DOCX. Max size: 10MB</p>

        <input class="file_input"
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
          <p className="file_name" >File: {fileName}</p>
          <p className="upload_status" >{isUploading ? "Uploading..." : "Uploaded"}</p>
          <p className="progress" >Progress: {progress}%</p>
        </div>
      )}

      {/* Error Message */}
      {error && <p>Error: {error}</p>}

      {/* GENERATED SUMMARY SECTION */}
      {summary && (
        <div>
          <div className="container_1">
            <h2>Generated Summary</h2>
            <p>Based on: {fileName}</p>

            <pre>{summary}</pre>
          </div>

          <div className="container_2">
            <button class="share-button" onClick={() => navigator.share?.({ text: summary })}>
                Share 
            </button>

            <button class="Download-button"
                onClick={() => {
                const blob = new Blob([summary], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${fileName}-summary.txt`;
                a.click();
                }}
            >
                Download Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
