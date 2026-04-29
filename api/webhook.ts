import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readRawBody, isValidSignature, isDeploymentEvent, sendNotificationEmail } from '../lib/webhook';

// Disable Vercel's built-in body parsing so we can read the raw bytes for
// signature verification — the HMAC must be computed over the exact bytes
// Vercel sent, not a re-serialised version.
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await readRawBody(req);

  if (!isValidSignature(rawBody, req.headers['x-vercel-signature'])) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody.toString('utf-8'));

  if (!isDeploymentEvent(event.type)) {
    return res.status(200).json({ ignored: true });
  }

  await sendNotificationEmail(event);

  res.status(200).json({ ok: true });
}
