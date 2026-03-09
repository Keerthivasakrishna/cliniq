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

# Diagnosis keyword → organ mapping
DIAGNOSIS_ORGAN_MAP = {
    "diabetes":       "pancreas",
    "glyc":           "pancreas",
    "hba1c":          "pancreas",
    "kidney":         "kidney",
    "renal":          "kidney",
    "nephro":         "kidney",
    "creatinine":     "kidney",
    "ckd":            "kidney",
    "heart":          "heart",
    "cardiac":        "heart",
    "coronary":       "heart",
    "cholesterol":    "heart",
    "lipid":          "heart",
    "hypertension":   "heart",
    "blood pressure": "heart",
    "lung":           "lungs",
    "pulmon":         "lungs",
    "asthma":         "lungs",
    "copd":           "lungs",
    "liver":          "liver",
    "hepat":          "liver",
    "arthritis":      "joints",
    "rheumat":        "joints",
    "joint":          "joints",
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

        # Step 1
        extracted = self._extract_patient_data(text)

        # Step 2
        lab_alerts = self._analyze_lab_values(extracted)

        # Step 3
        organs = self._detect_affected_organs(extracted, lab_alerts)

        # Step 4
        summary = self._generate_clinical_summary(extracted, lab_alerts, organs)

        print("[AGENT] Pipeline complete ✓\n")

        # Merge everything back into the extracted dict
        extracted["clinicalSummary"] = summary
        extracted.setdefault("riskScore", self._estimate_risk(lab_alerts))
        extracted.setdefault("adherenceScore", 70)
        extracted["_agentMeta"] = {
            "labAlerts": lab_alerts,
            "affectedOrgans": list(organs),
        }
        return extracted

    # ------------------------------------------------------------------
    # Step 1 — Extract structured data
    # ------------------------------------------------------------------

    def _extract_patient_data(self, text: str) -> dict:
        print("[AGENT] Step 1: Extracting structured patient data from document...")

        prompt = f"""You are a medical data extraction assistant.

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
    "BP": "value or empty string",
    "Cholesterol": "value or empty string",
    "LDL": "value or empty string",
    "Triglycerides": "value or empty string",
    "BUN": "value or empty string"
  }},
  "riskScore": 60,
  "adherenceScore": 75
}}

Rules:
- ALL fields are required. Never use null or undefined.
- riskScore: 0-100 based on condition severity.
- adherenceScore: 0-100 derived from medication compliance clues.

Clinical Document:
{text}"""

        response = self._model.generate_content(prompt)
        extracted = _extract_json(response.text)

        # Apply sensible defaults
        extracted.setdefault("name", "Unknown Patient")
        extracted.setdefault("age", 50)
        extracted.setdefault("gender", "Unknown")
        extracted.setdefault("diagnosis", [])
        extracted.setdefault("chiefComplaint", "Presenting for clinical evaluation")
        extracted.setdefault("medications", [])
        extracted.setdefault("labValues", {})

        print(f"[AGENT] Extracted: {extracted.get('name')}, age {extracted.get('age')}, "
              f"diagnoses: {extracted.get('diagnosis')}")
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
    # Step 3 — Detect affected organs
    # ------------------------------------------------------------------

    def _detect_affected_organs(self, extracted: dict, lab_alerts: list[dict]) -> set[str]:
        print("[AGENT] Step 3: Detecting affected organs from diagnoses and lab alerts...")

        organs: set[str] = set()
        all_text = " ".join(extracted.get("diagnosis", [])).lower()

        # From diagnosis keywords
        for keyword, organ in DIAGNOSIS_ORGAN_MAP.items():
            if keyword in all_text:
                organs.add(organ)

        # From abnormal lab → organ mapping
        for alert in lab_alerts:
            if alert.get("organ"):
                organs.add(alert["organ"])

        if not organs:
            organs.add("heart")  # Default fallback

        print(f"[AGENT] Organs flagged: {list(organs)}")
        return organs

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

        prompt = f"""You are a clinical AI assistant summarizing a patient's medical condition for a physician.

Patient: {extracted.get('name')}, age {extracted.get('age')}, {extracted.get('gender')}
Diagnoses: {', '.join(extracted.get('diagnosis', []))}
Chief Complaint: {extracted.get('chiefComplaint')}

Abnormal Lab Values:
{alert_text}

Affected Organ Systems: {organ_text}

Write exactly 3 concise bullet points (starting with •) summarizing the key clinical concerns.
Reference specific lab values. Keep each point under 20 words. Be medically precise."""

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
