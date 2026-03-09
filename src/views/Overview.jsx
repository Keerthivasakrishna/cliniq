import GlassPanel from "../components/GlassPanel";
import BodyMap from "../components/BodyMap";
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
        </div>
    );
}