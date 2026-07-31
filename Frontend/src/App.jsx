import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function getScoreColor(score) {
  if (score >= 60) return "#2DD4BF";
  if (score >= 35) return "#FBBF24";
  return "#F87171";
}

function getAvatarColor(name) {
  const colors = ["#818CF8", "#2DD4BF", "#FBBF24", "#F472B6", "#60A5FA", "#A78BFA"];
  const idx = (name || "?").charCodeAt(0) % colors.length;
  return colors[idx];
}

function getInitials(name) {
  if (!name || name === "Not found") return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
}

const PROCESSING_STEPS = ["Parsing resume...", "Analyzing skills...", "Computing semantic similarity...", "Finalizing score..."];
const NAV_ITEMS = ["Dashboard", "Candidates", "Job postings", "Settings"];

function HeroGauge({ score }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  return (
    <div style={{ position: "relative", width: "140px", height: "140px" }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease", filter: `drop-shadow(0 0 8px ${color}80)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 600, color }}>{Math.round(score)}%</span>
      </div>
    </div>
  );
}

function ScoreDistributionChart({ candidates }) {
  const buckets = [
    { label: "0-20", min: 0, max: 20, color: "#F87171" },
    { label: "20-40", min: 20, max: 40, color: "#FB923C" },
    { label: "40-60", min: 40, max: 60, color: "#FBBF24" },
    { label: "60-80", min: 60, max: 80, color: "#A3E635" },
    { label: "80-100", min: 80, max: 100.01, color: "#2DD4BF" },
  ];
  const counts = buckets.map((b) => candidates.filter((c) => c.match_score >= b.min && c.match_score < b.max).length);
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="chart-card">
      <h2 className="section-title" style={{ marginBottom: 0 }}>Score distribution</h2>
      <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0 0" }}>Number of candidates per score range</p>
      <div className="chart-bars">
        {buckets.map((b, i) => (
          <div className="chart-bar-col" key={b.label}>
            <span className="chart-bar-count">{counts[i]}</span>
            <div className="chart-bar" style={{ height: `${(counts[i] / maxCount) * 100}%`, background: b.color, boxShadow: `0 0 12px ${b.color}60` }}></div>
            <span className="chart-bar-label">{b.label}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [activeNav, setActiveNav] = useState("Dashboard");

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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let interval;
    if (matchLoading) {
      setProcessingStepIndex(0);
      interval = setInterval(() => setProcessingStepIndex((p) => (p + 1) % PROCESSING_STEPS.length), 700);
    }
    return () => clearInterval(interval);
  }, [matchLoading]);

  const getErrorMessage = (err, fallback) => (err.response?.data?.detail) || fallback;

  const handleFileChange = (e) => { setSelectedFile(e.target.files[0]); setUploadResult(null); setError(""); };

  const handleUpload = async () => {
    if (!selectedFile) { setError("Select a resume file (PDF or DOCX) first."); return; }
    const formData = new FormData();
    formData.append("file", selectedFile);
    setLoading(true); setError("");
    try {
      const response = await axios.post("http://127.0.0.1:8000/upload-resume", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadResult(response.data);
    } catch (err) { setError(getErrorMessage(err, "Upload failed. Check that your backend server is running.")); }
    finally { setLoading(false); }
  };

  const handleAddJob = async () => {
    if (!jobTitle || !jobDescription) { setError("Enter both job title and description."); return; }
    setJobLoading(true); setError("");
    try {
      const response = await axios.post(`http://127.0.0.1:8000/add-job?title=${encodeURIComponent(jobTitle)}&description_text=${encodeURIComponent(jobDescription)}`);
      setJobResult(response.data);
    } catch (err) { setError(getErrorMessage(err, "Adding job failed. Check backend server.")); }
    finally { setJobLoading(false); }
  };

  const handleMatch = async () => {
    if (!uploadResult || !jobResult) { setError("Upload a resume AND add a job description first."); return; }
    setMatchLoading(true); setError("");
    try {
      const response = await axios.post(`http://127.0.0.1:8000/match?resume_id=${uploadResult.resume_id}&job_id=${jobResult.job_id}`);
      setMatchResult(response.data);
    } catch (err) { setError(getErrorMessage(err, "Matching failed. Check backend server.")); }
    finally { setMatchLoading(false); }
  };

  const handleGetLeaderboard = async () => {
    if (!jobResult) { setError("Add a job description first to see its leaderboard."); return; }
    setLeaderboardLoading(true); setError("");
    try {
      const response = await axios.get(`http://127.0.0.1:8000/leaderboard/${jobResult.job_id}`);
      setLeaderboard(response.data);
    } catch (err) { setError(getErrorMessage(err, "Failed to fetch leaderboard. Check backend server.")); }
    finally { setLeaderboardLoading(false); }
  };

  const avgScore = leaderboard?.leaderboard.length > 0
    ? (leaderboard.leaderboard.reduce((s, c) => s + c.match_score, 0) / leaderboard.leaderboard.length).toFixed(1) : "0";
  const topScore = leaderboard?.leaderboard.length > 0 ? leaderboard.leaderboard[0].match_score : 0;
  const topCandidate = leaderboard?.leaderboard.length > 0 ? leaderboard.leaderboard[0].candidate_name : "\u2014";

  const filteredCandidates = leaderboard
    ? leaderboard.leaderboard.filter((c) =>
        (c.candidate_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.skills || "").toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const uploadPanel = (
    <div className="panel panel-1">
      <div className="panel-header"><div className="panel-icon">1</div><h2>Upload resume</h2></div>
      <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        <span className="btn-content">{loading && <span className="spinner"></span>}{loading ? "Uploading..." : "Upload"}</span>
      </button>
      {uploadResult && <div className="result-chip">Resume <span className="mono">#{uploadResult.resume_id}</span> \u2014 {uploadResult.file_name}</div>}
    </div>
  );

  const jobPanel = (
    <div className="panel panel-2">
      <div className="panel-header"><div className="panel-icon">2</div><h2>Job description</h2></div>
      <input type="text" placeholder="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
      <textarea placeholder="Paste job description..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows="3" />
      <button onClick={handleAddJob} disabled={jobLoading}>
        <span className="btn-content">{jobLoading && <span className="spinner"></span>}{jobLoading ? "Adding..." : "Add job"}</span>
      </button>
      {jobResult && <div className="result-chip">Job <span className="mono">#{jobResult.job_id}</span> \u2014 {jobResult.title}</div>}
    </div>
  );

  const matchPanel = (
    <div className="panel panel-3" style={{ marginBottom: "18px" }}>
      <div className="panel-header"><div className="panel-icon">3</div><h2>Run match</h2></div>
      <button onClick={handleMatch} disabled={matchLoading}>
        <span className="btn-content">{matchLoading && <span className="spinner"></span>}{matchLoading ? "Matching..." : "Run match"}</span>
      </button>
      {matchLoading && <div className="processing-panel"><span className="processing-dot"></span>{PROCESSING_STEPS[processingStepIndex]}</div>}
      {!matchLoading && matchResult && (
        <div className="match-score-display">
          <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#9CA3AF" }}>{matchResult.candidate_name} \u2192 {matchResult.job_title}</p>
          <span className="score-number" style={{ color: getScoreColor(matchResult.match_score) }}>{matchResult.match_score}%</span>
          <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${matchResult.match_score}%`, background: getScoreColor(matchResult.match_score) }} /></div>
        </div>
      )}
    </div>
  );

  const candidateRows = (list) => list.map((c) => (
    <div className="candidate-row" key={c.resume_id}>
      <div className="candidate-rank">#{c.rank}</div>
      <div className="candidate-avatar" style={{ background: getAvatarColor(c.candidate_name) }}>{getInitials(c.candidate_name)}</div>
      <div className="candidate-info">
        <p className="candidate-name">{c.candidate_name}</p>
        <p className="candidate-email">{c.email}</p>
        <div className="skill-tags">{(c.skills || "").split(",").filter(Boolean).slice(0, 4).map((s, i) => <span className="skill-tag" key={i}>{s.trim()}</span>)}</div>
      </div>
      <div className="candidate-progress">
        <div className="candidate-progress-track"><div className="candidate-progress-fill" style={{ width: `${c.match_score}%`, background: getScoreColor(c.match_score) }} /></div>
        <span className="candidate-progress-label" style={{ color: getScoreColor(c.match_score) }}>{c.match_score}%</span>
      </div>
    </div>
  ));

  return (
    <div>
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      <div className="bg-glow-3"></div>

      <div className="app-layout">
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">RS</div>
            <div className="sidebar-logo-text">Resume<br />Screener</div>
          </div>
          <div className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <button key={item} className={`sidebar-nav-item ${activeNav === item ? "active" : ""}`} onClick={() => setActiveNav(item)}>
                <span className="sidebar-nav-dot"></span><span>{item}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="main-content">
          <div className="topbar">
            <div>
              <p className="topbar-title">{activeNav}</p>
              <p className="topbar-sub">{jobResult ? jobResult.title : "No job selected yet"}</p>
            </div>
          </div>

          <div className="content-area">
            {activeNav === "Dashboard" && (
              <>
                {leaderboard && (
                  <div className="hero-gauge-row">
                    <div className="hero-gauge-card">
                      <span className="hero-gauge-label">Top match</span>
                      <HeroGauge score={topScore} />
                      <p style={{ marginTop: "10px", fontSize: "12.5px", color: "#9CA3AF" }}>{topCandidate}</p>
                    </div>
                    <div className="stats-mini-grid">
                      <div className="stat-card"><span className="stat-label">Total candidates</span><span className="stat-value">{leaderboard.total_candidates}</span></div>
                      <div className="stat-card"><span className="stat-label">Average score</span><span className="stat-value accent-teal">{avgScore}%</span></div>
                      <div className="stat-card"><span className="stat-label">Job role</span><span className="stat-value accent-purple" style={{ fontSize: "15px" }}>{leaderboard.job_title}</span></div>
                      <div className="stat-card"><span className="stat-label">Status</span><span className="stat-value" style={{ fontSize: "15px" }}>Active</span></div>
                    </div>
                  </div>
                )}

                {leaderboard && leaderboard.leaderboard.length > 0 && <ScoreDistributionChart candidates={leaderboard.leaderboard} />}

                <div className="panel-grid">{uploadPanel}{jobPanel}</div>
                {matchPanel}

                <button onClick={handleGetLeaderboard} disabled={leaderboardLoading}>
                  <span className="btn-content">{leaderboardLoading && <span className="spinner"></span>}{leaderboardLoading ? "Loading..." : "Refresh leaderboard"}</span>
                </button>
              </>
            )}

            {activeNav === "Candidates" && (
              <>
                <h2 className="section-title">All candidates</h2>
                {leaderboard ? (
                  <>
                    <div className="candidates-toolbar">
                      <input className="search-input" type="text" placeholder="Search by name or skill..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    {candidateRows(filteredCandidates)}
                  </>
                ) : (
                  <div className="settings-placeholder">No leaderboard loaded yet \u2014 go to Dashboard and run a match first.</div>
                )}
              </>
            )}

            {activeNav === "Job postings" && (
              <>
                <h2 className="section-title">Current job posting</h2>
                {jobResult ? (
                  <div className="panel panel-2">
                    <div className="panel-header"><div className="panel-icon">2</div><h2>{jobResult.title}</h2></div>
                    <p style={{ fontSize: "13px", color: "#9CA3AF" }}>Job ID: <span className="mono">{jobResult.job_id}</span></p>
                  </div>
                ) : (
                  <div className="settings-placeholder">No job added yet \u2014 go to Dashboard to add one.</div>
                )}
              </>
            )}

            {activeNav === "Settings" && (
              <div className="settings-placeholder">
                <i className="ti">\u2699</i>
                Settings coming soon
              </div>
            )}

            {error && <div className="error-msg">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;