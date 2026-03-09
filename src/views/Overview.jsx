import { useState } from "react";
import { PATIENTS } from "../mockData";
import PatientCard from "../components/PatientCard";
import GlassPanel from "../components/GlassPanel";
import { T } from "../tokens";

export default function Overview({ setActivePatient, goToPatient }) {
    const [search, setSearch] = useState("");

    const filteredPatients = PATIENTS.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

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

                    <button
                        style={{
                            background: T.primary,
                            color: "white",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            cursor: "pointer"
                        }}
                    >
                        + Add Patient
                    </button>
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