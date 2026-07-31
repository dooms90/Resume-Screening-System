import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function getScoreColor(score) {
  if (score >= 60) return "#15803D";
  if (score >= 35) return "#B45309";
  return "#B91C1C";
}

const PROCESSING_STEPS = [
  "Parsing resume...",
  "Analyzing skills...",
  "Computing semantic similarity...",
  "Finalizing score...",
];

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobResult, setJobResult] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);

  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);

  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (matchLoading) {
      setProcessingStepIndex(0);
      interval = setInterval(() => {
        setProcessingStepIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [matchLoading]);

  const getErrorMessage = (err, fallback) => {
    if (err.response && err.response.data && err.response.data.detail) {
      return err.response.data.detail;
    }
    return fallback;
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadResult(null);
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Select a resume file (PDF or DOCX) first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-resume",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUploadResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed. Check that your backend server is running."));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async () => {
    if (!jobTitle || !jobDescription) {
      setError("Enter both job title and description.");
      return;
    }
    setJobLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/add-job?title=${encodeURIComponent(jobTitle)}&description_text=${encodeURIComponent(jobDescription)}`
      );
      setJobResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Adding job failed. Check backend server."));
      console.error(err);
    } finally {
      setJobLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!uploadResult || !jobResult) {
      setError("Upload a resume AND add a job description first.");
      return;
    }
    setMatchLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/match?resume_id=${uploadResult.resume_id}&job_id=${jobResult.job_id}`
      );
      setMatchResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Matching failed. Check backend server."));
      console.error(err);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleGetLeaderboard = async () => {
    if (!jobResult) {
      setError("Add a job description first to see its leaderboard.");
      return;
    }
    setLeaderboardLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/leaderboard/${jobResult.job_id}`
      );
      setLeaderboard(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch leaderboard. Check backend server."));
      console.error(err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const avgScore =
    leaderboard && leaderboard.leaderboard.length > 0
      ? (
          leaderboard.leaderboard.reduce((sum, c) => sum + c.match_score, 0) /
          leaderboard.leaderboard.length
        ).toFixed(1)
      : "0";

  const topCandidate =
    leaderboard && leaderboard.leaderboard.length > 0
      ? leaderboard.leaderboard[0].candidate_name
      : "—";

  return (
    <div className={`app-root ${darkMode ? "dark" : ""}`}>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>

      <div className="app-shell">
        <div className="app-header">
          <div>
            <h1>Resume Screening System</h1>
            <p>Upload resumes, define a role, and rank candidates by AI-matched relevance.</p>
          </div>
          <label className="theme-switch">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
            <span className="switch-track">
              <span className="switch-thumb">{darkMode ? "🌙" : "☀️"}</span>
            </span>
          </label>
        </div>

        {/* Upload */}
        <div className="section section-1">
          <div className="section-label">
            <span className="step-number">1</span>
            <h2>Upload Resume</h2>
          </div>
          <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
          <button onClick={handleUpload} disabled={loading} style={{ marginLeft: "10px" }}>
            <span className="btn-content">
              {loading && <span className="spinner"></span>}
              {loading ? "Uploading..." : "Upload"}
            </span>
          </button>
          {uploadResult && (
            <div className="result-box">
              <p>Resume ID: <span className="mono">{uploadResult.resume_id}</span></p>
              <p>File: {uploadResult.file_name}</p>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="section section-2">
          <div className="section-label">
            <span className="step-number">2</span>
            <h2>Add Job Description</h2>
          </div>
          <input
            type="text"
            placeholder="Job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
          <textarea
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows="5"
          />
          <button onClick={handleAddJob} disabled={jobLoading}>
            <span className="btn-content">
              {jobLoading && <span className="spinner"></span>}
              {jobLoading ? "Adding..." : "Add Job"}
            </span>
          </button>
          {jobResult && (
            <div className="result-box">
              <p>Job ID: <span className="mono">{jobResult.job_id}</span></p>
              <p>Title: {jobResult.title}</p>
            </div>
          )}
        </div>

        {/* Match */}
        <div className="section section-3">
          <div className="section-label">
            <span className="step-number">3</span>
            <h2>Match Resume to Job</h2>
          </div>
          <button onClick={handleMatch} disabled={matchLoading}>
            <span className="btn-content">
              {matchLoading && <span className="spinner"></span>}
              {matchLoading ? "Matching..." : "Run Match"}
            </span>
          </button>

          {matchLoading && (
            <div className="processing-panel">
              <span className="processing-dot"></span>
              {PROCESSING_STEPS[processingStepIndex]}
            </div>
          )}

          {!matchLoading && matchResult && (
            <div className="match-score-display">
              <p style={{ margin: "0 0 2px", fontSize: "13px", color: "var(--text-secondary)" }}>
                {matchResult.candidate_name} → {matchResult.job_title}
              </p>
              <span className="score-number" style={{ color: getScoreColor(matchResult.match_score) }}>
                {matchResult.match_score}%
              </span>
              <div className="score-bar-track">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${matchResult.match_score}%`,
                    background: getScoreColor(matchResult.match_score),
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="section section-4">
          <div className="section-label">
            <span className="step-number">4</span>
            <h2>View Leaderboard</h2>
          </div>
          <button onClick={handleGetLeaderboard} disabled={leaderboardLoading}>
            <span className="btn-content">
              {leaderboardLoading && <span className="spinner"></span>}
              {leaderboardLoading ? "Loading..." : "Show Leaderboard"}
            </span>
          </button>

          {leaderboard && (
            <div style={{ marginTop: "16px" }}>
              <div className="stats-dashboard">
                <div className="stat-card">
                  <span className="stat-label">Total Candidates</span>
                  <span className="stat-value">{leaderboard.total_candidates}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Average Score</span>
                  <span className="stat-value">{avgScore}%</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Top Candidate</span>
                  <span className="stat-value" style={{ fontSize: "15px" }}>{topCandidate}</span>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate</th>
                    <th>Email</th>
                    <th>Skills</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.leaderboard.map((c) => (
                    <tr key={c.resume_id}>
                      <td className="rank-badge">#{c.rank}</td>
                      <td>{c.candidate_name}</td>
                      <td>{c.email}</td>
                      <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{c.skills}</td>
                      <td>
                        <span className="mini-bar-track">
                          <span
                            className="mini-bar-fill"
                            style={{
                              width: `${c.match_score}%`,
                              background: getScoreColor(c.match_score),
                              display: "block",
                            }}
                          />
                        </span>
                        <span className="mono" style={{ color: getScoreColor(c.match_score) }}>
                          {c.match_score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
}

export default App;