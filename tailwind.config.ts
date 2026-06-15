import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Brand colors from UX & Design Guidelines §3
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0F172A",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
        },
        error: {
          DEFAULT: "#DC2626", /* red-600 — 4.81:1 on white (WCAG AA) */
          foreground: "#FFFFFF",
        },
        background: "#FFFFFF",
        surface: "#F8FAFC",
        // Figma reference accent (theme.css --wc-blue) — used for icon/badge
        // accents on the homepage. Additive only; does not replace `primary`.
        "wc-blue": "#00AEEF",
        // shadcn/ui compatible tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      // Typography from UX & Design Guidelines §4
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Desktop heading sizes
        "h1-desktop": ["48px", { lineHeight: "1.1", fontWeight: "700" }],
        "h2-desktop": ["36px", { lineHeight: "1.2", fontWeight: "700" }],
        "h3-desktop": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        // Mobile heading sizes
        "h1-mobile": ["36px", { lineHeight: "1.1", fontWeight: "700" }],
        "h2-mobile": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        "h3-mobile": ["20px", { lineHeight: "1.3", fontWeight: "600" }],
      },
      // Max width from UX & Design Guidelines §5
      maxWidth: {
        container: "1280px",
        content: "1200px",
      },
      // Minimum touch target 44px per UX guidelines §13
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Animation per UX guidelines §23: 150ms–250ms
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "250ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "hero-progress": {
          from: { width: "0%" },
          to: { width: "100%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "hero-progress": "hero-progress 5.5s linear forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
