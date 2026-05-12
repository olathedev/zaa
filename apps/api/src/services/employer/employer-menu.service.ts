import { desc, eq } from "drizzle-orm";

import { getDb } from "../../db/client.js";
import {
  paymentTransactions,
  users,
  virtualAccounts,
  walletBalances,
} from "../../db/schema.js";
import type { NormalizedWhatsAppMessage } from "../whatsapp/twilio-whatsapp.types.js";
import { sendWhatsAppMessage } from "../whatsapp/twilio-whatsapp.service.js";

type HandleEmployerMenuMessageParams = {
  user: typeof users.$inferSelect;
  message: NormalizedWhatsAppMessage;
};

export async function handleEmployerMenuMessage(
  params: HandleEmployerMenuMessageParams,
) {
  const command = normalizeCommand(params.message.body);

  if (isMenuCommand(command)) {
    await sendEmployerHomeMenu({
      to: params.message.from,
    });
    return;
  }

  if (["1", "post", "post work", "post work request", "create job", "create request"].includes(command)) {
    await sendPostWorkRequestIntro({
      to: params.message.from,
    });
    return;
  }

  if (["2", "open", "open requests", "published", "published jobs"].includes(command)) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body:
        "You do not have any open work requests yet.\n\n" +
        "Reply 1 or POST WORK REQUEST to create one.",
    });
    return;
  }

  if (["3", "in progress", "progress", "in-progress work"].includes(command)) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body: "You do not have any work in progress yet.",
    });
    return;
  }

  if (["4", "completed", "completed work"].includes(command)) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body: "You do not have completed work on Zaa yet.",
    });
    return;
  }

  if (["5", "wallet", "payments", "wallet and payments", "wallet & payments"].includes(command)) {
    await sendWalletMenu({
      to: params.message.from,
    });
    return;
  }

  if (["balance", "check balance", "wallet balance"].includes(command)) {
    await sendWalletBalance({
      userId: params.user.id,
      to: params.message.from,
    });
    return;
  }

  if (["fund", "fund wallet", "deposit"].includes(command)) {
    await sendFundingInstructions({
      userId: params.user.id,
      to: params.message.from,
    });
    return;
  }

  if (["withdraw", "withdrawal"].includes(command)) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body:
        "Withdrawals are coming soon.\n\n" +
        "For now, you can fund your Zaa wallet and use it to prepare work requests.",
    });
    return;
  }

  if (["history", "payment history", "transactions"].includes(command)) {
    await sendPaymentHistory({
      userId: params.user.id,
      to: params.message.from,
    });
    return;
  }

  await sendEmployerHomeMenu({
    to: params.message.from,
  });
}

export async function sendEmployerHomeMenu(params: { to: string }) {
  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Welcome to Zaa.\n\n" +
      "What would you like to do?\n\n" +
      "1. Post a Work Request\n" +
      "2. View Open Requests\n" +
      "3. View In-Progress Work\n" +
      "4. View Completed Work\n" +
      "5. Wallet & Payments\n\n" +
      "Reply with a number or command.",
  });
}

async function sendPostWorkRequestIntro(params: { to: string }) {
  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Post a Work Request helps you find talents, service providers, and traders on Zaa.\n\n" +
      "Next, I will collect:\n" +
      "- what service or talent you need\n" +
      "- location\n" +
      "- budget\n" +
      "- urgency/date\n" +
      "- work description\n\n" +
      "This request flow is the next piece we will activate.",
  });
}

async function sendWalletMenu(params: { to: string }) {
  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Wallet & Payments\n\n" +
      "Reply with one of these:\n\n" +
      "1. Check Balance\n" +
      "2. Fund Wallet\n" +
      "3. Withdraw\n" +
      "4. Payment History\n\n" +
      "You can also reply BALANCE, FUND WALLET, WITHDRAW, or HISTORY.",
  });
}

async function sendWalletBalance(params: {
  userId: string;
  to: string;
}) {
  const db = getDb();
  const balance = await db.query.walletBalances.findFirst({
    where: eq(walletBalances.userId, params.userId),
  });

  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Your Zaa wallet balance:\n\n" +
      `Available: ${formatNaira(balance?.availableBalance ?? 0)}\n` +
      `Ledger: ${formatNaira(balance?.ledgerBalance ?? 0)}`,
  });
}

async function sendFundingInstructions(params: {
  userId: string;
  to: string;
}) {
  const db = getDb();
  const virtualAccount = await db.query.virtualAccounts.findFirst({
    where: eq(virtualAccounts.userId, params.userId),
  });

  if (!virtualAccount) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "I could not find your virtual account yet. Please try again shortly.",
    });
    return;
  }

  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Fund your Zaa wallet by transferring to your virtual account:\n\n" +
      `Account number: ${virtualAccount.virtualAccountNumber}\n` +
      `Bank code: ${virtualAccount.bankCode ?? "pending"}\n\n` +
      "Once payment is confirmed, I will notify you here.",
  });
}

async function sendPaymentHistory(params: {
  userId: string;
  to: string;
}) {
  const db = getDb();
  const transactions = await db.query.paymentTransactions.findMany({
    where: eq(paymentTransactions.userId, params.userId),
    orderBy: [desc(paymentTransactions.createdAt)],
    limit: 5,
  });

  if (transactions.length === 0) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "You do not have any wallet transactions yet.",
    });
    return;
  }

  await sendWhatsAppMessage({
    to: params.to,
    body: [
      "Recent wallet transactions:",
      "",
      ...transactions.map(
        (transaction, index) =>
          `${index + 1}. ${formatNaira(transaction.settledAmount)} - ${transaction.status}`,
      ),
    ].join("\n"),
  });
}

function normalizeCommand(value: string) {
  return value.trim().toLowerCase();
}

function isMenuCommand(command: string) {
  return ["", "hi", "hello", "hey", "menu", "home", "help", "start"].includes(command);
}

function formatNaira(amountInKobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amountInKobo / 100);
}
