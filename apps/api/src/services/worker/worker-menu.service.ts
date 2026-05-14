import { eq } from "drizzle-orm";

import { getDb } from "../../db/client.js";
import { walletBalances, workerProfiles, type users } from "../../db/schema.js";
import type { NormalizedWhatsAppMessage } from "../whatsapp/twilio-whatsapp.types.js";
import { sendWhatsAppMessage } from "../whatsapp/twilio-whatsapp.service.js";

type HandleWorkerMenuMessageParams = {
  user: typeof users.$inferSelect;
  message: NormalizedWhatsAppMessage;
};

export async function handleWorkerMenuMessage(
  params: HandleWorkerMenuMessageParams,
) {
  const command = normalizeCommand(params.message.body);

  if (isMenuCommand(command)) {
    await sendWorkerHomeMenu({ to: params.message.from });
    return;
  }

  if (isAvailableJobsIntent(command)) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body:
        "No job matches yet.\n\n" +
        "I'll notify you here as soon as a suitable request comes in.",
    });
    return;
  }

  if (isActiveJobsIntent(command)) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body: "You do not have any active jobs yet.",
    });
    return;
  }

  if (isProfileIntent(command)) {
    await sendProfileSummary({ userId: params.user.id, to: params.message.from });
    return;
  }

  if (isEarningsIntent(command)) {
    await sendEarningsSummary({ userId: params.user.id, to: params.message.from });
    return;
  }

  await sendWhatsAppMessage({
    to: params.message.from,
    body: "Reply MENU to see your options.",
  });
}

export async function sendWorkerHomeMenu(params: { to: string }) {
  await sendWhatsAppMessage({
    to: params.to,
    body:
      "What would you like to do?\n\n" +
      "1. Available Jobs\n" +
      "2. My Active Jobs\n" +
      "3. My Profile\n" +
      "4. Earnings\n\n" +
      "Reply with a number or command.",
  });
}

async function sendProfileSummary(params: { userId: string; to: string }) {
  const db = getDb();
  const profile = await db.query.workerProfiles.findFirst({
    where: eq(workerProfiles.userId, params.userId),
  });

  if (!profile) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "I couldn't find your profile. Reply START PROFILE to set it up.",
    });
    return;
  }

  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Your work profile:\n\n" +
      `Service: ${profile.serviceTitle ?? profile.occupation ?? "Not set"}\n` +
      `Skills: ${profile.skills.join(", ") || "Not set"}\n` +
      `Location: ${profile.location ?? "Not set"}\n` +
      `Availability: ${profile.availability ?? "Not set"}\n` +
      `Pay preference: ${profile.expectedPayRange ?? "Not set"}\n` +
      `Trust score: ${profile.trustScore}/100\n\n` +
      "Reply RESTART PROFILE to update your profile.",
  });
}

async function sendEarningsSummary(params: { userId: string; to: string }) {
  const db = getDb();
  const balance = await db.query.walletBalances.findFirst({
    where: eq(walletBalances.userId, params.userId),
  });

  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Your Zaa earnings:\n\n" +
      `Available: ${formatNaira(balance?.availableBalance ?? 0)}\n` +
      `Ledger: ${formatNaira(balance?.ledgerBalance ?? 0)}\n\n` +
      "Withdrawals are coming soon.",
  });
}

function normalizeCommand(value: string) {
  return value.trim().toLowerCase();
}

function isMenuCommand(command: string) {
  return ["", "hi", "hello", "hey", "menu", "home", "help", "start"].includes(command);
}

function isAvailableJobsIntent(command: string) {
  return [
    "1", "available", "available jobs", "jobs", "find jobs", "find work", "show jobs",
  ].includes(command);
}

function isActiveJobsIntent(command: string) {
  return [
    "2", "active", "active jobs", "my jobs", "in progress", "in-progress", "current jobs",
  ].includes(command);
}

function isProfileIntent(command: string) {
  return [
    "3", "profile", "my profile", "view profile", "show profile",
  ].includes(command);
}

function isEarningsIntent(command: string) {
  return [
    "4", "earnings", "my earnings", "wallet", "balance", "pay", "payment", "withdraw",
  ].includes(command);
}

function formatNaira(amountInKobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amountInKobo / 100);
}
