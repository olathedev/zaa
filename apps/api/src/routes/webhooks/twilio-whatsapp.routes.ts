import { Router } from "express";
import { z } from "zod";

import { handleIncomingWhatsAppMessage } from "../../services/onboarding/whatsapp-onboarding.service.js";
import {
  normalizeTwilioWhatsAppMessage,
  validateTwilioWebhook,
} from "../../services/whatsapp/twilio-webhook.service.js";
import type { TwilioWhatsAppWebhookPayload } from "../../services/whatsapp/twilio-whatsapp.types.js";

const twilioWebhookSchema = z
  .object({
    MessageSid: z.string().optional(),
    SmsMessageSid: z.string().optional(),
    AccountSid: z.string().optional(),
    From: z.string().optional(),
    To: z.string().optional(),
    Body: z.string().optional(),
    ButtonText: z.string().optional(),
    ButtonPayload: z.string().optional(),
    ProfileName: z.string().optional(),
    WaId: z.string().optional(),
    NumMedia: z.string().optional(),
  })
  .catchall(z.string().optional());

export const twilioWhatsAppWebhookRouter = Router();

twilioWhatsAppWebhookRouter.post("/", async (req, res, next) => {
  try {
    console.log("Twilio WhatsApp webhook received", {
      path: req.originalUrl,
      body: req.body,
    });

    const payload = twilioWebhookSchema.parse(req.body) as TwilioWhatsAppWebhookPayload;
    const isValidWebhook = validateTwilioWebhook({
      signature: req.header("x-twilio-signature"),
      originalUrl: req.originalUrl,
      body: payload,
    });

    if (!isValidWebhook) {
      res.status(401).json({
        error: "Invalid Twilio webhook signature",
      });
      return;
    }

    const message = normalizeTwilioWhatsAppMessage(payload);

    if (!message) {
      res.status(400).json({
        error: "Invalid Twilio WhatsApp webhook payload",
      });
      return;
    }

    await handleIncomingWhatsAppMessage(message);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
