/**
 * Contact page — /[locale]/contact
 *
 * Store contact info, hours, map embed, and a quick-contact form
 * (sends an email via the contact action).
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/store/contact-form";
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon, WrenchIcon, NavigationIcon } from "lucide-react";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactContent />;
}

function ContactContent() {
  const t = useTranslations("contact");

  return (
    <main>
      {/* Hero */}
      <section className="bg-secondary px-4 py-16 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold md:text-4xl">{t("hero.headline")}</h1>
          <p className="mt-3 text-white/80">{t("hero.subheadline")}</p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Store info */}
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-xl font-bold">{t("info.title")}</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{t("info.address")}</p>
                    <p className="text-sm text-muted-foreground">
                      14723 Aurora Ave N<br />Shoreline, WA 98133
                    </p>
                    <a
                      href="https://maps.google.com/?q=14723+Aurora+Ave+N+Shoreline+WA+98133"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm text-primary hover:underline"
                    >
                      {t("info.getDirections")} →
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{t("info.phone")}</p>
                    <a href="tel:+12064232965" className="text-sm text-muted-foreground hover:text-primary">
                      (206) 423-2965
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{t("info.email")}</p>
                    <a
                      href="mailto:officialwirelessconnect@gmail.com"
                      className="text-sm text-muted-foreground hover:text-primary break-all"
                    >
                      officialwirelessconnect@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{t("info.hours")}</p>
                    <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                      <p>Mon–Fri: 10:00 AM – 7:00 PM</p>
                      <p>Saturday: 10:00 AM – 6:00 PM</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service area */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <NavigationIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium">{t("info.serviceArea")}</p>
                  <p className="text-sm text-muted-foreground">{t("info.serviceAreaDetail")}</p>
                </div>
              </div>
            </div>

            {/* In-store repairs */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <WrenchIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium">{t("inStoreRepairs")}</p>
                  <p className="text-sm text-muted-foreground">{t("inStoreRepairsDetail")}</p>
                </div>
              </div>
            </div>

            {/* Call now CTA */}
            <a
              href="tel:+12064232965"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <PhoneIcon className="h-4 w-4" aria-hidden="true" />
              {t("callNow")} — (206) 423-2965
            </a>

            {/* Google Maps embed */}
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                title="Wireless Connect location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2685.456!2d-122.3441!3d47.7516!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s14723+Aurora+Ave+N%2C+Shoreline%2C+WA+98133!5e0!3m2!1sen!2sus!4v1"
                width="100%"
                height="240"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="mb-6 text-xl font-bold">{t("form.title")}</h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
