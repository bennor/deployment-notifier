import crypto from 'crypto';
import type { IncomingMessage } from 'http';

export interface WebhookBody {
  type: string;
  createdAt: number;
  payload: {
    deployment?: { url?: string };
    project?: { name?: string };
  };
}

export function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Length is checked first to satisfy timingSafeEqual's requirement that both
// buffers are the same length.
export function isValidSignature(rawBody: Buffer, header: string | string[] | undefined): boolean {
  if (!header || typeof header !== 'string') return false;

  const expected = crypto
    .createHmac('sha1', process.env.WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  return (
    header.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  );
}

export function isDeploymentEvent(type: string): boolean {
  return type.startsWith('deployment.');
}

export function sendNotification(event: WebhookBody): void {
  const { type, createdAt, payload } = event;
  const project = payload?.project;
  const deployment = payload?.deployment;

  console.log('[deployment-notifier]', {
    type,
    project: project?.name ?? 'unknown',
    url: `https://${deployment?.url ?? 'n/a'}`,
    time: new Date(createdAt).toUTCString(),
  });
}
