import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import getRawBody from 'raw-body';
import nodemailer from 'nodemailer';

interface WebhookBody {
  type: string;
  createdAt: number;
  payload: {
    deployment?: { url?: string };
    project?: { name?: string };
  };
}

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const headerSignature = req.headers['x-vercel-signature'];
  const bodySignature = crypto
    .createHmac('sha1', process.env.WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  if (
    !headerSignature ||
    typeof headerSignature !== 'string' ||
    headerSignature.length !== bodySignature.length ||
    !crypto.timingSafeEqual(Buffer.from(headerSignature), Buffer.from(bodySignature))
  ) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const { type, payload, createdAt } = JSON.parse(rawBody.toString('utf-8')) as WebhookBody;

  if (!type.startsWith('deployment.')) {
    return res.status(200).json({ ignored: true });
  }

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
