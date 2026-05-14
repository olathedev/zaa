import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { getDb } from "../../db/client.js";
import {
  jobApplications,
  jobEscrows,
  users,
  whatsappContacts,
  workRequests,
  workerProfiles,
} from "../../db/schema.js";
import { initiateDynamicVirtualAccount } from "../squad/squad-dva.service.js";
import { sendWhatsAppMessage } from "../whatsapp/twilio-whatsapp.service.js";
import { getPendingApplicationId } from "./employer-application.service.js";

export type EscrowState =
  | { stage: "none" }
  | { stage: "awaiting_amount"; applicationId: string }
  | { stage: "awaiting_payment"; escrowId: string };

export function getEscrowState(employer: typeof users.$inferSelect): EscrowState {
  const data = employer.onboardingData;
  if (!data || typeof data !== "object") return { stage: "none" };

  if ("escrowId" in data && data.escrowId) {
    return { stage: "awaiting_payment", escrowId: data.escrowId as string };
  }

  if ("awaitingEscrowAmount" in data && data.awaitingEscrowAmount) {
    const applicationId = ("escrowApplicationId" in data ? data.escrowApplicationId : null) as
      | string
      | null;
    if (applicationId) return { stage: "awaiting_amount", applicationId };
  }

  return { stage: "none" };
}

export async function handleEscrowAccept(params: {
  employer: typeof users.$inferSelect;
  to: string;
}) {
  const pendingApplicationId = getPendingApplicationId(params.employer);

  if (!pendingApplicationId) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "No pending application found.",
    });
    return;
  }

  const db = getDb();
  const application = await db.query.jobApplications.findFirst({
    where: and(
      eq(jobApplications.id, pendingApplicationId),
      eq(jobApplications.status, "pending"),
    ),
  });

  if (!application) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "That application has already been responded to or no longer exists.",
    });
    return;
  }

  const workRequest = await db.query.workRequests.findFirst({
    where: eq(workRequests.id, application.workRequestId),
  });

  if (!workRequest) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "Something went wrong retrieving the job details.",
    });
    return;
  }

  const parsed = parseBudgetToNaira(workRequest.budget);

  if (parsed !== null) {
    await initiateEscrow({
      employer: params.employer,
      application,
      workRequest,
      amountNaira: parsed,
      to: params.to,
    });
  } else {
    // Budget is not parseable — ask employer for exact amount
    await db
      .update(users)
      .set({
        onboardingData: {
          ...((params.employer.onboardingData as object) ?? {}),
          awaitingEscrowAmount: true,
          escrowApplicationId: pendingApplicationId,
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.employer.id));

    const workerProfile = await db.query.workerProfiles.findFirst({
      where: eq(workerProfiles.id, application.workerProfileId),
    });
    const workerUser = await db.query.users.findFirst({
      where: eq(users.id, application.workerId),
    });

    await sendWhatsAppMessage({
      to: params.to,
      body:
        `To hire ${workerUser?.displayName ?? "this worker"} for ${workRequest.serviceType ?? "this job"}, ` +
        `you need to deposit the agreed amount into escrow.\n\n` +
        `Reply with the exact amount in Naira (numbers only).\n` +
        `Example: 15000 for ₦15,000`,
    });
  }
}

export async function handleEscrowAmountInput(params: {
  employer: typeof users.$inferSelect;
  applicationId: string;
  amountText: string;
  to: string;
}) {
  const amountNaira = parseFloat(params.amountText.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(amountNaira) || amountNaira < 100) {
    await sendWhatsAppMessage({
      to: params.to,
      body:
        "Please reply with a valid amount in Naira (minimum ₦100).\n" +
        "Example: 15000 for ₦15,000",
    });
    return;
  }

  const db = getDb();
  const application = await db.query.jobApplications.findFirst({
    where: and(
      eq(jobApplications.id, params.applicationId),
      eq(jobApplications.status, "pending"),
    ),
  });

  const workRequest = application
    ? await db.query.workRequests.findFirst({
        where: eq(workRequests.id, application.workRequestId),
      })
    : null;

  if (!application || !workRequest) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "That application is no longer available.",
    });
    return;
  }

  await initiateEscrow({
    employer: params.employer,
    application,
    workRequest,
    amountNaira,
    to: params.to,
  });
}

async function initiateEscrow(params: {
  employer: typeof users.$inferSelect;
  application: typeof jobApplications.$inferSelect;
  workRequest: typeof workRequests.$inferSelect;
  amountNaira: number;
  to: string;
}) {
  const db = getDb();
  const transactionRef = `zaa-escrow-${randomUUID()}`;
  const email = `employer-${params.employer.id}@zaa.ng`;

  let dvaAccountNumber: string | undefined;
  let expiresAt: Date | undefined;

  try {
    const dva = await initiateDynamicVirtualAccount({
      amountNaira: params.amountNaira,
      email,
      transactionRef,
      durationSeconds: 86400,
    });

    dvaAccountNumber = dva.virtual_account_number;
    if (dva.expires_at) {
      expiresAt = new Date(dva.expires_at);
    } else {
      expiresAt = new Date(Date.now() + 86400 * 1000);
    }
  } catch (error) {
    console.error("Squad DVA creation failed", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
    await sendWhatsAppMessage({
      to: params.to,
      body: "Sorry, I couldn't set up the escrow account right now. Please try again shortly.",
    });
    return;
  }

  // Lock the job so no new applications come in while waiting for payment
  await db
    .update(workRequests)
    .set({ status: "escrow_pending", updatedAt: new Date() })
    .where(eq(workRequests.id, params.workRequest.id));

  const [escrow] = await db
    .insert(jobEscrows)
    .values({
      jobApplicationId: params.application.id,
      workRequestId: params.workRequest.id,
      employerId: params.employer.id,
      workerId: params.application.workerId,
      amount: Math.round(params.amountNaira * 100),
      status: "pending_payment",
      transactionRef,
      dvaAccountNumber: dvaAccountNumber ?? null,
      expiresAt: expiresAt ?? null,
    })
    .returning();

  // Store escrowId on employer so we can reference it later; clear pending escrow flags
  await db
    .update(users)
    .set({
      onboardingData: {
        ...((params.employer.onboardingData as object) ?? {}),
        escrowId: escrow.id,
        awaitingEscrowAmount: false,
        escrowApplicationId: null,
        pendingApplicationId: null,
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.employer.id));

  const formattedAmount = formatNaira(Math.round(params.amountNaira * 100));
  const expiryText = expiresAt
    ? expiresAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })
    : "24 hours";

  await sendWhatsAppMessage({
    to: params.to,
    body:
      `Escrow payment required.\n\n` +
      `To confirm the hire, transfer ${formattedAmount} to:\n\n` +
      `Account: ${dvaAccountNumber ?? "Pending"}\n` +
      `Bank: Guaranty Trust Bank (GTBank)\n` +
      `Amount: ${formattedAmount}\n` +
      `Ref: ${transactionRef}\n\n` +
      `Deadline: ${expiryText}\n\n` +
      "Once payment is confirmed, the worker will be notified and contacts will be shared.",
  });
}

export function parseBudgetToNaira(budget: string | null | undefined): number | null {
  if (!budget) return null;

  const cleaned = budget.replace(/[₦,\s]/g, "");

  // Range: "10000-20000" or "10000–20000" → take lower bound
  const rangeMatch = cleaned.match(/^(\d+(?:\.\d+)?)[–\-](\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    return parseFloat(rangeMatch[1]);
  }

  // Single value: "10000" or "10000.00"
  const singleMatch = cleaned.match(/^(\d+(?:\.\d+)?)$/);
  if (singleMatch) {
    return parseFloat(singleMatch[1]);
  }

  return null;
}

export async function releaseEscrowAndShareContacts(params: {
  escrowId: string;
  squadTransactionRef?: string;
}) {
  const db = getDb();
  const escrow = await db.query.jobEscrows.findFirst({
    where: eq(jobEscrows.id, params.escrowId),
  });

  if (!escrow) throw new Error(`Escrow not found: ${params.escrowId}`);

  await Promise.all([
    db
      .update(jobEscrows)
      .set({
        status: "funded",
        squadTransactionReference: params.squadTransactionRef ?? null,
        updatedAt: new Date(),
      })
      .where(eq(jobEscrows.id, params.escrowId)),
    db
      .update(jobApplications)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(jobApplications.id, escrow.jobApplicationId)),
    db
      .update(workRequests)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(workRequests.id, escrow.workRequestId)),
  ]);

  await shareContacts(escrow);
}

async function shareContacts(escrow: typeof jobEscrows.$inferSelect) {
  const db = getDb();

  const [employerContact, workerContact, employerUser, workerUser, workRequest] =
    await Promise.all([
      db.query.whatsappContacts.findFirst({
        where: eq(whatsappContacts.userId, escrow.employerId),
      }),
      db.query.whatsappContacts.findFirst({
        where: eq(whatsappContacts.userId, escrow.workerId),
      }),
      db.query.users.findFirst({ where: eq(users.id, escrow.employerId) }),
      db.query.users.findFirst({ where: eq(users.id, escrow.workerId) }),
      db.query.workRequests.findFirst({ where: eq(workRequests.id, escrow.workRequestId) }),
    ]);

  const employerName = employerUser?.displayName ?? "the employer";
  const workerName = workerUser?.displayName ?? "the worker";
  const jobTitle = workRequest?.serviceType ?? "this job";
  const amountFormatted = formatNaira(escrow.amount);

  if (employerContact) {
    await sendWhatsAppMessage({
      to: employerContact.phoneNumber,
      body:
        `Payment confirmed! Escrow of ${amountFormatted} received.\n\n` +
        `${workerName} has been hired for ${jobTitle}.\n\n` +
        `Worker's contact: ${workerContact?.phoneNumber ?? "Not available"}\n\n` +
        "Reach out to them to confirm the details and get started.",
    });
  }

  if (workerContact) {
    await sendWhatsAppMessage({
      to: workerContact.phoneNumber,
      body:
        `Great news! ${employerName} has confirmed your hire for ${jobTitle}.\n\n` +
        `Employer's contact: ${employerContact?.phoneNumber ?? "Not available"}\n\n` +
        "Reach out to confirm the details and get started.",
    });
  }
}

function formatNaira(amountInKobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    amountInKobo / 100,
  );
}
