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

type StartOnboardingFlowParams = {
  to: string;
  userId: string;
  accountType: "worker" | "employer";
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
  if (env.twilio.onboardingAccountTypeListPickerContentSid) {
    await sendWhatsAppContentMessage({
      to,
      contentSid: env.twilio.onboardingAccountTypeListPickerContentSid,
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

export async function sendOnboardingStartPrompt(to: string) {
  if (env.twilio.onboardingStartContentSid) {
    await sendWhatsAppContentMessage({
      to,
      contentSid: env.twilio.onboardingStartContentSid,
    });
    return;
  }

  await sendWhatsAppMessage({
    to,
    body:
      "Please click the button below to complete your onboarding and set up your Zaa account.\n\n" +
      "If you do not see a button, reply START.",
  });
}

export async function startOnboardingFlow(params: StartOnboardingFlowParams) {
  if (!env.twilio.onboardingFlowSid) {
    throw new Error("Twilio onboarding Flow SID is not configured");
  }

  return getTwilioClient()
    .studio.v2.flows(env.twilio.onboardingFlowSid)
    .executions.create({
      to: params.to,
      from: getWhatsAppFrom(),
      parameters: {
        user_id: params.userId,
        account_type: params.accountType,
      },
    });
}
