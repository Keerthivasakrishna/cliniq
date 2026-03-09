from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
import re

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash")


class CaseSheet(BaseModel):
    text: str


def extract_json(text: str) -> dict:
    """Safely extract JSON from Gemini response (which may contain markdown)."""
    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strip markdown fences then try again
    cleaned = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Last resort: find the first {...} block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return {}


@app.post("/extract_patient")
async def extract_patient(data: CaseSheet):
    extraction_prompt = f"""You are a medical data extraction assistant.

From the clinical document below, extract structured patient information.

Return ONLY valid JSON in this exact format with no extra text or markdown:

{{
  "name": "patient full name",
  "age": 0,
  "gender": "Male or Female",
  "diagnosis": ["condition 1", "condition 2"],
  "chiefComplaint": "main symptom or reason for visit",
  "medications": [
    {{"name": "drug name", "dose": "amount", "freq": "how often"}}
  ],
  "labValues": {{
    "HbA1c": "value or empty string",
    "Creatinine": "value or empty string",
    "BP": "value or empty string"
  }},
  "riskScore": 60,
  "adherenceScore": 75
}}

Rules:
- ALL fields are required. Never use null or undefined.
- If a value is not in the document, make a reasonable clinical inference and note it.
- riskScore: 0-100 based on severity (high labs, multiple conditions = higher score).
- adherenceScore: 0-100 based on medication compliance clues in the text.
- chiefComplaint must be a real sentence describing the presenting problem.

Clinical Document:
{data.text}"""

    response = model.generate_content(extraction_prompt)
    parsed = extract_json(response.text)

    # Handle missing required fields gracefully
    parsed.setdefault("name", "Unknown Patient")
    parsed.setdefault("age", 50)
    parsed.setdefault("gender", "Unknown")
    parsed.setdefault("diagnosis", ["See clinical notes"])
    parsed.setdefault("chiefComplaint", "Presenting for clinical review")
    parsed.setdefault("medications", [])
    parsed.setdefault("labValues", {})
    parsed.setdefault("riskScore", 60)
    parsed.setdefault("adherenceScore", 70)

    # --- Second Gemini call: generate clinical summary bullets ---
    summary_prompt = f"""You are a clinical AI assistant.

Based on this patient data, write exactly 3 short bullet points summarizing the key clinical concerns.
Format each point starting with a bullet •.
Be specific — include lab values and trends where relevant.
Keep each point under 15 words.

Patient Data:
{json.dumps(parsed, indent=2)}"""

    try:
        summary_response = model.generate_content(summary_prompt)
        parsed["clinicalSummary"] = summary_response.text.strip()
    except Exception:
        parsed["clinicalSummary"] = (
            f"• Diagnosis: {', '.join(parsed['diagnosis'])}\n"
            f"• Chief complaint: {parsed['chiefComplaint']}\n"
            f"• Risk score estimated at {parsed['riskScore']}%"
        )

    return parsed


class NLQueryRequest(BaseModel):
    question: str
    patient: dict


@app.post("/nl_query")
async def nl_query(data: NLQueryRequest):
    patient_summary = json.dumps(data.patient, indent=2)

    prompt = f"""You are a clinical AI assistant helping a doctor understand a patient's medical situation.

Based on the patient data below, answer the doctor's question with a concise, evidence-based clinical explanation.
Mention specific lab values and trends where relevant. Limit your response to 2-3 sentences.

Patient Data:
{patient_summary}

Doctor's Question:
{data.question}

Your Answer:"""

    response = model.generate_content(prompt)
    return {"answer": response.text.strip()}


@app.get("/")
def root():
    return {"status": "ClinIQ backend running", "version": "1.0"}
