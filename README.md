# Zaa

> **Intelligent economic infrastructure for Africa's informal workforce — built entirely on WhatsApp.**

Zaa connects informal workers and employers, assesses skills with AI, secures every transaction with escrow, and builds a financial identity for workers who have never had one — all without an app, a bank account, or a formal work history.

[![Node.js](https://img.shields.io/badge/Node.js-22-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![WhatsApp](https://img.shields.io/badge/Interface-WhatsApp-25D366)](https://twilio.com/whatsapp)
[![Squad](https://img.shields.io/badge/Payments-Squad-orange)](https://squadco.com)

---

## What is Zaa?

Nigeria has over 80 million informal workers — carpenters, plumbers, cleaners, data clerks — who are economically active but financially invisible. They have no digital work history, no way to reach employers beyond their immediate network, and no access to credit or insurance because traditional institutions have nothing to evaluate them on.

Zaa solves this by meeting workers where they already are: **WhatsApp**.

A worker in Jos texts the Zaa number. Within minutes they have a skill-assessed, trust-scored digital profile. When a matching job drops, they get a branded job card and a single-tap Apply button. When they get hired, their payment is locked in Squad escrow before work starts. When the job is done and confirmed, the money hits their Zaa wallet instantly.

No app. No laptop. No bank branch. Just WhatsApp.

---

## Core Features

### For Workers
- **Conversational onboarding** — profile built through natural WhatsApp chat
- **AI skill assessment** — Claude generates trade-specific questions (plumber gets plumbing questions, not generic tests)
- **Trust Score** — 0–100 score computed from profile strength, assessment performance, job completion history, and behavioural signals
- **One-tap job applications** — quick-reply buttons, no typing required
- **Zaa wallet** — Squad-powered virtual account, credited on job completion
- **Job lifecycle management** — view active jobs, mark complete, all via WhatsApp

### For Employers
- **Post work requests conversationally** — describe what you need, Zaa structures it
- **Dynamic job cards** — branded image with job details auto-generated and broadcast to matched workers
- **AI worker analysis** — Claude writes a 1–2 sentence hiring recommendation per applicant based on trust score, skills, and location
- **Squad escrow** — deposit job amount before hiring is confirmed; released to worker on completion
- **Quick-reply job management** — mark jobs done, view in-progress work, all in WhatsApp

### Financial Infrastructure
- **Squad DVA escrow** — per-transaction Dynamic Virtual Account, amount-locked, auto-detected via webhook
- **Virtual wallets** — every worker and employer has a Squad-backed Zaa wallet
- **Payment history** — full transaction ledger
- **Roadmap: micro-credit, savings, income insurance** — powered by the Trust Score as an alternative credit signal

---

## How the Flow Works

```
WORKER SIDE
───────────────────────────────────────────────────────────────
1. Worker messages Zaa on WhatsApp
2. Conversational onboarding: occupation, location, skills, availability
3. AI generates a trade-specific skill assessment
4. Worker completes assessment → Trust Score computed by Claude
5. Worker receives a Zaa virtual wallet (Squad)
6. Job alert arrives: job card image + quick-reply Apply/Skip
7. Worker taps Apply → application sent to employer

EMPLOYER SIDE
───────────────────────────────────────────────────────────────
1. Employer messages Zaa on WhatsApp
2. Posts a work request conversationally
3. Job card generated (Sharp + Cloudinary) → broadcast to matched workers
4. Employer receives application notification with worker profile + AI analysis
5. Employer taps ACCEPT → Squad DVA created → payment instructions sent
6. Employer transfers job amount to DVA account (GTBank)
7. Squad webhook fires → escrow funded → contacts shared with both parties
8. Work happens
9. Worker taps "Mark Complete ✅" OR employer taps "Mark Done ✅"
10. Escrow released → worker wallet credited → 💰 Cha-ching notification

STATUS LIFECYCLE
───────────────────────────────────────────────────────────────
draft → open → escrow_pending → in_progress → pending_completion → completed
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22, TypeScript 5 |
| Framework | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| WhatsApp | Twilio WhatsApp Business API |
| AI | Anthropic Claude (assessment, trust scoring, worker analysis) |
| Payments | Squad (Virtual Accounts, Dynamic Virtual Accounts, Webhooks) |
| Image generation | Sharp + Cloudinary |
| Package manager | pnpm (monorepo) |

---

## Project Structure

```
zaa/
├── apps/
│   ├── api/                          # Backend API
│   │   ├── src/
│   │   │   ├── config/env.ts         # Environment config
│   │   │   ├── db/
│   │   │   │   ├── schema.ts         # Full DB schema
│   │   │   │   └── client.ts         # Drizzle client
│   │   │   ├── routes/
│   │   │   │   └── webhooks/
│   │   │   │       ├── twilio-whatsapp.routes.ts
│   │   │   │       └── squad.routes.ts
│   │   │   └── services/
│   │   │       ├── ai/               # Claude integrations
│   │   │       ├── employer/         # Employer flows + escrow
│   │   │       ├── worker/           # Worker flows + active jobs
│   │   │       ├── worker-profile/   # Profile onboarding + assessment
│   │   │       ├── trust/            # Trust score evaluation
│   │   │       ├── job-card/         # Dynamic image generation
│   │   │       ├── squad/            # Squad DVA + webhook processing
│   │   │       ├── onboarding/       # WhatsApp message routing
│   │   │       └── whatsapp/         # Twilio messaging helpers
│   │   ├── assets/                   # Job card + acceptance card templates
│   │   └── drizzle/                  # Migration history
│   └── web/                          # Landing page (Vite + React)
└── docs/                             # Architecture, env, hackathon submission
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 16
- A [Twilio account](https://twilio.com) with WhatsApp sandbox enabled
- A [Squad account](https://squadco.com) (sandbox works for development)
- An [Anthropic API key](https://console.anthropic.com)
- A [Cloudinary account](https://cloudinary.com)

### 1. Clone and install

```bash
git clone https://github.com/your-org/zaa.git
cd zaa
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the required values (see [docs/env.md](docs/env.md) for full reference):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/zaa

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Squad (Payments)
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com
SQUAD_SECRET_KEY=sandbox_sk_xxxxxxxxxxxxxxxxxxxxxxxx
SQUAD_BENEFICIARY_ACCOUNT=your_account_number

# AI
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-haiku-4-5-20251001

# Cloudinary (Job card images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run database migrations

```bash
cd apps/api
pnpm drizzle-kit migrate
```

### 4. Start development servers

```bash
# From root — starts both API and web
pnpm dev

# Or individually
pnpm dev:api
pnpm dev:web
```

The API runs on `http://localhost:4000` by default.

### 5. Expose to Twilio

Twilio needs a public URL to send webhook events. Use [ngrok](https://ngrok.com) or similar:

```bash
ngrok http 4000
```

Set your Twilio WhatsApp sandbox webhook to:
```
https://your-ngrok-url.ngrok.io/webhooks/twilio/whatsapp
```

Set your Squad webhook to:
```
https://your-ngrok-url.ngrok.io/webhooks/squad
```

---

## Key API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/webhooks/twilio/whatsapp` | Receives all WhatsApp messages |
| `POST` | `/webhooks/squad` | Receives Squad payment events |
| `POST` | `/webhooks/squad/test` | Simulate a payment (dev only) |
| `GET` | `/health` | Health check |

---

## Squad Setup

### 1. Create the DVA pool (one-time)

```bash
curl -X POST https://sandbox-api-d.squadco.com/virtual-account/create-dynamic-virtual-account \
  -H "Authorization: Bearer $SQUAD_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2. Testing escrow payments

When an employer accepts a worker, a `zaa-escrow-<uuid>` transaction reference is generated and sent to the employer via WhatsApp. To simulate payment in development:

```bash
curl -X POST http://localhost:4000/webhooks/squad/test \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_reference": "zaa-escrow-<uuid-from-whatsapp>",
    "amount": 1000000
  }'
```

This triggers the full escrow release: contacts shared, job moves to `in_progress`, worker notified.

---

## Twilio Content Templates

For quick-reply buttons to work, create these templates in [Twilio Content Template Builder](https://console.twilio.com/us1/develop/sms/content-template-builder):

| Template | Env var | Buttons |
|---|---|---|
| Worker job detail | `TWILIO_WORKER_JOB_DETAIL_SID` | Mark Complete ✅ / Discontinue |
| Employer job detail | `TWILIO_EMPLOYER_JOB_DETAIL_SID` | Mark Done ✅ / Discontinue |
| Employer confirm done | `TWILIO_EMPLOYER_CONFIRM_DONE_SID` | Confirm Done ✅ |
| Job alert | `TWILIO_JOB_ALERT_CONTENT_SID` | Apply ✅ / Skip ❌ |

All templates fall back to plain text if the SID is not set — the platform works without them.

See [docs/hackathon-submission.md](docs/hackathon-submission.md) for the full product and technical writeup.

---

## Database Schema Overview

```
users                    — workers and employers, onboarding state, wallet
whatsapp_contacts        — phone number ↔ user mapping
worker_profiles          — skills, location, trust score, assessment score
worker_profile_assessments — AI-generated questions + answers + score
worker_trust_evaluations — full trust evaluation history from Claude
work_requests            — job postings, full lifecycle status
job_applications         — worker ↔ job application, status
job_escrows              — Squad DVA reference, amount, escrow status
virtual_accounts         — Squad permanent virtual accounts (wallets)
wallet_balances          — available + ledger balance per user
payment_transactions     — full payment history
```

---

## Roadmap

- [ ] AI-ranked job matching (shortlist top workers per job, not broadcast)
- [ ] Employer ratings — workers rated after each completed job
- [ ] Micro-credit — Trust Score unlocks working-capital loans
- [ ] Savings — auto-deduct % of each job payment to locked savings
- [ ] Income insurance — protection for high-trust workers during low activity
- [ ] Worker bank account registration + Squad direct payout
- [ ] Multi-language support (Hausa, Yoruba, Igbo)
- [ ] Discontinue / dispute resolution flow

---

## Documentation

- [docs/hackathon-submission.md](docs/hackathon-submission.md) — full product and technical writeup for the hackathon
- [docs/architecture.md](docs/architecture.md) — system architecture notes
- [docs/env.md](docs/env.md) — full environment variable reference

---

*Zaa — Work. Trust. Earn.*
