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
│   ├── main.py             
│   ├── database.py         
│   ├── models.py           
│   ├── resume_parser.py    
│   ├── nlp_extractor.py    
│   ├── matcher.py          
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   └── App.css
    └── package.json
```
---

## API Endpoints

| Method   | Endpoint                | Description                                              |
| -------- | ----------------------- | -------------------------------------------------------- |
| **POST** | `/upload-resume`        | Upload and parse a resume file                           |
| **POST** | `/add-job`              | Add a job description                                    |
| **POST** | `/match`                | Compute the match score for a resume and job description |
| **GET**  | `/leaderboard/{job_id}` | Retrieve ranked candidates for a specific job            |

---

## How Matching Works

1. The **resume text** and **job description** are converted into sentence embeddings using **`all-MiniLM-L6-v2`**.
2. **Cosine Similarity** is calculated between the two embeddings.
3. The similarity score is converted into a **0–100% relevance score**.
4. Candidates are ranked based on their semantic similarity score.

### Validation

The matching model was validated by comparing two scenarios:

* **Relevant Resume + Matching Job Description** → **72.2% Match**
* **Irrelevant Resume + Unrelated Job Description** → **12.2% Match**

These results demonstrate that the model can effectively distinguish between strong and weak candidate-job matches based on semantic meaning rather than simple keyword overlap.
