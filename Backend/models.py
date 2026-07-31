from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String(100))
    email = Column(String(100))
    file_name = Column(String(255))
    extracted_text = Column(Text)
    skills = Column(Text)         
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    match_results = relationship("MatchResult", back_populates="resume")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150))
    description_text = Column(Text)
    required_skills = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    match_results = relationship("MatchResult", back_populates="job")


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    job_id = Column(Integer, ForeignKey("job_descriptions.id"))
    match_score = Column(Float)
    matched_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="match_results")
    job = relationship("JobDescription", back_populates="match_results")