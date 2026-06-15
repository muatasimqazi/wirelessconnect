"use client";

/**
 * HeroCarousel — auto-advancing homepage hero, matched pixel-for-pixel to the
 * Figma Make reference's `Hero.tsx` (fileKey oiOFfJ4wYN9FZ4LQn927TL).
 *
 * Copy comes from translations (passed in as `slides`); per-slide visual
 * config (accent color, icons, CTA destinations, photography) lives here
 * since it isn't translatable content. The "local" slide uses generated
 * placeholder images (`/local-shop-storefront-0{1,2,3}.jpg`) and the
 * "repairs" slide's third (right) image is also a placeholder
 * (`/phone-repair-03.jpg`) until real photography lands — replace those
 * files directly, no code change needed.
 */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  ShoppingBagIcon,
  WrenchIcon,
  ArrowLeftRightIcon,
  MapPinIcon,
  ArrowRightIcon,
  PhoneIcon,
  InfoIcon,
} from "lucide-react";

export interface HeroSlideContent {
  eyebrow: string;
  headlineTop: string;
  headlineAccent: string;
  subheadline: string;
  cta: string;
  secondaryCta: string;
  trust: string[];
  badge: { top: string; value: string };
  pill: string;
}

interface SlideConfig {
  accent: string;
  primaryIcon: typeof ShoppingBagIcon;
  secondaryIcon: typeof ShoppingBagIcon;
  primaryHref: string;
  secondaryHref: string;
  secondaryIsTel?: boolean;
  images: { main: string; left: string; right: string };
}

const SLIDE_CONFIG: SlideConfig[] = [
  {
    accent: "#00AEEF",
    primaryIcon: ShoppingBagIcon,
    secondaryIcon: InfoIcon,
    primaryHref: "/shop",
    secondaryHref: "/about",
    images: {
      main: "/certief-preowned-phones-01.jpg",
      left: "/certief-preowned-phones-02.jpg",
      right: "/certief-preowned-phones-03.jpg",
    },
  },
  {
    accent: "#10B981",
    primaryIcon: WrenchIcon,
    secondaryIcon: PhoneIcon,
    primaryHref: "/repairs",
    secondaryHref: "tel:+12064232965",
    secondaryIsTel: true,
    images: {
      main: "/phone-repair-01.jpg",
      left: "/phone-repair-02.jpg",
      right: "/phone-repair-03.jpg",
    },
  },
  {
    accent: "#F59E0B",
    primaryIcon: ArrowLeftRightIcon,
    secondaryIcon: ShoppingBagIcon,
    primaryHref: "/trade-in",
    secondaryHref: "/shop",
    images: {
      main: "/device-trade-in-01.jpg",
      left: "/device-trade-in-02.jpg",
      right: "/device-trade-in-03.jpg",
    },
  },
  {
    accent: "#8B5CF6",
    primaryIcon: MapPinIcon,
    secondaryIcon: PhoneIcon,
    primaryHref: "/contact",
    secondaryHref: "tel:+12064232965",
    secondaryIsTel: true,
    images: {
      main: "/local-shop-storefront-01.jpg",
      left: "/local-shop-storefront-02.jpg",
      right: "/local-shop-storefront-03.jpg",
    },
  },
];

const AUTO_ADVANCE_MS = 5500;
const FADE_MS = 280;

export function HeroCarousel({ slides }: { slides: HeroSlideContent[] }) {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      const next = ((idx % slides.length) + slides.length) % slides.length;
      if (next === active) return;
      setFading(true);
      setTimeout(() => {
        setActive(next);
        setFading(false);
      }, FADE_MS);
    },
    [active, slides.length],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => goTo(active + 1), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [active, goTo, slides.length]);

  const slide = slides[active];
  const config = SLIDE_CONFIG[active % SLIDE_CONFIG.length];
  const accent = config.accent;
  const PrimaryIcon = config.primaryIcon;
  const SecondaryIcon = config.secondaryIcon;

  const ctaClassName =
    "inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all duration-200 active:scale-[0.98]";

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Progress bar */}
      <div className="absolute inset-x-0 top-0 z-30 h-[3px]" style={{ background: "rgba(15,23,42,0.05)" }}>
        <div key={active} className="h-full animate-hero-progress" style={{ background: accent }} />
      </div>

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.04) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      {/* Accent glow */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[560px] w-[640px] transition-all duration-700"
        style={{ background: `radial-gradient(ellipse at 80% 15%, ${accent}10 0%, transparent 65%)` }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid items-center gap-12 pb-16 pt-20 md:pb-20 md:pt-24 lg:grid-cols-2 lg:pb-24 lg:pt-28">
          {/* ── Left: copy ── */}
          <div
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? "translateY(8px)" : "translateY(0)",
              transition: "opacity 0.28s ease, transform 0.28s ease",
            }}
          >
            {/* Eyebrow */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                {slide.eyebrow}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="mb-5"
              style={{
                fontFamily: "'Geist', 'Inter', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "#0F172A",
              }}
            >
              {slide.headlineTop}
              <br />
              <span style={{ color: accent }}>{slide.headlineAccent}</span>
            </h1>

            <p className="mb-8 max-w-[460px]" style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "#475569" }}>
              {slide.subheadline}
            </p>

            {/* CTAs */}
            <div className="mb-10 flex flex-wrap items-center gap-3">
              <Link
                href={config.primaryHref}
                className={ctaClassName}
                style={{ background: "#0F172A", color: "#ffffff", boxShadow: "0 4px 16px rgba(15,23,42,0.2)" }}
              >
                <PrimaryIcon size={15} aria-hidden="true" />
                {slide.cta}
                <ArrowRightIcon size={15} aria-hidden="true" />
              </Link>
              {config.secondaryIsTel ? (
                <a
                  href={config.secondaryHref}
                  className={`${ctaClassName} hover:bg-slate-50`}
                  style={{ background: "#ffffff", color: "#0F172A", border: "1.5px solid rgba(15,23,42,0.12)" }}
                >
                  <SecondaryIcon size={15} style={{ color: "#64748B" }} aria-hidden="true" />
                  {slide.secondaryCta}
                </a>
              ) : (
                <Link
                  href={config.secondaryHref}
                  className={`${ctaClassName} hover:bg-slate-50`}
                  style={{ background: "#ffffff", color: "#0F172A", border: "1.5px solid rgba(15,23,42,0.12)" }}
                >
                  <SecondaryIcon size={15} style={{ color: "#64748B" }} aria-hidden="true" />
                  {slide.secondaryCta}
                </Link>
              )}
            </div>

            {/* Trust pills */}
            <div className="mb-8 flex flex-wrap items-center gap-4">
              {slide.trust.map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <div
                    className="flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ background: `${accent}15` }}
                  >
                    <svg width="8" height="7" viewBox="0 0 8 7" fill="none" aria-hidden="true">
                      <path d="M1 3.5L3 5.5L7 1" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium" style={{ color: "#64748B" }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Dot navigation — inline */}
            {slides.length > 1 && (
              <div className="flex items-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.eyebrow + i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === active}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === active ? "28px" : "8px",
                      background: i === active ? accent : "rgba(15,23,42,0.15)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right: phone composition ── */}
          <div className="relative flex h-[380px] items-center justify-center md:h-[480px] lg:h-[520px]">
            {/* Back-left phone */}
            <div
              className="absolute z-0 h-[310px] w-[150px] overflow-hidden rounded-[2rem] md:h-[340px] md:w-[170px]"
              style={{
                background: "#E2E8F0",
                boxShadow: "0 24px 60px rgba(15,23,42,0.14)",
                transform: "rotate(-8deg) translateX(-120px) translateY(20px)",
                opacity: fading ? 0 : 0.82,
                transition: "opacity 0.4s ease",
              }}
            >
              <Image src={config.images.left} alt="" fill sizes="170px" className="object-cover" />
            </div>

            {/* Main center phone */}
            <div
              className="absolute z-10 h-[360px] w-[180px] overflow-hidden rounded-[2.5rem] md:h-[400px] md:w-[200px]"
              style={{
                background: "#0F172A",
                boxShadow: "0 32px 80px rgba(15,23,42,0.28), 0 0 0 1px rgba(255,255,255,0.06)",
                transform: "rotate(-2deg) translateY(-10px)",
              }}
            >
              <Image
                src={config.images.main}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
                style={{ opacity: fading ? 0 : 0.9, transition: "opacity 0.28s ease" }}
                priority={active === 0}
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(15,23,42,0.4))" }}
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-1">
                <span className="rounded-full px-3 py-0.5 text-[10px]" style={{ background: `${accent}30`, color: accent }}>
                  {slide.pill}
                </span>
                <span className="text-[13px] font-bold text-white">{slide.badge.value}</span>
              </div>
            </div>

            {/* Back-right phone */}
            <div
              className="absolute z-0 h-[310px] w-[150px] overflow-hidden rounded-[2rem] md:h-[340px] md:w-[170px]"
              style={{
                background: "#CBD5E1",
                boxShadow: "0 24px 60px rgba(15,23,42,0.14)",
                transform: "rotate(8deg) translateX(120px) translateY(20px)",
                opacity: fading ? 0 : 0.82,
                transition: "opacity 0.4s ease",
              }}
            >
              <Image src={config.images.right} alt="" fill sizes="170px" className="object-cover" />
            </div>

            {/* Floating price/rating badge — top right */}
            <div
              className="absolute right-4 top-10 z-20 rounded-xl px-3 py-2 md:right-8"
              style={{
                background: "#ffffff",
                boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                border: "1px solid rgba(15,23,42,0.06)",
                opacity: fading ? 0 : 1,
                transition: "opacity 0.28s ease",
              }}
            >
              <div className="text-[10px]" style={{ color: "#94A3B8" }}>{slide.badge.top}</div>
              <div className="text-[16px] font-extrabold" style={{ color: "#0F172A" }}>{slide.badge.value}</div>
            </div>

            {/* Floating warranty badge — bottom right */}
            <div
              className="absolute bottom-12 right-2 z-20 flex items-center gap-2 rounded-xl px-3 py-2 md:right-4"
              style={{
                background: "#0F172A",
                boxShadow: "0 8px 24px rgba(15,23,42,0.3)",
                opacity: fading ? 0 : 1,
                transition: "opacity 0.28s ease",
              }}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: `${accent}25` }}>
                <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true">
                  <path d="M1 4.5L3.5 7L9 1" stroke={accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: "#94A3B8" }}>Wireless Connect</div>
                <div className="text-[11px] font-semibold text-white">{slide.pill}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
