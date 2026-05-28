import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "The Friendship Baptist Church — The Church That Christ Built";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 100px",
          background: "linear-gradient(135deg, #13111A 0%, #1a1528 50%, #2d1b4e 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "4px",
              color: "#9b7ec8",
              textTransform: "uppercase" as const,
            }}
          >
            Beaufort, SC — The Church That Christ Built
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "white",
              lineHeight: 1.1,
              letterSpacing: "-2px",
            }}
          >
            The Friendship
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#9b7ec8",
              lineHeight: 1.1,
              letterSpacing: "-2px",
            }}
          >
            Baptist Church
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "rgba(255,255,255,0.6)",
              marginTop: "20px",
              fontWeight: 300,
            }}
          >
            Sunday School 9:00 AM · Worship Service 10:00 AM
          </div>
          <div
            style={{
              width: "200px",
              height: "2px",
              background: "linear-gradient(90deg, #9b7ec8, transparent)",
              marginTop: "16px",
            }}
          />
          <div
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.4)",
              marginTop: "8px",
            }}
          >
            Pastor Isiah Smalls · thefriendshipbaptist.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
