import { Router } from "express";
import { z } from "zod";

import { env } from "../../config/env.js";
import {
  processSquadPaymentWebhook,
  verifySquadWebhookSignature,
} from "../../services/squad/squad-webhook.service.js";

export const squadWebhookRouter = Router();

squadWebhookRouter.post("/test", async (req, res) => {
  if (env.nodeEnv === "production") {
    res.status(404).json({
      error: "Not found",
    });
    return;
  }

  const body = testPaymentSchema.parse(req.body);
  const transactionReference =
    body.transaction_reference ?? `test_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const payload = {
    data: {
      transaction_reference: transactionReference,
      gateway_reference: body.gateway_reference ?? transactionReference,
      virtual_account_number: body.virtual_account_number,
      customer_identifier: body.customer_identifier,
      currency: body.currency,
      principal_amount: body.amount,
      settled_amount: body.settled_amount ?? body.amount,
      fee: body.fee,
      status: body.status,
      channel: body.channel,
      sender_name: body.sender_name,
    },
  };

  const result = await processSquadPaymentWebhook(payload);

  res.status(200).json({
    ok: true,
    test: true,
    ...result,
  });
});

squadWebhookRouter.post("/", async (req, res, next) => {
  try {
    const payload = req.body as Record<string, unknown>;
    const transactionReference = getTransactionReference(payload);
    const isValidSignature = verifySquadWebhookSignature({
      payload,
      rawBody: req.rawBody,
      squadSignature: req.header("x-squad-signature"),
      encryptedBody: req.header("x-squad-encrypted-body"),
    });

    if (!isValidSignature) {
      res.status(400).json({
        response_code: 400,
        transaction_reference: transactionReference,
        response_description: "Invalid signature",
      });
      return;
    }

    const result = await processSquadPaymentWebhook(payload);

    console.log("Squad webhook processed", {
      transactionReference: result.transactionReference,
      credited: result.credited,
      duplicate: result.duplicate,
    });

    res.status(200).json({
      response_code: 200,
      transaction_reference: result.transactionReference,
      response_description: "Success",
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Squad webhook rejected", {
        message: error.message,
      });
    }

    res.status(400).json({
      response_code: 400,
      transaction_reference: getTransactionReference(req.body as Record<string, unknown>),
      response_description: error instanceof Error ? error.message : "Webhook rejected",
    });
  }
});

const testPaymentSchema = z.object({
  customer_identifier: z.string().min(1),
  virtual_account_number: z.string().min(1),
  amount: z.number().int().positive(),
  settled_amount: z.number().int().positive().optional(),
  fee: z.number().int().min(0).default(0),
  currency: z.string().default("NGN"),
  status: z.string().default("success"),
  channel: z.string().default("bank_transfer"),
  transaction_reference: z.string().optional(),
  gateway_reference: z.string().optional(),
  sender_name: z.string().optional(),
});

function getTransactionReference(payload: Record<string, unknown>) {
  const data = typeof payload.data === "object" && payload.data !== null
    ? (payload.data as Record<string, unknown>)
    : payload;
  const value =
    data.transaction_reference ??
    data.transaction_ref ??
    data.transactionRef ??
    payload.transaction_reference;

  return typeof value === "string" ? value : undefined;
}
