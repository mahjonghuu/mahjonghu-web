import { ImageResponse } from "next/og";

/** Accessible description for the generated social preview. */
export const alt = "MahjongHu — Book a mahjong table. Bring your friends.";
/** Standard landscape dimensions for Open Graph and large Twitter cards. */
export const size = { width: 1200, height: 630 };
/** The generated preview is a PNG, requiring no external image service. */
export const contentType = "image/png";

/** Renders a build-time social image using local markup and the bundled font. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#103b32",
        color: "#fff9e9",
        padding: "64px 72px",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 730 }}>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "#edc989",
            marginBottom: 38,
          }}
        >
          MahjongHu
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.12,
          }}
        >
          Book a mahjong table.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 56,
            lineHeight: 1.2,
            marginTop: 12,
          }}
        >
          Bring your friends.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#c3d8cb",
            marginTop: 40,
          }}
        >
          Find a venue. Choose your time. Play together.
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {[1, 2, 3].map((count) => (
          <div
            key={count}
            style={{
              display: "flex",
              flexDirection: "column",
              width: 72,
              height: 128,
              borderRadius: 12,
              background: "#fff9e9",
              borderBottom: "10px solid #d2b779",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              transform: `translateY(${count === 2 ? -20 : 10}px)`,
            }}
          >
            {Array.from({ length: count }, (_, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `4px solid ${count === 1 ? "#ad4937" : "#246451"}`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
