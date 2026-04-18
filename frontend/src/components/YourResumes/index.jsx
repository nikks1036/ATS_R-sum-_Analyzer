import React, { useState } from "react";
import "./index.css";

const API_BASE = "https://ats-r-sum-analyzer.onrender.com";

const YourResumes = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError("");
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a resume to upload.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }

    if (jobDescription.trim().split(/\s+/).length < 20) {
      setError("Minimum 20 words required.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Login required.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      setLoading(true);
      setError("");

      // ✅ STEP 1: Upload Resume
      const uploadResponse = await fetch(`${API_BASE}/resume/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Resume upload failed");
      }

      const uploadData = await uploadResponse.json();

      // ✅ STEP 2: Analyze Resume
      const analyzeResponse = await fetch(`${API_BASE}/resume/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeText: uploadData.text,
          jobDescription: jobDescription.trim(),
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error("Resume analysis failed");
      }

      const analyzeData = await analyzeResponse.json();

      setAnalysisResult(analyzeData);
      setShowModal(true);

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAFE DATA EXTRACTION
  const report =
    analysisResult?.suggestions?.analysis ||
    analysisResult?.suggestions ||
    analysisResult ||
    {};

  const score =
    report?.compatibility_score ||
    analysisResult?.matchPercentage ||
    analysisResult?.score ||
    "N/A";

  const suggestions = Array.isArray(report?.actual_changes)
    ? report.actual_changes
    : [];

  return (
    <div className="resume-container">
      <h2>Upload Your Resume</h2>

      <textarea
        className="jd-input"
        placeholder="Paste job description (minimum 20 words)"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />

      <input type="file" accept=".pdf" onChange={handleFileChange} />

      <button onClick={handleUploadAndAnalyze} disabled={loading}>
        {loading ? "Processing..." : "Upload & Analyze"}
      </button>

      {error && <p className="error">{error}</p>}

      {analysisResult && (
        <button onClick={() => setShowModal(true)}>
          View Report
        </button>
      )}

      {/* ✅ MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>ATS Resume Analysis</h2>

            <p>
              <strong>ATS Score:</strong> {score}%
            </p>

            <h3>Recommended Changes</h3>
            <ul>
              {suggestions.length > 0 ? (
                suggestions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))
              ) : (
                <li>No suggestions available</li>
              )}
            </ul>

            <button onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default YourResumes;
