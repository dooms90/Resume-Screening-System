from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("all-MiniLM-L6-v2")

def calculate_match_score(resume_text: str, job_description_text: str) -> float:
    """
    Uses semantic embeddings to compare a resume against a job description.
    Understands meaning/context, not just exact keyword overlap.
    Returns a similarity score between 0 and 100.
    """
    resume_embedding = model.encode(resume_text, convert_to_tensor=True)
    job_embedding = model.encode(job_description_text, convert_to_tensor=True)

    similarity_score = util.cos_sim(resume_embedding, job_embedding).item()


    return round(similarity_score * 100, 2)