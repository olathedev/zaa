import { and, eq, inArray } from "drizzle-orm";

import { env } from "../../config/env.js";
import { getDb } from "../../db/client.js";
import {
  jobApplications,
  users,
  whatsappContacts,
  workRequests,
  workerProfiles,
} from "../../db/schema.js";
import {
  sendWhatsAppContentMessage,
  sendWhatsAppMessage,
} from "../whatsapp/twilio-whatsapp.service.js";

export async function handleWorkerActiveJobs(params: { userId: string; to: string }) {
  const db = getDb();

  const applications = await db.query.jobApplications.findMany({
    where: and(
      eq(jobApplications.workerId, params.userId),
      inArray(jobApplications.status, ["accepted"]),
    ),
  });

  if (applications.length === 0) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "You do not have any active jobs right now.\n\nI'll notify you when a new opportunity comes in.",
    });
    return;
  }

  const jobIds = applications.map((a) => a.workRequestId);
  const jobs = await db.query.workRequests.findMany({
    where: and(
      inArray(workRequests.id, jobIds),
      inArray(workRequests.status, ["in_progress", "pending_completion"]),
    ),
  });

  if (jobs.length === 0) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "You do not have any active jobs right now.",
    });
    return;
  }

  if (jobs.length === 1) {
    await sendJobDetail({
      userId: params.userId,
      to: params.to,
      job: jobs[0],
    });
    return;
  }

  // Multiple jobs — text list, user replies with a number
  const profile = await db.query.workerProfiles.findFirst({
    where: eq(workerProfiles.userId, params.userId),
  });
  if (profile) {
    await db
      .update(workerProfiles)
      .set({
        metadata: {
          ...((profile.metadata as object) ?? {}),
          activeJobList: jobs.map((j) => j.id),
        },
        updatedAt: new Date(),
      })
      .where(eq(workerProfiles.userId, params.userId));
  }

  const lines = [
    "Your active jobs:\n",
    ...jobs.map((job, i) => {
      const started = formatDate(job.updatedAt);
      const tag = job.status === "pending_completion" ? " ⏳" : "";
      return `${i + 1}. ${job.serviceType ?? "Job"} — ${job.location ?? "Location TBD"}\n   Started: ${started}${tag}`;
    }),
    "\nReply with the number to manage a job.",
  ];
  await sendWhatsAppMessage({ to: params.to, body: lines.join("\n") });
}

export async function handleWorkerJobSelection(params: {
  userId: string;
  to: string;
  input: string;
}) {
  const db = getDb();
  const profile = await db.query.workerProfiles.findFirst({
    where: eq(workerProfiles.userId, params.userId),
  });

  const activeJobList =
    profile?.metadata &&
    typeof profile.metadata === "object" &&
    "activeJobList" in profile.metadata
      ? (profile.metadata.activeJobList as string[])
      : null;

  if (!activeJobList?.length) {
    await handleWorkerActiveJobs({ userId: params.userId, to: params.to });
    return;
  }

  const index = parseInt(params.input.trim(), 10) - 1;
  if (isNaN(index) || index < 0 || index >= activeJobList.length) {
    await sendWhatsAppMessage({
      to: params.to,
      body: `Please select a number between 1 and ${activeJobList.length}.`,
    });
    return;
  }

  const jobId = activeJobList[index];
  const job = await db.query.workRequests.findFirst({ where: eq(workRequests.id, jobId) });

  if (!job) {
    await sendWhatsAppMessage({ to: params.to, body: "That job no longer exists." });
    return;
  }

  await db
    .update(workerProfiles)
    .set({
      metadata: {
        ...((profile!.metadata as object) ?? {}),
        activeJobList: null,
        managingJobId: jobId,
      },
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.userId, params.userId));

  await sendJobDetail({ userId: params.userId, to: params.to, job });
}

export async function handleWorkerMarkComplete(params: { userId: string; to: string }) {
  const db = getDb();
  const profile = await db.query.workerProfiles.findFirst({
    where: eq(workerProfiles.userId, params.userId),
  });

  const managingJobId = getManagingJobId(profile);
  if (!managingJobId) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "No active job selected. Reply MY JOBS to view your jobs.",
    });
    return;
  }

  const job = await db.query.workRequests.findFirst({ where: eq(workRequests.id, managingJobId) });
  if (!job || job.status !== "in_progress") {
    await sendWhatsAppMessage({ to: params.to, body: "This job is no longer active." });
    return;
  }

  await db
    .update(workRequests)
    .set({ status: "pending_completion", updatedAt: new Date() })
    .where(eq(workRequests.id, managingJobId));

  await db
    .update(workerProfiles)
    .set({
      metadata: { ...((profile!.metadata as object) ?? {}), managingJobId: null },
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.userId, params.userId));

  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Got it! The employer has been notified that you've marked this job as complete.\n\n" +
      "Once they confirm, the job will be closed.",
  });

  await notifyEmployerJobComplete({ job, workerId: params.userId }).catch((err) => {
    console.error("Failed to notify employer of job completion", {
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

export async function handleWorkerCancelJob(params: { userId: string; to: string }) {
  const db = getDb();
  const profile = await db.query.workerProfiles.findFirst({
    where: eq(workerProfiles.userId, params.userId),
  });

  const managingJobId = getManagingJobId(profile);
  if (!managingJobId) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "No active job selected. Reply MY JOBS to view your jobs.",
    });
    return;
  }

  const [job, application] = await Promise.all([
    db.query.workRequests.findFirst({ where: eq(workRequests.id, managingJobId) }),
    db.query.jobApplications.findFirst({
      where: and(
        eq(jobApplications.workRequestId, managingJobId),
        eq(jobApplications.workerId, params.userId),
      ),
    }),
  ]);

  if (!job || !application) {
    await sendWhatsAppMessage({ to: params.to, body: "Job not found." });
    return;
  }

  await Promise.all([
    db.update(workRequests).set({ status: "cancelled", updatedAt: new Date() }).where(eq(workRequests.id, managingJobId)),
    db.update(jobApplications).set({ status: "cancelled", updatedAt: new Date() }).where(eq(jobApplications.id, application.id)),
  ]);

  await db
    .update(workerProfiles)
    .set({
      metadata: { ...((profile!.metadata as object) ?? {}), managingJobId: null },
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.userId, params.userId));

  await sendWhatsAppMessage({
    to: params.to,
    body: "Job cancelled. The employer has been notified.",
  });

  await notifyEmployerJobCancelled({ job, workerId: params.userId }).catch((err) => {
    console.error("Failed to notify employer of cancellation", {
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

async function sendJobDetail(params: {
  userId: string;
  to: string;
  job: typeof workRequests.$inferSelect;
}) {
  const db = getDb();

  const profile = await db.query.workerProfiles.findFirst({
    where: eq(workerProfiles.userId, params.userId),
  });
  if (profile) {
    await db
      .update(workerProfiles)
      .set({
        metadata: {
          ...((profile.metadata as object) ?? {}),
          activeJobList: null,
          managingJobId: params.job.id,
        },
        updatedAt: new Date(),
      })
      .where(eq(workerProfiles.userId, params.userId));
  }

  const started = formatDate(params.job.updatedAt);
  const isPendingCompletion = params.job.status === "pending_completion";
  const status = isPendingCompletion ? "Awaiting employer confirmation" : "In Progress";

  if (env.twilio.workerJobDetailSid && !isPendingCompletion) {
    await sendWhatsAppContentMessage({
      to: params.to,
      contentSid: env.twilio.workerJobDetailSid,
      contentVariables: {
        "1": params.job.serviceType ?? "Job",
        "2": params.job.location ?? "Not specified",
        "3": params.job.budget ?? "Not specified",
        "4": started,
        "5": status,
      },
    });
  } else {
    await sendWhatsAppMessage({
      to: params.to,
      body:
        `${params.job.serviceType ?? "Job"}\n\n` +
        `Location: ${params.job.location ?? "Not specified"}\n` +
        `Budget: ${params.job.budget ?? "Not specified"}\n` +
        `Started: ${started}\n` +
        `Status: ${status}\n\n` +
        (isPendingCompletion
          ? "Waiting for employer to confirm completion."
          : "Reply COMPLETE to mark as done."),
    });
  }
}

async function notifyEmployerJobComplete(params: {
  job: typeof workRequests.$inferSelect;
  workerId: string;
}) {
  const db = getDb();
  const [employerContact, workerUser] = await Promise.all([
    db.query.whatsappContacts.findFirst({ where: eq(whatsappContacts.userId, params.job.userId) }),
    db.query.users.findFirst({ where: eq(users.id, params.workerId) }),
  ]);

  if (!employerContact) return;

  const workerName = workerUser?.displayName ?? "The worker";

  if (env.twilio.employerConfirmDoneSid) {
    await sendWhatsAppContentMessage({
      to: employerContact.phoneNumber,
      contentSid: env.twilio.employerConfirmDoneSid,
      contentVariables: {
        "1": workerName,
        "2": params.job.serviceType ?? "Job",
        "3": params.job.location ?? "Not specified",
      },
    });
  } else {
    await sendWhatsAppMessage({
      to: employerContact.phoneNumber,
      body:
        `${workerName} has marked the job as complete.\n\n` +
        `Service: ${params.job.serviceType ?? "Job"}\n` +
        `Location: ${params.job.location ?? "Not specified"}\n\n` +
        "Reply DONE to confirm and close the job.",
    });
  }
}

async function notifyEmployerJobCancelled(params: {
  job: typeof workRequests.$inferSelect;
  workerId: string;
}) {
  const db = getDb();
  const [employerContact, workerUser] = await Promise.all([
    db.query.whatsappContacts.findFirst({ where: eq(whatsappContacts.userId, params.job.userId) }),
    db.query.users.findFirst({ where: eq(users.id, params.workerId) }),
  ]);

  if (!employerContact) return;

  const workerName = workerUser?.displayName ?? "The worker";
  await sendWhatsAppMessage({
    to: employerContact.phoneNumber,
    body:
      `${workerName} has cancelled the job.\n\n` +
      `Service: ${params.job.serviceType ?? "Job"}\n` +
      `Location: ${params.job.location ?? "Not specified"}`,
  });
}

export function getManagingJobId(
  profile: typeof workerProfiles.$inferSelect | null | undefined,
): string | null {
  if (!profile?.metadata || typeof profile.metadata !== "object") return null;
  return ("managingJobId" in profile.metadata ? profile.metadata.managingJobId : null) as string | null;
}

export function hasActiveJobList(
  profile: typeof workerProfiles.$inferSelect | null | undefined,
): boolean {
  if (!profile?.metadata || typeof profile.metadata !== "object") return false;
  const list = "activeJobList" in profile.metadata ? profile.metadata.activeJobList : null;
  return Array.isArray(list) && list.length > 0;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}
