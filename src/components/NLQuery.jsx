import { useState, useRef } from "react";
import { T } from "../tokens";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function NLQuery({ patient }) {
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [displayedAnswer, setDisplayedAnswer] = useState("");
    const streamTimerRef = useRef(null);

    /** Simulate token-by-token streaming of the answer text */
    function streamText(fullText) {
        const words = fullText.split(" ");
        let i = 0;
        setDisplayedAnswer("");

        streamTimerRef.current = setInterval(() => {
            if (i < words.length) {
                setDisplayedAnswer((prev) => (prev ? prev + " " + words[i] : words[i]));
                i++;
            } else {
                clearInterval(streamTimerRef.current);
            }
        }, 45); // ~22 words/sec feels like real streaming
    }

    async function handleAsk() {
        if (!query.trim()) return;
        setIsLoading(true);
        setAnswer("");
        setDisplayedAnswer("");
        if (streamTimerRef.current) clearInterval(streamTimerRef.current);

        try {
            const response = await fetch(`${BACKEND_URL}/nl_query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: query, patient })
            });

            if (!response.ok) throw new Error("Backend unavailable");

            const data = await response.json();
            setAnswer(data.answer);
            streamText(data.answer);
        } catch (err) {
            // Backend unavailable — show actionable error rather than fake rule-based answer
            const errMsg = "⚠ Could not reach the AI backend. Please ensure the backend server is running (uvicorn main:app --reload) and try again.";
            setAnswer(errMsg);
            setDisplayedAnswer(errMsg);
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleAsk();
    }

    return (
        <div
            style={{
                padding: "20px",
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                background: "#fff"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div
                    style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: T.primary,
                        boxShadow: `0 0 6px ${T.primary}`,
                        animation: isLoading ? "pulse 1s infinite" : "none"
                    }}
                />
                <h3 style={{ margin: 0, fontSize: "15px", color: T.textPrimary }}>
                    Natural Language Query
                </h3>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about this patient's history..."
                    style={{
                        flex: 1,
                        padding: "10px",
                        border: `1px solid ${T.border}`,
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none"
                    }}
                    disabled={isLoading}
                />

                <button
                    onClick={handleAsk}
                    disabled={isLoading}
                    style={{
                        background: isLoading ? T.textMuted : T.primary,
                        color: "white",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "14px",
                        transition: "background 0.2s"
                    }}
                >
                    {isLoading ? "..." : "Ask AI"}
                </button>
            </div>

            {/* Suggested prompts */}
            {!displayedAnswer && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                    {[
                        "Summarize clinical concerns",
                        "HbA1c trend?",
                        "Current medications?",
                        "Kidney function status?"
                    ].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => { setQuery(suggestion); }}
                            style={{
                                background: T.primarySoft,
                                color: T.primary,
                                border: `1px solid ${T.primaryBorder || T.primary}`,
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                cursor: "pointer"
                            }}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Streaming answer */}
            {(displayedAnswer || isLoading) && (
                <div
                    style={{
                        marginTop: "14px",
                        padding: "14px",
                        background: "#F0FDF4",
                        borderRadius: "8px",
                        borderLeft: `3px solid ${T.primary}`,
                        fontSize: "14px",
                        lineHeight: "1.6",
                        color: T.textPrimary,
                        minHeight: "40px"
                    }}
                >
                    {isLoading && !displayedAnswer ? (
                        <span style={{ color: T.textMuted }}>Gemini is analyzing patient data...</span>
                    ) : (
                        <>
                            {displayedAnswer}
                            {displayedAnswer.length < answer.length && (
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: "2px",
                                        height: "14px",
                                        background: T.primary,
                                        marginLeft: "2px",
                                        verticalAlign: "middle",
                                        animation: "blink 0.7s step-start infinite"
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            <style>{`
                @keyframes blink {
                    50% { opacity: 0; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}

