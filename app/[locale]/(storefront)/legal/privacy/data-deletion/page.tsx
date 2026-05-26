/**
 * Data Deletion Request — /[locale]/legal/privacy/data-deletion
 *
 * CCPA §1798.105 compliance: California residents can request deletion of their
 * personal data. Requests are stored in `data_deletion_requests` with a 45-day
 * response deadline.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalLayout } from "@/components/legal/legal-layout";
import { DataDeletionForm } from "./data-deletion-form";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return {
    title: isEs ? "Solicitud de Eliminación de Datos" : "Data Deletion Request",
    description: isEs
      ? "Solicite la eliminación de su información personal de Wireless Connect."
      : "Request deletion of your personal information from Wireless Connect.",
    alternates: {
      canonical: `https://wirelessconnectnw.com/${locale}/legal/privacy/data-deletion`,
      languages: {
        en: "https://wirelessconnectnw.com/en/legal/privacy/data-deletion",
        es: "https://wirelessconnectnw.com/es/legal/privacy/data-deletion",
      },
    },
  };
}

export default async function DataDeletionPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEs = locale === "es";

  return (
    <LegalLayout
      title={isEs ? "Solicitud de Eliminación de Datos" : "Data Deletion Request"}
      lastUpdated={isEs ? "26 de mayo de 2026" : "May 26, 2026"}
    >
      {isEs ? (
        <>
          <p>
            Como residente de California, tiene derecho bajo la Ley de Privacidad del
            Consumidor de California (CCPA) a solicitar que Wireless Connect elimine la
            información personal que hemos recopilado sobre usted.
          </p>
          <p>
            Complete el formulario a continuación para enviar una solicitud de eliminación.
            Responderemos dentro de los <strong>45 días hábiles</strong> a la dirección de
            correo electrónico que proporcione. Puede ser necesario que verifiquemos su
            identidad antes de procesar su solicitud.
          </p>
          <p>
            Si prefiere enviarnos una solicitud directamente, puede contactarnos en:{" "}
            <a href="mailto:officialwirelessconnect@gmail.com">
              officialwirelessconnect@gmail.com
            </a>
          </p>
          <h2>Formulario de Solicitud</h2>
        </>
      ) : (
        <>
          <p>
            As a California resident, you have the right under the California Consumer
            Privacy Act (CCPA) to request that Wireless Connect delete the personal
            information we have collected about you.
          </p>
          <p>
            Complete the form below to submit a deletion request. We will respond within{" "}
            <strong>45 business days</strong> to the email address you provide. We may need
            to verify your identity before processing your request.
          </p>
          <p>
            If you prefer to send us a request directly, you can contact us at:{" "}
            <a href="mailto:officialwirelessconnect@gmail.com">
              officialwirelessconnect@gmail.com
            </a>
          </p>
          <h2>Request Form</h2>
        </>
      )}

      <div className="not-prose mt-6">
        <DataDeletionForm locale={locale} />
      </div>
    </LegalLayout>
  );
}
