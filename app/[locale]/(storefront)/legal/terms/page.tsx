/**
 * Terms of Service — /[locale]/legal/terms
 *
 * Required before launch per Sprint 6 spec.
 * Both English and Spanish served from this single route via next-intl locale param.
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
    title: isEs ? "Términos de Servicio" : "Terms of Service",
    description: isEs
      ? "Los términos y condiciones que rigen el uso de Wireless Connect."
      : "The terms and conditions governing your use of Wireless Connect.",
    alternates: {
      canonical: `https://wirelessconnectstore.com/${locale}/legal/terms`,
      languages: {
        en: "https://wirelessconnectstore.com/en/legal/terms",
        es: "https://wirelessconnectstore.com/es/legal/terms",
      },
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEs = locale === "es";

  if (isEs) {
    return (
      <LegalLayout title="Términos de Servicio" lastUpdated="26 de mayo de 2026">
        <p>
          Bienvenido a Wireless Connect. Al acceder o utilizar nuestro sitio web y servicios,
          usted acepta estar sujeto a estos Términos de Servicio. Léalos detenidamente.
        </p>

        <h2>1. Aceptación de los Términos</h2>
        <p>
          Al usar el sitio web de Wireless Connect ubicado en wirelessconnectstore.com, usted
          confirma que tiene al menos 18 años de edad o que tiene el consentimiento de un
          padre o tutor legal, y que acepta cumplir con estos términos.
        </p>

        <h2>2. Productos y Disponibilidad</h2>
        <p>
          Todos los productos que vendemos son teléfonos certificados de segunda mano. La
          disponibilidad del inventario puede cambiar sin previo aviso. Nos reservamos el
          derecho de limitar las cantidades y de rechazar pedidos a nuestra discreción.
        </p>

        <h2>3. Precios y Pago</h2>
        <p>
          Todos los precios se muestran en dólares estadounidenses (USD) e incluyen el
          impuesto aplicable calculado durante el proceso de pago. Aceptamos pagos a través
          de Stripe. El pago completo es requerido al momento de realizar el pedido.
        </p>

        <h2>4. Política de Devoluciones</h2>
        <p>
          Consulte nuestra{" "}
          <a href={`/${locale}/legal/returns`}>Política de Devoluciones</a> para obtener
          información completa sobre elegibilidad y el proceso de devolución.
        </p>

        <h2>5. Garantía</h2>
        <p>
          Todos los dispositivos elegibles incluyen una garantía limitada. Consulte nuestra{" "}
          <a href={`/${locale}/legal/warranty`}>Política de Garantía</a> para más detalles.
        </p>

        <h2>6. Limitación de Responsabilidad</h2>
        <p>
          En la medida máxima permitida por la ley, Wireless Connect no será responsable
          de daños indirectos, incidentales, especiales o consecuentes que resulten del uso
          o la imposibilidad de usar nuestros productos o servicios. Nuestra responsabilidad
          total no superará el precio de compra del producto en cuestión.
        </p>

        <h2>7. Ley Aplicable</h2>
        <p>
          Estos términos se rigen por las leyes del Estado de Washington, Estados Unidos,
          sin tener en cuenta sus disposiciones sobre conflicto de leyes.
        </p>

        <h2>8. Cambios a los Términos</h2>
        <p>
          Podemos actualizar estos Términos de Servicio en cualquier momento. Los cambios
          entrarán en vigor inmediatamente después de su publicación en el sitio. El uso
          continuado del sitio después de los cambios constituye su aceptación de los nuevos
          términos.
        </p>

        <h2>9. Contacto</h2>
        <p>
          Si tiene preguntas sobre estos Términos, contáctenos en{" "}
          <a href="mailto:officialwirelessconnect@gmail.com">
            officialwirelessconnect@gmail.com
          </a>{" "}
          o llámenos al (206) 423-2965.
        </p>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title="Terms of Service" lastUpdated="May 26, 2026">
      <p>
        Welcome to Wireless Connect. By accessing or using our website and services, you
        agree to be bound by these Terms of Service. Please read them carefully.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By using the Wireless Connect website at wirelessconnectstore.com, you confirm that
        you are at least 18 years old or have the consent of a parent or legal guardian,
        and that you agree to comply with these terms.
      </p>

      <h2>2. Products and Availability</h2>
      <p>
        All products we sell are certified pre-owned phones. Inventory availability may
        change without notice. We reserve the right to limit quantities and to refuse orders
        at our discretion.
      </p>

      <h2>3. Pricing and Payment</h2>
      <p>
        All prices are shown in U.S. dollars (USD) and include applicable sales tax
        calculated during checkout. We accept payment through Stripe. Full payment is
        required at the time of purchase.
      </p>

      <h2>4. Return Policy</h2>
      <p>
        Please refer to our{" "}
        <a href={`/${locale}/legal/returns`}>Return Policy</a> for complete information on
        eligibility and the return process.
      </p>

      <h2>5. Warranty</h2>
      <p>
        All eligible devices include a limited warranty. Please refer to our{" "}
        <a href={`/${locale}/legal/warranty`}>Warranty Policy</a> for details.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Wireless Connect shall not be liable for
        indirect, incidental, special, or consequential damages arising from your use of or
        inability to use our products or services. Our total liability shall not exceed the
        purchase price of the product in question.
      </p>

      <h2>7. Governing Law</h2>
      <p>
        These terms are governed by the laws of the State of Washington, United States,
        without regard to its conflict of law provisions.
      </p>

      <h2>8. Changes to Terms</h2>
      <p>
        We may update these Terms of Service at any time. Changes take effect immediately
        upon posting to the site. Continued use of the site after changes constitutes your
        acceptance of the new terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        If you have questions about these Terms, contact us at{" "}
        <a href="mailto:officialwirelessconnect@gmail.com">
          officialwirelessconnect@gmail.com
        </a>{" "}
        or call us at (206) 423-2965.
      </p>
    </LegalLayout>
  );
}
