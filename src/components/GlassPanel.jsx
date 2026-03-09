import { T } from "../tokens";

export default function GlassPanel({ title, children, style = {} }) {
    return (
        <div
            style={{
                background: T.bgCard,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                ...style
            }}
        >
            {title && (
                <div
                    style={{
                        fontSize: "12px",
                        color: T.textSecondary,
                        marginBottom: "10px",
                        fontWeight: "600",
                        letterSpacing: "0.04em"
                    }}
                >
                    {title}
                </div>
            )}

            {children}
        </div>
    );
}