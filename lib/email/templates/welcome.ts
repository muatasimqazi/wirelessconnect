/**
 * Welcome email — sent to new customers after successful signup.
 * Supports EN + ES.
 */

export interface WelcomeEmailData {
  locale: string;
  customerName: string;
  siteUrl: string;
}

const strings = {
  en: {
    subject: "Welcome to Wireless Connect!",
    heading: "Welcome aboard!",
    intro: (name: string) =>
      `Hi ${name}, thanks for creating an account with Wireless Connect.`,
    body: "We sell certified pre-owned phones — professionally tested, clean IMEI verified, and backed by a warranty. Every device goes through a 14-point inspection before it's listed.",
    shopCta: "Browse Phones",
    features: [
      "✓ Certified pre-owned iPhones, Samsung, and Google Pixel phones",
      "✓ Battery health disclosed on every listing",
      "✓ Clean IMEI verified",
      "✓ 30-day warranty included",
      "✓ Local pickup in Shoreline, WA or ships anywhere in the U.S.",
    ],
    questions: "Questions? Reply to this email — we're happy to help.",
    footer: "Wireless Connect — 14723 Aurora Ave N, Shoreline, WA 98133",
  },
  es: {
    subject: "¡Bienvenido a Wireless Connect!",
    heading: "¡Bienvenido!",
    intro: (name: string) =>
      `Hola ${name}, gracias por crear una cuenta en Wireless Connect.`,
    body: "Vendemos teléfonos usados certificados — probados profesionalmente, IMEI limpio verificado y con garantía incluida. Cada dispositivo pasa por una inspección de 14 puntos antes de publicarse.",
    shopCta: "Ver Teléfonos",
    features: [
      "✓ iPhones, Samsung y Google Pixel usados certificados",
      "✓ Salud de batería indicada en cada listado",
      "✓ IMEI limpio verificado",
      "✓ Garantía de 30 días incluida",
      "✓ Recogida local en Shoreline, WA o envío a todo EE.UU.",
    ],
    questions: "¿Preguntas? Responde a este correo — con gusto te ayudamos.",
    footer: "Wireless Connect — 14723 Aurora Ave N, Shoreline, WA 98133",
  },
};

export function buildWelcomeEmail(data: WelcomeEmailData): {
  subject: string;
  html: string;
} {
  const s = strings[data.locale as keyof typeof strings] ?? strings.en;
  const shopUrl = `${data.siteUrl}/${data.locale}/shop`;

  const html = `<!DOCTYPE html>
<html lang="${data.locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,sans-serif;color:#1e293b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%">
        <!-- Header -->
        <tr><td style="background:#0f172a;padding:24px 32px">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700">Wireless Connect</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b">${s.heading}</h1>
          <p style="margin:0 0 16px;color:#475569">${s.intro(data.customerName)}</p>
          <p style="margin:0 0 24px;color:#475569">${s.body}</p>

          <!-- Features list -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px">
            <tr><td style="padding:20px">
              ${s.features.map((f) => `<p style="margin:0 0 8px;font-size:14px;color:#1e293b;last-child:margin-bottom:0">${f}</p>`).join("")}
            </td></tr>
          </table>

          <a href="${shopUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:8px">${s.shopCta}</a>

          <p style="margin:32px 0 0;color:#94a3b8;font-size:13px">${s.questions}</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">${s.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: s.subject, html };
}
