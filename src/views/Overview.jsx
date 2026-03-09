import GlassPanel from "../components/GlassPanel";
import BodyMap from "../components/BodyMap";
import PatientCard from "../components/PatientCard";
import { PATIENTS } from "../mockData";
export default function Overview() {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px"
            }}
        >
            <GlassPanel title="Active Patients">
                <h2>2</h2>
            </GlassPanel>

            <GlassPanel title="Critical Alerts">
                <h2>3</h2>
            </GlassPanel>

            <GlassPanel title="Pill Scans Today">
                <h2>4</h2>
            </GlassPanel>

            <GlassPanel title="Average Adherence">
                <h2>74%</h2>
            </GlassPanel>

            <GlassPanel title="Clinical Body Map">
                <BodyMap />
            </GlassPanel>

            <GlassPanel title="Patients">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px"
                    }}
                >
                    {PATIENTS.map((p) => (
                        <PatientCard key={p.id} patient={p} />
                    ))}
                </div>
            </GlassPanel>
        </div>
    );
}