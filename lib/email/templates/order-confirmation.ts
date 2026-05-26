/**
 * Order confirmation email template.
 *
 * Sent to the customer after payment is confirmed via Stripe webhook.
 * Supports EN and ES locales.
 *
 * Guest orders: includes the /order-confirmation?token=... URL so the
 * customer can view their order without creating an account.
 */

import { formatMoney } from "@/lib/utils/format-money";

export interface OrderConfirmationData {
  locale: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  fulfillmentMethod: "pickup" | "shipping";
  /** In cents */
  subtotal: number;
  /** In cents */
  total: number;
  /** In cents */
  discountTotal?: number;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number; // cents
    lineTotal: number; // cents
  }>;
  /** UUID — only for guest orders; omit for authenticated users. */
  guestAccessToken?: string;
  siteUrl: string;
}

const STORE_ADDRESS = "14723 Aurora Ave N, Seattle, WA 98133";

const strings = {
  en: {
    subject: (orderNumber: string) => `Order Confirmed — ${orderNumber}`,
    heading: "Your order is confirmed!",
    thankYou: "Thank you for your purchase.",
    orderNumber: "Order Number",
    item: "Item",
    qty: "Qty",
    price: "Price",
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Total",
    pickup: "Pickup Instructions",
    pickupDetail: `Your order will be ready for pickup at ${STORE_ADDRESS}. We will contact you when it's ready.`,
    shipping: "Shipping",
    shippingDetail: "We will send you a tracking number once your order has shipped.",
    viewOrder: "View Order",
    questions: "Questions? Reply to this email or visit us at the store.",
    footer: `Wireless Connect — ${STORE_ADDRESS}`,
  },
  es: {
    subject: (orderNumber: string) => `Pedido Confirmado — ${orderNumber}`,
    heading: "¡Tu pedido ha sido confirmado!",
    thankYou: "Gracias por tu compra.",
    orderNumber: "Número de Pedido",
    item: "Artículo",
    qty: "Cant.",
    price: "Precio",
    subtotal: "Subtotal",
    discount: "Descuento",
    total: "Total",
    pickup: "Instrucciones de Recogida",
    pickupDetail: `Tu pedido estará listo para recoger en ${STORE_ADDRESS}. Te contactaremos cuando esté listo.`,
    shipping: "Envío",
    shippingDetail: "Te enviaremos un número de seguimiento una vez que tu pedido haya sido enviado.",
    viewOrder: "Ver Pedido",
    questions: "¿Preguntas? Responde a este correo o visítanos en la tienda.",
    footer: `Wireless Connect — ${STORE_ADDRESS}`,
  },
};

export function buildOrderConfirmationEmail(data: OrderConfirmationData): {
  subject: string;
  html: string;
} {
  const loc = data.locale === "es" ? "es" : "en";
  const s = strings[loc];
  const orderPageUrl = data.guestAccessToken
    ? `${data.siteUrl}/${loc}/order-confirmation?token=${data.guestAccessToken}`
    : `${data.siteUrl}/${loc}/account`;

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${item.title}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">${formatMoney(item.lineTotal, data.locale)}</td>
      </tr>`,
    )
    .join("");

  const discountRow =
    data.discountTotal && data.discountTotal > 0
      ? `<tr>
          <td colspan="2" style="padding:4px 0;color:#666;">${s.discount}</td>
          <td style="padding:4px 0;text-align:right;color:#16a34a;">−${formatMoney(data.discountTotal, data.locale)}</td>
        </tr>`
      : "";

  const fulfillmentSection =
    data.fulfillmentMethod === "pickup"
      ? `<h3 style="color:#1a1a1a;margin-top:24px;">${s.pickup}</h3>
         <p style="color:#555;">${s.pickupDetail}</p>`
      : `<h3 style="color:#1a1a1a;margin-top:24px;">${s.shipping}</h3>
         <p style="color:#555;">${s.shippingDetail}</p>`;

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
              <h2 style="margin:0 0 8px;font-size:24px;">${s.heading}</h2>
              <p style="color:#555;margin:0 0 24px;">${s.thankYou}</p>

              <p style="margin:0 0 24px;">
                <strong>${s.orderNumber}:</strong>
                <span style="font-family:monospace;font-size:16px;color:#0f172a;">${data.orderNumber}</span>
              </p>

              <!-- Items -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr>
                    <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e5e7eb;font-size:12px;text-transform:uppercase;color:#888;">${s.item}</th>
                    <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #e5e7eb;font-size:12px;text-transform:uppercase;color:#888;">${s.qty}</th>
                    <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e5e7eb;font-size:12px;text-transform:uppercase;color:#888;">${s.price}</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  ${discountRow}
                  <tr>
                    <td colspan="2" style="padding:12px 0 0;font-weight:700;">${s.total}</td>
                    <td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:18px;">${formatMoney(data.total, data.locale)}</td>
                  </tr>
                </tfoot>
              </table>

              ${fulfillmentSection}

              <!-- CTA -->
              ${
                data.guestAccessToken
                  ? `<div style="margin-top:32px;text-align:center;">
                      <a href="${orderPageUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;">${s.viewOrder}</a>
                    </div>`
                  : ""
              }

              <p style="margin-top:32px;color:#888;font-size:14px;">${s.questions}</p>
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
