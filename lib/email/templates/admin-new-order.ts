/**
 * Admin new-order notification email.
 *
 * Sent to the store admin after each successful payment.
 * Always in English (admin-facing).
 */

import { formatMoney } from "@/lib/utils/format-money";

export interface AdminNewOrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  fulfillmentMethod: "pickup" | "shipping";
  /** In cents */
  total: number;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number; // cents
  }>;
  adminOrderUrl: string;
}

export function buildAdminNewOrderEmail(data: AdminNewOrderData): {
  subject: string;
  html: string;
} {
  const subject = `New Order — ${data.orderNumber} (${data.fulfillmentMethod === "pickup" ? "Pickup" : "Shipping"})`;

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${item.title}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:right;">${formatMoney(item.unitPrice * item.quantity, "en")}</td>
      </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>${subject}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="560" style="max-width:560px;background:#fff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#16a34a;padding:16px 24px;">
              <h1 style="margin:0;color:#fff;font-size:16px;">🛒 New Order Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 4px;"><strong>Order:</strong> ${data.orderNumber}</p>
              <p style="margin:0 0 4px;"><strong>Fulfillment:</strong> ${data.fulfillmentMethod === "pickup" ? "📍 Pickup" : "📦 Shipping"}</p>
              <p style="margin:0 0 4px;"><strong>Total:</strong> ${formatMoney(data.total, "en")}</p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />

              <p style="margin:0 0 4px;"><strong>Customer:</strong> ${data.customerName}</p>
              <p style="margin:0 0 4px;"><strong>Email:</strong> ${data.customerEmail}</p>
              ${data.customerPhone ? `<p style="margin:0 0 4px;"><strong>Phone:</strong> ${data.customerPhone}</p>` : ""}

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="text-align:left;font-size:11px;text-transform:uppercase;color:#888;padding-bottom:8px;">Item</th>
                    <th style="text-align:center;font-size:11px;text-transform:uppercase;color:#888;padding-bottom:8px;">Qty</th>
                    <th style="text-align:right;font-size:11px;text-transform:uppercase;color:#888;padding-bottom:8px;">Total</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
              </table>

              <div style="margin-top:20px;">
                <a href="${data.adminOrderUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;">View in Admin</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
