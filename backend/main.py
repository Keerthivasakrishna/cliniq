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

    prompt = f"""You are a clinical AI assistant helping a doctor understand a patient's medical situation.

{rag_context}

Current Patient Data (structured):
{patient_summary}

Doctor's Question:
{data.question}

Provide a concise, evidence-based clinical answer in 2–3 sentences. Reference specific lab values and trends where relevant."""

    response = gemini_model.generate_content(prompt)
    print(f"[RAG] NL Query answered ({len(response.text)} chars)")

    return {"answer": response.text.strip()}


@app.get("/")
def root():
    return {
        "status": "ClinIQ backend running",
        "version": "2.0",
        "architecture": "ClinicalAgent + RAG Pipeline"
    }
