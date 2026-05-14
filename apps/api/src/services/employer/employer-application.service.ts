import { and, eq } from "drizzle-orm";

import { getDb } from "../../db/client.js";
import {
  jobApplications,
  users,
  whatsappContacts,
  workRequests,
  workerProfiles,
} from "../../db/schema.js";
import { tryGenerateAcceptanceCard } from "../job-card/acceptance-card.service.js";
import {
  sendWhatsAppMediaMessage,
  sendWhatsAppMessage,
} from "../whatsapp/twilio-whatsapp.service.js";

export async function handleApplicationResponse(params: {
  employer: typeof users.$inferSelect;
  to: string;
  intent: "accept" | "decline";
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

  const [workRequest, workerProfile, workerUser] = await Promise.all([
    db.query.workRequests.findFirst({
      where: eq(workRequests.id, application.workRequestId),
    }),
    db.query.workerProfiles.findFirst({
      where: eq(workerProfiles.id, application.workerProfileId),
    }),
    db.query.users.findFirst({
      where: eq(users.id, application.workerId),
    }),
  ]);

  if (!workRequest || !workerProfile || !workerUser) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "Something went wrong retrieving the application details.",
    });
    return;
  }

  if (params.intent === "accept") {
    await acceptApplication({
      application,
      workRequest,
      workerUser,
      employer: params.employer,
      employerTo: params.to,
    });
  } else {
    await declineApplication({
      application,
      workRequest,
      workerUser,
      employerTo: params.to,
    });
  }

  // Clear pending application from employer's onboardingData
  await db
    .update(users)
    .set({
      onboardingData: { ...((params.employer.onboardingData as object) ?? {}), pendingApplicationId: null },
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.employer.id));
}

async function acceptApplication(params: {
  application: typeof jobApplications.$inferSelect;
  workRequest: typeof workRequests.$inferSelect;
  workerUser: typeof users.$inferSelect;
  employer: typeof users.$inferSelect;
  employerTo: string;
}) {
  const db = getDb();

  await Promise.all([
    db
      .update(jobApplications)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(jobApplications.id, params.application.id)),
    db
      .update(workRequests)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(workRequests.id, params.workRequest.id)),
  ]);

  const workerPhone = await getWhatsAppNumber(params.workerUser.id);
  const workerName = params.workerUser.displayName ?? "the worker";
  const employerName = params.employer.displayName ?? "the employer";

  await sendWhatsAppMessage({
    to: params.employerTo,
    body:
      `You've accepted ${workerName}'s application.\n\n` +
      `Service: ${params.workRequest.serviceType ?? "Not specified"}\n` +
      `Location: ${params.workRequest.location ?? "Not specified"}\n\n` +
      "The worker has been notified. They will reach out to confirm details.",
  });

  if (workerPhone) {
    const acceptanceImageUrl = await tryGenerateAcceptanceCard({
      serviceType: params.workRequest.serviceType ?? "Job",
      location: params.workRequest.location ?? "Nigeria",
      preferredDate: params.workRequest.preferredDate ?? "Flexible",
    });

    if (acceptanceImageUrl) {
      await sendWhatsAppMediaMessage({
        to: workerPhone,
        mediaUrl: acceptanceImageUrl,
      });
    }

    await sendWhatsAppMessage({
      to: workerPhone,
      body:
        `Great news! ${employerName} has accepted your application.\n\n` +
        `Service: ${params.workRequest.serviceType ?? "Not specified"}\n` +
        `Location: ${params.workRequest.location ?? "Not specified"}\n` +
        `Budget: ${params.workRequest.budget ?? "Not specified"}\n` +
        `Date: ${params.workRequest.preferredDate ?? "Not specified"}\n\n` +
        "Reach out to the employer to confirm the details and get started.",
    });
  }
}

async function declineApplication(params: {
  application: typeof jobApplications.$inferSelect;
  workRequest: typeof workRequests.$inferSelect;
  workerUser: typeof users.$inferSelect;
  employerTo: string;
}) {
  const db = getDb();

  await db
    .update(jobApplications)
    .set({ status: "declined", updatedAt: new Date() })
    .where(eq(jobApplications.id, params.application.id));

  const workerPhone = await getWhatsAppNumber(params.workerUser.id);
  const workerName = params.workerUser.displayName ?? "The worker";

  await sendWhatsAppMessage({
    to: params.employerTo,
    body: `You've declined ${workerName}'s application. The job is still open for other applicants.`,
  });

  if (workerPhone) {
    await sendWhatsAppMessage({
      to: workerPhone,
      body:
        "The employer has filled this position.\n\n" +
        "Don't worry — I'll keep sending you new opportunities as they come in.",
    });
  }
}

async function getWhatsAppNumber(userId: string): Promise<string | null> {
  const db = getDb();
  const contact = await db.query.whatsappContacts.findFirst({
    where: eq(whatsappContacts.userId, userId),
  });
  return contact?.phoneNumber ?? null;
}

export function getPendingApplicationId(
  employer: typeof users.$inferSelect,
): string | null {
  const data = employer.onboardingData;
  if (data && typeof data === "object" && "pendingApplicationId" in data) {
    return (data.pendingApplicationId as string) || null;
  }
  return null;
}
