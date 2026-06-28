import nodemailer from "nodemailer";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using the configured custom provider (Resend, SendGrid, or SMTP).
 * Returns success: true if sent, or success: false with an error message.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const provider = process.env.EMAIL_PROVIDER || "";
  const from = process.env.EMAIL_FROM || "CostPilot AI <noreply@costpilotsai.com>";

  // 1. Resend Provider
  if (provider === "resend" || process.env.RESEND_API_KEY) {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error("RESEND_API_KEY is not defined");
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Resend API error: ${res.status} ${errText}`);
      }

      return { success: true };
    } catch (err) {
      console.error("Failed to send email via Resend:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // 2. SendGrid Provider
  if (provider === "sendgrid" || process.env.SENDGRID_API_KEY) {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        throw new Error("SENDGRID_API_KEY is not defined");
      }
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { 
            email: from.includes("<") ? from.split("<")[1].replace(">", "").trim() : from, 
            name: from.includes("<") ? from.split("<")[0].trim() : "CostPilot AI" 
          },
          subject: payload.subject,
          content: [{ type: "text/html", value: payload.html }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`SendGrid API error: ${res.status} ${errText}`);
      }

      return { success: true };
    } catch (err) {
      console.error("Failed to send email via SendGrid:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // 3. SMTP Provider (Zoho, etc.)
  if (provider === "smtp" || process.env.SMTP_HOST) {
    try {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!host || !user || !pass) {
        throw new Error("SMTP configuration is incomplete (host, user, and pass are required)");
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      return { success: true };
    } catch (err) {
      console.error("Failed to send email via SMTP:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // If no custom email provider is configured
  return { success: false, error: "No custom email provider configured in environment variables." };
}

/**
 * Helper to send the signup/email verification link to the user.
 */
export async function sendVerificationEmail(email: string, confirmLink: string): Promise<{ success: boolean; error?: string }> {
  const subject = "Confirm your email - CostPilot AI";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #111827; margin-bottom: 16px;">Welcome to CostPilot AI!</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 24px;">Please confirm your email address to complete your signup and activate your account.</p>
      <div style="margin: 24px 0;">
        <a href="${confirmLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; font-weight: 500; border-radius: 6px; display: inline-block;">Confirm Email Address</a>
      </div>
      <p style="color: #6b7280; font-size: 14px; line-height: 20px;">If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="color: #2563eb; font-size: 14px; word-break: break-all;"><a href="${confirmLink}">${confirmLink}</a></p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">If you did not sign up for this account, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}
