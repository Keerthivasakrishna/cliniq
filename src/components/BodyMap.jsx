import { T } from "../tokens";

export default function BodyMap() {
    return (
        <div
            style={{
                position: "relative",
                width: "180px",
                margin: "auto"
            }}
        >
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

            {/* Heart Node */}
            <div
                style={{
                    position: "absolute",
                    top: "26%",
                    left: "44%",
                    width: "12px",
                    height: "12px",
                    background: T.warning,
                    borderRadius: "50%"
                }}
            />

            {/* Kidney Node */}
            <div
                style={{
                    position: "absolute",
                    top: "43%",
                    left: "55%",
                    width: "12px",
                    height: "12px",
                    background: T.danger,
                    borderRadius: "50%"
                }}
            />

            {/* Pancreas Node */}
            <div
                style={{
                    position: "absolute",
                    top: "41%",
                    left: "45%",
                    width: "12px",
                    height: "12px",
                    background: T.danger,
                    borderRadius: "50%"
                }}
            />
        </div>
    );
}