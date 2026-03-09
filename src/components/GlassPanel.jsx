import { T } from "../tokens";

export default function GlassPanel({ title, children, style = {} }) {
    return (
        <div
            style={{
                background: T.bgPanel,
                border: `1px solid ${T.borderSubtle}`,
                borderRadius: "16px",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                padding: "20px",
                ...style
            }}
        >
            {title && (
                <div
                    style={{
                        fontSize: "12px",
                        letterSpacing: "0.1em",
                        color: T.teal,
                        marginBottom: "12px",
                        textTransform: "uppercase"
                    }}
                >
                    {title}
                </div>
            )}

            {children}
        </div>
    );
}