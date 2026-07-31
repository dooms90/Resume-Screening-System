import spacy
import re

nlp = spacy.load("en_core_web_sm")

SKILLS_DB = [
    "python", "java", "c++", "javascript", "react", "node.js", "fastapi", "django",
    "flask", "sql", "mysql", "mongodb", "machine learning", "deep learning",
    "data analysis", "excel", "power bi", "tableau", "git", "docker", "kubernetes",
    "aws", "azure", "html", "css", "typescript", "communication", "leadership",
    "project management", "nlp", "tensorflow", "pytorch", "pandas", "numpy"
]

def extract_email(text: str) -> str:
    match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return match.group(0) if match else "Not found"

def extract_phone(text: str) -> str:
    match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}', text)
    return match.group(0) if match else "Not found"

def extract_name(text: str) -> str:
    doc = nlp(text[:500])  
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text
    return "Not found"

def extract_skills(text: str) -> list:
    text_lower = text.lower()
    found_skills = []
    for skill in SKILLS_DB:
        if skill in text_lower:
            found_skills.append(skill)
    return found_skills

def extract_resume_details(text: str) -> dict:
    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills(text)
    }