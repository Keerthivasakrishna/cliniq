// Fake AI Extraction function that takes raw text, simulates a delay, and returns a structured patient object
export async function parseClinicalText(text) {
    // Simulate network delay for AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fallback extraction logic using Regex
    const nameMatch = text.match(/Patient Name:\s*(.+)/i);
    const ageMatch = text.match(/Age:\s*(\d+)/i);
    const diagMatch = text.match(/Diagnosis:\s*(.+)/i);

    // Extracting Chief Complaint
    const compMatch = text.match(/Chief Complaint:\s*([\s\S]*?)(?=Recent Labs:|Medications:|$)/i);

    // Extracting Medications block
    const medsMatch = text.match(/Medications:\s*([\s\S]*)$/i);

    const name = nameMatch ? nameMatch[1].trim() : "Unknown Patient";
    const age = ageMatch ? parseInt(ageMatch[1]) : 50;
    const diagnoses = diagMatch ? diagMatch[1].split(',').map(d => d.trim()) : ["Unknown"];
    const complaint = compMatch ? compMatch[1].trim() : "None stated";

    let parsedMeds = [];
    if (medsMatch) {
        const lines = medsMatch[1].split('\n').filter(l => l.trim().length > 0);
        parsedMeds = lines.map(line => {
            // simple parse assuming "Name Dosage Frequency"
            const parts = line.split(' ');
            const medName = parts[0];
            const dose = parts[1] || "Unknown dose";
            const freq = parts.slice(2).join(' ') || "Unknown frequency";
            return { name: medName, dose, freq, shape: "round", color: "#cbd5e1" };
        });
    }

    if (parsedMeds.length === 0) {
        parsedMeds = [
            { name: "Simulated Med A", dose: "10mg", freq: "OD", shape: "round", color: "#bae6fd" }
        ];
    }

    return {
        id: "P" + Math.floor(Math.random() * 10000),
        name,
        age,
        diagnosis: diagnoses,
        riskScore: Math.floor(Math.random() * 30) + 50, // 50-80
        adherenceScore: Math.floor(Math.random() * 40) + 50, // 50-90
        medications: parsedMeds,
        labTrends: {
            HbA1c: [
                { date: "Jan", value: 6.0 }, { date: "Feb", value: 6.2 }, { date: "Mar", value: 6.5 }, { date: "Apr", value: 6.8 }, { date: "May", value: 7.1 }
            ],
            Creatinine: [
                { date: "Jan", value: 1.0 }, { date: "Feb", value: 1.1 }, { date: "Mar", value: 1.1 }, { date: "Apr", value: 1.3 }, { date: "May", value: 1.4 }
            ],
            BP: [
                { date: "Jan", systolic: 130, diastolic: 80 }, { date: "Feb", systolic: 135, diastolic: 82 }, { date: "Mar", systolic: 140, diastolic: 85 }, { date: "Apr", systolic: 145, diastolic: 88 }, { date: "May", systolic: 150, diastolic: 90 }
            ]
        },
        consultBrief: {
            complaint,
            keyFindings: [
                "AI Extracted: Uploaded text indicates need for clinical review.",
                "AI Extracted: Check medication interactions against new data.",
                "AI Extracted: System parsed clinical parameters successfully."
            ]
        },
        alerts: [
            { id: 1, type: "warning", message: "AI Generated Alert: Review new case file against guidelines", time: "Just now" }
        ]
    };
}
