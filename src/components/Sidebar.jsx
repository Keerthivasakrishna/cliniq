import { T } from "../tokens";

const NAV = [
    { id: "overview", label: "Overview", icon: "⬡" },
    { id: "patient", label: "Patient Intel", icon: "◈" },
    { id: "pillguard", label: "Pill Guard", icon: "◉" },
    { id: "analytics", label: "Analytics", icon: "◬" },
    { id: "alerts", label: "Alert Centre", icon: "◎" }
];

export default function Sidebar({ active, setActive }) {
    return (
        <div
            style={{
                width: "220px",
                background: T.bgSidebar,
                height: "100vh",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
            }}
        >
            <div>
                <h2>
                    <span style={{ color: T.teal }}>Clin</span>
                    <span style={{ color: T.textPrimary }}>IQ</span>
                </h2>

                <div style={{ marginTop: "40px" }}>
                    {NAV.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setActive(item.id)}
                            style={{
                                padding: "10px",
                                marginBottom: "10px",
                                cursor: "pointer",
                                borderRadius: "8px",
                                background:
                                    active === item.id ? T.tealDim : "transparent",
                                color:
                                    active === item.id ? T.teal : T.textSecondary
                            }}
                        >
                            {item.icon} {item.label}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ fontSize: "12px", color: T.textMuted }}>
                PHYSICIAN AI CO-PILOT
            </div>
        </div>
    );
}