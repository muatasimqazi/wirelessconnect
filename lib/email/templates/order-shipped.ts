/**
 * Order shipped email — sent when admin marks an order as "shipped".
 * Includes tracking number and carrier. Supports EN + ES.
 */

export interface OrderShippedData {
  locale: string;
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  carrier: string;
  siteUrl: string;
}

const strings = {
  en: {
    subject: (orderNumber: string) => `Your Order Has Shipped — ${orderNumber}`,
    heading: "Your order is on its way!",
    intro: (name: string, orderNumber: string) =>
      `Hi ${name}, great news — your order <strong>${orderNumber}</strong> has shipped.`,
    tracking: "Tracking Number",
    carrier: "Carrier",
    trackingNote: "Use your tracking number on the carrier website to follow your package.",
    delivery: "Estimated delivery: 3–7 business days.",
    viewOrder: "View Order",
    questions: "Questions? Reply to this email or contact us at the store.",
    footer: "Wireless Connect — Certified Pre-Owned Phones",
  },
  es: {
    subject: (orderNumber: string) => `Tu Pedido Ha Sido Enviado — ${orderNumber}`,
    heading: "¡Tu pedido está en camino!",
    intro: (name: string, orderNumber: string) =>
      `Hola ${name}, excelentes noticias — tu pedido <strong>${orderNumber}</strong> ha sido enviado.`,
    tracking: "Número de Seguimiento",
    carrier: "Transportista",
    trackingNote: "Usa tu número de seguimiento en el sitio web del transportista para rastrear tu paquete.",
    delivery: "Entrega estimada: 3–7 días hábiles.",
    viewOrder: "Ver Pedido",
    questions: "¿Preguntas? Responde a este correo o contáctanos en la tienda.",
    footer: "Wireless Connect — Teléfonos Certificados",
  },
};

export function buildOrderShippedEmail(data: OrderShippedData): {
  subject: string;
  html: string;
} {
  const s = strings[data.locale as keyof typeof strings] ?? strings.en;
  const orderUrl = `${data.siteUrl}/en/account/orders/${data.orderNumber}`;

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
          <p style="margin:0 0 24px;color:#475569">${s.intro(data.customerName, data.orderNumber)}</p>

          <!-- Tracking box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px">
            <tr><td style="padding:20px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px">
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8">${s.tracking}</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;font-family:monospace;color:#2563eb">${data.trackingNumber}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8">${s.carrier}</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b">${data.carrier}</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;color:#475569">${s.trackingNote}</p>
          <p style="margin:0 0 24px;color:#475569">${s.delivery}</p>

          <a href="${orderUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:8px">${s.viewOrder}</a>

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

  return { subject: s.subject(data.orderNumber), html };
}
