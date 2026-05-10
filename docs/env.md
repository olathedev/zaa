# Environment

Create a local `.env` file from `.env.example`.

```bash
cp .env.example .env
```

## Variables

- `PORT`: API server port.
- `NODE_ENV`: runtime environment.
- `WEB_ORIGIN`: frontend URL allowed to call the API during development.
- `API_BASE_URL`: public API base URL used for webhook validation.
- `DATABASE_URL`: Postgres connection string used by Drizzle and the API.
- `TWILIO_ACCOUNT_SID`: Twilio account SID.
- `TWILIO_AUTH_TOKEN`: Twilio auth token, used for sending messages and optional webhook validation.
- `TWILIO_WHATSAPP_FROM`: Twilio WhatsApp sender, for example `whatsapp:+14155238886` in the sandbox.
- `TWILIO_VALIDATE_WEBHOOKS`: set to `true` when the API has a stable public URL and should validate Twilio webhook signatures.
- `TWILIO_ONBOARDING_ACCOUNT_TYPE_LIST_PICKER_CONTENT_SID`: optional Twilio Content SID for the onboarding account type list picker.
- `TWILIO_ONBOARDING_USE_FLOW_TEMPLATE`: set to `true` only when a production WhatsApp Flow content template is approved and usable.
- `TWILIO_ONBOARDING_START_CONTENT_SID`: optional Twilio Content SID for the button prompt that starts full onboarding.
- `SQUAD_BASE_URL`: Squad API base URL. Defaults to the sandbox API.
- `SQUAD_SECRET_KEY`: Squad API secret key used to create virtual accounts.
- `SQUAD_BENEFICIARY_ACCOUNT`: settlement/beneficiary account passed to Squad when creating virtual accounts.
- `OPENAI_API_KEY`: API key for the LLM provider.
