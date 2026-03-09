from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os

app = FastAPI()

# Allow requests from the Vite dev server (and any origin for the hackathon)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API Key — set this as environment variable GEMINI_API_KEY
# or paste your key directly here for the hackathon demo
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
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
- riskScore (number between 0-100, based on severity of condition)
- adherenceScore (number between 0-100)
- labValues (object with any lab values mentioned, e.g. HbA1c, Creatinine, BP)

Do not include any markdown formatting, code blocks, or extra text. Return raw JSON only.

Case Sheet:
{data.text}
"""

    response = model.generate_content(prompt)
    return {"result": response.text}


@app.get("/")
def root():
    return {"status": "ClinIQ backend running", "version": "1.0"}
