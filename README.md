# ClinIQ – Physician AI Copilot

> A clinical decision support dashboard that uses Google Gemini to help doctors instantly extract, visualize, and query patient records.

---

## 🩺 Problem Statement

Doctors spend significant time manually reading long, unstructured patient case sheets before consultations. This slows down clinical workflows and delays critical decisions.

**ClinIQ** solves this by combining a modern patient dashboard with Google Gemini AI to:
- Instantly summarize patient histories
- Extract structured clinical profiles from raw text documents
- Let doctors query patient data using natural language
- Visualize lab trends, medications, and alerts in an intelligence-focused UI

---

## ✅ Features Implemented

| Feature | Description |
|---|---|
| **Patient Dashboard** | Overview page listing all registered patients |
| **Patient Search** | Real-time filter by patient name |
| **Click-to-Navigate** | Click any patient card to open their full Intel profile |
| **Patient Intel Page** | 3-column AI-powered clinical intelligence view |
| **AI Pre-Consultation Brief** | Auto-generated header with chief complaint and clinical findings |
| **Clinical Body Map** | Interactive SVG of the human body with clickable organ nodes |
| **Lab Trend Charts** | Line charts (via Recharts) for HbA1c, Creatinine, and Blood Pressure over time |
| **Medication Panel** | Active prescriptions list with pill shape/color visualization |
| **Clinical Pattern Feed** | Alert feed showing worsening clinical indicators |
| **Natural Language Query** | Doctors can ask questions about a patient's history in plain English |
| **Case Sheet Upload** | Upload `.txt` patient case files from the dashboard |
| **Gemini AI Extraction** | Backend sends uploaded text to Gemini, which returns structured JSON |
| **Dynamic Patient Creation** | Extracted profiles are immediately added to the live dashboard |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────┐
│        React Frontend (Vite)     │
│   Overview  ──→  PatientIntel    │
│   Upload .txt file               │
└──────────────┬───────────────────┘
               │ HTTP POST /extract_patient
               ▼
┌──────────────────────────────────┐
│      FastAPI Backend (Python)    │
│   Receives raw case sheet text   │
└──────────────┬───────────────────┘
               │ Gemini SDK
               ▼
┌──────────────────────────────────┐
│     Google Gemini 1.5 Flash      │
│   Extracts structured JSON       │
└──────────────┬───────────────────┘
               │
               ▼
        Patient object added
        to React state →
        Rendered in dashboard
```

**Frontend:** React 18 + Vite + Recharts + React Icons  
**Backend:** FastAPI + Uvicorn + Python 3  
**AI Model:** Google Gemini 1.5 Flash (`google-generativeai` SDK)

---

## 📁 Folder Structure

```
cliniq/
├── src/
│   ├── components/
│   │   ├── BodyMap.jsx         # Clinical human body SVG with organ nodes
│   │   ├── GlassPanel.jsx      # Reusable glassmorphic card container
│   │   ├── NLQuery.jsx         # Natural Language Query interface
│   │   ├── PatientCard.jsx     # Patient summary card with risk/adherence bars
│   │   └── Sidebar.jsx         # Navigation sidebar
│   ├── views/
│   │   ├── Overview.jsx        # Patient list, search, and file upload
│   │   └── PatientIntel.jsx    # Full patient intelligence dashboard
│   ├── utils/
│   │   └── aiParser.js         # Fetches Gemini extraction from backend
│   ├── mockData.js             # 5 realistic pre-loaded patient profiles
│   ├── tokens.js               # Design system tokens (colors, fonts)
│   ├── App.jsx                 # Root component with routing and global state
│   └── main.jsx
├── backend/
│   ├── main.py                 # FastAPI server with /extract_patient endpoint
│   └── requirements.txt        # Python dependencies
├── demo_case_sheets/
│   ├── patient_case_1.txt      # Robert Downey – Type 2 Diabetes, Hypertension
│   ├── patient_case_2.txt      # Sarah Connor – Chronic Kidney Disease
│   └── patient_case_3.txt      # Michael Scott – Rheumatoid Arthritis
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Installation & Running

### Prerequisites
- **Node.js** v18+
- **Python** 3.9+
- A **Gemini API Key** from [aistudio.google.com](https://aistudio.google.com)

---

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Runs at: `http://localhost:5173`

---

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Start the server
uvicorn main:app --reload
```

Runs at: `http://127.0.0.1:8000`

> ⚠️ Both servers must be running simultaneously for the AI upload feature to work.

---

## 🤖 How the AI Extraction Works

1. Doctor clicks **"+ Upload Case Sheet"** in the Overview dashboard
2. A `.txt` file is selected from `demo_case_sheets/` (or any plain text case file)
3. The React frontend reads the file using `FileReader.readAsText()`
4. The raw text is `POST`-ed to `http://127.0.0.1:8000/extract_patient`
5. The FastAPI backend constructs a Gemini prompt:

```
You are a clinical data extraction assistant.
Extract structured patient information from the case sheet below.
Return ONLY valid JSON with: name, age, diagnosis, chiefComplaint,
medications, riskScore, adherenceScore, labValues.
```

6. Gemini 1.5 Flash responds with a structured JSON string
7. The backend parses and returns the JSON to the frontend
8. The `aiParser.js` utility normalises the response into the full patient schema
9. The new patient is injected into the React state and the dashboard auto-navigates to their Patient Intel page

---

## 🎬 Demo Workflow

```
1. Open ClinIQ at http://localhost:5173
   └─ 2 pre-loaded patients visible (Eleanor Rigby, John Doe)

2. Search for a patient by name
   └─ Real-time filtering of patient cards

3. Click a patient card
   └─ Opens full Patient Intel view with:
      - AI Pre-Consultation Brief
      - Clinical Body Map
      - HbA1c / Creatinine / BP trend charts
      - Active prescriptions panel
      - Clinical pattern alerts

4. Ask a clinical question in the NL Query box
   └─ e.g. "What is the HbA1c trend?"
   └─ System responds using patient's actual lab data

5. Go back to Overview
   └─ Click "+ Upload Case Sheet"
   └─ Select patient_case_1.txt

6. Gemini AI extracts the clinical profile (1-2 seconds)
   └─ New patient appears instantly in the dashboard
   └─ Patient Intel view opens automatically with full profile
```

---

## 🔮 Future Enhancements

- **Second Opinion Mode** – Doctor proposes a diagnosis; AI cross-references patient lab data and returns `CORROBORATED` or `NOT SUPPORTED` with evidence
- **Real-Time Drug Interaction Detection** – Alert when uploaded medications interact with current prescriptions
- **NL Query → Gemini** – Replace deterministic query router with live Gemini API responses for more nuanced clinical Q&A
- **EHR Integration** – Connect to FHIR-compliant hospital systems for live patient data
- **Multi-Doctor Collaboration** – Share patient intel views across care teams
- **Streaming AI Responses** – Token-by-token streaming for a more realistic AI copilot feel

---

## 👨‍💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + Vite |
| Charts | Recharts |
| Icons | React Icons |
| Styling | Vanilla CSS with design tokens |
| Backend Framework | FastAPI + Uvicorn |
| AI Model | Google Gemini 1.5 Flash |
| AI SDK | `google-generativeai` (Python) |
| Version Control | Git + GitHub |

---

*Built for a healthcare AI hackathon — ClinIQ demonstrates how AI can reduce cognitive load on physicians and accelerate clinical decision-making.*
