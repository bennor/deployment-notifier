import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

interface WebhookBody {
  type: string;
  createdAt: number;
  payload: {
    deployment?: { url?: string };
    project?: { name?: string };
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, payload, createdAt } = req.body as WebhookBody;
  const deployment = payload?.deployment;
  const project = payload?.project;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `[${project?.name ?? 'Vercel'}] ${type}`,
    text: [
      `Event:   ${type}`,
      `Project: ${project?.name ?? 'unknown'}`,
      `URL:     https://${deployment?.url ?? 'n/a'}`,
      `Time:    ${new Date(createdAt).toUTCString()}`,
    ].join('\n'),
  });

  res.status(200).json({ ok: true });
}
