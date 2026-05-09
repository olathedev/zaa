# Architecture

Zaa is split into a landing page and backend agent infrastructure. The frontend in `apps/web` presents the product and routes users through the landing experience. The backend in `apps/api` exposes the API surface for health checks, WhatsApp webhooks, and the agent service layer that will coordinate message handling, LLM calls, and future persistence.

## Planned Backend Flow

1. WhatsApp sends an incoming webhook event to the Express API.
2. The webhook route validates the request and normalizes the message payload.
3. The agent service decides what the user is asking for.
4. The LLM service generates or assists with a response.
5. The WhatsApp service sends the reply back to the user.

