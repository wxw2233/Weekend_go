import nodemailer from "nodemailer";
import { logError, logInfo } from "@/lib/log";

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let transporter: MailTransporter | null = null;

export function mailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

function getTransporter(): MailTransporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FROM =
  process.env.MAIL_FROM || process.env.SMTP_USER || "shuangxiu@localhost";

/**
 * Send an email. In non-production without SMTP config, logs instead of sending
 * so local flows stay testable. Throws in production when mail is unconfigured.
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ dev: boolean }> {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP not configured");
    }
    logInfo("email_dev_mode", { to: opts.to, subject: opts.subject, body: opts.text });
    return { dev: true };
  }
  try {
    await getTransporter().sendMail({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { dev: false };
  } catch (e) {
    logError("email_send_failed", e, { to: opts.to });
    throw e;
  }
}

export function verificationEmailHtml(code: string, scene: "register" | "reset"): string {
  const purpose = scene === "register" ? "注册账号" : "重置密码";
  return `
  <div style="font-family:system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;max-width:480px;margin:0 auto;padding:24px;">
    <h2 style="color:#1f6b4a;margin:0 0 12px;">双休go! — ${purpose}验证码</h2>
    <p style="color:#333;font-size:14px;">你的验证码是：</p>
    <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1f6b4a;background:#F3F0E8;padding:12px 16px;border-radius:8px;text-align:center;margin:16px 0;">${code}</p>
    <p style="color:#888;font-size:12px;">10 分钟内有效。如果不是你本人操作，请忽略本邮件。</p>
  </div>`;
}
