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
import {
  getDraftWorkRequest,
  handleWorkRequestMessage,
} from "./employer-work-request-flow.service.js";

type HandleEmployerMenuMessageParams = {
  user: typeof users.$inferSelect;
  message: NormalizedWhatsAppMessage;
};

export async function handleEmployerMenuMessage(
  params: HandleEmployerMenuMessageParams,
) {
  const command = normalizeCommand(params.message.body);

  const activeDraft = await getDraftWorkRequest(params.user.id);
  if (activeDraft) {
    await handleWorkRequestMessage({ user: params.user, message: params.message });
    return;
  }

  if (isMenuCommand(command)) {
    await sendEmployerHomeMenu({
      to: params.message.from,
    });
    return;
  }

  if (isPostWorkRequestIntent(command)) {
    await handleWorkRequestMessage({ user: params.user, message: params.message });
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
      `Bank: Guaranty Trust Bank (GTBank)\n\n` +
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

function isPostWorkRequestIntent(command: string) {
  const exactCommands = new Set([
    "1", "post", "post work", "post work request",
    "create job", "create request", "new request", "new job",
  ]);

  if (exactCommands.has(command)) return true;

  const patterns = [
    /\b(post|create|publish|add)\b.*(job|request|work|task)/,
    /\b(need|want|looking for|find me|get me)\b.*(worker|help|someone|person|staff|hand)/,
    /\bi need\b/,
    /\bi want to hire\b/,
    /\b(hire|employ|recruit)\b/,
  ];

  return patterns.some((p) => p.test(command));
}

function formatNaira(amountInKobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amountInKobo / 100);
}
