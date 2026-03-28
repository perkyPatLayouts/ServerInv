import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Email service for sending emails via SMTP.
 * Configuration is loaded from environment variables:
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port
 * - SMTP_USER: SMTP username
 * - SMTP_PASS: SMTP password
 * - SMTP_FROM: From email address
 * - SMTP_SECURE: Use TLS (true/false, defaults to false for port 587)
 */

let transporter: Transporter | null = null;

/**
 * Initialize the email transporter with SMTP configuration.
 */
function getTransporter(): Transporter | null {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If SMTP is not configured, return null
  if (!host || !user || !pass) {
    console.warn("SMTP not configured. Email sending will be disabled.");
    return null;
  }

  // Determine if we should use TLS (secure connection)
  // Port 465 requires secure=true, port 587 uses STARTTLS (secure=false)
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

/**
 * Send a password reset email.
 * @param to - Recipient email address
 * @param resetUrl - Password reset URL with token
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transport = getTransporter();

  if (!transport) {
    throw new Error("SMTP is not configured. Cannot send password reset email.");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from,
    to,
    subject: "ServerInv - Password Reset Request",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password for your ServerInv account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">ServerInv - Server Inventory Management</p>
    `,
    text: `
Password Reset Request

You requested to reset your password for your ServerInv account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

---
ServerInv - Server Inventory Management
    `.trim(),
  };

  await transport.sendMail(mailOptions);
}

/**
 * Test the SMTP connection.
 * @returns true if connection is successful, false otherwise
 */
export async function testSmtpConnection(): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    return false;
  }

  try {
    await transport.verify();
    return true;
  } catch (error) {
    console.error("SMTP connection test failed:", error);
    return false;
  }
}
