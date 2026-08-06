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

function LandingPage({ onGetStarted }) {
  const steps = [
    { num: "1", color: "#6366F1", title: "Upload resumes", desc: "Drop in PDF or DOCX resumes \u2014 the system parses and extracts candidate details automatically." },
    { num: "2", color: "#14B8A6", title: "Define the role", desc: "Paste a job description once, and match as many candidates against it as you need." },
    { num: "3", color: "#F59E0B", title: "Get ranked results", desc: "See every candidate scored by real semantic relevance, ranked highest to lowest." },
  ];
  const features = [
    { icon: "\u{1F9E0}", color: "#6366F1", title: "Semantic AI matching", desc: "Sentence-embedding models understand meaning, not just keywords \u2014 \u201cML\u201d matches \u201cmachine learning\u201d." },
    { icon: "\u26A1", color: "#14B8A6", title: "Fast, local, and free", desc: "Runs entirely on your own machine in seconds per match \u2014 no subscription, no per-seat pricing." },
    { icon: "\u{1F3AF}", color: "#F59E0B", title: "Explainable scoring", desc: "Every score comes with visible extracted skills, so you can see exactly why a candidate ranked where they did." },
    { icon: "\u{1F4C4}", color: "#EC4899", title: "PDF & DOCX support", desc: "Upload resumes in the formats candidates actually send \u2014 no manual reformatting needed." },
    { icon: "\u{1F4CA}", color: "#60A5FA", title: "Ranked leaderboard", desc: "Instantly see every candidate for a role sorted by relevance, with a score distribution overview." },
    { icon: "\u{1F512}", color: "#A78BFA", title: "Your data stays local", desc: "Resumes and job data are stored in your own MySQL database \u2014 nothing leaves your machine." },
  ];

  return (
    <div className="landing-page">
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      <div className="bg-glow-3"></div>

      <div className="landing-nav">
        <div className="landing-nav-brand">
          <div className="sidebar-logo-icon"></div>
          <span className="landing-nav-text">Resume Screener</span>
        </div>
        <button className="landing-cta" onClick={onGetStarted} style={{ padding: "9px 18px", fontSize: "13px" }}>Open dashboard</button>
      </div>

      <div className="landing-hero">
        <span className="landing-eyebrow">AI-powered candidate matching</span>
        <h1>Screen resumes by meaning, not just keywords</h1>
        <p>Upload resumes, define a role, and get a ranked, explainable shortlist in seconds \u2014 powered by semantic AI matching, not brittle keyword search.</p>
        <button className="landing-cta" onClick={onGetStarted}>Get started</button>
      </div>

      <div className="landing-stats-bar">
        <div className="landing-stat"><span className="landing-stat-value">60pt</span><span className="landing-stat-label">score gap: relevant vs. irrelevant</span></div>
        <div className="landing-stat"><span className="landing-stat-value">&lt;3s</span><span className="landing-stat-label">average match time</span></div>
        <div className="landing-stat"><span className="landing-stat-value">12/12</span><span className="landing-stat-label">functional tests passed</span></div>
        <div className="landing-stat"><span className="landing-stat-value">$0</span><span className="landing-stat-label">licensing cost</span></div>
      </div>

      <div className="landing-section">
        <h2 className="landing-section-title">How it works</h2>
        <p className="landing-section-sub">Three steps from resume to ranked shortlist</p>
        <div className="landing-steps">
          {steps.map((s) => (
            <div className="landing-step" key={s.num}>
              <div className="landing-step-num" style={{ background: s.color, boxShadow: `0 0 16px ${s.color}80` }}>{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="landing-section">
        <h2 className="landing-section-title">Built for real screening workflows</h2>
        <p className="landing-section-sub">Everything a recruiter needs for a fast, fair first pass</p>
        <div className="landing-features">
          {features.map((f) => (
            <div className="landing-feature-card" key={f.title}>
              <div className="landing-feature-icon" style={{ background: f.color + "22", color: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="landing-footer-cta">
        <h2>Ready to screen your first batch of candidates?</h2>
        <button className="landing-cta" onClick={onGetStarted}>Open the dashboard </button>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState("landing"); 
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobResult, setJobResult] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");

  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [processingStepIndex, setProcessingStepIndex] = useState(0);

  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
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

  const handleFileChange = (e) => { setSelectedFile(e.target.files[0]); setUploadResult(null); setUploadError(""); };

  const handleUpload = async () => {
    if (!selectedFile) { setUploadError("Select a resume file (PDF or DOCX) first."); return; }
    const formData = new FormData();
    formData.append("file", selectedFile);
    setLoading(true); setUploadError("");
    try {
      const response = await axios.post("http://127.0.0.1:8000/upload-resume", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadResult(response.data);
    } catch (err) { setUploadError(getErrorMessage(err, "Upload failed. Check that your backend server is running.")); }
    finally { setLoading(false); }
  };

  const handleAddJob = async () => {
    if (!jobTitle || !jobDescription) { setJobError("Enter both job title and description."); return; }
    setJobLoading(true); setJobError("");
    try {
      const response = await axios.post(`http://127.0.0.1:8000/add-job?title=${encodeURIComponent(jobTitle)}&description_text=${encodeURIComponent(jobDescription)}`);
      setJobResult(response.data);
    } catch (err) { setJobError(getErrorMessage(err, "Adding job failed. Check backend server.")); }
    finally { setJobLoading(false); }
  };

  const handleMatch = async () => {
    if (!uploadResult || !jobResult) { setMatchError("Upload a resume AND add a job description first."); return; }
    setMatchLoading(true); setMatchError("");
    try {
      const response = await axios.post(`http://127.0.0.1:8000/match?resume_id=${uploadResult.resume_id}&job_id=${jobResult.job_id}`);
      setMatchResult(response.data);
    } catch (err) { setMatchError(getErrorMessage(err, "Matching failed. Check backend server.")); }
    finally { setMatchLoading(false); }
  };

  const handleGetLeaderboard = async () => {
    if (!jobResult) { setLeaderboardError("Add a job description first to see its leaderboard."); return; }
    setLeaderboardLoading(true); setLeaderboardError("");
    try {
      const response = await axios.get(`http://127.0.0.1:8000/leaderboard/${jobResult.job_id}`);
      setLeaderboard(response.data);
    } catch (err) { setLeaderboardError(getErrorMessage(err, "Failed to fetch leaderboard. Check backend server.")); }
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
      {uploadError && <div className="field-error">{uploadError}</div>}
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
      {jobError && <div className="field-error">{jobError}</div>}
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
      {matchError && <div className="field-error">{matchError}</div>}
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

  if (view === "landing") {
    return <LandingPage onGetStarted={() => setView("app")} />;
  }

  return (
    <div>
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      <div className="bg-glow-3"></div>

      <div className="app-layout">
        <div className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"></div>
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
            <div className="topbar-left">
              <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
                {sidebarOpen ? "\u2039" : "\u203A"}
              </button>
              <div>
                <p className="topbar-title">{activeNav}</p>
                <p className="topbar-sub">{jobResult ? jobResult.title : "No job selected yet"}</p>
              </div>
            </div>
            <button className="back-to-landing-btn" onClick={() => setView("landing")}>
              Back
            </button>
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
                {leaderboardError && <div className="field-error">{leaderboardError}</div>}
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
              <div className="settings-placeholder">Settings coming soon</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;