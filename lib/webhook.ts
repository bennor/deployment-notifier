import crypto from 'crypto';
import type { IncomingMessage } from 'http';

export interface WebhookBody {
  id: string;
  type: string;
  createdAt: number;
  region: string | null;
  payload: {
    team: { id: string | null };
    user: { id: string };
    deployment: {
      id: string;
      name: string;
      url: string;
      meta: Record<string, string>;
    };
    project: { id: string };
    links: {
      deployment: string;
      project: string;
    };
    target: 'production' | 'staging' | null;
    plan: string;
    regions: string[];
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

  console.log('[deployment-notifier]', {
    type,
    name: payload.deployment.name,
    url: `https://${payload.deployment.url}`,
    deployment: payload.links.deployment,
    time: new Date(createdAt).toUTCString(),
  });
}
