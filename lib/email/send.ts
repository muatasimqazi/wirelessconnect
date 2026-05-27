/**
 * Email sending utility using Resend.
 *
 * Wraps Resend to provide:
 *  - Graceful degradation when RESEND_API_KEY is not set (dev / CI)
 *  - Consistent sender address
 *  - Admin notification helper
 *
 * All emails are sent from: Wireless Connect <orders@wirelessconnectnw.com>
 */

import { Resend } from "resend";

const FROM = "Wireless Connect <orders@wirelessconnectnw.com>";

// Admin recipient — falls back to env var, then a hard-coded fallback
const ADMIN_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL ??
  process.env.STORE_EMAIL ??
  "admin@wirelessconnectnw.com";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send a transactional email.
 * Silently skips when RESEND_API_KEY is not configured.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping send:", payload.subject);
    return;
  }

  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text ?? stripHtml(payload.html),
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    });

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    // Non-fatal — log but do not throw so callers (webhooks) still return 200
    console.error("[email] Failed to send email:", err);
  }
}

/**
 * Send a notification to the store admin.
 */
export async function sendAdminEmail(payload: Omit<EmailPayload, "to">): Promise<void> {
  await sendEmail({ ...payload, to: ADMIN_EMAIL });
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
