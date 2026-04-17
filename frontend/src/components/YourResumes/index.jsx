import React, { useState } from "react";
import "./index.css";

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
      setError("Please paste the job description before analyzing.");
      return;
    }

    if (jobDescription.trim().split(/\s+/).length < 20) {
      setError("Minimum 20 words required in job description.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("You must be logged in.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      setLoading(true);
      setError("");

      // ✅ STEP 1: Upload Resume
      const uploadResponse = await fetch(
        "https://ats-r-sum-analyzer.onrender.com/resume/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Resume upload failed.");
      }

      const data = await uploadResponse.json();

      // ✅ STEP 2: Analyze Resume
      const analyzeResponse = await fetch(
        "https://ats-r-sum-analyzer.onrender.com/resume/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resumeText: data.text,
            jobDescription: jobDescription.trim(),
          }),
        }
      );

      if (!analyzeResponse.ok) {
        throw new Error("Resume analysis failed.");
      }

      const analyzeData = await analyzeResponse.json();
      setAnalysisResult(analyzeData);
      setShowModal(true);

    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-container">
      <h2>Upload Your Resume</h2>

      <textarea
        placeholder="Paste job description (min 20 words)"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />

      <input type="file" accept=".pdf" onChange={handleFileChange} />

      <button onClick={handleUploadAndAnalyze}>
        {loading ? "Processing..." : "Upload & Analyze"}
      </button>

      {error && <p className="error">{error}</p>}

      {analysisResult && (
        <button onClick={() => setShowModal(true)}>View Report</button>
      )}

      {showModal && analysisResult && (
        <div className="modal">
          <h2>Analysis Result</h2>

          <p>
            <strong>Score:</strong>{" "}
            {analysisResult.score || analysisResult.matchPercentage || "N/A"}%
          </p>

          <h3>Suggestions</h3>
          <ul>
            {(analysisResult.suggestions || []).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <button onClick={() => setShowModal(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default YourResumes;
