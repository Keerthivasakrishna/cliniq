import { T } from "../tokens";

/**
 * Maps diagnosis keywords to body organ nodes.
 * Returns a set of active organ names for the current patient.
 */
function getActiveOrgans(diagnoses = []) {
    const active = new Set();
    const all = diagnoses.map(d => d.toLowerCase()).join(" ");

    if (all.includes("diabetes") || all.includes("glucose") || all.includes("hba1c") || all.includes("glyc")) {
        active.add("pancreas");
    }
    if (all.includes("kidney") || all.includes("renal") || all.includes("creatinine") || all.includes("nephro") || all.includes("ckd")) {
        active.add("kidney");
    }
    if (all.includes("heart") || all.includes("cardiac") || all.includes("coronary") || all.includes("cad") || all.includes("cholesterol") || all.includes("lipid")) {
        active.add("heart");
    }
    if (all.includes("lung") || all.includes("pulmon") || all.includes("asthma") || all.includes("copd") || all.includes("respir")) {
        active.add("lungs");
    }
    if (all.includes("liver") || all.includes("hepat")) {
        active.add("liver");
    }
    if (all.includes("hypertension") || all.includes("blood pressure") || all.includes("bp")) {
        active.add("heart");
    }
    if (all.includes("arthritis") || all.includes("joint") || all.includes("rheumat")) {
        active.add("joints");
    }

    // Default: show at least one node if nothing matched
    if (active.size === 0) active.add("heart");

    return active;
}

const ORGANS = {
    heart: { top: "26%", left: "44%", label: "Heart" },
    kidney: { top: "43%", left: "55%", label: "Kidneys" },
    pancreas: { top: "41%", left: "41%", label: "Pancreas" },
    lungs: { top: "24%", left: "33%", label: "Lungs" },
    liver: { top: "33%", left: "53%", label: "Liver" },
    joints: { top: "68%", left: "45%", label: "Joints" },
};

export default function BodyMap({ diagnoses = [] }) {
    const activeOrgans = getActiveOrgans(diagnoses);

    return (
        <div style={{ position: "relative", width: "180px", margin: "auto" }}>
            <svg
                viewBox="0 0 140 380"
                width="180"
                height="380"
                style={{ fill: "#1E293B", stroke: "#334155", strokeWidth: 1.5 }}
            >
                {/* Head */}
                <ellipse cx="70" cy="30" rx="20" ry="24" />
                {/* Neck */}
                <rect x="62" y="52" width="16" height="14" rx="4" />
                {/* Torso */}
                <path d="M36 68 Q24 88 26 136 L114 136 Q116 88 104 68 Q88 60 70 58 Q52 60 36 68 Z" />
                {/* Pelvis */}
                <path d="M26 136 Q22 168 36 178 L104 178 Q118 168 114 136 Z" />
                {/* Arms */}
                <path d="M26 72 Q10 96 12 158 L26 158 Q30 108 36 74 Z" />
                <path d="M104 74 Q110 108 114 158 L128 158 Q130 96 114 72 Z" />
                {/* Legs */}
                <path d="M36 178 Q32 228 34 304 L54 304 Q56 252 58 178 Z" />
                <path d="M82 178 Q84 252 86 304 L106 304 Q108 228 104 178 Z" />
            </svg>

            {/* Organ nodes — only render organs present in ORGANS map */}
            {Object.entries(ORGANS).map(([organ, pos]) => {
                const isActive = activeOrgans.has(organ);
                const color = isActive
                    ? (organ === "heart" || organ === "kidneys" ? T.danger : T.warning)
                    : "#334155";

                return (
                    <div
                        key={organ}
                        title={`${pos.label}${isActive ? " — Clinical alert" : ""}`}
                        style={{
                            position: "absolute",
                            top: pos.top,
                            left: pos.left,
                            width: isActive ? "14px" : "10px",
                            height: isActive ? "14px" : "10px",
                            background: color,
                            borderRadius: "50%",
                            border: isActive ? `2px solid ${color}` : "1px solid #475569",
                            boxShadow: isActive ? `0 0 8px ${color}` : "none",
                            transition: "all 0.3s ease",
                            cursor: "default"
                        }}
                    />
                );
            })}

            {/* Legend */}
            {activeOrgans.size > 0 && (
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {[...activeOrgans].map(organ => (
                        <div key={organ} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: T.textSecondary }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.warning, flexShrink: 0 }} />
                            <span>{ORGANS[organ]?.label} — Clinical Alert</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}