from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
import pdfplumber
import io
import pytesseract
from PIL import Image

from clinical_agent import ClinicalAgent
from rag_engine import rag_engine

# Load .env if present
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

gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# Instantiate the agent (shared singleton)
agent = ClinicalAgent(model=gemini_model)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class CaseSheet(BaseModel):
    text: str


class NLQueryRequest(BaseModel):
    question: str
    patient: dict


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/extract_patient")
async def extract_patient(file: UploadFile = File(...)):
    """
    Extracts text from uploaded PDF or TXT, then runs the full ClinicalAgent pipeline:
      1. Extract structured patient data
      2. Analyze lab abnormalities
      3. Detect affected organs
      4. Generate AI clinical summary

    Also stores the case sheet in the RAG engine for future NL queries.
    """
    content = await file.read()
    text = ""
    
    if file.filename.lower().endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    elif file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image)
    else:
        text = content.decode("utf-8", errors="ignore")

    # Run the 4-step agent pipeline
    result = agent.run(text)

    return result


@app.post("/nl_query")
async def nl_query(data: NLQueryRequest):
    """
    RAG-powered NL query:
      1. Retrieve relevant patient context from RAG store
      2. Send context + patient JSON + question to Gemini
      3. Return clinical answer
    """
    print(f"\n[RAG] NL Query received: '{data.question[:80]}'")
    # Retrieve relevant context from the RAG store
    rag_context = rag_engine.build_context(data.question)

    patient_summary = json.dumps(data.patient, indent=2)

    prompt = f"""You are a clinical AI assistant.

Using the patient data and retrieved history below, answer the doctor's question with evidence-based medical reasoning.
Be concise (2-3 sentences). Reference specific lab values or history where relevant.
Do not speculate beyond the available data.

{rag_context}

Patient Data (Structured):
{patient_summary}

Doctor Question:
{data.question}"""

    print(f"[RAG] Processing NL query: '{data.question[:80]}'")
    response = gemini_model.generate_content(prompt)
    answer = response.text.strip()
    print(f"[RAG] Answer generated ({len(answer)} chars)")
    return {"answer": answer}


class SecondOpinionRequest(BaseModel):
    hypothesis: str
    patient: dict


@app.post("/second_opinion")
async def second_opinion(data: SecondOpinionRequest):
    """
    AI Second Opinion Mode:
    Doctor proposes a diagnosis → Gemini cross-checks against patient data.
    Returns a structured verdict (CORROBORATED / NOT SUPPORTED / PARTIAL)
    with reasoning and evidence bullet points.
    """
    print(f"\n[AGENT] Second Opinion requested: '{data.hypothesis}'")

    patient_summary = json.dumps(data.patient, indent=2)

    prompt = f"""You are a clinical decision support AI acting as a second opinion consultant.

A doctor has proposed the following diagnosis hypothesis for their patient:
Hypothesis: "{data.hypothesis}"

Patient Data:
{patient_summary}

Your task:
1. Evaluate whether the patient data supports, contradicts, or partially supports this hypothesis.
2. Provide a verdict: CORROBORATED, NOT SUPPORTED, or PARTIAL
3. List up to 4 specific evidence points from the patient data (lab values, diagnoses, symptoms).
4. Write a 2-sentence clinical reasoning summary.

Return ONLY valid JSON in this exact format:
{{
  "verdict": "CORROBORATED",
  "reasoning": "2 sentence clinical summary here.",
  "evidence": [
    "Evidence point 1 with specific value",
    "Evidence point 2 with specific value"
  ]
}}"""

    response = gemini_model.generate_content(prompt)

    # Parse JSON from response
    import re as _re
    raw = response.text.strip()
    cleaned = _re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        match = _re.search(r"\{.*\}", cleaned, _re.DOTALL)
        try:
            result = json.loads(match.group()) if match else {}
        except Exception:
            result = {}

    result.setdefault("verdict", "UNKNOWN")
    result.setdefault("reasoning", "Unable to evaluate hypothesis with available data.")
    result.setdefault("evidence", [])

    print(f"[AGENT] Second Opinion verdict: {result.get('verdict')}")
    return result


@app.get("/")
def root():
    return {
        "status": "ClinIQ backend running",
        "version": "2.0",
        "architecture": "ClinicalAgent + RAG Pipeline"
    }
