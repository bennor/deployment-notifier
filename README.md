# deployment-notifier

A demo of the minimal setup required to notify specific people by email when selected [Vercel deployment events](https://vercel.com/docs/webhooks) occur. A single Vercel Function receives the webhook and sends the notification via SMTP.

## How it works

`api/webhook.ts` is a single [Vercel Function](https://vercel.com/docs/functions/quickstart) that accepts `POST` requests. When Vercel fires a deployment event, it sends a signed JSON payload to this endpoint; the function extracts the event type, project name, and deployment URL, then sends an email via nodemailer.

## Setup

### 1. Install dependencies

```sh
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your SMTP credentials:

```sh
cp .env.example .env
```

| Variable | Description |
|---|---|
| `WEBHOOK_SECRET` | Secret shown when creating the webhook in Vercel |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (default: `587`) |
| `SMTP_SECURE` | Set to `true` for port 465 / TLS |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From address (falls back to `SMTP_USER`) |
| `NOTIFY_EMAIL` | Recipient address for notifications |

On Vercel, add these via the dashboard or CLI — see [Managing environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables).

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
