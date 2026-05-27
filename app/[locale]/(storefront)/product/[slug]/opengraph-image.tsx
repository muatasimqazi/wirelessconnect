/**
 * Dynamic per-product OG image — 1200×630
 *
 * Rendered by Next.js at build/request time via the file convention.
 * Automatically wired into <head> og:image for every /product/[slug] page.
 *
 * Layout:
 *  Left half  — dark branded panel (name, brand, price, condition badge)
 *  Right half — product photo (object-contain, white bg panel)
 */
import { ImageResponse } from "next/og";
import { getProductBySlug, getProductImages } from "@/lib/data/products";

export const runtime = "edge";
export const alt = "Product — Wireless Connect";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fetch Inter fonts once per cold start
async function loadFont(weight: 400 | 700) {
  const axis = weight === 700 ? "wght@700" : "wght@400";
  const url = `https://fonts.googleapis.com/css2?family=Inter:${axis}&display=swap`;
  const css = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  }).then((r) => r.text());
  const fontUrl = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!fontUrl) throw new Error("Could not parse Google Fonts CSS");
  return fetch(fontUrl).then((r) => r.arrayBuffer());
}

const CONDITION_LABELS: Record<string, string> = {
  like_new: "Like New",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

const CONDITION_COLORS: Record<string, string> = {
  like_new: "#10b981",
  excellent: "#3b82f6",
  good: "#f59e0b",
  fair: "#6b7280",
};

function formatPrice(cents: number | null) {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function ProductOgImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const [product, interBold, interRegular] = await Promise.all([
    getProductBySlug(params.slug),
    loadFont(700),
    loadFont(400),
  ]);

  if (!product) {
    // Fallback to plain branded image
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: 48,
            fontFamily: "Inter",
          }}
        >
          Wireless Connect
        </div>
      ),
      { ...size, fonts: [{ name: "Inter", data: interBold, weight: 700 }] },
    );
  }

  // Fetch primary image
  const images = product.id ? await getProductImages(product.id) : [];
  const primaryImage = images.find((i) => i.is_primary) ?? images[0];

  const title = product.title ?? "Refurbished Phone";
  const brand = product.brand ?? "";
  const price = formatPrice(product.price);
  const condition = product.condition ?? "";
  const conditionLabel = CONDITION_LABELS[condition] ?? condition;
  const conditionColor = CONDITION_COLORS[condition] ?? "#6b7280";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          fontFamily: "Inter",
          overflow: "hidden",
        }}
      >
        {/* ── Left: branded info panel ─────────────────────────────── */}
        <div
          style={{
            width: 600,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 48px",
            background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
          }}
        >
          {/* Logo / brand lockup */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>📱</span>
            <span style={{ color: "#94a3b8", fontSize: 18, fontWeight: 400 }}>
              Wireless Connect
            </span>
          </div>

          {/* Product info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Brand */}
            {brand && (
              <span style={{ color: "#64748b", fontSize: 22, fontWeight: 400, textTransform: "uppercase", letterSpacing: "2px" }}>
                {brand}
              </span>
            )}

            {/* Title */}
            <span
              style={{
                color: "#f8fafc",
                fontSize: title.length > 30 ? 34 : 40,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.5px",
              }}
            >
              {title}
            </span>

            {/* Condition + Price row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
              {condition && (
                <span
                  style={{
                    background: `${conditionColor}22`,
                    border: `1px solid ${conditionColor}55`,
                    color: conditionColor,
                    borderRadius: 100,
                    padding: "6px 16px",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {conditionLabel}
                </span>
              )}
              {price && (
                <span style={{ color: "#f8fafc", fontSize: 32, fontWeight: 700 }}>
                  {price}
                </span>
              )}
            </div>
          </div>

          {/* Bottom badges */}
          <div style={{ display: "flex", gap: 10 }}>
            {["✓ Quality Tested", "✓ Warranty"].map((b) => (
              <span
                key={b}
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 100,
                  padding: "5px 12px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: product photo panel ───────────────────────────── */}
        <div
          style={{
            width: 600,
            height: 630,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
          }}
        >
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.image_url}
              alt={title}
              style={{
                width: 480,
                height: 480,
                objectFit: "contain",
              }}
            />
          ) : (
            <span style={{ fontSize: 120 }}>📱</span>
          )}
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
