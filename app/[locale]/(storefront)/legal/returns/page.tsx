/**
 * Return Policy — /[locale]/legal/returns
 *
 * Required before launch per Sprint 6 spec.
 * Clarifies that the in-store purchase policy does NOT apply to customer returns
 * (i.e., online returns use this policy, not the physical store's policy).
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalLayout } from "@/components/legal/legal-layout";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return {
    title: isEs ? "Política de Devoluciones" : "Return Policy",
    description: isEs
      ? "Conozca nuestros plazos y condiciones de devolución para compras en línea."
      : "Learn about our return window and conditions for online purchases.",
    alternates: {
      canonical: `https://wirelessconnectstore.com/${locale}/legal/returns`,
      languages: {
        en: "https://wirelessconnectstore.com/en/legal/returns",
        es: "https://wirelessconnectstore.com/es/legal/returns",
      },
    },
  };
}

export default async function ReturnPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEs = locale === "es";

  if (isEs) {
    return (
      <LegalLayout title="Política de Devoluciones" lastUpdated="26 de mayo de 2026">
        <p>
          Esta política aplica exclusivamente a compras realizadas en wirelessconnectstore.com.
          La política de la tienda física <strong>no aplica</strong> a devoluciones de
          compras en línea.
        </p>

        <h2>Plazo de Devolución</h2>
        <p>
          Aceptamos devoluciones dentro de los <strong>7 días</strong> a partir de la
          fecha de entrega o recogida, siempre que se cumplan las condiciones a
          continuación.
        </p>

        <h2>Condiciones de Elegibilidad</h2>
        <p>Para ser elegible para devolución, el dispositivo debe:</p>
        <ul>
          <li>Estar en la misma condición en que fue recibido</li>
          <li>No mostrar daños físicos causados por el comprador</li>
          <li>Incluir todos los accesorios originales proporcionados</li>
          <li>No estar bloqueado (por ejemplo, a través de &ldquo;Buscar mi iPhone&rdquo; o bloqueo de cuenta Google)</li>
          <li>Venir acompañado de su número de orden o comprobante de compra</li>
        </ul>

        <h2>Artículos No Elegibles</h2>
        <p>Los siguientes artículos no son elegibles para devolución:</p>
        <ul>
          <li>Dispositivos con daños físicos causados por el comprador (pantalla rota, daño por líquido)</li>
          <li>Dispositivos que han sido desbloqueados, modificados o reparados por terceros</li>
          <li>Accesorios (fundas, protectores de pantalla, cargadores) comprados como artículos independientes</li>
          <li>Devoluciones presentadas después del plazo de 7 días</li>
        </ul>

        <h2>Proceso de Devolución</h2>
        <ol>
          <li>Contáctenos en <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a> o llame al (206) 423-2965 para iniciar una devolución.</li>
          <li>Recibirá instrucciones de devolución e información de envío o recogida.</li>
          <li>Una vez que inspeccionemos el dispositivo, procesaremos su reembolso dentro de los 5 a 10 días hábiles al método de pago original.</li>
        </ol>

        <h2>Devoluciones Defectuosas</h2>
        <p>
          Si su dispositivo llega con un defecto o no funciona como se describe, contáctenos
          de inmediato. Los productos defectuosos pueden ser elegibles para cambio o
          reembolso fuera del plazo estándar de 7 días, a nuestra discreción.
        </p>

        <h2>Envío de Devoluciones</h2>
        <p>
          El cliente es responsable de los costos de envío de devolución a menos que el
          artículo sea defectuoso o haya sido enviado incorrectamente. Le recomendamos
          utilizar un método de envío rastreable para su protección.
        </p>

        <h2>Contacto</h2>
        <p>
          <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a>
          {" "}· (206) 423-2965 · 14723 Aurora Ave N, Shoreline, WA 98133
        </p>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title="Return Policy" lastUpdated="May 26, 2026">
      <p>
        This policy applies exclusively to purchases made at wirelessconnectstore.com. The
        physical store&apos;s purchase policy does <strong>not apply</strong> to online
        order returns.
      </p>

      <h2>Return Window</h2>
      <p>
        We accept returns within <strong>7 days</strong> of the delivery or pickup date,
        provided the conditions below are met.
      </p>

      <h2>Eligibility Conditions</h2>
      <p>To be eligible for a return, the device must:</p>
      <ul>
        <li>Be in the same condition as when it was received</li>
        <li>Show no physical damage caused by the buyer</li>
        <li>Include all original accessories provided</li>
        <li>Not be locked (e.g., via Find My iPhone or Google account lock)</li>
        <li>Be accompanied by your order number or proof of purchase</li>
      </ul>

      <h2>Non-Eligible Items</h2>
      <p>The following items are not eligible for return:</p>
      <ul>
        <li>Devices with buyer-caused physical damage (cracked screen, liquid damage)</li>
        <li>Devices that have been unlocked, modified, or repaired by third parties</li>
        <li>Accessories (cases, screen protectors, chargers) purchased as standalone items</li>
        <li>Returns submitted after the 7-day window</li>
      </ul>

      <h2>Return Process</h2>
      <ol>
        <li>Contact us at <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a> or call (206) 423-2965 to initiate a return.</li>
        <li>You will receive return instructions and shipping or pickup information.</li>
        <li>Once we inspect the device, we will process your refund within 5–10 business days to the original payment method.</li>
      </ol>

      <h2>Defective Returns</h2>
      <p>
        If your device arrives defective or does not function as described, contact us
        immediately. Defective products may be eligible for exchange or refund outside the
        standard 7-day window, at our discretion.
      </p>

      <h2>Return Shipping</h2>
      <p>
        The customer is responsible for return shipping costs unless the item is defective
        or was incorrectly shipped. We recommend using a trackable shipping method for your
        protection.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a>
        {" "}· (206) 423-2965 · 14723 Aurora Ave N, Shoreline, WA 98133
      </p>
    </LegalLayout>
  );
}
