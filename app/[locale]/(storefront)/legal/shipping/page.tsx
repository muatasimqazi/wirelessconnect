/**
 * Shipping Policy — /[locale]/legal/shipping
 *
 * Required before launch per Sprint 6 spec.
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
    title: isEs ? "Política de Envío" : "Shipping Policy",
    description: isEs
      ? "Opciones de envío, plazos de entrega y cobertura geográfica de Wireless Connect."
      : "Shipping options, delivery timelines, and geographic coverage for Wireless Connect.",
    alternates: {
      canonical: `https://wirelessconnectnw.com/${locale}/legal/shipping`,
      languages: {
        en: "https://wirelessconnectnw.com/en/legal/shipping",
        es: "https://wirelessconnectnw.com/es/legal/shipping",
      },
    },
  };
}

export default async function ShippingPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEs = locale === "es";

  if (isEs) {
    return (
      <LegalLayout title="Política de Envío" lastUpdated="26 de mayo de 2026">
        <p>
          Wireless Connect envía a todo Estados Unidos desde nuestra ubicación en
          Shoreline, WA.
        </p>

        <h2>Opciones de Cumplimiento</h2>
        <p>Ofrecemos dos métodos de cumplimiento de pedidos:</p>
        <ul>
          <li><strong>Envío:</strong> entrega a domicilio a cualquier dirección de EE.UU.</li>
          <li><strong>Recogida Local:</strong> disponible en 14723 Aurora Ave N, Shoreline, WA 98133.</li>
        </ul>

        <h2>Tiempo de Procesamiento</h2>
        <p>
          Los pedidos se procesan en 1 a 2 días hábiles después de la confirmación del
          pago. Los pedidos realizados los fines de semana o días festivos se procesarán
          el siguiente día hábil.
        </p>

        <h2>Plazos de Entrega</h2>
        <p>
          Los plazos de entrega estimados una vez enviado el pedido son los siguientes:
        </p>
        <ul>
          <li><strong>Estándar (USPS / UPS Ground):</strong> 3 a 7 días hábiles</li>
          <li><strong>Exprés:</strong> 1 a 2 días hábiles (cuando esté disponible)</li>
        </ul>
        <p>
          Los tiempos de entrega son estimados y no están garantizados. Los retrasos del
          transportista están fuera de nuestro control.
        </p>

        <h2>Costos de Envío</h2>
        <p>
          Los costos de envío se calculan en tiempo real durante el proceso de pago según
          el peso del pedido y la dirección de destino.
        </p>

        <h2>Seguro de Envío</h2>
        <p>
          El seguro de envío puede añadirse automáticamente para pedidos de alto valor a
          fin de proteger contra pérdida o daño durante el tránsito.
        </p>

        <h2>Número de Seguimiento</h2>
        <p>
          Recibirá un correo electrónico con el número de seguimiento cuando su pedido sea
          enviado. El seguimiento puede tardar de 24 a 48 horas en actualizarse después de
          su recogida por el transportista.
        </p>

        <h2>Pedidos Perdidos o Dañados</h2>
        <p>
          Si su pedido llega dañado o no llega, contáctenos en{" "}
          <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a>{" "}
          dentro de los 7 días posteriores a la fecha de entrega esperada para abrir una
          reclamación.
        </p>

        <h2>Restricciones Geográficas</h2>
        <p>
          Actualmente solo realizamos envíos a direcciones dentro de los 50 estados de
          EE.UU. No realizamos envíos internacionales ni a Casillas de Correo.
        </p>

        <h2>Contacto</h2>
        <p>
          <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a>
          {" "}· (206) 423-2965
        </p>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title="Shipping Policy" lastUpdated="May 26, 2026">
      <p>
        Wireless Connect ships throughout the United States from our location in Shoreline,
        WA.
      </p>

      <h2>Fulfillment Options</h2>
      <p>We offer two order fulfillment methods:</p>
      <ul>
        <li><strong>Shipping:</strong> home delivery to any U.S. address.</li>
        <li><strong>Local Pickup:</strong> available at 14723 Aurora Ave N, Shoreline, WA 98133.</li>
      </ul>

      <h2>Processing Time</h2>
      <p>
        Orders are processed within 1–2 business days after payment confirmation. Orders
        placed on weekends or holidays will be processed the next business day.
      </p>

      <h2>Delivery Timelines</h2>
      <p>Estimated delivery timelines once your order has shipped:</p>
      <ul>
        <li><strong>Standard (USPS / UPS Ground):</strong> 3–7 business days</li>
        <li><strong>Express:</strong> 1–2 business days (when available)</li>
      </ul>
      <p>
        Delivery times are estimates and are not guaranteed. Carrier delays are outside of
        our control.
      </p>

      <h2>Shipping Costs</h2>
      <p>
        Shipping costs are calculated in real time during checkout based on order weight
        and destination address.
      </p>

      <h2>Shipping Insurance</h2>
      <p>
        Shipping insurance may be automatically added for high-value orders to protect
        against loss or damage in transit.
      </p>

      <h2>Tracking Number</h2>
      <p>
        You will receive an email with a tracking number when your order ships. Tracking
        may take 24–48 hours to update after carrier pickup.
      </p>

      <h2>Lost or Damaged Orders</h2>
      <p>
        If your order arrives damaged or does not arrive, contact us at{" "}
        <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a>{" "}
        within 7 days of the expected delivery date to open a claim.
      </p>

      <h2>Geographic Restrictions</h2>
      <p>
        We currently only ship to addresses within the 50 U.S. states. We do not ship
        internationally or to P.O. Boxes.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a>
        {" "}· (206) 423-2965
      </p>
    </LegalLayout>
  );
}
