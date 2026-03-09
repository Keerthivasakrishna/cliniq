import { useState } from "react";
import { T } from "../tokens";

export default function NLQuery({ patient }) {
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState("");

    function queryRouter(q) {
        const lower = q.toLowerCase();

        if (lower.includes("hba1c") || lower.includes("sugar")) {
            const labs = patient.labTrends?.HbA1c;
            if (!labs || labs.length === 0) return "No HbA1c data available.";

            const first = labs[0];
            const last = labs[labs.length - 1];

            return `${patient.name}'s HbA1c increased from ${first.value}% in ${first.date} to ${last.value}% in ${last.date}. This suggests worsening glycemic control.`;
        }

        if (lower.includes("creatinine") || lower.includes("kidney")) {
            const labs = patient.labTrends?.Creatinine;
            if (!labs || labs.length === 0) return "No creatinine records available.";

            const values = labs.map((l) => l.value).join(" → ");

            return `Creatinine trend: ${values} mg/dL. This indicates increasing renal stress.`;
        }

        if (lower.includes("bp") || lower.includes("blood pressure")) {
            return "Blood pressure readings have been persistently elevated despite medication.";
        }

        if (lower.includes("medication") || lower.includes("drug")) {
            if (!patient.medications || patient.medications.length === 0) {
                return `${patient.name} is not currently taking any recorded medications.`;
            }
            return `${patient.name} is currently taking ${patient.medications
                .map((m) => `${m.name} ${m.dose}`)
                .join(", ")}.`;
        }

        return "Try asking about HbA1c, creatinine, blood pressure, or medications.";
    }

    function handleAsk() {
        const result = queryRouter(query);
        setAnswer(result);
    }

    return (
        <div
            style={{
                padding: "20px",
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                background: "#fff"
            }}
        >
            <h3>Natural Language Query</h3>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about this patient's history..."
                    style={{
                        flex: 1,
                        padding: "10px",
                        border: `1px solid ${T.border}`,
                        borderRadius: "8px"
                    }}
                />

                <button
                    onClick={handleAsk}
                    style={{
                        background: T.primary,
                        color: "white",
                        border: "none",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        cursor: "pointer"
                    }}
                >
                    Ask
                </button>
            </div>

            {answer && (
                <div
                    style={{
                        marginTop: "15px",
                        padding: "12px",
                        background: "#F0FDF4",
                        borderRadius: "8px"
                    }}
                >
                    {answer}
                </div>
            )}
        </div>
    );
}
