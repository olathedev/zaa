import { eq } from "drizzle-orm";

import { getDb } from "../../db/client.js";
import {
  jobApplications,
  users,
  walletBalances,
  whatsappContacts,
  workRequests,
  workerProfiles,
} from "../../db/schema.js";
import { generateWorkerAnalysis } from "../ai/zaa-analysis.service.js";
import { sendWhatsAppMessage } from "../whatsapp/twilio-whatsapp.service.js";
import type { NormalizedWhatsAppMessage } from "../whatsapp/twilio-whatsapp.types.js";

type HandleWorkerMenuMessageParams = {
  user: typeof users.$inferSelect;
  message: NormalizedWhatsAppMessage;
};

export async function handleWorkerMenuMessage(
  params: HandleWorkerMenuMessageParams,
) {
  const command = normalizeCommand(params.message.buttonPayload ?? params.message.body);

  if (isMenuCommand(command)) {
    await sendWorkerHomeMenu({ to: params.message.from });
    return;
  }

  if (isApplyIntent(command)) {
    await handleApply({ userId: params.user.id, to: params.message.from });
    return;
  }

  if (isSkipIntent(command)) {
    await handleSkip({ userId: params.user.id, to: params.message.from });
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

async function handleApply(params: { userId: string; to: string }) {
  const db = getDb();

  const [profile, workerUser] = await Promise.all([
    db.query.workerProfiles.findFirst({ where: eq(workerProfiles.userId, params.userId) }),
    db.query.users.findFirst({ where: eq(users.id, params.userId) }),
  ]);

  const pendingJobAlertId =
    profile?.metadata &&
    typeof profile.metadata === "object" &&
    "pendingJobAlertId" in profile.metadata
      ? (profile.metadata.pendingJobAlertId as string)
      : null;

  if (!pendingJobAlertId || !profile) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "No active job alert found. I'll notify you when a new one comes in.",
    });
    return;
  }

  const job = await db.query.workRequests.findFirst({
    where: eq(workRequests.id, pendingJobAlertId),
  });

  if (!job || job.status !== "open") {
    await sendWhatsAppMessage({
      to: params.to,
      body: "That job is no longer available.",
    });
    return;
  }

  // Create application record
  const [application] = await db
    .insert(jobApplications)
    .values({
      workRequestId: job.id,
      workerId: params.userId,
      workerProfileId: profile.id,
      status: "pending",
    })
    .returning();

  // Clear pending alert from worker profile
  await db
    .update(workerProfiles)
    .set({
      metadata: { ...((profile.metadata as object) ?? {}), pendingJobAlertId: null },
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.userId, params.userId));

  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Your application has been sent.\n\n" +
      `Service: ${job.serviceType ?? "Not specified"}\n` +
      `Location: ${job.location ?? "Not specified"}\n\n` +
      "The employer will be notified. I'll let you know their decision.",
  });

  // Notify employer in the background
  notifyEmployerOfApplication({
    application,
    job,
    profile,
    workerUser: workerUser ?? null,
  }).catch((error) => {
    console.error("Employer application notification failed", {
      applicationId: application.id,
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
  });
}

async function notifyEmployerOfApplication(params: {
  application: typeof jobApplications.$inferSelect;
  job: typeof workRequests.$inferSelect;
  profile: typeof workerProfiles.$inferSelect;
  workerUser: typeof users.$inferSelect | null;
}) {
  const db = getDb();

  const [employerContact, employerUser] = await Promise.all([
    db.query.whatsappContacts.findFirst({
      where: eq(whatsappContacts.userId, params.job.userId),
    }),
    db.query.users.findFirst({
      where: eq(users.id, params.job.userId),
    }),
  ]);

  if (!employerContact || !employerUser) return;

  const workerName = params.workerUser?.displayName ?? "A worker";
  const analysis = await generateWorkerAnalysis({
    workerName,
    serviceTitle: params.profile.serviceTitle ?? params.profile.occupation ?? "Not set",
    skills: params.profile.skills,
    experienceLevel: params.profile.experienceLevel ?? "unknown",
    location: params.profile.location ?? "Not set",
    trustScore: params.profile.trustScore,
    assessmentScore: params.profile.assessmentScore ?? 0,
  });

  // Store the pending application ID on the employer so we know what
  // they're responding to when they type ACCEPT or DECLINE
  await db
    .update(users)
    .set({
      onboardingData: {
        ...((employerUser.onboardingData as object) ?? {}),
        pendingApplicationId: params.application.id,
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.job.userId));

  await sendWhatsAppMessage({
    to: employerContact.phoneNumber,
    body:
      `New Application!\n\n` +
      `${workerName} applied for your ${params.job.serviceType ?? "job"}.\n\n` +
      `Service: ${params.profile.serviceTitle ?? params.profile.occupation ?? "Not set"}\n` +
      `Location: ${params.profile.location ?? "Not set"}\n` +
      `Experience: ${params.profile.experienceLevel ?? "Not set"}\n` +
      `Trust Score: ${params.profile.trustScore}/100\n` +
      `Skill Score: ${params.profile.assessmentScore ?? 0}%\n\n` +
      `Zaa says: ${analysis}\n\n` +
      "Reply ACCEPT to hire them, or DECLINE to pass.",
  });
}

async function handleSkip(params: { userId: string; to: string }) {
  const db = getDb();

  await db
    .update(workerProfiles)
    .set({
      metadata: { pendingJobAlertId: null },
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.userId, params.userId));

  await sendWhatsAppMessage({
    to: params.to,
    body: "Got it. I'll keep sending you new opportunities as they come in.",
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

function isApplyIntent(command: string) {
  return ["apply", "apply ✅", "interested", "yes"].includes(command);
}

function isSkipIntent(command: string) {
  return ["skip", "not interested", "skip ❌", "no"].includes(command);
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
