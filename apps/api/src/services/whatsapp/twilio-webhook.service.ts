import twilio from "twilio";

import { env } from "../../config/env.js";
import type {
  NormalizedWhatsAppMessage,
  TwilioWhatsAppWebhookPayload,
} from "./twilio-whatsapp.types.js";

export function validateTwilioWebhook(params: {
  signature?: string;
  originalUrl: string;
  body: TwilioWhatsAppWebhookPayload;
}) {
  if (!env.twilio.validateWebhooks) {
    return true;
  }

  if (!env.twilio.authToken || !params.signature) {
    return false;
  }

  const webhookUrl = `${env.apiBaseUrl}${params.originalUrl}`;

  return twilio.validateRequest(
    env.twilio.authToken,
    params.signature,
    webhookUrl,
    params.body,
  );
}

export function normalizeTwilioWhatsAppMessage(
  payload: TwilioWhatsAppWebhookPayload,
): NormalizedWhatsAppMessage | null {
  const messageId = payload.MessageSid ?? payload.SmsMessageSid;

  if (!messageId || !payload.From || !payload.To) {
    return null;
  }

  return {
    provider: "twilio",
    messageId,
    from: payload.From,
    to: payload.To,
    body: payload.Body ?? "",
    buttonText: payload.ButtonText,
    buttonPayload: payload.ButtonPayload,
    listId: payload.ListId,
    listTitle: payload.ListTitle,
    flowData: payload.FlowData,
    interactiveData: payload.InteractiveData,
    profileName: payload.ProfileName,
    whatsappId: payload.WaId,
    mediaCount: Number(payload.NumMedia ?? 0),
    raw: payload,
  };
}
