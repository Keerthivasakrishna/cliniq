import { useState } from "react";
import PatientCard from "../components/PatientCard";
import GlassPanel from "../components/GlassPanel";
import { T } from "../tokens";
import { parseClinicalText } from "../utils/aiParser";

export default function Overview({ patients, setPatients, setActivePatient, goToPatient }) {
    const [search, setSearch] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [extractedIndicators, setExtractedIndicators] = useState(null);

    const filteredPatients = patients.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setExtractedIndicators(null);

        try {
            const newPatient = await parseClinicalText(file);

            // Build extraction summary for the confirmation panel
            const labs = newPatient.labTrends;
            const latestHbA1c = labs?.HbA1c?.slice(-1)[0]?.value;
            const latestCreat = labs?.Creatinine?.slice(-1)[0]?.value;
            const latestBP = labs?.BP?.slice(-1)[0];

            setExtractedIndicators({
                name: newPatient.name,
                age: newPatient.age,
                diagnosis: newPatient.diagnosis,
                HbA1c: latestHbA1c,
                Creatinine: latestCreat,
                BP: latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : null,
                meds: newPatient.medications?.length || 0,
                riskScore: newPatient.riskScore
            });

            setPatients((prev) => [...prev, newPatient]);
            setActivePatient(newPatient);

            // Auto-navigate after 2s so user can see the confirmation
            setTimeout(() => {
                goToPatient();
            }, 2000);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Search + Upload */}
            <GlassPanel>
                <div style={{ display: "flex", gap: "10px" }}>
                    <input
                        placeholder="Search patient..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            flex: 1,
                            padding: "10px",
                            border: `1px solid ${T.border}`,
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none"
                        }}
                    />

                    <label
                        style={{
                            background: isUploading ? T.textMuted : T.primary,
                            color: "white",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            cursor: isUploading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontWeight: "600",
                            fontSize: "14px"
                        }}
                    >
                        {isUploading ? (
                            <>
                                <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                                Gemini Extracting...
                            </>
                        ) : "⬆ Upload Case Sheet (.txt, .pdf, .img)"}
                        <input
                            type="file"
                            accept=".txt,.pdf,.png,.jpg,.jpeg"
                            style={{ display: "none" }}
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>

                {/* AI Extraction Indicator Panel */}
                {extractedIndicators && (
                    <div
                        style={{
                            marginTop: "16px",
                            padding: "14px",
                            background: "#F0FDF4",
                            border: `1px solid ${T.primary}`,
                            borderRadius: "8px",
                            borderLeft: `4px solid ${T.primary}`
                        }}
                    >
                        <div style={{ fontSize: "12px", color: T.primary, fontWeight: "700", marginBottom: "8px" }}>
                            ✓ AI Extracted the Following Clinical Indicators
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                            {[
                                { label: "Patient", value: `${extractedIndicators.name}, ${extractedIndicators.age}y` },
                                { label: "Diagnosis", value: extractedIndicators.diagnosis?.join(", ") || "—" },
                                { label: "Risk Score", value: `${extractedIndicators.riskScore}%` },
                                extractedIndicators.HbA1c && { label: "HbA1c", value: `${extractedIndicators.HbA1c}%` },
                                extractedIndicators.Creatinine && { label: "Creatinine", value: `${extractedIndicators.Creatinine} mg/dL` },
                                extractedIndicators.BP && { label: "Blood Pressure", value: `${extractedIndicators.BP} mmHg` },
                                { label: "Medications", value: `${extractedIndicators.meds} identified` }
                            ].filter(Boolean).map(({ label, value }) => (
                                <div key={label} style={{ background: "#fff", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${T.border}` }}>
                                    <div style={{ fontSize: "10px", color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                                    <div style={{ fontSize: "13px", fontWeight: "600", color: T.textPrimary, marginTop: "2px" }}>{value}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: "12px", color: T.textSecondary, marginTop: "10px" }}>
                            Opening Patient Intel in a moment...
                        </div>
                    </div>
                )}
            </GlassPanel>

            {/* Patient List */}
            <GlassPanel title="Patients">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {filteredPatients.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => {
                                setActivePatient(p);
                                goToPatient();
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <PatientCard patient={p} />
                        </div>
                    ))}
                </div>
            </GlassPanel>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}