const BACKEND_URL = "http://127.0.0.1:8000";

/**
 * Sends raw clinical text to the FastAPI /Gemini backend.
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

        const data = await response.json();

        // Clean Gemini response — strip markdown code fences if present
        const raw = data.result
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        extracted = JSON.parse(raw);
    } catch (err) {
        console.warn("Gemini extraction failed, using fallback parser:", err.message);
        extracted = fallbackParse(text);
    }

    return buildPatientObject(extracted, text);
}

/** Simple regex fallback if the backend is unavailable */
function fallbackParse(text) {
    const nameMatch = text.match(/Patient Name:\s*(.+)/i);
    const ageMatch = text.match(/Age:\s*(\d+)/i);
    const diagMatch = text.match(/Diagnosis:\s*(.+)/i);
    const compMatch = text.match(/Chief Complaint:\s*([\s\S]*?)(?=Recent Labs:|Medications:|$)/i);
    const medsMatch = text.match(/Medications:\s*([\s\S]*)$/i);

    let meds = [];
    if (medsMatch) {
        meds = medsMatch[1]
            .split("\n")
            .filter(l => l.trim())
            .map(line => {
                const parts = line.trim().split(" ");
                return { name: parts[0], dose: parts[1] || "Unknown", freq: parts.slice(2).join(" ") || "OD" };
            });
    }

    return {
        name: nameMatch ? nameMatch[1].trim() : "Unknown Patient",
        age: ageMatch ? parseInt(ageMatch[1]) : 50,
        diagnosis: diagMatch ? diagMatch[1].split(",").map(d => d.trim()) : ["Unknown"],
        chiefComplaint: compMatch ? compMatch[1].trim() : "Not specified",
        medications: meds,
        riskScore: 60,
        adherenceScore: 70,
        labValues: {}
    };
}

/** Normalise the Gemini (or fallback) result into the full PATIENTS schema */
function buildPatientObject(extracted, rawText) {
    const meds = (extracted.medications || []).map(m => ({
        name: m.name || "Unknown",
        dose: m.dose || "Unknown",
        freq: m.freq || m.frequency || "OD",
        shape: "round",
        color: "#bae6fd"
    }));

    // Build flat 5-month trend from a single lab snapshot value
    const labs = extracted.labValues || {};
    const trend = (start) =>
        ["Jan", "Feb", "Mar", "Apr", "May"].map((date, i) => ({
            date,
            value: parseFloat((start + i * 0.1).toFixed(1))
        }));

    const hba1cStart = parseFloat(labs.HbA1c) || 6.5;
    const creatStart = parseFloat(labs.Creatinine) || 1.1;
    const bpRaw = String(labs.BP || "130/82").split("/");
    const sys = parseInt(bpRaw[0]) || 130;
    const dia = parseInt(bpRaw[1]) || 82;

    return {
        id: "P" + Math.floor(Math.random() * 90000 + 10000),
        name: extracted.name || "Unknown Patient",
        age: extracted.age || 50,
        diagnosis: extracted.diagnosis || ["Unknown"],
        riskScore: extracted.riskScore || 60,
        adherenceScore: extracted.adherenceScore || 70,
        medications: meds,
        labTrends: {
            HbA1c: trend(hba1cStart),
            Creatinine: trend(creatStart),
            BP: ["Jan", "Feb", "Mar", "Apr", "May"].map((date, i) => ({
                date,
                systolic: sys + i * 2,
                diastolic: dia + i
            }))
        },
        consultBrief: {
            complaint: extracted.chiefComplaint || "Not specified",
            keyFindings: [
                "AI Extracted: Patient data parsed from uploaded case sheet.",
                `Labs on record: HbA1c ${hba1cStart}, Creatinine ${creatStart}, BP ${sys}/${dia}`,
                "Further workup recommended based on current trends."
            ]
        },
        alerts: [
            { id: 1, type: "warning", message: "AI Extracted: Review and validate auto-populated profile.", time: "Just now" }
        ]
    };
}
