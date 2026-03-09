import { T } from "../tokens";

export default function PatientCard({ patient }) {
    const riskColor =
        patient.riskScore > 60 ? T.danger : patient.riskScore > 40 ? T.warning : T.success;

    return (
        <div
            style={{
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                padding: "16px",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
        >
            <div style={{ fontWeight: "600", fontSize: "16px" }}>{patient.name}</div>

            <div style={{ color: T.textSecondary, fontSize: "13px", marginBottom: "10px" }}>
                Age {patient.age}
            </div>

            <div style={{ marginBottom: "12px" }}>
                {patient.diagnosis.map((d, i) => (
                    <span
                        key={i}
                        style={{
                            background: T.primarySoft,
                            color: T.primary,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            marginRight: "6px"
                        }}
                    >
                        {d}
                    </span>
                ))}
            </div>

            {/* Risk Score */}
            <div style={{ fontSize: "12px", marginBottom: "4px" }}>Risk Score</div>
            <div
                style={{
                    height: "6px",
                    background: "#eee",
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginBottom: "10px"
                }}
            >
                <div
                    style={{
                        width: `${patient.riskScore}%`,
                        background: riskColor,
                        height: "100%"
                    }}
                />
            </div>

            {/* Adherence */}
            <div style={{ fontSize: "12px", marginBottom: "4px" }}>Adherence</div>
            <div
                style={{
                    height: "6px",
                    background: "#eee",
                    borderRadius: "4px",
                    overflow: "hidden"
                }}
            >
                <div
                    style={{
                        width: `${patient.adherenceScore}%`,
                        background: T.success,
                        height: "100%"
                    }}
                />
            </div>
        </div>
    );
}