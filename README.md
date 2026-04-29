# deployment-notifier

A demo of the minimal setup required to notify specific people when selected [Vercel deployment events](https://vercel.com/docs/webhooks) occur. A single Vercel Function receives and verifies the webhook, then triggers a notification.

## How it works

`api/webhook.ts` is a single [Vercel Function](https://vercel.com/docs/functions/quickstart) that accepts `POST` requests. When Vercel fires a deployment event, it sends a signed JSON payload to this endpoint; the function verifies the signature, filters to deployment events, then calls `sendNotification` in `lib/webhook.ts`.

The current `sendNotification` implementation is a stub that logs the event — output is visible in the [Vercel Dashboard logs](https://vercel.com/docs/observability/runtime-logs). Replace it with your preferred notification method.

## Notification methods

Once the webhook payload is verified you can send notifications any way you like — email via SMTP or an HTTPS API (e.g. SendGrid, Resend), SMS (e.g. Twilio), web push, Slack, or any other channel.

## Setup

### 1. Install dependencies

```sh
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env`:

```sh
cp .env.example .env
```

| Variable | Description |
|---|---|
| `WEBHOOK_SECRET` | Secret shown when creating the webhook in Vercel |

On Vercel, add this via the dashboard or CLI — see [Managing environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables).

### 3. Deploy

```sh
pnpm dlx vercel deploy
```

### 4. Register the webhook

In the Vercel dashboard go to **Account / Team Settings → Webhooks** (or per-project under **Settings → Webhooks**) and add:

```
https://<your-deployment>.vercel.app/api/webhook
```

Select the event types you want to be notified about (e.g. `deployment.succeeded`, `deployment.error`). See the full list of [webhook event types](https://vercel.com/docs/webhooks/webhooks-api#supported-event-types).

## Webhook signature verification

Every request is verified against the `x-vercel-signature` header before processing. Vercel signs the raw request body with HMAC-SHA1 using the secret displayed when you create the webhook — set this as `WEBHOOK_SECRET`. Requests with a missing or invalid signature are rejected with a `403`. See [securing webhooks](https://vercel.com/docs/webhooks/webhooks-api#securing-webhooks) for more detail.
