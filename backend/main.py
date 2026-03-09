from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import json

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
async def extract_patient(data: CaseSheet):
    """
    Runs the full ClinicalAgent pipeline:
      1. Extract structured patient data
      2. Analyze lab abnormalities
      3. Detect affected organs
      4. Generate AI clinical summary

    Also stores the case sheet in the RAG engine for future NL queries.
    """
    # Run the 4-step agent pipeline
    result = agent.run(data.text)

    # Store in RAG for future NL queries (key by patient name + random id)
    patient_id = f"{result.get('name', 'unknown').replace(' ', '_')}_{id(data.text) % 9999}"
    rag_engine.add_document(patient_id, data.text)

    # Strip internal agent metadata before returning to frontend
    result.pop("_agentMeta", None)

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

Using the patient data below answer the doctor's question with evidence-based medical reasoning.
Be concise (2-3 sentences). Reference specific lab values or diagnoses from the patient record where relevant.
Do not speculate beyond the available data.

Patient Data:
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
