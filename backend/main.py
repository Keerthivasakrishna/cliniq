from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import json

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, rely on system environment variables

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


@app.post("/extract_patient")
async def extract_patient(data: CaseSheet):
    prompt = f"""
You are a clinical data extraction assistant.

Extract structured patient information from the following case sheet text.

Return ONLY a valid JSON object with exactly these fields:
- name (string)
- age (number)
- diagnosis (array of strings)
- chiefComplaint (string)
- medications (array of objects with "name", "dose", "freq" fields)
- riskScore (number between 0-100, estimate based on severity)
- adherenceScore (number between 0-100, estimate if not stated)
- labValues (object with any lab values mentioned, e.g. HbA1c, Creatinine, BP as string)

Do NOT include any markdown, code blocks, or extra text. Return raw JSON only.

Case Sheet:
{data.text}
"""

    response = model.generate_content(prompt)

    # Strip any markdown code fences Gemini might add
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Return the raw text so the frontend fallback can handle it
        parsed = {"raw": response.text, "name": "Extracted Patient", "age": 50, "diagnosis": ["Unknown"]}

    return parsed


@app.get("/")
def root():
    return {"status": "ClinIQ backend running", "version": "1.0"}
