/**
 * Warranty claim status update email template.
 *
 * Sent to the customer when their warranty claim status changes.
 * Supports EN and ES locales.
 * Covers: submitted confirmation, under_review, approved, denied, resolved.
 */

const STORE_ADDRESS = "14723 Aurora Ave N, Shoreline, WA 98133";
const STORE_EMAIL = "officialwirelessconnect@gmail.com";
const STORE_PHONE = "(206) 423-2965";

type ClaimStatus = "submitted" | "under_review" | "approved" | "denied" | "resolved";

export interface WarrantyClaimEmailData {
  locale: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  deviceTitle: string;
  claimStatus: ClaimStatus;
  /** Staff notes visible to customer — optional */
  claimNotes?: string;
}

interface StatusStrings {
  subject: string;
  heading: string;
  statusLine: string;
  body: string;
}

const STATUS_STRINGS: Record<ClaimStatus, { en: StatusStrings; es: StatusStrings }> = {
  submitted: {
    en: {
      subject: "Warranty Claim Received",
      heading: "We received your warranty claim",
      statusLine: "Status: Claim Submitted",
      body: "We have received your warranty claim and will review it shortly. You can expect a response within 3–5 business days.",
    },
    es: {
      subject: "Reclamación de Garantía Recibida",
      heading: "Hemos recibido tu reclamación de garantía",
      statusLine: "Estado: Reclamación Enviada",
      body: "Hemos recibido tu reclamación de garantía y la revisaremos pronto. Puedes esperar una respuesta dentro de 3 a 5 días hábiles.",
    },
  },
  under_review: {
    en: {
      subject: "Warranty Claim Under Review",
      heading: "Your warranty claim is being reviewed",
      statusLine: "Status: Under Review",
      body: "Your warranty claim is currently under review by our team. We will contact you with a decision as soon as possible.",
    },
    es: {
      subject: "Reclamación de Garantía en Revisión",
      heading: "Tu reclamación de garantía está siendo revisada",
      statusLine: "Estado: En Revisión",
      body: "Tu reclamación de garantía está siendo revisada por nuestro equipo. Te contactaremos con una decisión lo antes posible.",
    },
  },
  approved: {
    en: {
      subject: "Warranty Claim Approved",
      heading: "Your warranty claim has been approved",
      statusLine: "Status: Approved ✓",
      body: "Great news — your warranty claim has been approved. We will contact you to arrange the next steps (repair, replacement, or refund).",
    },
    es: {
      subject: "Reclamación de Garantía Aprobada",
      heading: "Tu reclamación de garantía ha sido aprobada",
      statusLine: "Estado: Aprobada ✓",
      body: "Buenas noticias: tu reclamación de garantía ha sido aprobada. Nos pondremos en contacto contigo para coordinar los próximos pasos (reparación, reemplazo o reembolso).",
    },
  },
  denied: {
    en: {
      subject: "Warranty Claim Update",
      heading: "Your warranty claim could not be approved",
      statusLine: "Status: Denied",
      body: "After reviewing your warranty claim, we were unable to approve it based on our warranty policy. If you have questions, please contact us — we are happy to discuss your situation.",
    },
    es: {
      subject: "Actualización de Reclamación de Garantía",
      heading: "Tu reclamación de garantía no pudo ser aprobada",
      statusLine: "Estado: Denegada",
      body: "Después de revisar tu reclamación de garantía, no pudimos aprobarla según nuestra política de garantía. Si tienes preguntas, contáctanos: estaremos encantados de discutir tu situación.",
    },
  },
  resolved: {
    en: {
      subject: "Warranty Claim Resolved",
      heading: "Your warranty claim has been resolved",
      statusLine: "Status: Resolved ✓",
      body: "Your warranty claim has been fully resolved. Thank you for choosing Wireless Connect — we hope you are satisfied with the outcome.",
    },
    es: {
      subject: "Reclamación de Garantía Resuelta",
      heading: "Tu reclamación de garantía ha sido resuelta",
      statusLine: "Estado: Resuelta ✓",
      body: "Tu reclamación de garantía ha sido completamente resuelta. Gracias por elegir Wireless Connect — esperamos que estés satisfecho con el resultado.",
    },
  },
};

export function buildWarrantyClaimEmail(data: WarrantyClaimEmailData): {
  subject: string;
  html: string;
} {
  const loc = data.locale === "es" ? "es" : "en";
  const statusStr = STATUS_STRINGS[data.claimStatus][loc];

  const notesBlock = data.claimNotes
    ? `<div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:4px solid #3b82f6;border-radius:4px;color:#1e3a5f;">
        <strong>${loc === "es" ? "Nota de nuestro equipo" : "Note from our team"}:</strong>
        <p style="margin:4px 0 0;">${data.claimNotes}</p>
       </div>`
    : "";

  const contactLine =
    loc === "es"
      ? `Preguntas: <a href="mailto:${STORE_EMAIL}" style="color:#0f172a;">${STORE_EMAIL}</a> · ${STORE_PHONE}`
      : `Questions: <a href="mailto:${STORE_EMAIL}" style="color:#0f172a;">${STORE_EMAIL}</a> · ${STORE_PHONE}`;

  const html = `
<!DOCTYPE html>
<html lang="${loc}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${statusStr.subject}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Wireless Connect</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:22px;">${statusStr.heading}</h2>

              <!-- Device + order info -->
              <table role="presentation" width="100%" style="border:1px solid #e5e7eb;border-radius:6px;border-collapse:collapse;margin-bottom:20px;">
                <tr>
                  <td style="padding:10px 16px;background:#f9fafb;font-size:12px;text-transform:uppercase;color:#888;font-weight:600;letter-spacing:0.05em;">
                    ${loc === "es" ? "Dispositivo" : "Device"}
                  </td>
                  <td style="padding:10px 16px;font-weight:500;">${data.deviceTitle}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;background:#f9fafb;font-size:12px;text-transform:uppercase;color:#888;font-weight:600;letter-spacing:0.05em;border-top:1px solid #e5e7eb;">
                    ${loc === "es" ? "Pedido" : "Order"}
                  </td>
                  <td style="padding:10px 16px;font-family:monospace;border-top:1px solid #e5e7eb;">${data.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;background:#f9fafb;font-size:12px;text-transform:uppercase;color:#888;font-weight:600;letter-spacing:0.05em;border-top:1px solid #e5e7eb;">
                    ${loc === "es" ? "Estado" : "Status"}
                  </td>
                  <td style="padding:10px 16px;font-weight:600;border-top:1px solid #e5e7eb;">${statusStr.statusLine}</td>
                </tr>
              </table>

              <p style="color:#555;margin:0 0 16px;">${statusStr.body}</p>

              ${notesBlock}

              <p style="color:#888;margin:24px 0 0;font-size:13px;">${contactLine}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;text-align:center;color:#aaa;font-size:12px;">
              Wireless Connect — ${STORE_ADDRESS}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: statusStr.subject, html };
}
