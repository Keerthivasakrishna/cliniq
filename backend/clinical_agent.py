"""
ClinicalAgent — A 4-step AI Agent pipeline for clinical document processing.

Step 1:  extract_patient_data    — Parse case sheet into structured JSON (Gemini)
Step 2:  analyze_lab_values      — Detect abnormal lab results against reference ranges
Step 3:  detect_affected_organs  — Map diagnoses + abnormal labs to body organs
Step 4:  generate_clinical_summary — Produce AI bullet-point brief (Gemini)
"""

import json
import re
from typing import Any

import google.generativeai as genai
from rag_engine import rag_engine

# ---------------------------------------------------------------------------
# Reference ranges for common labs
# ---------------------------------------------------------------------------
LAB_REFERENCES = {
    "HbA1c":      {"min": 0,   "max": 6.5,  "unit": "%",    "organ": "pancreas"},
    "Creatinine": {"min": 0.6, "max": 1.2,  "unit": "mg/dL","organ": "kidney"},
    "LDL":        {"min": 0,   "max": 100,  "unit": "mg/dL","organ": "heart"},
    "Cholesterol":{"min": 0,   "max": 200,  "unit": "mg/dL","organ": "heart"},
    "Triglycerides":{"min":0,  "max": 150,  "unit": "mg/dL","organ": "heart"},
    "BUN":        {"min": 7,   "max": 20,   "unit": "mg/dL","organ": "kidney"},
    "Hemoglobin": {"min": 12,  "max": 99,   "unit": "g/dL", "organ": None},
    "CRP":        {"min": 0,   "max": 3.0,  "unit": "mg/L", "organ": "heart"},
}

def _extract_json(text: str) -> dict:
    """Safely extract a JSON dict from Gemini's response."""
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    cleaned = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {}

def _regex_fallback(text: str, pattern: str, default: str) -> str:
    """Extract a string from document text via regex, or return default."""
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else default

class ClinicalAgent:
    def __init__(self, model: Any):
        self._model = model

    # ------------------------------------------------------------------
    # Main entry — orchestrate all 4 steps
    # ------------------------------------------------------------------

    def run(self, text: str) -> dict:
        print("\n" + "=" * 55)
        print("[AGENT] Clinical pipeline started")
        print("=" * 55)

        # Step 1: Extract structured patient data
        extracted = self._extract_patient_data(text)

        # Step 2: Identify abnormal lab values
        lab_alerts = self._analyze_lab_values(extracted)

        # Add document to RAG engine so we can retrieve from it
        patient_id = f"{extracted.get('name', 'unknown').replace(' ', '_')}_{id(text) % 9999}"
        rag_engine.add_document(patient_id, text)

        # Step 3: Retrieve patient context using the RAG system
        print("[AGENT] Step 3: Retrieving patient context using the RAG system...")
        query = f"{extracted.get('chief_complaint', '')} {', '.join(extracted.get('diagnosis', []))}"
        rag_context = rag_engine.build_context(query)

        # Step 4: Generate clinical insights using Gemini
        summary = self._generate_clinical_summary(extracted, lab_alerts, rag_context)

        print("[AGENT] Pipeline complete ✓\n")
        
        patient_info = {
            "name": extracted.get("name"),
            "age": extracted.get("age"),
            "gender": extracted.get("gender"),
            "chief_complaint": extracted.get("chief_complaint"),
            "diagnosis": extracted.get("diagnosis"),
            "riskScore": self._estimate_risk(lab_alerts),
            "adherenceScore": 70
        }
        
        insights = [line.strip() for line in summary.split("\n") if line.strip()]

        return {
            "patient_info": patient_info,
            "lab_results": extracted.get("lab_results", {}),
            "medications": extracted.get("medications", []),
            "clinical_insights": insights
        }

    # ------------------------------------------------------------------
    # Step 1 — Extract structured data
    # ------------------------------------------------------------------

    def _extract_patient_data(self, text: str) -> dict:
        print("[AGENT] Step 1: Extracting structured patient data from document...")

        prompt = f"""You are a medical data extraction assistant. Your only job is to extract structured data.

From the clinical document below, extract patient information and return ONLY valid JSON.
No explanation, no markdown, no code fences — ONLY the JSON object.

Use exactly this schema:

{{
  "name": "patient full name (string)",
  "age": 0,
  "gender": "Male or Female",
  "chief_complaint": "main symptom or reason for visit (string)",
  "diagnosis": ["condition 1", "condition 2"],
  "medications": [
    {{"name": "drug name", "dose": "dosage amount", "freq": "how often"}}
  ],
  "lab_results": {{
    "HbA1c": "",
    "Creatinine": "",
    "BloodPressure": "",
    "Cholesterol": "",
    "LDL": "",
    "Triglycerides": "",
    "BUN": ""
  }},
  "riskScore": 60,
  "adherenceScore": 75
}}

Rules (strictly follow these):
- Every field is REQUIRED. Never omit any field.
- For numeric fields (age, riskScore, adherenceScore) return actual numbers, not strings.
- For lab_results: if a value is not in the document return an empty string "".
- Never return null, undefined, "unknown", "not specified", or "N/A".
- riskScore 0-100: estimate from clinical severity (multiple abnormal labs = higher).
- adherenceScore 0-100: derive from medication compliance clues in the text.
- chief_complaint must be a complete sentence describing the patient's presenting problem.

Clinical Document:
{text}"""

        response = self._model.generate_content(prompt)

        # --- RAW RESPONSE LOGGING ---
        raw_text = response.text
        print(f"[AGENT] Raw Gemini response ({len(raw_text)} chars):")
        print("-" * 40)
        print(raw_text[:800] + ("..." if len(raw_text) > 800 else ""))
        print("-" * 40)

        extracted = _extract_json(raw_text)

        if not extracted:
            print("[AGENT] WARNING: JSON extraction failed — using full fallback defaults")

        # ------------------------------------------------------------------
        # Per-field validation and coercion
        # ------------------------------------------------------------------

        # name
        name = extracted.get("name", "")
        if not isinstance(name, str) or not name.strip() or name.lower() in ("unknown", "n/a", "not specified"):
            name = _regex_fallback(text, r"Patient Name:\s*(.+)", "Extracted Patient")
        extracted["name"] = name.strip()

        # age
        age = extracted.get("age", 0)
        try:
            age = int(str(age).split(".")[0])
        except (ValueError, TypeError):
            age_match = re.search(r"Age:\s*(\d+)", text, re.IGNORECASE)
            age = int(age_match.group(1)) if age_match else 50
        extracted["age"] = max(1, min(120, age))  # clamp to sane range

        # gender
        gender = extracted.get("gender", "")
        if not isinstance(gender, str) or gender.strip().lower() in ("", "unknown", "n/a"):
            # Infer from document text
            if re.search(r"\bfemale\b|\bwoman\b|\bher\b", text, re.IGNORECASE):
                gender = "Female"
            elif re.search(r"\bmale\b|\bman\b|\bhis\b", text, re.IGNORECASE):
                gender = "Male"
            else:
                gender = "Not specified"
        extracted["gender"] = gender.strip()

        # chief_complaint — normalise both snake_case and camelCase incoming fields
        complaint = (
            extracted.get("chief_complaint")
            or extracted.get("chiefComplaint")
            or ""
        )
        if not isinstance(complaint, str) or complaint.strip().lower() in ("", "not specified", "unknown", "n/a"):
            m = re.search(r"Chief Complaint:\s*([\s\S]*?)(?=\n\n|\nMedical|$)", text, re.IGNORECASE)
            complaint = m.group(1).strip().split("\n")[0] if m else "Presenting for clinical evaluation"
        extracted["chief_complaint"] = complaint.strip()
        extracted.pop("chiefComplaint", None)   # remove legacy key if present

        # diagnosis
        diag = extracted.get("diagnosis", [])
        if not isinstance(diag, list) or len(diag) == 0:
            m = re.search(r"Diagnosis(?:es)?:\s*(.+)", text, re.IGNORECASE)
            diag = [d.strip() for d in m.group(1).split(",")] if m else ["Clinical review required"]
        extracted["diagnosis"] = [str(d) for d in diag if str(d).strip().lower() not in ("unknown", "none", "")]

        # medications
        meds = extracted.get("medications", [])
        if not isinstance(meds, list):
            meds = []
        cleaned_meds = []
        for m in meds:
            if isinstance(m, dict):
                cleaned_meds.append({
                    "name": str(m.get("name") or "Medication").strip(),
                    "dose": str(m.get("dose") or "Unknown dose").strip(),
                    "freq": str(m.get("freq") or m.get("frequency") or "As directed").strip(),
                })
        extracted["medications"] = cleaned_meds

        # lab_results — normalise from both "lab_results" and "labValues"
        lab_results = (
            extracted.get("lab_results")
            or extracted.get("labValues")
            or {}
        )
        REQUIRED_LABS = ["HbA1c", "Creatinine", "BloodPressure", "Cholesterol", "LDL", "Triglycerides", "BUN"]
        # Migrate BP alias
        if "BP" in lab_results and "BloodPressure" not in lab_results:
            lab_results["BloodPressure"] = lab_results.pop("BP")
        for lab in REQUIRED_LABS:
            val = lab_results.get(lab, "")
            # Strip bad values
            if str(val).strip().lower() in ("null", "none", "unknown", "n/a", "not specified", "undefined"):
                val = ""
            lab_results[lab] = str(val).strip()
        extracted["lab_results"] = lab_results
        extracted.pop("labValues", None)     # remove legacy key

        # riskScore / adherenceScore — ensure integers in range
        for score_key, default in [("riskScore", 60), ("adherenceScore", 70)]:
            try:
                val = int(float(str(extracted.get(score_key, default))))
                extracted[score_key] = max(0, min(100, val))
            except (ValueError, TypeError):
                extracted[score_key] = default

        print(f"[AGENT] Validated extraction: {extracted['name']}, "
              f"age={extracted['age']}, diagnoses={extracted['diagnosis']}, "
              f"meds={len(extracted['medications'])}, "
              f"labs={[k for k,v in extracted['lab_results'].items() if v]}")

        return extracted

    # ------------------------------------------------------------------
    # Step 2 — Analyze lab values for abnormalities
    # ------------------------------------------------------------------

    def _analyze_lab_values(self, extracted: dict) -> list[dict]:
        print("[AGENT] Step 2: Analyzing lab values for abnormalities...")
        labs = extracted.get("labValues", {})
        alerts = []

        for lab_name, ref in LAB_REFERENCES.items():
            raw = labs.get(lab_name, "")
            try:
                value = float(str(raw).split("/")[0].strip())
            except (ValueError, TypeError):
                continue

            if value > ref["max"]:
                status = "HIGH"
            elif value < ref["min"]:
                status = "LOW"
            else:
                continue

            alert = {
                "lab": lab_name,
                "value": value,
                "unit": ref["unit"],
                "status": status,
                "reference": f"{ref['min']}–{ref['max']} {ref['unit']}",
                "organ": ref.get("organ"),
            }
            alerts.append(alert)
            print(f"[AGENT] Lab alert: {lab_name} {value} {ref['unit']} → {status} "
                  f"(ref: {ref['min']}–{ref['max']})")

        if not alerts:
            print("[AGENT] No abnormal lab values detected")

        return alerts



    # ------------------------------------------------------------------
    # Step 4 — Generate AI clinical summary
    # ------------------------------------------------------------------

    def _generate_clinical_summary(
        self, extracted: dict, lab_alerts: list[dict], organs: set[str]
    ) -> str:
        print("[AGENT] Step 4: Generating AI clinical summary via Gemini...")

        alert_text = "\n".join(
            f"- {a['lab']}: {a['value']} {a['unit']} ({a['status']}, ref {a['reference']})"
            for a in lab_alerts
        ) or "No significant abnormalities."

        organ_text = ", ".join(organs) if organs else "none identified"

        prompt = f"""You are a clinical assistant.

Patient Data:
Name: {extracted.get('name')}, Age: {extracted.get('age')}, Gender: {extracted.get('gender')}
Diagnoses: {', '.join(extracted.get('diagnosis', []))}
Chief Complaint: {extracted.get('chief_complaint', extracted.get('chiefComplaint', ''))}

Abnormal Lab Values:
{alert_text}

Analyze the patient data and identify:

1. Key abnormal findings
2. Possible medical risks
3. Organs potentially affected
4. Recommended follow-up tests

Return concise bullet points."""


        response = self._model.generate_content(prompt)
        summary = response.text.strip()
        print(f"[AGENT] Summary generated ({len(summary)} chars)")
        return summary

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _estimate_risk(lab_alerts: list[dict]) -> int:
        """Simple heuristic: each abnormal lab adds 10 risk points, capped at 95."""
        base = 40
        return min(95, base + len(lab_alerts) * 10)
