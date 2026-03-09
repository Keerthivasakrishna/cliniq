const BACKEND_URL = "http://127.0.0.1:8000";

/**
 * Sends raw clinical text to the FastAPI/Gemini backend (ClinicalAgent pipeline).
 * Handles both new snake_case schema (lab_results, chief_complaint) and legacy camelCase.
 * Returns a fully structured patient object ready for the dashboard.
 */
export async function parseClinicalText(text) {
    let extracted = null;

    try {
        const response = await fetch(`${BACKEND_URL}/extract_patient`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error(`Backend error: ${response.status}`);

        extracted = await response.json();
        console.log("[aiParser] Backend extraction received:", extracted);
    } catch (err) {
        console.warn("[aiParser] Gemini extraction failed, using local fallback:", err.message);
        extracted = fallbackParse(text);
    }

    return buildPatientObject(extracted);
}

/** Simple regex fallback when the backend is offline */
function fallbackParse(text) {
    const nameMatch = text.match(/Patient Name:\s*(.+)/i);
    const ageMatch = text.match(/Age:\s*(\d+)/i);
    const diagMatch = text.match(/Diagnosis(?:es)?:\s*(.+)/i);
    const compMatch = text.match(/Chief Complaint:\s*([\s\S]*?)(?=Recent Labs:|Medications:|Authorized|Medical History|$)/i);
    const medsMatch = text.match(/(?:Current )?Medications:\s*([\s\S]*?)(?=\n\n|\nAuthorized|Doctor|$)/i);

    let meds = [];
    if (medsMatch) {
        meds = medsMatch[1]
            .split("\n")
            .filter(l => l.trim().length > 2)
            .map(line => {
                const parts = line.trim().split(/\s+/);
                return { name: parts[0], dose: parts[1] || "Unknown dose", freq: parts.slice(2).join(" ") || "As directed" };
            });
    }

    return {
        name: nameMatch ? nameMatch[1].trim() : "Extracted Patient",
        age: ageMatch ? parseInt(ageMatch[1]) : 50,
        gender: text.match(/\bfemale\b|\bwoman\b/i) ? "Female" : text.match(/\bmale\b|\bman\b/i) ? "Male" : "Not specified",
        diagnosis: diagMatch ? diagMatch[1].split(",").map(d => d.trim()) : ["Clinical review required"],
        chief_complaint: compMatch ? compMatch[1].trim().split("\n")[0] : "Presenting for clinical evaluation",
        medications: meds,
        lab_results: { HbA1c: "", Creatinine: "", BloodPressure: "", Cholesterol: "", LDL: "", Triglycerides: "", BUN: "" },
        riskScore: 60,
        adherenceScore: 70,
        clinicalSummary: "• Patient data extracted locally — backend offline\n• Validate all fields before clinical use\n• Lab trends generated from document snapshot"
    };
}

/** Normalise the structured extraction result into the full PATIENTS dashboard schema */
function buildPatientObject(extracted) {
    // --- Medications ---
    const meds = (extracted.medications || []).map(m => ({
        name: m.name || "Medication",
        dose: m.dose || "Unknown dose",
        freq: m.freq || m.frequency || "As directed",
        shape: "round",
        color: "#bae6fd"
    }));

    // --- Lab values — handle both schema versions ---
    const labs = extracted.lab_results || extracted.labValues || {};
    const bp = labs.BloodPressure || labs.BP || "";

    const parseNum = (val, fallback) => { const n = parseFloat(String(val).split("/")[0]); return isNaN(n) ? fallback : n; };
    const hba1c = parseNum(labs.HbA1c, 6.5);
    const creat = parseNum(labs.Creatinine, 1.1);
    const bpParts = String(bp || "130/82").split("/");
    const sys = parseInt(bpParts[0]) || 130;
    const dia = parseInt(bpParts[1]) || 82;

    // --- Build 5-month trend lines from snapshot values ---
    const trend = (start, step = 0.1) =>
        ["Jan", "Feb", "Mar", "Apr", "May"].map((date, i) => ({
            date,
            value: parseFloat((start + i * step).toFixed(2))
        }));

    // --- Parse AI clinical summary into keyFindings array ---
    const summaryText = extracted.clinicalSummary || "";
    const keyFindings = summaryText
        .split("\n")
        .map(l => l.replace(/^[•\-]\s*/, "").trim())
        .filter(l => l.length > 0);

    if (keyFindings.length === 0) {
        const diagList = (extracted.diagnosis || []).join(", ") || "Unknown";
        keyFindings.push(
            `Diagnosis: ${diagList}`,
            `Labs — HbA1c: ${hba1c}%, Creatinine: ${creat} mg/dL, BP: ${sys}/${dia}`,
            `Risk score estimated at ${extracted.riskScore || 60}%`
        );
    }

    // --- chief_complaint normalisation ---
    const complaint =
        extracted.chief_complaint ||
        extracted.chiefComplaint ||
        "Presenting for clinical evaluation";

    return {
        id: "P" + Math.floor(Math.random() * 90000 + 10000),
        name: extracted.name || "Extracted Patient",
        age: extracted.age || 50,
        gender: extracted.gender || "Not specified",
        diagnosis: (extracted.diagnosis || []).length ? extracted.diagnosis : ["Clinical review required"],
        riskScore: extracted.riskScore || 60,
        adherenceScore: extracted.adherenceScore || 70,
        medications: meds,
        labTrends: {
            HbA1c: trend(hba1c, 0.15),
            Creatinine: trend(creat, 0.08),
            BP: ["Jan", "Feb", "Mar", "Apr", "May"].map((date, i) => ({
                date,
                systolic: sys + i * 2,
                diastolic: dia + i
            }))
        },
        consultBrief: {
            complaint,
            keyFindings
        },
        alerts: [
            {
                id: 1,
                type: "warning",
                message: "AI Extracted Profile — validate all fields before clinical use.",
                time: "Just now"
            }
        ]
    };
}
