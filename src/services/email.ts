import { EmailLogEntry } from '../types';

export interface SendEmailParams {
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
  };
}

export const sendEmail = async (params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string | null;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
}> => {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error('[emailService] Failed to send email via /api/send-email:', err);
    return {
      success: false,
      status: 'failed',
      error: err.message,
    };
  }
};

export const sendTestEmail = async (to: string, recipientName?: string): Promise<{
  success: boolean;
  previewUrl?: string | null;
  status: string;
  error?: string;
}> => {
  const res = await fetch('/api/test-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, recipientName }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }

  return await res.json();
};

export const fetchEmailLogs = async (): Promise<EmailLogEntry[]> => {
  try {
    const res = await fetch('/api/email-logs');
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.error('Failed to fetch email logs:', err);
    return [];
  }
};
