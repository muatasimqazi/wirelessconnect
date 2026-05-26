/**
 * Order cancellation email template.
 *
 * Sent to the customer when an admin cancels their order.
 * Supports EN and ES locales.
 */

const STORE_ADDRESS = "14723 Aurora Ave N, Shoreline, WA 98133";
const STORE_EMAIL = "officialwirelessconnect@gmail.com";
const STORE_PHONE = "(206) 423-2965";

export interface OrderCancellationData {
  locale: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  /** Reason shown to customer — omit to show a generic message. */
  cancellationReason?: string;
}

const strings = {
  en: {
    subject: (orderNumber: string) => `Order Cancelled — ${orderNumber}`,
    heading: "Your order has been cancelled",
    intro: (name: string, orderNumber: string) =>
      `Hi ${name}, we're writing to let you know that your order <strong>${orderNumber}</strong> has been cancelled.`,
    reason: "Reason",
    refund:
      "If your card was charged, a full refund will be issued to your original payment method within 5–10 business days.",
    questions: `If you have any questions, please contact us at ${STORE_EMAIL} or call us at ${STORE_PHONE}.`,
    apology: "We apologize for any inconvenience.",
    footer: `Wireless Connect — ${STORE_ADDRESS}`,
  },
  es: {
    subject: (orderNumber: string) => `Pedido Cancelado — ${orderNumber}`,
    heading: "Tu pedido ha sido cancelado",
    intro: (name: string, orderNumber: string) =>
      `Hola ${name}, te escribimos para informarte que tu pedido <strong>${orderNumber}</strong> ha sido cancelado.`,
    reason: "Motivo",
    refund:
      "Si se realizó un cargo a tu tarjeta, se emitirá un reembolso completo al método de pago original en un plazo de 5 a 10 días hábiles.",
    questions: `Si tienes alguna pregunta, contáctanos en ${STORE_EMAIL} o llámanos al ${STORE_PHONE}.`,
    apology: "Lamentamos los inconvenientes ocasionados.",
    footer: `Wireless Connect — ${STORE_ADDRESS}`,
  },
};

export function buildOrderCancellationEmail(data: OrderCancellationData): {
  subject: string;
  html: string;
} {
  const loc = data.locale === "es" ? "es" : "en";
  const s = strings[loc];

  const reasonBlock = data.cancellationReason
    ? `<p style="margin:16px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;color:#7f1d1d;">
        <strong>${s.reason}:</strong> ${data.cancellationReason}
       </p>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="${loc}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${s.subject(data.orderNumber)}</title>
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
              <h2 style="margin:0 0 16px;font-size:22px;">${s.heading}</h2>
              <p style="color:#555;margin:0 0 16px;"
                 dangerouslySetInnerHTML="{undefined}">${s.intro(data.customerName, data.orderNumber)}</p>

              ${reasonBlock}

              <p style="color:#555;margin:16px 0;">${s.refund}</p>
              <p style="color:#555;margin:16px 0;">${s.questions}</p>
              <p style="color:#888;margin:16px 0;font-size:14px;">${s.apology}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;text-align:center;color:#aaa;font-size:12px;">
              ${s.footer}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: s.subject(data.orderNumber), html };
}
