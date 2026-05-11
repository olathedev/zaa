import { Router } from "express";

import {
  processSquadPaymentWebhook,
  verifySquadWebhookSignature,
} from "../../services/squad/squad-webhook.service.js";

export const squadWebhookRouter = Router();

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

