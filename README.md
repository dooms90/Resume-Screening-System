# AI-Powered Resume Screening System

An end-to-end resume screening web application that lets a recruiter upload resumes, define a job description, and automatically get a ranked leaderboard of candidates scored by semantic AI matching—not just keyword overlap.

## Features

1. **Resume Parsing**

   * Extracts text from **PDF** and **DOCX** resumes.

2. **NLP Extraction**

   * Pulls candidate **name**, **email**, **phone**, and **skills** using **spaCy** and **Regex**.

3. **Semantic AI Matching**

   * Scores resume-to-job relevance using **Sentence Transformer embeddings (`all-MiniLM-L6-v2`)**, enabling semantic understanding (e.g., **"ML" ≈ "Machine Learning"**) rather than simple keyword matching.

4. **Ranked Leaderboard**

   * Displays all candidates sorted by match score, along with live statistics such as **average score** and **top candidate**.

5. **Modern UI**

   * Light/Dark themed interface with animated feedback during resume matching.

6. **Robust Error Handling**

   * Provides clear error messages for invalid files, empty inputs, and missing records.

---

## Tech Stack

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Frontend**       | React (Vite), Axios                             |
| **Backend**        | FastAPI (Python), Uvicorn                       |
| **Database**       | MySQL, SQLAlchemy ORM                           |
| **NLP**            | spaCy (`en_core_web_sm`)                        |
| **AI Matching**    | Sentence Transformers (`all-MiniLM-L6-v2`, CPU) |
| **Resume Parsing** | pdfplumber, python-docx                         |

---

## Project Structure

```text
resume-screening-system/
├── backend/
│   ├── main.py             # FastAPI app + all API routes
│   ├── database.py         # SQLAlchemy engine/session setup
│   ├── models.py           # Resume, JobDescription, MatchResult tables
│   ├── resume_parser.py    # PDF/DOCX text extraction
│   ├── nlp_extractor.py    # Name/email/phone/skills extraction
│   ├── matcher.py          # Semantic similarity scoring
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   └── App.css
    └── package.json
```
