import { useState } from "react";
import PatientCard from "../components/PatientCard";
import GlassPanel from "../components/GlassPanel";
import { T } from "../tokens";
import { parseClinicalText } from "../utils/aiParser";

export default function Overview({ patients, setPatients, setActivePatient, goToPatient }) {
    const [search, setSearch] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const filteredPatients = patients.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const newPatient = await parseClinicalText(text);

            setPatients((prev) => [...prev, newPatient]);
            setActivePatient(newPatient);
            setIsUploading(false);
            goToPatient();
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Search + Add Patient */}
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
                            borderRadius: "8px"
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
                            alignItems: "center"
                        }}
                    >
                        {isUploading ? "Extracting AI Profile..." : "+ Upload Case Sheet"}
                        <input
                            type="file"
                            accept=".txt"
                            style={{ display: "none" }}
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            </GlassPanel>

            {/* Patient List */}
            <GlassPanel title="Patients">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px"
                    }}
                >
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

        </div>
    );
}