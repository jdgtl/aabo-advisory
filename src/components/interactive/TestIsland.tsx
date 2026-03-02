import { useState } from "react";
import { colors } from "@/lib/constants";

/** Minimal React island to verify hydration works. Remove after Phase 1. */
export default function TestIsland() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        border: `1px solid ${colors.accent}`,
        borderRadius: 8,
        padding: "1.5rem",
        maxWidth: 320,
      }}
    >
      <p style={{ fontFamily: "'DM Sans', sans-serif", marginBottom: "0.5rem" }}>
        React island hydrated — count: <strong>{count}</strong>
      </p>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          backgroundColor: colors.accent,
          color: "#fff",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: 4,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Increment
      </button>
    </div>
  );
}
