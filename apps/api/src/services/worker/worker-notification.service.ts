import { eq } from "drizzle-orm";

import { env } from "../../config/env.js";
import { getDb } from "../../db/client.js";
import { whatsappContacts, workerProfiles, type workRequests } from "../../db/schema.js";
import {
  sendWhatsAppContentMessage,
  sendWhatsAppMediaMessage,
  sendWhatsAppMessage,
} from "../whatsapp/twilio-whatsapp.service.js";

export async function notifyMatchedWorkers(params: {
  workRequest: typeof workRequests.$inferSelect;
  jobCardImageUrl: string;
}) {
  const matched = await findMatchedWorkers(params.workRequest);

  console.log("Worker notification: matched workers", {
    workRequestId: params.workRequest.id,
    matchedCount: matched.length,
    phones: matched.map((w) => w.phoneNumber),
  });

  if (matched.length === 0) {
    return;
  }

  await Promise.allSettled(
    matched.map((worker) =>
      sendJobAlertToWorker({
        workerProfileId: worker.profile.id,
        phoneNumber: worker.phoneNumber,
        workRequest: params.workRequest,
        jobCardImageUrl: params.jobCardImageUrl,
      }),
    ),
  );
}

async function findMatchedWorkers(workRequest: typeof workRequests.$inferSelect) {
  const db = getDb();

  const completedProfiles = await db.query.workerProfiles.findMany({
    where: eq(workerProfiles.profileStatus, "completed"),
  });

  console.log("Worker notification: searching for matches", {
    serviceType: workRequest.serviceType,
    location: workRequest.location,
    completedProfilesCount: completedProfiles.length,
  });

  // TODO: replace with AI-based matching
  const matched = completedProfiles;

  if (matched.length === 0) {
    return [];
  }

  const contacts = await db.query.whatsappContacts.findMany();
  const contactByUserId = new Map(contacts.map((c) => [c.userId, c]));

  return matched
    .map((profile) => {
      const contact = contactByUserId.get(profile.userId);
      return contact ? { profile, phoneNumber: contact.phoneNumber } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

async function sendJobAlertToWorker(params: {
  workerProfileId: string;
  phoneNumber: string;
  workRequest: typeof workRequests.$inferSelect;
  jobCardImageUrl: string;
}) {
  try {
    // Store the work request ID on the worker profile so we know
    // which job they're responding to when they tap Apply.
    const db = getDb();
    await db
      .update(workerProfiles)
      .set({
        metadata: { pendingJobAlertId: params.workRequest.id },
        updatedAt: new Date(),
      })
      .where(eq(workerProfiles.id, params.workerProfileId));

    // Send the job card image first
    await sendWhatsAppMediaMessage({
      to: params.phoneNumber,
      mediaUrl: params.jobCardImageUrl,
    });

    // Send quick reply buttons if template SID is configured,
    // otherwise fall back to plain text
    if (env.twilio.jobAlertContentSid) {
      await sendWhatsAppContentMessage({
        to: params.phoneNumber,
        contentSid: env.twilio.jobAlertContentSid,
        contentVariables: {
          "1": params.workRequest.serviceType ?? "Job",
          "2": params.workRequest.location ?? "Nigeria",
          "3": params.workRequest.budget ?? "Negotiable",
          "4": params.workRequest.preferredDate ?? "Flexible",
        },
      });
    } else {
      await sendWhatsAppMessage({
        to: params.phoneNumber,
        body: buildFallbackAlertMessage(params.workRequest),
      });
    }
  } catch (error) {
    console.error("Failed to send job alert to worker", {
      phoneNumber: params.phoneNumber,
      workRequestId: params.workRequest.id,
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
  }
}

function buildFallbackAlertMessage(workRequest: typeof workRequests.$inferSelect): string {
  return (
    "New job request near you.\n\n" +
    `Service: ${workRequest.serviceType ?? "Not specified"}\n` +
    `Location: ${workRequest.location ?? "Not specified"}\n` +
    `Budget: ${workRequest.budget ?? "Not specified"}\n` +
    `Date: ${workRequest.preferredDate ?? "Not specified"}\n\n` +
    "Reply APPLY to apply, or SKIP to dismiss."
  );
}
