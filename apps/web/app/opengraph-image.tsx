import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Praxis — Hegemony companion tracker";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c1019",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          color: "#e8e6e1",
          fontFamily: "serif",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "#9ca3af",
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          A companion tracker
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 180,
            fontWeight: 300,
            lineHeight: 1,
            color: "#e8e6e1",
            letterSpacing: -2,
          }}
        >
          Praxis
        </div>

        {/* Lede */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 300,
            color: "#9ca3af",
            marginTop: 32,
            maxWidth: 900,
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          For{" "}
          <span style={{ fontStyle: "italic", color: "#cbd5e1", marginLeft: 8, marginRight: 8 }}>
            Hegemony — Lead Your Class to Victory
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer rule + faction stripes */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            paddingTop: 24,
            borderTop: "1px solid rgba(232, 230, 225, 0.16)",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 60, height: 4, background: "#ef4444", borderRadius: 2 }} />
            <div style={{ width: 60, height: 4, background: "#22c55e", borderRadius: 2 }} />
            <div style={{ width: 60, height: 4, background: "#60a5fa", borderRadius: 2 }} />
            <div style={{ width: 60, height: 4, background: "#c084fc", borderRadius: 2 }} />
          </div>
          <div
            style={{
              fontSize: 16,
              fontStyle: "italic",
              color: "#6f6a5e",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Resources · Taxes · Policies · Victory
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
