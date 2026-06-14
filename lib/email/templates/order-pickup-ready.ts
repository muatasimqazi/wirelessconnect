/**
 * Order pickup ready email — sent when admin marks a pickup order as "ready_for_pickup".
 * Includes store address and instructions. Supports EN + ES.
 */

export interface OrderPickupReadyData {
  locale: string;
  orderNumber: string;
  customerName: string;
  storeAddress: string;
  storePhone: string;
  siteUrl: string;
}

const strings = {
  en: {
    subject: (orderNumber: string) => `Your Order Is Ready for Pickup — ${orderNumber}`,
    heading: "Your order is ready!",
    intro: (name: string, orderNumber: string) =>
      `Hi ${name}, your order <strong>${orderNumber}</strong> is ready for pickup at our store.`,
    address: "Store Address",
    phone: "Phone",
    instructions: "What to Bring",
    instructionsDetail: "Please bring this email or your order confirmation number when picking up.",
    hours: "Store Hours",
    hoursDetail: "Mon–Fri: 10:00 AM – 7:00 PM · Sat: 10:00 AM – 6:00 PM · Sun: Closed",
    viewOrder: "View Order",
    questions: "Questions? Give us a call or reply to this email.",
    footer: "Wireless Connect — Certified Pre-Owned Phones",
  },
  es: {
    subject: (orderNumber: string) => `Tu Pedido Está Listo para Recoger — ${orderNumber}`,
    heading: "¡Tu pedido está listo!",
    intro: (name: string, orderNumber: string) =>
      `Hola ${name}, tu pedido <strong>${orderNumber}</strong> está listo para recoger en nuestra tienda.`,
    address: "Dirección de la Tienda",
    phone: "Teléfono",
    instructions: "Qué Traer",
    instructionsDetail: "Por favor trae este correo o tu número de confirmación de pedido al recoger.",
    hours: "Horario de la Tienda",
    hoursDetail: "Lun–Vie: 10:00 AM – 7:00 PM · Sáb: 10:00 AM – 6:00 PM · Dom: Cerrado",
    viewOrder: "Ver Pedido",
    questions: "¿Preguntas? Llámanos o responde a este correo.",
    footer: "Wireless Connect — Teléfonos Certificados",
  },
};

export function buildOrderPickupReadyEmail(data: OrderPickupReadyData): {
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

          <!-- Info box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px">
            <tr><td style="padding:20px">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#16a34a">${s.address}</p>
              <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1e293b">${data.storeAddress}</p>
              ${data.storePhone ? `
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#16a34a">${s.phone}</p>
              <p style="margin:0 0 16px;font-size:15px;color:#1e293b">${data.storePhone}</p>` : ""}
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#16a34a">${s.hours}</p>
              <p style="margin:0;font-size:14px;color:#475569">${s.hoursDetail}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 24px;padding:12px 16px;background:#fef9c3;border-radius:6px;font-size:14px;color:#854d0e">
            📋 ${s.instructionsDetail}
          </p>

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
