import "server-only";

export type EmailResult = { sent: boolean; reason?: string };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * إرسال بريد عبر Resend API دون إضافة اعتماديات · يتجاهل الإرسال عند غياب المفتاح.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      return { sent: false, reason: `EMAIL_FAILED_${response.status}` };
    }

    return { sent: true };
  } catch {
    return { sent: false, reason: "EMAIL_REQUEST_FAILED" };
  }
}
