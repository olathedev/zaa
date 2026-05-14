import { eq } from "drizzle-orm";

import { getDb } from "../../db/client.js";
import { whatsappContacts, workerProfiles, type workRequests } from "../../db/schema.js";
import {
  sendWhatsAppMediaMessage,
  sendWhatsAppMessage,
} from "../whatsapp/twilio-whatsapp.service.js";

export async function notifyMatchedWorkers(params: {
  workRequest: typeof workRequests.$inferSelect;
  jobCardImageUrl: string;
}) {
  const matched = await findMatchedWorkers(params.workRequest);

  if (matched.length === 0) {
    return;
  }

  await Promise.allSettled(
    matched.map((worker) =>
      sendJobAlertToWorker({
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

  const serviceKeywords = extractKeywords(workRequest.serviceType ?? "");
  const requestState = extractState(workRequest.location ?? "");

  const matched = completedProfiles.filter((profile) => {
    const serviceMatch = matchesService(
      serviceKeywords,
      profile.serviceTitle ?? profile.occupation ?? "",
      profile.skills,
    );

    const locationMatch = requestState
      ? matchesState(requestState, profile.location ?? "")
      : true;

    return serviceMatch && locationMatch;
  });

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
  phoneNumber: string;
  workRequest: typeof workRequests.$inferSelect;
  jobCardImageUrl: string;
}) {
  try {
    await sendWhatsAppMediaMessage({
      to: params.phoneNumber,
      mediaUrl: params.jobCardImageUrl,
    });

    await sendWhatsAppMessage({
      to: params.phoneNumber,
      body: buildAlertMessage(params.workRequest),
    });
  } catch (error) {
    console.error("Failed to send job alert to worker", {
      phoneNumber: params.phoneNumber,
      workRequestId: params.workRequest.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function buildAlertMessage(workRequest: typeof workRequests.$inferSelect): string {
  return (
    "New job request near you.\n\n" +
    `Service: ${workRequest.serviceType ?? "Not specified"}\n` +
    `Location: ${workRequest.location ?? "Not specified"}\n` +
    `Budget: ${workRequest.budget ?? "Not specified"}\n` +
    `Date: ${workRequest.preferredDate ?? "Not specified"}\n\n` +
    "Reply INTERESTED to apply."
  );
}

function extractKeywords(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((word) => word.length > 2);
}

function extractState(location: string): string {
  // "Jos, Nigeria" → "nigeria" | "Yaba, Lagos" → "lagos"
  const parts = location.split(",").map((p) => p.trim().toLowerCase());
  return parts[parts.length - 1] ?? "";
}

function matchesService(
  requestKeywords: string[],
  serviceTitle: string,
  skills: string[],
): boolean {
  const workerText = [serviceTitle, ...skills].join(" ").toLowerCase();
  return requestKeywords.some((keyword) => workerText.includes(keyword));
}

function matchesState(requestState: string, workerLocation: string): boolean {
  return workerLocation.toLowerCase().includes(requestState);
}
