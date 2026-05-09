import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 4000;
const rootEnvPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../..",
  ".env",
);

config({ path: rootEnvPath });

function readPort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return port;
}

function readBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  return value === "true";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: readPort(process.env.PORT),
  host: process.env.HOST ?? "0.0.0.0",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:4000",
  databaseUrl: process.env.DATABASE_URL,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
    validateWebhooks: readBoolean(process.env.TWILIO_VALIDATE_WEBHOOKS, false),
    onboardingAccountTypeContentSid:
      process.env.TWILIO_ONBOARDING_ACCOUNT_TYPE_CONTENT_SID,
  },
};
