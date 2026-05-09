# Environment

Create a local `.env` file from `.env.example`.

```bash
cp .env.example .env
```

## Variables

- `PORT`: API server port.
- `NODE_ENV`: runtime environment.
- `WEB_ORIGIN`: frontend URL allowed to call the API during development.
- `WHATSAPP_VERIFY_TOKEN`: token used to verify WhatsApp webhook setup.
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp Cloud API access token.
- `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp phone number identifier.
- `OPENAI_API_KEY`: API key for the LLM provider.

