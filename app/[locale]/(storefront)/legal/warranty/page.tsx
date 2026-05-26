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
      canonical: `https://wirelessconnectnw.com/${locale}/legal/warranty`,
      languages: {
        en: "https://wirelessconnectnw.com/en/legal/warranty",
        es: "https://wirelessconnectnw.com/es/legal/warranty",
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
          vendidos a través de wirelessconnectnw.com.
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

        <h2>Cómo Presentar un Reclamo de Garantía</h2>
        <ol>
          <li>Contáctenos dentro del período de garantía en <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a> o llame al (206) 423-2965.</li>
          <li>Proporcione su número de orden y una descripción del problema.</li>
          <li>Se le proporcionarán instrucciones para diagnóstico y, si es elegible, reparación o sustitución.</li>
        </ol>

        <h2>Resolución de Garantía</h2>
        <p>
          A nuestra discreción, los reclamos de garantía elegibles serán resueltos mediante:
          reparación, sustitución por un dispositivo equivalente o reembolso parcial o total.
        </p>

        <h2>Garantías de Fabricante</h2>
        <p>
          Los dispositivos de segunda mano generalmente no incluyen garantía del fabricante
          original. La garantía de Wireless Connect es su único recurso de garantía para
          estos dispositivos.
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
    <LegalLayout title="Warranty Policy" lastUpdated="May 26, 2026">
      <p>
        Wireless Connect provides a limited warranty on eligible devices sold through
        wirelessconnectnw.com.
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

      <h2>How to Submit a Warranty Claim</h2>
      <ol>
        <li>Contact us within the warranty period at <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a> or call (206) 423-2965.</li>
        <li>Provide your order number and a description of the issue.</li>
        <li>You will be given instructions for diagnosis and, if eligible, repair or replacement.</li>
      </ol>

      <h2>Warranty Resolution</h2>
      <p>
        At our discretion, eligible warranty claims will be resolved through: repair,
        replacement with an equivalent device, or partial or full refund.
      </p>

      <h2>Manufacturer Warranties</h2>
      <p>
        Pre-owned devices typically do not include the original manufacturer&apos;s warranty.
        The Wireless Connect warranty is your sole warranty remedy for these devices.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:officialwirelessconnect@gmail.com">officialwirelessconnect@gmail.com</a>
        {" "}· (206) 423-2965
      </p>
    </LegalLayout>
  );
}
