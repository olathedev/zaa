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
  if (!env.twilio.accountSid || !env.twilio.authToken) {
    throw new Error("Twilio credentials are not configured");
  }

  const body = new URLSearchParams({
    From: getWhatsAppFrom(),
    To: params.to,
    ContentSid: params.contentSid,
  });

  if (params.contentVariables) {
    body.set("ContentVariables", JSON.stringify(params.contentVariables));
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.twilio.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${env.twilio.accountSid}:${env.twilio.authToken}`,
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const responseBody = (await response.json()) as {
    code?: number;
    message?: string;
    more_info?: string;
    status?: number;
  };

  if (!response.ok) {
    if (responseBody?.code === 21656) {
      console.error("Twilio content variables rejected", {
        contentSid: params.contentSid,
        templateVariables: await fetchContentTemplateVariables(params.contentSid),
      });
    }

    throw new Error(
      `Twilio content message failed: ${response.status} ${JSON.stringify(responseBody)}`,
    );
  }

  return responseBody;
}

async function fetchContentTemplateVariables(contentSid: string) {
  if (!env.twilio.accountSid || !env.twilio.authToken) {
    return undefined;
  }

  const response = await fetch(`https://content.twilio.com/v1/Content/${contentSid}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${env.twilio.accountSid}:${env.twilio.authToken}`,
      ).toString("base64")}`,
    },
  });

  if (!response.ok) {
    return {
      fetchStatus: response.status,
    };
  }

  const template = (await response.json()) as {
    variables?: Record<string, string>;
    types?: Record<string, unknown>;
  };

  return {
    variables: template.variables,
    typeKeys: template.types ? Object.keys(template.types) : [],
  };
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
  if (env.twilio.useOnboardingFlowTemplate && env.twilio.onboardingStartContentSid) {
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
