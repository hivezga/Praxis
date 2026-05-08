import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c1019",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fcd34d",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 110, fontStyle: "italic", fontWeight: 300, lineHeight: 1 }}>
          P
        </div>
        <div
          style={{
            fontSize: 12,
            fontStyle: "italic",
            color: "#6f6a5e",
            marginTop: 4,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Praxis
        </div>
      </div>
    ),
    { ...size },
  );
}
