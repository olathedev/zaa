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
    onboardingAccountTypeListPickerContentSid:
      process.env.TWILIO_ONBOARDING_ACCOUNT_TYPE_LIST_PICKER_CONTENT_SID ??
      process.env.TWILIO_ONBOARDING_ACCOUNT_TYPE_CONTENT_SID,
    useOnboardingFlowTemplate: readBoolean(
      process.env.TWILIO_ONBOARDING_USE_FLOW_TEMPLATE,
      false,
    ),
    onboardingStartContentSid: process.env.TWILIO_ONBOARDING_START_CONTENT_SID,
    employerWelcomeImageUrl: process.env.TWILIO_EMPLOYER_WELCOME_IMAGE_URL,
    workerWelcomeImageUrl: process.env.TWILIO_WORKER_WELCOME_IMAGE_URL,
    jobAlertContentSid: process.env.TWILIO_JOB_ALERT_CONTENT_SID,
    workerJobDetailSid: process.env.TWILIO_WORKER_JOB_DETAIL_SID,
    employerJobDetailSid: process.env.TWILIO_EMPLOYER_JOB_DETAIL_SID,
    employerConfirmDoneSid: process.env.TWILIO_EMPLOYER_CONFIRM_DONE_SID,
  },
  squad: {
    baseUrl: process.env.SQUAD_BASE_URL ?? "https://sandbox-api-d.squadco.com",
    secretKey: process.env.SQUAD_SECRET_KEY,
    beneficiaryAccount: process.env.SQUAD_BENEFICIARY_ACCOUNT,
    webhookSignatureVersion: process.env.SQUAD_WEBHOOK_SIGNATURE_VERSION ?? "v3",
  },
  onboarding: {
    defaultEmail: process.env.DEFAULT_ONBOARDING_EMAIL,
  },
  ai: {
    // Claude (active)
    claudeApiKey: process.env.CLAUDE_API_KEY,
    claudeModel: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001",
    // OpenAI (disabled — kept for reference)
    openaiApiKey: undefined as string | undefined,
    openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
};
