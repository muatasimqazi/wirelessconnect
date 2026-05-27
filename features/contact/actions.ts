"use server";

/**
 * Contact form server action.
 * Sends the customer's message to the store email via Resend.
 */

import { sendEmail } from "@/lib/email/send";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

const STORE_EMAIL = "officialwirelessconnect@gmail.com";

export async function sendContactEmail(data: ContactFormData): Promise<ActionResult> {
  const { name, email, subject, message } = data;

  if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
    return { success: false, error: "All fields are required." };
  }
  if (message.trim().length < 10) {
    return { success: false, error: "Message is too short." };
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family:-apple-system,sans-serif;color:#1a1a1a;padding:24px;max-width:600px;">
  <h2 style="margin:0 0 16px;">New Contact Form Submission</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr>
      <td style="padding:8px 12px;background:#f9fafb;font-weight:600;width:120px;border:1px solid #e5e7eb;">Name</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(name)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#f9fafb;font-weight:600;border:1px solid #e5e7eb;border-top:0;">Email</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;border-top:0;">
        <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#f9fafb;font-weight:600;border:1px solid #e5e7eb;border-top:0;">Subject</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;border-top:0;">${escapeHtml(subject)}</td>
    </tr>
  </table>
  <div style="margin-top:16px;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;white-space:pre-wrap;font-size:14px;">
    ${escapeHtml(message)}
  </div>
</body>
</html>`;

  await sendEmail({
    to: STORE_EMAIL,
    subject: `Contact: ${subject}`,
    html,
    replyTo: email,
  });

  return { success: true };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
