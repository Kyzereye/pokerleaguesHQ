import nodemailer from "nodemailer";
import { config } from "../config/index.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const { host, port, user, pass } = config.smtp;
    if (!host || !user || !pass) {
      throw new Error("SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in server/.env");
    }
    transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: config.smtp.secure,
      auth: { user, pass },
    });
  }
  return transporter;
}

function emailLayout(title: string, body: string, buttonText: string, link: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">${title}</h1>
              <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.6; color: #3f3f46;">${body}</p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #2563eb;">
                    <a href="${link}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">${buttonText}</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 28px 0 0; font-size: 14px; line-height: 1.5; color: #71717a;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 8px 0 0; font-size: 14px; word-break: break-all;"><a href="${link}" style="color: #2563eb; text-decoration: none;">${link}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(to: string, link: string): Promise<void> {
  const from = config.smtp.from || config.smtp.user;
  if (!from) throw new Error("Set SMTP_FROM or SMTP_USER in server/.env");
  const html = emailLayout(
    "Verify your email",
    "Thanks for signing up. Click the button below to verify your email address and finish setting up your account.",
    "Verify email",
    link
  );
  await getTransporter().sendMail({
    from,
    to,
    subject: "Verify your email",
    html,
  });
}

export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  const from = config.smtp.from || config.smtp.user;
  if (!from) throw new Error("Set SMTP_FROM or SMTP_USER in server/.env");
  const html = emailLayout(
    "Reset your password",
    "We received a request to reset your password. Click the button below to choose a new password. If you didn't request this, you can ignore this email.",
    "Reset password",
    link
  );
  await getTransporter().sendMail({
    from,
    to,
    subject: "Reset your password",
    html,
  });
}
