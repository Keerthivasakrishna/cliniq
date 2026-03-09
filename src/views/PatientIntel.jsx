import { T } from "../tokens";
import GlassPanel from "../components/GlassPanel";
import NLQuery from "../components/NLQuery";
import SecondOpinion from "../components/SecondOpinion";

// Lab reference ranges for status colouring
const LAB_REFS = {
    HbA1c: { min: 0, max: 6.5, unit: "%" },
    Creatinine: { min: 0.6, max: 1.2, unit: "mg/dL" },
    BloodPressure: { min: 0, max: 130, unit: "mmHg" },
    Cholesterol: { min: 0, max: 200, unit: "mg/dL" },
    LDL: { min: 0, max: 100, unit: "mg/dL" },
    Triglycerides: { min: 0, max: 150, unit: "mg/dL" },
    BUN: { min: 7, max: 20, unit: "mg/dL" },
};

function labStatus(key, rawVal) {
    const ref = LAB_REFS[key];
    if (!ref || !rawVal || String(rawVal).trim() === "") return "normal";
    const num = parseFloat(String(rawVal).split("/")[0]);
    if (isNaN(num)) return "normal";
    if (num > ref.max) return "high";
    if (num < ref.min) return "low";
    return "normal";
}

const STATUS_STYLE = {
    high: { color: "#EF4444", bg: "#FEF2F2", label: "HIGH" },
    low: { color: "#F59E0B", bg: "#FFFBEB", label: "LOW" },
    normal: { color: "#22C55E", bg: "#F0FDF4", label: "NORMAL" },
};

export default function PatientIntel({ patient }) {
    // Prefer new snake_case field, fall back to camelCase
    const labResults = patient.lab_results || patient.labValues || {};
    const complaint = patient.consultBrief?.complaint
        || patient.chief_complaint
        || "Not recorded";
    const insights = patient.consultBrief?.keyFindings || [];
    const meds = patient.medications || [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* ── Section 1: Patient Overview ── */}
            <GlassPanel>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <div style={{ fontSize: "11px", color: T.textSecondary, letterSpacing: "1px", marginBottom: "6px" }}>
                            PATIENT OVERVIEW
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                            <h2 style={{ fontSize: "26px", margin: 0, color: T.textPrimary }}>
                                {patient.name}
                            </h2>
                            <span style={{ color: T.textMuted, fontSize: "15px" }}>
                                {patient.age}y · {patient.gender || "—"}
                            </span>
                        </div>

                        {/* Diagnoses */}
                        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                            {(patient.diagnosis || []).map((d, i) => (
                                <span
                                    key={i}
                                    style={{
                                        background: T.primarySoft,
                                        color: T.primary,
                                        padding: "3px 10px",
                                        borderRadius: "4px",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                        border: `1px solid ${T.primaryBorder}`
                                    }}
                                >
                                    {d}
                                </span>
                            ))}
                        </div>

                        {/* Chief Complaint */}
                        <div style={{
                            marginTop: "12px",
                            padding: "10px 14px",
                            background: T.bgMain,
                            borderRadius: "6px",
                            border: `1px solid ${T.border}`,
                            fontSize: "14px",
                            color: T.textPrimary
                        }}>
                            <span style={{ color: T.textSecondary, fontWeight: "600" }}>Chief Complaint: </span>
                            {complaint}
                        </div>
                    </div>

                    {/* Medications summary sidebar */}
                    {meds.length > 0 && (
                        <div style={{
                            minWidth: "200px",
                            maxWidth: "260px",
                            padding: "12px 16px",
                            background: T.bgMain,
                            borderRadius: "8px",
                            border: `1px solid ${T.border}`
                        }}>
                            <div style={{ fontSize: "11px", color: T.textSecondary, letterSpacing: "1px", marginBottom: "8px" }}>
                                ACTIVE MEDICATIONS
                            </div>
                            {meds.map((m, i) => (
                                <div key={i} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "13px",
                                    color: T.textPrimary,
                                    padding: "4px 0",
                                    borderBottom: i < meds.length - 1 ? `1px solid ${T.border}` : "none"
                                }}>
                                    <span style={{ fontWeight: "500" }}>{m.name}</span>
                                    <span style={{ color: T.textSecondary }}>{m.dose}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </GlassPanel>

            {/* ── Section 2: Lab Results Table ── */}
            <GlassPanel>
                <div style={{ fontSize: "11px", color: T.textSecondary, letterSpacing: "1px", marginBottom: "14px" }}>
                    EXTRACTED LAB RESULTS
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                        <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                            {["Investigation", "Result", "Reference Range", "Unit", "Status"].map(h => (
                                <th key={h} style={{
                                    textAlign: "left",
                                    padding: "8px 12px",
                                    color: T.textSecondary,
                                    fontWeight: "600",
                                    fontSize: "12px",
                                    letterSpacing: "0.5px"
                                }}>
                                    {h.toUpperCase()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(LAB_REFS).map(([key, ref]) => {
                            const val = labResults[key];
                            if (!val || String(val).trim() === "") return null;
                            const status = labStatus(key, val);
                            const s = STATUS_STYLE[status];
                            return (
                                <tr key={key} style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <td style={{ padding: "10px 12px", fontWeight: "500", color: T.textPrimary }}>
                                        {key === "BloodPressure" ? "Blood Pressure" : key}
                                    </td>
                                    <td style={{ padding: "10px 12px", fontWeight: "700", color: s.color }}>
                                        {val}
                                    </td>
                                    <td style={{ padding: "10px 12px", color: T.textSecondary }}>
                                        {ref.min > 0 ? `${ref.min} – ${ref.max}` : `< ${ref.max}`}
                                    </td>
                                    <td style={{ padding: "10px 12px", color: T.textSecondary }}>
                                        {ref.unit}
                                    </td>
                                    <td style={{ padding: "10px 12px" }}>
                                        <span style={{
                                            background: s.bg,
                                            color: s.color,
                                            padding: "2px 8px",
                                            borderRadius: "4px",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            letterSpacing: "0.5px"
                                        }}>
                                            {s.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {Object.values(labResults).every(v => !v || !String(v).trim()) && (
                            <tr>
                                <td colSpan={5} style={{ padding: "16px 12px", color: T.textMuted, textAlign: "center" }}>
                                    No lab values extracted from this record.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </GlassPanel>

            {/* ── Section 3: AI Clinical Insights ── */}
            {insights.length > 0 && (
                <GlassPanel>
                    <div style={{ fontSize: "11px", color: T.textSecondary, letterSpacing: "1px", marginBottom: "14px" }}>
                        AI CLINICAL INSIGHTS
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {insights.map((finding, i) => (
                            <div key={i} style={{
                                display: "flex",
                                gap: "12px",
                                padding: "12px 14px",
                                background: "#F0FDF4",
                                borderLeft: `3px solid ${T.primary}`,
                                borderRadius: "4px",
                                fontSize: "14px",
                                color: T.textPrimary,
                                lineHeight: "1.5"
                            }}>
                                <span style={{ color: T.primary, fontWeight: "700", flexShrink: 0 }}>•</span>
                                <span>{finding}</span>
                            </div>
                        ))}
                    </div>
                </GlassPanel>
            )}

            {/* ── Section 4: Doctor Query Panels ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <NLQuery patient={patient} />
                <SecondOpinion patient={patient} />
            </div>

        </div>
    );
}
