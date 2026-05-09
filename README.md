# Zaa

Zaa AI agent on WhatsApp.

## Structure

- `apps/web`: landing page built with Vite, React, and TanStack Router.
- `apps/api`: backend agent infrastructure built with Node, TypeScript, and Express.
- `docs`: project notes for architecture and environment setup.

## Development

```bash
pnpm install
pnpm dev
```

Run one app at a time:

```bash
pnpm dev:web
pnpm dev:api
```

## Environment

Copy `.env.example` to `.env` and fill in the required values.

