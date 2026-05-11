import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, or, sql } from "drizzle-orm";

import { env } from "../../config/env.js";
import { getDb } from "../../db/client.js";
import {
  paymentTransactions,
  virtualAccounts,
  walletBalances,
} from "../../db/schema.js";

type SquadWebhookPayload = Record<string, unknown>;

type NormalizedSquadPayment = {
  transactionReference: string;
  gatewayReference?: string;
  virtualAccountNumber: string;
  customerIdentifier: string;
  currency: string;
  principalAmount: number;
  settledAmount: number;
  fee: number;
  status: string;
  channel?: string;
  raw: SquadWebhookPayload;
};

export function verifySquadWebhookSignature(params: {
  payload: SquadWebhookPayload;
  rawBody?: Buffer;
  squadSignature?: string;
  encryptedBody?: string;
}) {
  if (!env.squad.secretKey) {
    throw new Error("SQUAD_SECRET_KEY is required to verify Squad webhooks");
  }

  if (params.squadSignature) {
    const payment = normalizeSquadPayment(params.payload);
    const signatureBody = [
      payment.transactionReference,
      payment.virtualAccountNumber,
      payment.currency,
      payment.principalAmount,
      payment.settledAmount,
      payment.customerIdentifier,
    ].join("|");

    return signaturesMatch(
      createHmac("sha512", env.squad.secretKey).update(signatureBody).digest("hex"),
      params.squadSignature,
    );
  }

  if (params.encryptedBody && params.rawBody) {
    return signaturesMatch(
      createHmac("sha512", env.squad.secretKey).update(params.rawBody).digest("hex"),
      params.encryptedBody,
    );
  }

  return false;
}

export async function processSquadPaymentWebhook(payload: SquadWebhookPayload) {
  const db = getDb();
  const payment = normalizeSquadPayment(payload);

  if (!isSuccessfulPaymentStatus(payment.status)) {
    return {
      credited: false,
      duplicate: false,
      transactionReference: payment.transactionReference,
      message: "Payment status is not successful",
    };
  }

  const virtualAccount = await db.query.virtualAccounts.findFirst({
    where: or(
      eq(virtualAccounts.customerIdentifier, payment.customerIdentifier),
      eq(virtualAccounts.virtualAccountNumber, payment.virtualAccountNumber),
    ),
  });

  if (!virtualAccount) {
    throw new Error("No Zaa virtual account matches Squad payment webhook");
  }

  const [insertedTransaction] = await db
    .insert(paymentTransactions)
    .values({
      userId: virtualAccount.userId,
      virtualAccountId: virtualAccount.id,
      provider: "squad",
      transactionReference: payment.transactionReference,
      gatewayReference: payment.gatewayReference,
      amount: payment.principalAmount,
      settledAmount: payment.settledAmount,
      fee: payment.fee,
      currency: payment.currency,
      status: payment.status,
      channel: payment.channel,
      customerIdentifier: payment.customerIdentifier,
      virtualAccountNumber: payment.virtualAccountNumber,
      metadata: sanitizeSquadWebhookMetadata(payment.raw),
    })
    .onConflictDoNothing()
    .returning();

  if (!insertedTransaction) {
    return {
      credited: false,
      duplicate: true,
      transactionReference: payment.transactionReference,
      message: "Duplicate transaction ignored",
    };
  }

  await db
    .insert(walletBalances)
    .values({
      userId: virtualAccount.userId,
      availableBalance: payment.settledAmount,
      ledgerBalance: payment.settledAmount,
      currency: payment.currency,
    })
    .onConflictDoUpdate({
      target: walletBalances.userId,
      set: {
        availableBalance: sql`${walletBalances.availableBalance} + ${payment.settledAmount}`,
        ledgerBalance: sql`${walletBalances.ledgerBalance} + ${payment.settledAmount}`,
        currency: payment.currency,
        updatedAt: new Date(),
      },
    });

  return {
    credited: true,
    duplicate: false,
    transactionReference: payment.transactionReference,
    message: "Payment credited",
  };
}

export function normalizeSquadPayment(payload: SquadWebhookPayload): NormalizedSquadPayment {
  const data = getRecord(payload.data) ?? payload;
  const transactionReference = getString(
    data.transaction_reference,
    data.transaction_ref,
    data.transactionRef,
    payload.transaction_reference,
  );
  const virtualAccountNumber = getString(
    data.virtual_account_number,
    data.virtualAccountNumber,
    data.account_number,
    payload.virtual_account_number,
  );
  const customerIdentifier = getString(
    data.customer_identifier,
    data.customerIdentifier,
    payload.customer_identifier,
  );

  if (!transactionReference || !virtualAccountNumber || !customerIdentifier) {
    throw new Error("Squad webhook payload is missing transaction reference, virtual account, or customer identifier");
  }

  const principalAmount = toMinorUnits(
    getNumber(data.principal_amount, data.amount, data.transaction_amount),
  );
  const settledAmount = toMinorUnits(
    getNumber(data.settled_amount, data.amount_settled, data.amount, data.principal_amount),
  );

  return {
    transactionReference,
    gatewayReference: getString(data.gateway_reference, data.gateway_ref, data.reference),
    virtualAccountNumber,
    customerIdentifier,
    currency: getString(data.currency, payload.currency) ?? "NGN",
    principalAmount,
    settledAmount,
    fee: toMinorUnits(getNumber(data.fee, data.charges) ?? 0),
    status: getString(data.status, data.transaction_status, payload.status) ?? "unknown",
    channel: getString(data.channel, data.payment_channel),
    raw: payload,
  };
}

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function isSuccessfulPaymentStatus(status: string) {
  const normalized = status.toLowerCase();

  return normalized === "success" || normalized === "successful" || normalized === "completed";
}

function sanitizeSquadWebhookMetadata(payload: SquadWebhookPayload) {
  const { bvn: _bvn, ...safePayload } = payload;

  return safePayload;
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function getString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return undefined;
}

function getNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function toMinorUnits(value: number | undefined) {
  if (!value) {
    return 0;
  }

  return Number.isInteger(value) ? value : Math.round(value * 100);
}
