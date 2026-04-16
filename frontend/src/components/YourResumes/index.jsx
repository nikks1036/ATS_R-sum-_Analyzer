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
    if (jobDescription.trim().split(/\s+/).filter(Boolean).length < 20) {
      setError("Please paste a fuller job description (minimum 20 words) for advanced ATS analysis.");
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
 
      // STEP 1️⃣ Upload Resume
      const uploadResponse = await fetch(
        "http://localhost:5000/resume/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
 
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(errorText || "Resume upload failed.");
      }
 
      const data = await uploadResponse.json();
 
      // STEP 2️⃣ Analyze Resume
      const rawData = {
        resumeText: data.text,
        jobDescription: jobDescription.trim()
      };
 
      const analyzeResponse = await fetch(
        "http://localhost:5000/resume/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(rawData),
        }
      );
 
      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        throw new Error(errorText || "Resume analysis failed.");
      }
      const analyzeData = await analyzeResponse.json();
      console.log(analyzeData)
      setAnalysisResult(analyzeData);
      setShowModal(true);
 
 
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="resume-container">
      <h2>Upload Your Resume</h2>

      <textarea
        className="jd-input"
        placeholder="Paste full job description here for accurate ATS match and concrete edits..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />
 
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
      />
 
      <button onClick={handleUploadAndAnalyze} disabled={loading}>
        {loading ? "Processing..." : "Upload & Analyze"}
      </button>
 
      {analysisResult && (
        <button onClick={() => setShowModal(true)}>
            View Report
        </button>
        )}
 
       {showModal && analysisResult?.success && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>ATS Resume Analysis Report</h2>
 
      {(() => {
        const report =
          analysisResult.suggestions?.analysis ??
          analysisResult.suggestions ??
          analysisResult;
 
        const score = report?.compatibility_score ?? analysisResult.matchPercentage ?? analysisResult.score;
        const renderList = (items, emptyText) => {
          if (!Array.isArray(items) || items.length === 0) {
            return <li>{emptyText}</li>;
          }
          return items.map((item, index) => <li key={index}>{String(item).replace(/\*\*/g, "")}</li>);
        };
        const missingSkillInsights = Array.isArray(report?.missing_skill_insights)
          ? report.missing_skill_insights
          : [];

        return (
          <>
            {/* Score */}
            <p>
              <strong>ATS Match:</strong>{" "}
              {Number.isFinite(Number(score)) ? `${Number(score)}%` : "N/A"}
            </p>

            <h3>Actual Changes To Make</h3>
            <ul>
              {renderList(
                report?.actual_changes,
                "No concrete edits returned yet. Try a longer and role-specific job description."
              )}
            </ul>
 
            {/* Resume Skills */}
            <h3>Resume Skills</h3>
            <ul>
              {renderList(report?.resume_skills, "No resume skills detected.")}
            </ul>
 
            {/* Job Description Skills */}
            <h3>Job Description Skills</h3>
            <ul>
              {renderList(report?.job_description_skills, "No JD skills detected.")}
            </ul>
 
            {/* Missing Skills */}
            <h3>Missing Skills (Add to Resume)</h3>
            <ul>
              {renderList(
                report?.missing_skills?.from_resume_for_job_description,
                "No critical missing skills found."
              )}
            </ul>

            <h3>Missing Skill Importance & Job Impact</h3>
            {missingSkillInsights.length > 0 ? (
              missingSkillInsights.map((item, idx) => (
                <div key={idx} style={{ marginBottom: "15px" }}>
                  <p>
                    <strong>Skill:</strong> {item.skill || "N/A"}
                  </p>
                  <p>
                    <strong>Why Important:</strong> {item.why_important || "N/A"}
                  </p>
                  <p>
                    <strong>Job Impact:</strong> {item.job_impact || "N/A"}
                  </p>
                  <p>
                    <strong>JD Reference:</strong> {item.jd_reference || "N/A"}
                  </p>
                  <p>
                    <strong>How To Add In Resume:</strong> {item.how_to_add_in_resume || "N/A"}
                  </p>
                </div>
              ))
            ) : (
              <ul>
                <li>No missing-skill insights available yet.</li>
              </ul>
            )}
 
            <h3>Extra Skills (Not Required by Job)</h3>
            <ul>
              {renderList(
                report?.missing_skills?.from_job_description_for_resume,
                "No extra/non-matching skills detected."
              )}
            </ul>
 
            {/* ATS Optimization Tips */}
            <h3>ATS Optimization Tips</h3>
            <ul>
              {renderList(report?.ats_optimization_tips, "No optimization tips returned.")}
            </ul>

            <h3>Interview Prep Tips (From JD)</h3>
            <ul>
              {renderList(
                report?.interview_prep_tips,
                "No interview prep tips returned."
              )}
            </ul>
 
            {/* Bullet Improvements */}
            <h3>Bullet Point Improvements</h3>
            {Array.isArray(report?.ats_optimized_bullet_point_improvements) &&
            report.ats_optimized_bullet_point_improvements.length > 0 ? (
              report.ats_optimized_bullet_point_improvements.map((item, index) => (
                <div key={index} style={{ marginBottom: "15px" }}>
                  <p>
                    <strong>Original:</strong> {item.original_summary || "N/A"}
                  </p>
                  <p>
                    <strong>Reasoning:</strong> {item.reasoning || "N/A"}
                  </p>
                  <strong>Suggested Bullets:</strong>
                  <ul>
                    {renderList(item.suggested_bullets, "No suggested bullets.")}
                  </ul>
                </div>
              ))
            ) : (
              <ul>
                <li>No bullet rewrites returned.</li>
              </ul>
            )}
 
            {/* Overall Assessment */}
            <h3>Overall Assessment</h3>
            <p>{report?.overall_assessment || "No overall assessment returned."}</p>
 
            <button onClick={() => setShowModal(false)}>Close</button>
          </>
        );
      })()}
    </div>
  </div>
)}
 
 
 
 
 
 
      {error && <p className="error">{error}</p>}
    </div>
  );
};
 
export default YourResumes;
