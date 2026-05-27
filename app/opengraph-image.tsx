/**
 * Root OG image — served at /opengraph-image
 *
 * Next.js file convention: any opengraph-image.tsx at the app/ level is
 * automatically picked up and added to <head> metadata for every route that
 * doesn't override it with its own opengraph-image file.
 *
 * Design: dark gradient, "Wireless Connect" wordmark, tagline, badge row.
 * Dimensions: 1200×630 (standard OG / Twitter card size).
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Wireless Connect — Certified Refurbished Phones";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  // Fetch Inter Bold for the wordmark (next/og requires ArrayBuffer fonts)
  const interBold = await fetch(
    "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2",
  ).then((r) => r.arrayBuffer());

  const interRegular = await fetch(
    "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
  ).then((r) => r.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "Inter",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Phone icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "rgba(59,130,246,0.2)",
            border: "1.5px solid rgba(59,130,246,0.4)",
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 40 }}>📱</span>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#f8fafc",
            letterSpacing: "-2px",
            lineHeight: 1.1,
            marginBottom: 16,
            display: "flex",
          }}
        >
          Wireless Connect
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            fontWeight: 400,
            letterSpacing: "-0.3px",
            marginBottom: 40,
            display: "flex",
          }}
        >
          Certified Refurbished Phones · Local Pickup &amp; Shipping
        </div>

        {/* Badge row */}
        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          {["✓ Quality Tested", "✓ Clean IMEI", "✓ Warranty Included"].map((badge) => (
            <div
              key={badge}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: 100,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#cbd5e1",
                fontSize: 18,
                fontWeight: 400,
              }}
            >
              {badge}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            color: "#475569",
            fontSize: 18,
            letterSpacing: "0.5px",
            display: "flex",
          }}
        >
          wirelessconnectnw.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interBold, style: "normal", weight: 700 },
        { name: "Inter", data: interRegular, style: "normal", weight: 400 },
      ],
    },
  );
}
