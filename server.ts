import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer, { type Transporter } from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface EmailPayload {
  to: string;
  recipientName?: string;
  subject: string;
  type: 'assignment' | 'status_change' | 'comment' | 'deadline' | 'test';
  issueId?: string;
  issueTitle?: string;
  details?: {
    actionText?: string;
    taskTitle?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    description?: string;
    actorName?: string;
    actorPhoto?: string;
    commentText?: string;
    appUrl?: string;
  };
}

export interface EmailLog {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  type: string;
  issueId?: string;
  issueTitle?: string;
  sentAt: string;
  previewUrl: string | null;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
}

const emailLogs: EmailLog[] = [];
const MAX_LOGS = 100;
let testTransporter: Transporter | null = null;

async function getTransporter(): Promise<{ transporter: Transporter; isTestAccount: boolean }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    return { transporter, isTestAccount: false };
  }

  if (!testTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      testTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailService] Initialized Ethereal test email account: ${testAccount.user}`);
    } catch (err) {
      console.warn('[EmailService] Failed to create Ethereal test account, using JSON transporter fallback', err);
      testTransporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return { transporter: testTransporter, isTestAccount: true };
}

function generateEmailHtml(payload: EmailPayload): string {
  const { recipientName, type, details, subject } = payload;
  const actionHeadline = details?.actionText || subject;
  const taskTitle = details?.taskTitle || payload.issueTitle || 'Task';
  const priority = details?.priority || 'normal';
  const status = details?.status ? details.status.replace('_', ' ') : '';
  const actor = details?.actorName || 'A team member';
  const appUrl = details?.appUrl || process.env.APP_URL || 'https://ais-dev-m6zf7iizgyketeyyk2jkiz-218131675462.europe-west2.run.app';
  const taskUrl = payload.issueId ? `${appUrl}?issue=${payload.issueId}` : appUrl;

  const typeBadgeColors: Record<string, { bg: string; text: string; label: string }> = {
    assignment: { bg: '#8B263E', text: '#ffffff', label: 'NEW TASK ASSIGNMENT' },
    status_change: { bg: '#2563EB', text: '#ffffff', label: 'STATUS UPDATE' },
    comment: { bg: '#059669', text: '#ffffff', label: 'NEW COMMENT' },
    deadline: { bg: '#DC2626', text: '#ffffff', label: 'DEADLINE REMINDER' },
    test: { bg: '#6B7280', text: '#ffffff', label: 'TEST NOTIFICATION' },
  };

  const badge = typeBadgeColors[type] || typeBadgeColors.assignment;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #8B263E; padding: 24px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">TaskFlow</span>
                    <span style="color: #fecdd3; font-size: 13px; margin-left: 8px; font-weight: 500;">Tracker</span>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${badge.label}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #64748b;">
                Hello <strong>${recipientName || 'there'}</strong>,
              </p>
              
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a; font-weight: 700; line-height: 1.4;">
                ${actionHeadline}
              </h2>

              <!-- Task Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 17px; color: #1e293b; font-weight: 600;">
                  ${taskTitle}
                </h3>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #475569; border-collapse: collapse;">
                  ${priority ? `
                  <tr>
                    <td style="padding: 6px 0; width: 110px; font-weight: 600; color: #64748b;">Priority:</td>
                    <td style="padding: 6px 0; font-weight: 600; text-transform: capitalize; color: ${priority === 'critical' || priority === 'high' ? '#dc2626' : '#2563eb'};">
                      ${priority}
                    </td>
                  </tr>` : ''}

                  ${status ? `
                  <tr>
                    <td style="padding: 6px 0; width: 110px; font-weight: 600; color: #64748b;">Status:</td>
                    <td style="padding: 6px 0; font-weight: 600; text-transform: capitalize; color: #0f172a;">
                      ${status}
                    </td>
                  </tr>` : ''}

                  ${details?.dueDate ? `
                  <tr>
                    <td style="padding: 6px 0; width: 110px; font-weight: 600; color: #64748b;">Due Date:</td>
                    <td style="padding: 6px 0; font-weight: 600; color: #d97706;">
                      ${details.dueDate}
                    </td>
                  </tr>` : ''}

                  <tr>
                    <td style="padding: 6px 0; width: 110px; font-weight: 600; color: #64748b;">Triggered by:</td>
                    <td style="padding: 6px 0; color: #1e293b;">
                      ${actor}
                    </td>
                  </tr>
                </table>

                ${details?.description ? `
                <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #475569; line-height: 1.5;">
                  <strong style="color: #334155;">Description:</strong>
                  <p style="margin: 6px 0 0 0; color: #475569; white-space: pre-wrap;">${details.description.length > 250 ? details.description.slice(0, 250) + '...' : details.description}</p>
                </div>` : ''}

                ${details?.commentText ? `
                <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #475569; line-height: 1.5;">
                  <strong style="color: #334155;">Comment:</strong>
                  <blockquote style="margin: 6px 0 0 0; padding-left: 12px; border-left: 3px solid #8B263E; font-style: italic; color: #334155;">
                    "${details.commentText}"
                  </blockquote>
                </div>` : ''}
              </div>

              <!-- Button CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${taskUrl}" target="_blank" style="display: inline-block; background-color: #8B263E; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.2px; box-shadow: 0 2px 4px rgba(139, 38, 62, 0.2);">
                      View Task in TaskFlow &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 6px 0;">
                You received this email because this address (<strong>${payload.to}</strong>) is configured as your notification email in TaskFlow.
              </p>
              <p style="margin: 0; color: #94a3b8;">
                You can change your notification email address or update your alert preferences anytime in your Profile Settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function sendEmailNotification(payload: EmailPayload): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string | null;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
}> {
  try {
    if (!payload.to || !payload.to.includes('@')) {
      throw new Error(`Invalid recipient email address: "${payload.to}"`);
    }

    const { transporter, isTestAccount } = await getTransporter();
    const html = generateEmailHtml(payload);
    const fromAddress = process.env.SMTP_FROM || '"TaskFlow Notifications" <notifications@taskflow.local>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: payload.to,
      subject: payload.subject,
      html,
    });

    let previewUrl: string | null = null;
    if (isTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
      if (previewUrl) {
        console.log(`[EmailService] Preview URL for "${payload.subject}": ${previewUrl}`);
      }
    }

    const logEntry: EmailLog = {
      id: info.messageId || `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      to: payload.to,
      recipientName: payload.recipientName || payload.to.split('@')[0],
      subject: payload.subject,
      type: payload.type,
      issueId: payload.issueId,
      issueTitle: payload.issueTitle,
      sentAt: new Date().toISOString(),
      previewUrl,
      status: isTestAccount ? 'simulated' : 'sent',
    };

    emailLogs.unshift(logEntry);
    if (emailLogs.length > MAX_LOGS) {
      emailLogs.pop();
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      status: logEntry.status,
    };
  } catch (error: any) {
    console.error('[EmailService] Failed to send email notification:', error);

    const logEntry: EmailLog = {
      id: `err-${Date.now()}`,
      to: payload.to,
      recipientName: payload.recipientName || 'User',
      subject: payload.subject,
      type: payload.type,
      issueId: payload.issueId,
      issueTitle: payload.issueTitle,
      sentAt: new Date().toISOString(),
      previewUrl: null,
      status: 'failed',
      error: error.message || 'Unknown error',
    };

    emailLogs.unshift(logEntry);
    return {
      success: false,
      status: 'failed',
      error: error.message || 'Unknown error',
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/send-email", async (req, res) => {
    try {
      const payload: EmailPayload = req.body;
      if (!payload.to || !payload.subject) {
        return res.status(400).json({ error: "Missing required fields: 'to' and 'subject'" });
      }

      const result = await sendEmailNotification(payload);
      return res.json(result);
    } catch (err: any) {
      console.error("[API] Error in /api/send-email:", err);
      return res.status(500).json({ error: err.message || "Failed to send email" });
    }
  });

  app.get("/api/email-logs", (req, res) => {
    try {
      return res.json({ logs: emailLogs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to retrieve logs" });
    }
  });

  app.post("/api/test-email", async (req, res) => {
    try {
      const { to, recipientName } = req.body;
      if (!to) {
        return res.status(400).json({ error: "Missing recipient email 'to'" });
      }

      const result = await sendEmailNotification({
        to,
        recipientName: recipientName || "Team Member",
        subject: "[TaskFlow] Test Notification Email",
        type: "test",
        issueTitle: "Notification Configuration Test",
        details: {
          actionText: "This is a test notification from TaskFlow Tracker.",
          taskTitle: "Verify Notification Email Settings",
          priority: "medium",
          status: "done",
          description: "Congratulations! Your notification email is properly configured to receive task assignments and updates in TaskFlow.",
          actorName: "TaskFlow System",
        },
      });

      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to send test email" });
    }
  });

  // Health check endpoint for Cloud Run
  app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
