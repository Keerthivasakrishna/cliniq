import { useState, useRef } from "react";
import { T } from "../tokens";

const BACKEND_URL = "http://127.0.0.1:8000";

const VERDICT_STYLES = {
    CORROBORATED: {
        bg: "#F0FDF4",
        border: "#22C55E",
        icon: "✓",
        iconBg: "#22C55E",
        label: "CORROBORATED"
    },
    "NOT SUPPORTED": {
        bg: "#FFF7ED",
        border: "#F97316",
        icon: "✕",
        iconBg: "#F97316",
        label: "NOT SUPPORTED"
    },
    PARTIAL: {
        bg: "#FFFBEB",
        border: "#EAB308",
        icon: "~",
        iconBg: "#EAB308",
        label: "PARTIAL EVIDENCE"
    },
    UNKNOWN: {
        bg: "#F8FAFC",
        border: "#94A3B8",
        icon: "?",
        iconBg: "#94A3B8",
        label: "INCONCLUSIVE"
    }
};

function parseVerdict(text) {
    const upper = text.toUpperCase();
    if (upper.includes("CORROBORATED")) return "CORROBORATED";
    if (upper.includes("NOT SUPPORTED") || upper.includes("UNSUPPORTED") || upper.includes("REFUTED")) return "NOT SUPPORTED";
    if (upper.includes("PARTIAL")) return "PARTIAL";
    return "UNKNOWN";
}

export default function SecondOpinion({ patient }) {
    const [hypothesis, setHypothesis] = useState("");
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const streamRef = useRef(null);

    const EXAMPLE_HYPOTHESES = [
        "Diabetic nephropathy",
        "Hypertensive heart disease",
        "Metabolic syndrome",
        "Chronic kidney disease"
    ];

    function streamText(fullText) {
        const words = fullText.split(" ");
        let i = 0;
        setDisplayedText("");
        if (streamRef.current) clearInterval(streamRef.current);
        streamRef.current = setInterval(() => {
            if (i < words.length) {
                setDisplayedText(prev => prev ? prev + " " + words[i] : words[i]);
                i++;
            } else {
                clearInterval(streamRef.current);
            }
        }, 50);
    }

    async function handleCheck() {
        if (!hypothesis.trim()) return;
        setIsLoading(true);
        setResult(null);
        setDisplayedText("");
        if (streamRef.current) clearInterval(streamRef.current);

        try {
            const resp = await fetch(`${BACKEND_URL}/second_opinion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hypothesis, patient })
            });

            if (!resp.ok) throw new Error("Backend unavailable");
            const data = await resp.json();

            const verdict = parseVerdict(data.verdict || "");
            const cleaned = (data.reasoning || "")
                .replace(/^(CORROBORATED|NOT SUPPORTED|PARTIAL)[:\s]*/i, "")
                .trim();

            setResult({ verdict, text: cleaned, evidence: data.evidence || [] });
            streamText(cleaned);
        } catch {
            // Graceful local fallback
            const localResult = localSecondOpinion(hypothesis, patient);
            setResult(localResult);
            streamText(localResult.text);
        } finally {
            setIsLoading(false);
        }
    }

    const style = result ? (VERDICT_STYLES[result.verdict] || VERDICT_STYLES.UNKNOWN) : null;

    return (
        <div style={{
            padding: "20px",
            border: `1px solid ${T.border}`,
            borderRadius: "12px",
            background: "#fff"
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: "700", fontSize: "14px"
                }}>
                    2nd
                </div>
                <div>
                    <div style={{ fontWeight: "700", fontSize: "15px", color: T.textPrimary }}>
                        Second Opinion Mode
                    </div>
                    <div style={{ fontSize: "12px", color: T.textSecondary }}>
                        Propose a diagnosis — AI cross-checks against patient data
                    </div>
                </div>
            </div>

            {/* Hypothesis Input */}
            <div style={{ display: "flex", gap: "10px" }}>
                <input
                    value={hypothesis}
                    onChange={e => setHypothesis(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCheck()}
                    placeholder="e.g. Diabetic nephropathy"
                    disabled={isLoading}
                    style={{
                        flex: 1, padding: "10px", fontSize: "14px",
                        border: `1px solid ${T.border}`, borderRadius: "8px", outline: "none"
                    }}
                />
                <button
                    onClick={handleCheck}
                    disabled={isLoading || !hypothesis.trim()}
                    style={{
                        background: isLoading ? T.textMuted : "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                        color: "#fff", border: "none", padding: "10px 18px",
                        borderRadius: "8px", fontWeight: "600", cursor: isLoading ? "not-allowed" : "pointer"
                    }}
                >
                    {isLoading ? "Checking..." : "Check Evidence"}
                </button>
            </div>

            {/* Suggestion chips */}
            {!result && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                    {EXAMPLE_HYPOTHESES.map(h => (
                        <button
                            key={h}
                            onClick={() => setHypothesis(h)}
                            style={{
                                background: "#EFF6FF", color: "#3B82F6",
                                border: "1px solid #BFDBFE", padding: "4px 10px",
                                borderRadius: "20px", fontSize: "12px", cursor: "pointer"
                            }}
                        >
                            {h}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div style={{ marginTop: "14px", color: T.textSecondary, fontSize: "14px" }}>
                    🔍 Analyzing patient data against hypothesis...
                </div>
            )}

            {/* Result card */}
            {result && !isLoading && (
                <div style={{
                    marginTop: "16px",
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    borderLeft: `4px solid ${style.border}`,
                    borderRadius: "10px",
                    padding: "16px"
                }}>
                    {/* Verdict badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                        <div style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            background: style.iconBg, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: "700", fontSize: "14px"
                        }}>
                            {style.icon}
                        </div>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: style.iconBg }}>
                            {style.label}
                        </div>
                        <div style={{ marginLeft: "auto", fontSize: "12px", color: T.textSecondary }}>
                            Hypothesis: <em>{hypothesis}</em>
                        </div>
                    </div>

                    {/* Streaming reasoning */}
                    <div style={{ fontSize: "14px", lineHeight: "1.7", color: T.textPrimary }}>
                        {displayedText}
                        {displayedText.length < (result?.text?.length || 0) && (
                            <span style={{
                                display: "inline-block", width: "2px", height: "14px",
                                background: style.border, marginLeft: "2px",
                                verticalAlign: "middle", animation: "blink 0.7s step-start infinite"
                            }} />
                        )}
                    </div>

                    {/* Evidence bullets */}
                    {result.evidence?.length > 0 && (
                        <div style={{ marginTop: "12px" }}>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: T.textSecondary, marginBottom: "6px" }}>
                                CLINICAL EVIDENCE
                            </div>
                            {result.evidence.map((e, i) => (
                                <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: T.textPrimary, marginBottom: "4px" }}>
                                    <span style={{ color: style.iconBg, fontWeight: "700" }}>•</span>
                                    <span>{e}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
        </div>
    );
}

/** Local fallback when backend is offline */
function localSecondOpinion(hypothesis, patient) {
    const h = hypothesis.toLowerCase();
    const labs = patient.labTrends || {};
    const diag = (patient.diagnosis || []).join(" ").toLowerCase();

    const lastHbA1c = labs.HbA1c?.slice(-1)[0]?.value;
    const lastCreat = labs.Creatinine?.slice(-1)[0]?.value;
    const lastBP = labs.BP?.slice(-1)[0];

    const evidence = [];

    if (h.includes("nephropathy") || h.includes("kidney") || h.includes("renal")) {
        if (lastCreat > 1.2) evidence.push(`Elevated Creatinine: ${lastCreat} mg/dL (ref: 0.6–1.2)`);
        if (lastHbA1c > 6.5) evidence.push(`Uncontrolled diabetes with HbA1c: ${lastHbA1c}%`);
        if (diag.includes("hypertension") || (lastBP?.systolic > 140)) evidence.push("Persistent hypertension — known nephropathy risk factor");
        const verdict = evidence.length >= 2 ? "CORROBORATED" : "PARTIAL";
        return {
            verdict,
            evidence,
            text: evidence.length >= 2
                ? `Evidence supports ${hypothesis}. Rising creatinine alongside uncontrolled diabetes and hypertension aligns with diabetic nephropathy progression.`
                : `Partial evidence for ${hypothesis}. Continue monitoring renal function.`
        };
    }

    if (h.includes("metabolic") || h.includes("syndrome")) {
        if (lastHbA1c > 6.5) evidence.push(`Elevated HbA1c: ${lastHbA1c}%`);
        if (lastBP?.systolic > 130) evidence.push(`Elevated BP: ${lastBP?.systolic}/${lastBP?.diastolic} mmHg`);
        if (diag.includes("diabetes")) evidence.push("Type 2 Diabetes confirmed");
        return {
            verdict: evidence.length >= 2 ? "CORROBORATED" : "PARTIAL",
            evidence,
            text: `Metabolic syndrome criteria assessment: ${evidence.length} of 5 criteria met from available data.`
        };
    }

    return {
        verdict: "UNKNOWN",
        evidence: [],
        text: `Insufficient data in the current patient record to evaluate "${hypothesis}". Consider ordering additional investigations.`
    };
}
