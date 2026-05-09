import twilio from "twilio";

import { env } from "../../config/env.js";

type SendWhatsAppMessageParams = {
  to: string;
  body: string;
};

type SendWhatsAppContentMessageParams = {
  to: string;
  contentSid: string;
  contentVariables?: Record<string, string>;
};

let client: ReturnType<typeof twilio> | undefined;

function getTwilioClient() {
  if (!env.twilio.accountSid || !env.twilio.authToken) {
    throw new Error("Twilio credentials are not configured");
  }

  client ??= twilio(env.twilio.accountSid, env.twilio.authToken);

  return client;
}

function getWhatsAppFrom() {
  if (!env.twilio.whatsappFrom) {
    throw new Error("Twilio WhatsApp sender is not configured");
  }

  return env.twilio.whatsappFrom;
}

export async function sendWhatsAppMessage(params: SendWhatsAppMessageParams) {
  return getTwilioClient().messages.create({
    from: getWhatsAppFrom(),
    to: params.to,
    body: params.body,
  });
}

export async function sendWhatsAppContentMessage(
  params: SendWhatsAppContentMessageParams,
) {
  return getTwilioClient().messages.create({
    from: getWhatsAppFrom(),
    to: params.to,
    contentSid: params.contentSid,
    contentVariables: params.contentVariables
      ? JSON.stringify(params.contentVariables)
      : undefined,
  });
}

export async function sendOnboardingAccountTypePrompt(to: string) {
  if (env.twilio.onboardingAccountTypeContentSid) {
    await sendWhatsAppContentMessage({
      to,
      contentSid: env.twilio.onboardingAccountTypeContentSid,
    });
    return;
  }

  await sendWhatsAppMessage({
    to,
    body:
      "Hi, I'm Zaa.\n\n" +
      "I help people find work, grow income, access financial services, and connect customers to capable hands.\n\n" +
      "What best describes you?\n\n" +
      "1. Worker / Trader\n" +
      "2. Employer",
  });
}
