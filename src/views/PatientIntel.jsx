import { useState } from "react";
import { T } from "../tokens";
import GlassPanel from "../components/GlassPanel";
import BodyMap from "../components/BodyMap";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import {
    FiAlertTriangle,
    FiActivity,
    FiSearch,
    FiMessageSquare
} from "react-icons/fi";

export default function PatientIntel({ patient }) {
    const [chartTab, setChartTab] = useState("HbA1c");

    const riskColor =
        patient.riskScore > 60 ? T.danger : patient.riskScore > 40 ? T.warning : T.success;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top Section: AI Pre-Consultation Brief */}
            <GlassPanel
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}
            >
                <div>
                    <div style={{ fontSize: "12px", color: T.textSecondary, marginBottom: "4px" }}>
                        AI PRE-CONSULTATION BRIEF
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                        <h2 style={{ fontSize: "28px", margin: 0 }}>{patient.name}</h2>
                        <span style={{ color: T.textMuted }}>Age {patient.age}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        {patient.diagnosis.map((d, i) => (
                            <span
                                key={i}
                                style={{
                                    background: T.primarySoft,
                                    color: T.primaryBorder, // Need softer text on primarySoft
                                    color: T.primary,
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    fontWeight: "500"
                                }}
                            >
                                {d}
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: T.textSecondary, marginBottom: "8px" }}>
                        CLINICAL RISK SCORE
                    </div>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: riskColor }}>
                        {patient.riskScore}%
                    </div>
                </div>
            </GlassPanel>

            {/* 3-Column Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "24px" }}>
                {/* Column 1: Body Map */}
                <GlassPanel title="Clinical Body Map" style={{ height: "460px" }}>
                    <BodyMap />
                </GlassPanel>

                {/* Column 2: Lab Trends */}
                <GlassPanel title="Key Lab Trends" style={{ height: "460px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                        {["HbA1c", "Creatinine", "BP"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setChartTab(tab)}
                                style={{
                                    background: chartTab === tab ? T.primarySoft : "transparent",
                                    color: chartTab === tab ? T.primary : T.textSecondary,
                                    border: `1px solid ${chartTab === tab ? T.primaryBorder : T.border}`,
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    transition: "all 0.2s"
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            {chartTab !== "BP" ? (
                                <LineChart data={patient.labTrends[chartTab]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                                    <XAxis dataKey="date" stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: T.bgDeep, border: `1px solid ${T.border}`, borderRadius: "8px", color: T.textPrimary }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={T.primary}
                                        strokeWidth={3}
                                        dot={{ fill: T.primary, r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            ) : (
                                <LineChart data={patient.labTrends.BP}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                                    <XAxis dataKey="date" stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: T.bgDeep, border: `1px solid ${T.border}`, borderRadius: "8px", color: T.textPrimary }}
                                    />
                                    <Line type="monotone" dataKey="systolic" stroke={T.danger} strokeWidth={2} name="Systolic" />
                                    <Line type="monotone" dataKey="diastolic" stroke={T.warning} strokeWidth={2} name="Diastolic" />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </GlassPanel>

                {/* Column 3: Medications */}
                <GlassPanel title="Active Prescriptions" style={{ height: "460px", overflowY: "auto" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {patient.medications.map((med, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "12px",
                                    border: `1px solid ${T.border}`,
                                    borderRadius: "8px",
                                    background: T.bgMain
                                }}
                            >
                                {/* Pill Shape Visualization */}
                                <div
                                    style={{
                                        width: "24px",
                                        height: med.shape === "oval" ? "12px" : "24px",
                                        borderRadius: med.shape === "oval" ? "12px" : "50%",
                                        background: med.color,
                                        border: "1px solid #ccc",
                                        marginRight: "16px",
                                        flexShrink: 0
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: "600", fontSize: "14px", color: T.textPrimary }}>
                                        {med.name}
                                    </div>
                                    <div style={{ fontSize: "12px", color: T.textSecondary }}>
                                        {med.dose} • {med.freq}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassPanel>
            </div>

            {/* Bottom Row: Alerts and Placeholders */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "24px" }}>
                {/* Alerts Feed */}
                <GlassPanel title="Clinical Pattern Feed">
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {patient.alerts.map((alert) => (
                            <div
                                key={alert.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px",
                                    background: alert.type === "danger" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                    borderLeft: `4px solid ${alert.type === "danger" ? T.danger : T.warning}`,
                                    borderRadius: "4px"
                                }}
                            >
                                {alert.type === "danger" ? (
                                    <FiAlertTriangle color={T.danger} size={18} />
                                ) : (
                                    <FiActivity color={T.warning} size={18} />
                                )}
                                <div style={{ flex: 1, fontSize: "14px", color: T.textPrimary }}>
                                    {alert.message}
                                </div>
                                <div style={{ fontSize: "12px", color: T.textSecondary }}>
                                    {alert.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassPanel>

                {/* Natural Language Query */}
                <GlassPanel
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        background: `linear-gradient(135deg, ${T.primarySoft}, ${T.bgCard})`,
                        cursor: "pointer"
                    }}
                >
                    <div style={{ padding: "16px", background: "#fff", borderRadius: "50%", color: T.primary }}>
                        <FiSearch size={24} />
                    </div>
                    <div style={{ fontWeight: "600", color: T.textPrimary }}>Natural Language Query</div>
                    <div style={{ fontSize: "12px", color: T.textSecondary, textAlign: "center" }}>
                        Ask AI about this patient's history
                    </div>
                </GlassPanel>

                {/* Second Opinion Mode */}
                <GlassPanel
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        background: `linear-gradient(135deg, #EFF6FF, ${T.bgCard})`,
                        cursor: "pointer"
                    }}
                >
                    <div style={{ padding: "16px", background: "#fff", borderRadius: "50%", color: "#3B82F6" }}>
                        <FiMessageSquare size={24} />
                    </div>
                    <div style={{ fontWeight: "600", color: T.textPrimary }}>Second Opinion Mode</div>
                    <div style={{ fontSize: "12px", color: T.textSecondary, textAlign: "center" }}>
                        Consult medical guidelines & literature
                    </div>
                </GlassPanel>
            </div>
        </div>
    );
}
