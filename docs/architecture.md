# Architecture

Zaa is split into a landing page and backend agent infrastructure. The frontend in `apps/web` presents the product and routes users through the landing experience. The backend in `apps/api` exposes the API surface for health checks, WhatsApp webhooks, and the agent service layer that will coordinate message handling, LLM calls, and persistence through Postgres and Drizzle.

## Planned Backend Flow

1. Twilio sends an incoming WhatsApp webhook event to the Express API.
2. The webhook route validates the request and normalizes the Twilio payload.
3. The agent service decides what the user is asking for.
4. The LLM service generates or assists with a response.
5. The Twilio WhatsApp service sends the reply back to the user.

## WhatsApp Webhook

The webhook endpoint lives at `/webhooks/twilio/whatsapp`. The `POST` handler parses Twilio's form-encoded WhatsApp webhook payload, optionally validates the Twilio signature when `TWILIO_VALIDATE_WEBHOOKS=true`, normalizes the inbound message, and hands it to the future agent layer.

## First-Time User Detection

Incoming WhatsApp users are identified by Twilio's `WaId` when available, with the `From` WhatsApp address as a fallback. If no matching row exists in `whatsapp_contacts`, the API creates a new `users` record, stores the WhatsApp contact, saves the inbound message, and starts onboarding. Existing users continue from their saved `onboarding_stage`.

## Onboarding Flow

New users first choose an account type from a Twilio list picker. In the sandbox, Zaa falls back to conversational onboarding so the MVP works without WhatsApp Flow approval. In production, the same data shape can be collected through a `twilio/flows` content template. Onboarding collects identity, address, and transaction PIN details. BVN is passed to Squad during virtual account creation and must not be stored in the database or message metadata.

## Virtual Accounts

At onboarding completion, the API hashes the transaction PIN, calls Squad's virtual account API with the transient BVN, then stores only the returned virtual account metadata. The BVN and raw PIN are removed from persisted onboarding data.

## Data Layer

The backend uses Postgres with Drizzle ORM. In development and production, the API reads `DATABASE_URL` from the root `.env` file. The schema tracks users, WhatsApp contacts, messages, worker profiles, virtual accounts, transaction PIN hashes, and opportunities.
