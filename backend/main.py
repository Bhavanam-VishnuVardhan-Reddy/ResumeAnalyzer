
import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import fitz
import shutil
import sqlite3
import re
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI


# Setup logging
logging.basicConfig(level=logging.INFO)

# Ensure DB and table exist
def init_db():
    conn = sqlite3.connect("mydb.db")
    with conn:
        cur = conn.cursor()
        cur.execute('''
                CREATE TABLE IF NOT EXISTS resumes
                   (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                   filename TEXT,
                   uploaded_at DATE,
                   name TEXT,
                   email TEXT,
                   phone TEXT,
                   extracted_data TEXT,
                   llm_analysis TEXT
                   )
                   ''')
    conn.close()

init_db()

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR="uploads"
os.makedirs(UPLOAD_DIR,exist_ok=True)


# Check for GEMINI_API_KEY
GEMINI_API_KEY = "AIzaSyD5RqBLvSwh5913uSmfo_MEtiV8UeS6nBA"
if not GEMINI_API_KEY:
    logging.error("GEMINI_API_KEY environment variable not set. Please set it before running the server.")
    raise RuntimeError("GEMINI_API_KEY environment variable not set.")

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",  # or "gemini-1.5-pro"
    google_api_key=GEMINI_API_KEY
)


def extract_resume_info(text):
    info={}
    lines=[line.strip() for line in text.splitlines() if line.strip()]
    if lines:
        info["name"]=lines[0]
    email_match=re.search(r"[A-Za-z0-9_%+-]+@[A-za-z0-9.-]+\.[A-za-z]{2,}",text)
    if email_match:
        info["email"]=email_match.group(0)
    phone_match=re.search(r"\+?\d[\d\s-]{8,}\d",text)
    if phone_match:
        info["phone"]=phone_match.group(0)
    
    known_skills = ["Python", "Java", "C++", "SQL", "React", "Node.js", "Django", "FastAPI"]
    found_skills = [s for s in known_skills if s.lower() in text.lower()]

    words=set(re.findall(r"\b[A-Z][a-zA-Z0-9\+\.#]*\b",text))
    additional_skills=[w for w in words if w not in found_skills]
    info["skills"]=found_skills+additional_skills

    return info

@app.post("/api/upload")

def uploadResume(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        text = ""
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        except Exception as e:
            logging.error(f"Error reading PDF: {e}")
            raise HTTPException(status_code=400, detail="Failed to read PDF file.")

        parsed_resume = extract_resume_info(text)
        parsed_resume['file_name'] = file.filename
        parsed_resume["extracted_data"] = text
        parsed_resume["uploaded_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        prompt = f"""
            You are an expert resume analyzer.
            Analyze the following resume text and return ONLY valid JSON. 
            Do not include explanations, notes, or extra text.

            Expected JSON format:
            {{
            "skills": ["skill1", "skill2"],
            "education": ["degree1", "degree2"],
            "experience": ["exp1", "exp2"],
            "rating": "number (0-10)",
            "improvements": ["suggestion1", "suggestion2"]
            }}

            Resume text:
            {text}
            """

        try:
            response = llm.invoke(prompt)
            raw = response.content.strip()
            logging.info(f"Raw LLM response: {raw}")

            # Try to locate JSON inside the response
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start != -1 and end != -1:
                raw_json = raw[start:end]
                result = json.loads(raw_json)
            else:
                raise ValueError("No JSON object found in response")
        except Exception as e:
            logging.error(f"LLM error or invalid JSON: {e}")
            result = {"error": "Invalid JSON response or LLM error", "raw": raw}

        parsed_resume['llm_analysis'] = result

        # Use a new DB connection per request
        conn = sqlite3.connect("mydb.db")
        with conn:
            cur = conn.cursor()
            cur.execute('''
                    INSERT INTO resumes
                        (filename,uploaded_at,name,email,phone,extracted_data,llm_analysis)
                    values(?,?,?,?,?,?,?)
                        ''', (
                            parsed_resume.get("file_name"),
                            parsed_resume.get("uploaded_at"),
                            parsed_resume.get("name"),
                            parsed_resume.get("email"),
                            parsed_resume.get("phone"),
                            parsed_resume.get("extracted_data"),
                            json.dumps(parsed_resume.get("llm_analysis"))
                        ))
        conn.close()
        return {"status": "success", "resume": parsed_resume}
    except Exception as e:
        logging.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

@app.get("/api/resumes")

def get_resumes():
    arr = []
    conn = sqlite3.connect("mydb.db")
    with conn:
        cur = conn.cursor()
        rows = cur.execute('''
            SELECT id, filename, name, email, phone
            FROM resumes
        ''').fetchall()
    conn.close()
    for row in rows:
        arr.append({
            "id": row[0],
            "filename": row[1],
            "name": row[2],
            "email": row[3],
            "phone": row[4]
        })
    return {"status": "success", "body": arr}

@app.get("/api/resumes/{resume_id}")
async def get_resume(resume_id: int):
    conn = sqlite3.connect("mydb.db")
    with conn:
        cur = conn.cursor()
        row = cur.execute('''
            SELECT * FROM resumes WHERE id = ?
        ''', (resume_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="No resume found with specified ID")
    response = {
        "id": row[0],
        "filename": row[1],
        "uploaded_at": row[2],
        "name": row[3],
        "email": row[4],
        "phone": row[5],
        "extracted_data": row[6],
        "llm_analysis": json.loads(row[7]) if row[7] else {}
    }
    return {"status": "success", "body": response}