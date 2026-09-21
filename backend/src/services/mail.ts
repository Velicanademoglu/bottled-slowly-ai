import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@projectstar.app";
const APP_NAME = process.env.APP_NAME || "PROJECT STAR";

const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  if (!transporter) {
    console.log(`[EMAIL MOCK] To: ${to}\nSubject: ${subject}\nText: ${text}`);
    return { messageId: "mock-" + Date.now() };
  }

  return transporter.sendMail({
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${baseUrl}/verify-email?token=${token}`;
  return sendEmail({
    to,
    subject: `${APP_NAME} - Verify your email`,
    text: `Please verify your email by clicking this link: ${link}`,
    html: `<p>Please verify your email by <a href="${link}">clicking here</a>.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${baseUrl}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: `${APP_NAME} - Reset your password`,
    text: `Reset your password by clicking this link: ${link}`,
    html: `<p>Reset your password by <a href="${link}">clicking here</a>.</p>`,
  });
}

export async function sendReportNotificationEmail(to: string, report: { id: number; category: string; description: string | null; targetUsername: string; initiatorUsername: string }) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${baseUrl}/admin/reports`;
  return sendEmail({
    to,
    subject: `${APP_NAME} - New user report (#${report.id})`,
    text: `A new report has been submitted.\n\nCategory: ${report.category}\nReported user: ${report.targetUsername}\nReported by: ${report.initiatorUsername}\nDescription: ${report.description || "No description"}\n\nReview: ${link}`,
    html: `<p>A new report has been submitted.</p>
      <ul>
        <li><strong>Category:</strong> ${report.category}</li>
        <li><strong>Reported user:</strong> ${report.targetUsername}</li>
        <li><strong>Reported by:</strong> ${report.initiatorUsername}</li>
        <li><strong>Description:</strong> ${report.description || "No description"}</li>
      </ul>
      <p><a href="${link}">Review in admin panel</a></p>`,
  });
}
