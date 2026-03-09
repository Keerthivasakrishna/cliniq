const BACKEND_URL = "http://127.0.0.1:8000";

/**
 * Sends raw clinical text to the FastAPI/Gemini backend.
 * The backend now returns structured JSON directly (no wrapping "result" key).
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

        // Backend now returns clean JSON directly (not wrapped in "result")
        extracted = await response.json();
    } catch (err) {
        console.warn("Gemini extraction failed, using local fallback:", err.message);
        extracted = fallbackParse(text);
    }

    return buildPatientObject(extracted);
}

/** Simple regex fallback if the backend is unavailable */
function fallbackParse(text) {
    const nameMatch = text.match(/Patient Name:\s*(.+)/i);
    const ageMatch = text.match(/Age:\s*(\d+)/i);
    const diagMatch = text.match(/Diagnosis:\s*(.+)/i);
    const compMatch = text.match(/Chief Complaint:\s*([\s\S]*?)(?=Recent Labs:|Medications:|Authorized|$)/i);
    const medsMatch = text.match(/(?:Current )?Medications:\s*([\s\S]*?)(?=\n\n|\nAuthorized|$)/i);

    let meds = [];
    if (medsMatch) {
        meds = medsMatch[1]
            .split("\n")
            .filter(l => l.trim().length > 2)
            .map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    name: parts[0],
                    dose: parts[1] || "Unknown dose",
                    freq: parts.slice(2).join(" ") || "As directed"
                };
            });
    }

    return {
        name: nameMatch ? nameMatch[1].trim() : "Extracted Patient",
        age: ageMatch ? parseInt(ageMatch[1]) : 50,
        diagnosis: diagMatch ? diagMatch[1].split(",").map(d => d.trim()) : ["Clinical review required"],
        chiefComplaint: compMatch ? compMatch[1].trim().split("\n")[0] : "Presenting for clinical evaluation",
        medications: meds,
        riskScore: 60,
        adherenceScore: 70,
        labValues: {},
        clinicalSummary: "• Patient data extracted from uploaded case sheet\n• Review all fields and validate with clinical judgment\n• Lab trends generated from snapshot values"
    };
}

/** Normalise the Gemini (or fallback) result into the full PATIENTS schema */
function buildPatientObject(extracted) {
    const meds = (extracted.medications || []).map(m => ({
        name: m.name || "Medication",
        dose: m.dose || "Unknown dose",
        freq: m.freq || m.frequency || "As directed",
        shape: "round",
        color: "#bae6fd"
    }));

    // Build 5-month trend lines from single snapshot lab values
    const labs = extracted.labValues || {};
    const buildTrend = (start, step = 0.1) =>
        ["Jan", "Feb", "Mar", "Apr", "May"].map((date, i) => ({
            date,
            value: parseFloat((start + i * step).toFixed(1))
        }));

    const hba1cStart = parseFloat(labs.HbA1c) || 6.5;
    const creatStart = parseFloat(labs.Creatinine) || 1.1;
    const bpRaw = String(labs.BP || "130/82").split("/");
    const sys = parseInt(bpRaw[0]) || 130;
    const dia = parseInt(bpRaw[1]) || 82;

    // Parse the AI-generated clinical summary bullets into keyFindings array
    const summaryText = extracted.clinicalSummary || "";
    const keyFindings = summaryText
        .split("\n")
        .map(l => l.replace(/^[•\-]\s*/, "").trim())
        .filter(l => l.length > 0);

    if (keyFindings.length === 0) {
        keyFindings.push(
            `Diagnosis: ${(extracted.diagnosis || []).join(", ")}`,
            `Labs — HbA1c: ${hba1cStart}%, Creatinine: ${creatStart} mg/dL, BP: ${sys}/${dia}`,
            `Risk score estimated at ${extracted.riskScore || 60}%`
        );
    }

    return {
        id: "P" + Math.floor(Math.random() * 90000 + 10000),
        name: extracted.name || "Extracted Patient",
        age: extracted.age || 50,
        diagnosis: extracted.diagnosis?.length ? extracted.diagnosis : ["Clinical review required"],
        riskScore: extracted.riskScore || 60,
        adherenceScore: extracted.adherenceScore || 70,
        medications: meds,
        labTrends: {
            HbA1c: buildTrend(hba1cStart, 0.15),
            Creatinine: buildTrend(creatStart, 0.08),
            BP: ["Jan", "Feb", "Mar", "Apr", "May"].map((date, i) => ({
                date,
                systolic: sys + i * 2,
                diastolic: dia + i
            }))
        },
        consultBrief: {
            complaint: extracted.chiefComplaint || "Presenting for clinical evaluation",
            keyFindings
        },
        alerts: [
            { id: 1, type: "warning", message: "AI Extracted Profile — validate all fields before clinical use.", time: "Just now" }
        ]
    };
}
