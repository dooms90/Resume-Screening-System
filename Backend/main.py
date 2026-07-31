from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os

from database import engine, Base, get_db
import models
from resume_parser import extract_resume_text
from nlp_extractor import extract_resume_details
from matcher import calculate_match_score

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "uploaded_resumes"


@app.get("/")
def read_root():
    return {"message": "Resume Screening System backend is running"}


@app.get("/test-db")
def test_db_connection():
    try:
        connection = engine.connect()
        connection.close()
        return {"status": "Database connected successfully!"}
    except Exception as e:
        return {"status": "Database connection failed", "error": str(e)}


@app.post("/upload-resume")
def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Validate file extension
    allowed_extensions = (".pdf", ".docx")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF or DOCX file."
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if os.path.getsize(file_path) == 0:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    try:
        extracted_text = extract_resume_text(file_path, file.filename)
    except ValueError as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(
            status_code=422,
            detail=f"Could not read this file — it may be corrupted or password-protected. ({str(e)})"
        )

    if not extracted_text or len(extracted_text.strip()) < 20:
        raise HTTPException(
            status_code=422,
            detail="Very little or no readable text found. This may be a scanned/image-based PDF, which isn't supported."
        )

    details = extract_resume_details(extracted_text)

    new_resume = models.Resume(
        candidate_name=details["name"],
        email=details["email"],
        file_name=file.filename,
        extracted_text=extracted_text,
        skills=", ".join(details["skills"])
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    return {
        "message": "Resume uploaded and processed successfully",
        "resume_id": new_resume.id,
        "file_name": new_resume.file_name,
        "extracted_text_preview": extracted_text[:300]
    }


@app.post("/add-job")
def add_job(title: str, description_text: str, db: Session = Depends(get_db)):
    if not title.strip() or not description_text.strip():
        raise HTTPException(status_code=400, detail="Job title and description cannot be empty.")

    if len(description_text.strip()) < 30:
        raise HTTPException(
            status_code=400,
            detail="Job description is too short to produce a meaningful match. Please provide more detail."
        )

    new_job = models.JobDescription(
        title=title,
        description_text=description_text
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {
        "message": "Job description added successfully",
        "job_id": new_job.id,
        "title": new_job.title
    }


@app.post("/match")
def match_resume_to_job(resume_id: int, job_id: int, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    job = db.query(models.JobDescription).filter(models.JobDescription.id == job_id).first()

    if not resume:
        raise HTTPException(status_code=404, detail=f"Resume with ID {resume_id} not found.")
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found.")

    score = calculate_match_score(resume.extracted_text, job.description_text)

    match_result = models.MatchResult(
        resume_id=resume.id,
        job_id=job.id,
        match_score=score
    )
    db.add(match_result)
    db.commit()
    db.refresh(match_result)

    return {
        "resume_id": resume.id,
        "candidate_name": resume.candidate_name,
        "job_title": job.title,
        "match_score": score
    }


@app.get("/leaderboard/{job_id}")
def get_leaderboard(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.JobDescription).filter(models.JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found.")

    results = (
        db.query(models.MatchResult)
        .filter(models.MatchResult.job_id == job_id)
        .order_by(models.MatchResult.match_score.desc())
        .all()
    )

    leaderboard = []
    for rank, result in enumerate(results, start=1):
        leaderboard.append({
            "rank": rank,
            "resume_id": result.resume.id,
            "candidate_name": result.resume.candidate_name,
            "email": result.resume.email,
            "skills": result.resume.skills,
            "match_score": result.match_score
        })

    return {
        "job_title": job.title,
        "total_candidates": len(leaderboard),
        "leaderboard": leaderboard
    }