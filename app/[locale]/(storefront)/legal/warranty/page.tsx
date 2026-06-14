/**
 * Warranty Policy — /[locale]/legal/warranty
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
    title: isEs ? "Política de Garantía" : "Warranty Policy",
    description: isEs
      ? "Cobertura de garantía para dispositivos Wireless Connect."
      : "Warranty coverage for Wireless Connect devices.",
    alternates: {
      canonical: `https://wirelessconnectstore.com/${locale}/legal/warranty`,
      languages: {
        en: "https://wirelessconnectstore.com/en/legal/warranty",
        es: "https://wirelessconnectstore.com/es/legal/warranty",
      },
    },
  };
}

export default async function WarrantyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEs = locale === "es";

  if (isEs) {
    return (
      <LegalLayout title="Política de Garantía" lastUpdated="26 de mayo de 2026">
        <p>
          Wireless Connect proporciona una garantía limitada en dispositivos elegibles
          vendidos a través de wirelessconnectstore.com.
        </p>

        <h2>Período de Garantía</h2>
        <p>
          Cada dispositivo muestra su período de garantía en la página del producto. La
          cobertura estándar es de <strong>30 días</strong> a partir de la fecha de compra,
          a menos que se especifique lo contrario.
        </p>

        <h2>Qué Cubre la Garantía</h2>
        <p>La garantía cubre defectos en materiales y mano de obra, incluyendo:</p>
        <ul>
          <li>Fallas de hardware no causadas por el usuario (ej. botones inoperables, altavoces defectuosos)</li>
          <li>Problemas de batería que no cumplan con el nivel de salud de batería listado</li>
          <li>Problemas de conectividad (Wi-Fi, Bluetooth, celular) presentes al momento de la compra</li>
          <li>Problemas de pantalla presentes al momento de la compra (líneas muertas, manchas)</li>
        </ul>

        <h2>Qué No Cubre la Garantía</h2>
        <ul>
          <li>Daño físico causado por el comprador (caídas, rotura de pantalla, daño por agua)</li>
          <li>Daño causado por uso indebido, accidentes o modificaciones no autorizadas</li>
          <li>Desgaste normal</li>
          <li>Daños cosméticos presentes al momento de la compra y divulgados en la descripción del producto</li>
          <li>Software o problemas de software de terceros</li>
          <li>Bloqueo de activación causado por acciones del comprador</li>
        </ul>

        <h2>Política de Cambio y Devolución</h2>
        <p>
          Los artículos solo pueden cambiarse si son defectuosos, por el mismo artículo
          dentro del período de garantía de 30 días.
        </p>
        <p>
          <strong>Se requiere una copia del recibo de venta o confirmación de pedido</strong> para
          cualquier cambio de garantía, ya sea en tienda o en línea. Sin comprobante de compra,
          no se puede procesar ninguna garantía o cambio.
        </p>
        <ul>
          <li>El artículo debe estar sin daños adicionales y en la condición en que se recibió</li>
          <li>Completamente restablecido de fábrica</li>
          <li>Sin bloqueo de activación agregado por el comprador</li>
        </ul>

        <h2>Cómo Presentar un Reclamo de Garantía</h2>
        <ol>
          <li>Contáctenos dentro del período de garantía en <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a> o llame al <a href="tel:+12064232965">(206) 423-2965</a>.</li>
          <li>Proporcione su número de orden (o recibo) y una descripción del problema.</li>
          <li>Puede traer el dispositivo a la tienda en 14723 Aurora Ave N, Shoreline, WA 98133 o enviarlo con autorización previa.</li>
          <li>Inspeccionaremos el dispositivo y, si el reclamo es aprobado, procederemos con reparación, sustitución o reembolso.</li>
        </ol>

        <h2>Resolución de Garantía</h2>
        <p>
          A nuestra discreción, los reclamos elegibles serán resueltos mediante reparación en tienda,
          sustitución por un dispositivo equivalente o reembolso al método de pago original.
        </p>

        <h2>Garantías de Fabricante</h2>
        <p>
          Los dispositivos usados generalmente no incluyen garantía del fabricante original.
          La garantía de Wireless Connect es su único recurso para estos dispositivos.
        </p>

        <h2>Métodos de Pago Aceptados</h2>
        <p>Aceptamos efectivo, Visa, Mastercard, American Express y Discover. No se aceptan cheques.</p>

        <h2>Contacto</h2>
        <p>
          <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a>
          {" "}· <a href="tel:+12064232965">(206) 423-2965</a>
          {" "}· 14723 Aurora Ave N, Shoreline, WA 98133
        </p>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title="Warranty Policy" lastUpdated="May 26, 2026">
      <p>
        Wireless Connect provides a limited warranty on eligible devices sold through
        wirelessconnectstore.com.
      </p>

      <h2>Warranty Period</h2>
      <p>
        Each device displays its warranty period on the product page. The standard coverage
        is <strong>30 days</strong> from the date of purchase, unless otherwise specified.
      </p>

      <h2>What the Warranty Covers</h2>
      <p>The warranty covers defects in materials and workmanship, including:</p>
      <ul>
        <li>Hardware failures not caused by the user (e.g., inoperative buttons, defective speakers)</li>
        <li>Battery issues that do not meet the listed battery health level</li>
        <li>Connectivity problems (Wi-Fi, Bluetooth, cellular) present at the time of purchase</li>
        <li>Display issues present at the time of purchase (dead lines, spots)</li>
      </ul>

      <h2>What the Warranty Does Not Cover</h2>
      <ul>
        <li>Physical damage caused by the buyer (drops, cracked screen, water damage)</li>
        <li>Damage caused by misuse, accidents, or unauthorized modifications</li>
        <li>Normal wear and tear</li>
        <li>Cosmetic damage present at the time of purchase and disclosed in the product description</li>
        <li>Software or third-party software issues</li>
        <li>Activation lock caused by buyer&apos;s actions</li>
      </ul>

      <h2>Exchange &amp; Return Policy</h2>
      <p>
        Items may be exchanged only if they are defective. They will be exchanged for the same
        item within the 30-day warranty period.
      </p>
      <p>
        <strong>A copy of your sales receipt or order confirmation is required</strong> for any
        warranty exchange, whether in-store or online. Without proof of purchase, no
        warranty or exchange can be processed.
      </p>
      <p>Items presented for exchange must be:</p>
      <ul>
        <li>Undamaged and in the condition received (no new physical or liquid damage)</li>
        <li>Completely reset to factory settings</li>
        <li>Free of any activation lock or account lock added by the buyer</li>
      </ul>
      <p>
        Wireless Connect reserves the right to deny an exchange if the device does not meet
        these conditions.
      </p>

      <h2>How to Submit a Warranty Claim</h2>
      <ol>
        <li>Contact us within the warranty period at <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a> or call <a href="tel:+12064232965">(206) 423-2965</a>.</li>
        <li>Provide your order number (or receipt) and a description of the issue.</li>
        <li>You may bring the device in-store at 14723 Aurora Ave N, Shoreline, WA 98133 or ship it back with prior authorization.</li>
        <li>We will inspect the device and, if the claim is approved, proceed with repair, replacement, or refund at our discretion.</li>
      </ol>

      <h2>Warranty Resolution</h2>
      <p>
        At our discretion, eligible warranty claims will be resolved through: in-store repair,
        replacement with an equivalent device, or partial or full refund to the original
        payment method.
      </p>

      <h2>Manufacturer Warranties</h2>
      <p>
        Pre-owned devices typically do not include the original manufacturer&apos;s warranty.
        The Wireless Connect warranty is your sole warranty remedy for these devices.
      </p>

      <h2>Payment Methods Accepted</h2>
      <p>We accept Cash, Visa, Mastercard, American Express, and Discover. No checks accepted.</p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a>
        {" "}· <a href="tel:+12064232965">(206) 423-2965</a>
        {" "}· 14723 Aurora Ave N, Shoreline, WA 98133
      </p>
    </LegalLayout>
  );
}
