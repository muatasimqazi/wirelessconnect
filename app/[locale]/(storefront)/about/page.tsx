/**
 * About page — /[locale]/about
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  ShieldCheckIcon, WrenchIcon, CheckCircleIcon, TruckIcon,
  MapPinIcon, PhoneIcon, MailIcon, StarIcon, UsersIcon,
  SmartphoneIcon, HeadphonesIcon,
} from "lucide-react";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("meta.title"), description: t("meta.description") };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutContent />;
}

function AboutContent() {
  const t = useTranslations("about");

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-secondary px-4 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold md:text-5xl">{t("hero.headline")}</h1>
          <p className="mt-4 text-lg text-white/80">{t("hero.subheadline")}</p>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-content">
          <h2 className="mb-8 text-center text-2xl font-bold">{t("stats.title")}</h2>
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: t("stats.years"), label: t("stats.yearsLabel") },
              { value: t("stats.customers"), label: t("stats.customersLabel") },
              { value: t("stats.devices"), label: t("stats.devicesLabel") },
              { value: t("stats.team"), label: t("stats.teamLabel") },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <dt className="text-4xl font-bold text-primary">{value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Story ─────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-2xl font-bold text-foreground">{t("story.title")}</h2>
          <p className="text-muted-foreground">{t("story.p1")}</p>
          <p className="text-muted-foreground">{t("story.p2")}</p>
          <p className="text-muted-foreground">{t("story.p3")}</p>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────────────────── */}
      <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-background p-8">
          <h2 className="mb-3 text-xl font-bold">{t("mission.title")}</h2>
          <p className="text-muted-foreground">{t("mission.body")}</p>
        </div>
      </section>

      {/* ── Why Choose Us ─────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold">{t("whyUs.title")}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: StarIcon, title: t("whyUs.expertise"), body: t("whyUs.expertiseBody") },
              { icon: ShieldCheckIcon, title: t("whyUs.quality"), body: t("whyUs.qualityBody") },
              { icon: UsersIcon, title: t("whyUs.customerFocus"), body: t("whyUs.customerFocusBody") },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-6 text-center">
                <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What We Offer ─────────────────────────────────────────────────── */}
      <section className="bg-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold">{t("services.title")}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: SmartphoneIcon, title: t("services.preOwned"), body: t("services.preOwnedBody") },
              { icon: WrenchIcon, title: t("services.repair"), body: t("services.repairBody") },
              { icon: HeadphonesIcon, title: t("services.accessories"), body: t("services.accessoriesBody") },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-background p-6">
                <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust points ──────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold">{t("trust.title")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: ShieldCheckIcon, label: t("trust.cleanImei") },
              { icon: WrenchIcon, label: t("trust.tested") },
              { icon: CheckCircleIcon, label: t("trust.warranty") },
              { icon: TruckIcon, label: t("trust.shipping") },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center">
                <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service area ──────────────────────────────────────────────────── */}
      <section className="bg-secondary px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <MapPinIcon className="mx-auto mb-3 h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold">{t("area.title")}</h2>
          <p className="mt-2 text-white/70">{t("area.body")}</p>
        </div>
      </section>

      {/* ── Store info ────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-2xl font-bold">{t("store.title")}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{t("store.location")}</p>
                <p className="text-sm text-muted-foreground">14723 Aurora Ave N<br />Shoreline, WA 98133</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{t("store.phone")}</p>
                <a href="tel:+12064232965" className="text-sm text-muted-foreground hover:text-primary">(206) 423-2965</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{t("store.email")}</p>
                <a href="mailto:officialwirelessconnect@gmail.com" className="break-all text-sm text-muted-foreground hover:text-primary">officialwirelessconnect@gmail.com</a>
              </div>
            </div>
          </div>
          <div className="mt-8 rounded-lg border border-border bg-surface p-6">
            <h3 className="mb-4 font-semibold">{t("store.hours")}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>{t("store.weekdays")}</span><span>10:00 AM – 7:00 PM</span></div>
              <div className="flex justify-between"><span>{t("store.saturday")}</span><span>10:00 AM – 6:00 PM</span></div>
              <div className="flex justify-between"><span>{t("store.sunday")}</span><span>{t("store.closed")}</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-4 text-2xl font-bold">{t("cta.title")}</h2>
          <p className="mb-8 text-muted-foreground">{t("cta.description")}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild><Link href="/shop">{t("cta.shop")}</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/contact">{t("cta.contact")}</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}
