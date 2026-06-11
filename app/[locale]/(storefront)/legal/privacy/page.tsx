/**
 * Privacy Policy — /[locale]/legal/privacy
 *
 * Required before launch per Sprint 6 spec.
 * Includes CCPA language and "Do Not Sell" section.
 * Data deletion requests stored in `data_deletion_requests` table (45-day response deadline).
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
    title: isEs ? "Política de Privacidad" : "Privacy Policy",
    description: isEs
      ? "Cómo Wireless Connect recopila, usa y protege su información personal."
      : "How Wireless Connect collects, uses, and protects your personal information.",
    alternates: {
      canonical: `https://wirelessconnectstore.com/${locale}/legal/privacy`,
      languages: {
        en: "https://wirelessconnectstore.com/en/legal/privacy",
        es: "https://wirelessconnectstore.com/es/legal/privacy",
      },
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEs = locale === "es";

  if (isEs) {
    return (
      <LegalLayout title="Política de Privacidad" lastUpdated="26 de mayo de 2026">
        <p>
          Wireless Connect (&ldquo;nosotros&rdquo;, &ldquo;nuestro&rdquo;) respeta su privacidad.
          Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos su información
          personal cuando usa nuestro sitio web en wirelessconnectstore.com.
        </p>

        <h2>1. Información que Recopilamos</h2>
        <p>Podemos recopilar los siguientes tipos de información:</p>
        <ul>
          <li><strong>Información de cuenta:</strong> nombre, dirección de correo electrónico y contraseña cuando crea una cuenta.</li>
          <li><strong>Información de pedido:</strong> nombre, dirección de envío, número de teléfono e historial de pedidos.</li>
          <li><strong>Información de pago:</strong> procesada de forma segura por Stripe. No almacenamos datos de tarjetas de crédito en nuestros servidores.</li>
          <li><strong>Datos de uso:</strong> dirección IP, tipo de navegador, páginas visitadas y duración de la sesión.</li>
          <li><strong>Cookies:</strong> usamos cookies de sesión para gestionar carritos de compra y preferencias de idioma.</li>
        </ul>

        <h2>2. Cómo Usamos Su Información</h2>
        <p>Usamos su información para:</p>
        <ul>
          <li>Procesar y cumplir sus pedidos</li>
          <li>Enviar confirmaciones de pedidos y actualizaciones de envío</li>
          <li>Responder a consultas de atención al cliente</li>
          <li>Mejorar nuestro sitio web y servicios</li>
          <li>Cumplir con obligaciones legales</li>
        </ul>

        <h2>3. Compartir su Información</h2>
        <p>
          No vendemos su información personal a terceros. Podemos compartir información con
          proveedores de servicios de confianza que nos ayudan a operar nuestro negocio
          (Stripe para pagos, Resend para correo electrónico, Supabase para almacenamiento de datos).
          Estos proveedores solo pueden usar su información para prestarnos servicios.
        </p>

        <h2>4. Seguridad de Datos</h2>
        <p>
          Utilizamos medidas técnicas estándar de la industria para proteger su información,
          incluyendo HTTPS, bases de datos cifradas y controles de acceso. Sin embargo,
          ningún método de transmisión por internet es 100% seguro.
        </p>

        <h2>5. Sus Derechos — Residentes de California (CCPA)</h2>
        <p>
          Si es residente de California, tiene los siguientes derechos bajo la Ley de
          Privacidad del Consumidor de California (CCPA):
        </p>
        <ul>
          <li><strong>Derecho a Saber:</strong> solicitar información sobre los datos personales que hemos recopilado sobre usted.</li>
          <li><strong>Derecho a Eliminar:</strong> solicitar que eliminemos su información personal, sujeto a ciertas excepciones.</li>
          <li><strong>Derecho a No Vender:</strong> optar por no participar en la venta de su información personal. <strong>No vendemos información personal.</strong></li>
          <li><strong>Derecho a la No Discriminación:</strong> no lo discriminaremos por ejercer sus derechos de privacidad.</li>
        </ul>

        <h3>No Vender Mi Información Personal</h3>
        <p>
          Wireless Connect no vende información personal de consumidores. Si desea presentar
          una solicitud de eliminación de datos o ejercer sus derechos de privacidad de
          California, visite nuestra{" "}
          <a href={`/${locale}/legal/privacy/data-deletion`}>
            página de Solicitud de Eliminación de Datos
          </a>.
        </p>

        <h2>6. Retención de Datos</h2>
        <p>
          Conservamos su información personal durante el tiempo necesario para cumplir los
          fines descritos en esta política, o según lo requiera la ley. Los registros de
          compra se conservan durante un mínimo de 7 años para cumplir con los requisitos
          fiscales y de cumplimiento.
        </p>

        <h2>7. Privacidad de Menores</h2>
        <p>
          Nuestro sitio no está dirigido a menores de 13 años. No recopilamos
          conscientemente información personal de niños menores de 13 años.
        </p>

        <h2>8. Cambios a Esta Política</h2>
        <p>
          Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos
          los cambios importantes publicando la nueva política en esta página con una fecha
          de actualización revisada.
        </p>

        <h2>9. Contacto</h2>
        <p>
          Para preguntas de privacidad o para ejercer sus derechos, contáctenos en:{" "}
          <a href="mailto:officialwirelessconnect@gmail.com">
            officialwirelessconnect@gmail.com
          </a>
        </p>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title="Privacy Policy" lastUpdated="May 26, 2026">
      <p>
        Wireless Connect (&ldquo;we,&rdquo; &ldquo;our,&rdquo; &ldquo;us&rdquo;) respects your
        privacy. This Privacy Policy explains how we collect, use, and protect your personal
        information when you use our website at wirelessconnectstore.com.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We may collect the following types of information:</p>
      <ul>
        <li><strong>Account information:</strong> name, email address, and password when you create an account.</li>
        <li><strong>Order information:</strong> name, shipping address, phone number, and order history.</li>
        <li><strong>Payment information:</strong> processed securely by Stripe. We do not store credit card data on our servers.</li>
        <li><strong>Usage data:</strong> IP address, browser type, pages visited, and session duration.</li>
        <li><strong>Cookies:</strong> we use session cookies to manage shopping carts and language preferences.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Process and fulfill your orders</li>
        <li>Send order confirmations and shipping updates</li>
        <li>Respond to customer service inquiries</li>
        <li>Improve our website and services</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>3. Sharing Your Information</h2>
      <p>
        We do not sell your personal information to third parties. We may share information
        with trusted service providers who help us operate our business (Stripe for payments,
        Resend for email, Supabase for data storage). These providers may only use your
        information to provide services to us.
      </p>

      <h2>4. Data Security</h2>
      <p>
        We use industry-standard technical measures to protect your information, including
        HTTPS, encrypted databases, and access controls. However, no method of internet
        transmission is 100% secure.
      </p>

      <h2>5. Your Rights — California Residents (CCPA)</h2>
      <p>
        If you are a California resident, you have the following rights under the California
        Consumer Privacy Act (CCPA):
      </p>
      <ul>
        <li><strong>Right to Know:</strong> request information about the personal data we have collected about you.</li>
        <li><strong>Right to Delete:</strong> request that we delete your personal information, subject to certain exceptions.</li>
        <li><strong>Right to Opt Out of Sale:</strong> opt out of the sale of your personal information. <strong>We do not sell personal information.</strong></li>
        <li><strong>Right to Non-Discrimination:</strong> we will not discriminate against you for exercising your privacy rights.</li>
      </ul>

      <h3>Do Not Sell My Personal Information</h3>
      <p>
        Wireless Connect does not sell consumer personal information. If you wish to submit a
        data deletion request or exercise your California privacy rights, please visit our{" "}
        <a href={`/${locale}/legal/privacy/data-deletion`}>Data Deletion Request page</a>.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        We retain your personal information for as long as necessary to fulfill the purposes
        described in this policy, or as required by law. Purchase records are retained for a
        minimum of 7 years to meet tax and compliance requirements.
      </p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>
        Our site is not directed to children under 13. We do not knowingly collect personal
        information from children under 13.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy periodically. We will notify you of important
        changes by posting the new policy on this page with a revised update date.
      </p>

      <h2>9. Contact</h2>
      <p>
        For privacy questions or to exercise your rights, contact us at:{" "}
        <a href="mailto:officialwirelessconnect@gmail.com">
          officialwirelessconnect@gmail.com
        </a>
      </p>
    </LegalLayout>
  );
}
