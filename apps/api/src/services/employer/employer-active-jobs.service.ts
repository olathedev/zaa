import { and, eq, inArray } from "drizzle-orm";

import { env } from "../../config/env.js";
import { getDb } from "../../db/client.js";
import { disburseEscrowToWallet } from "./employer-escrow.service.js";
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

export async function handleEmployerActiveJobs(params: {
  employer: typeof users.$inferSelect;
  to: string;
}) {
  const db = getDb();

  const jobs = await db.query.workRequests.findMany({
    where: and(
      eq(workRequests.userId, params.employer.id),
      inArray(workRequests.status, ["in_progress", "pending_completion"]),
    ),
  });

  if (jobs.length === 0) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "You do not have any work in progress right now.",
    });
    return;
  }

  if (jobs.length === 1) {
    await sendJobDetail({ employer: params.employer, to: params.to, job: jobs[0] });
    return;
  }

  // Store list for selection routing
  const db2 = getDb();
  await db2
    .update(users)
    .set({
      onboardingData: {
        ...((params.employer.onboardingData as object) ?? {}),
        activeJobList: jobs.map((j) => j.id),
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.employer.id));

  const lines = [
    "Work in progress:\n",
    ...jobs.map((job, i) => {
      const started = formatDate(job.updatedAt);
      const tag = job.status === "pending_completion" ? " ⏳ Awaiting your confirmation" : "";
      return `${i + 1}. ${job.serviceType ?? "Job"} — ${job.location ?? "Location TBD"}\n   Started: ${started}${tag}`;
    }),
    "\nReply with the number to manage a job.",
  ];
  await sendWhatsAppMessage({ to: params.to, body: lines.join("\n") });
}

export async function handleEmployerJobSelection(params: {
  employer: typeof users.$inferSelect;
  to: string;
  input: string;
}) {
  const data = params.employer.onboardingData;
  const activeJobList =
    data && typeof data === "object" && "activeJobList" in data
      ? (data.activeJobList as string[])
      : null;

  if (!activeJobList?.length) {
    await handleEmployerActiveJobs({ employer: params.employer, to: params.to });
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

  const db = getDb();
  const jobId = activeJobList[index];
  const job = await db.query.workRequests.findFirst({ where: eq(workRequests.id, jobId) });

  if (!job) {
    await sendWhatsAppMessage({ to: params.to, body: "That job no longer exists." });
    return;
  }

  await db
    .update(users)
    .set({
      onboardingData: {
        ...((params.employer.onboardingData as object) ?? {}),
        activeJobList: null,
        managingJobId: jobId,
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.employer.id));

  await sendJobDetail({ employer: params.employer, to: params.to, job });
}

export async function handleEmployerMarkDone(params: {
  employer: typeof users.$inferSelect;
  to: string;
}) {
  const managingJobId = getManagingJobId(params.employer);
  if (!managingJobId) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "No active job selected. Reply IN PROGRESS to view your jobs.",
    });
    return;
  }

  const db = getDb();
  const [job, application] = await Promise.all([
    db.query.workRequests.findFirst({ where: eq(workRequests.id, managingJobId) }),
    db.query.jobApplications.findFirst({
      where: and(
        eq(jobApplications.workRequestId, managingJobId),
        inArray(jobApplications.status, ["accepted"]),
      ),
    }),
  ]);

  if (!job || !["in_progress", "pending_completion"].includes(job.status)) {
    await sendWhatsAppMessage({ to: params.to, body: "This job is no longer active." });
    return;
  }

  await Promise.all([
    db.update(workRequests).set({ status: "completed", updatedAt: new Date() }).where(eq(workRequests.id, managingJobId)),
    application
      ? db.update(jobApplications).set({ status: "completed", updatedAt: new Date() }).where(eq(jobApplications.id, application.id))
      : Promise.resolve(),
  ]);

  await db
    .update(users)
    .set({
      onboardingData: {
        ...((params.employer.onboardingData as object) ?? {}),
        managingJobId: null,
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.employer.id));

  await sendWhatsAppMessage({
    to: params.to,
    body:
      `Job marked as complete.\n\n` +
      `Service: ${job.serviceType ?? "Job"}\n` +
      `Location: ${job.location ?? "Not specified"}\n\n` +
      "Great work! The worker has been notified.",
  });

  if (application) {
    // Disburse escrow to worker wallet — also sends the payment "cha ching" notification
    disburseEscrowToWallet(managingJobId).catch((err) => {
      console.error("Failed to disburse escrow to worker wallet", {
        error: err instanceof Error ? err.message : String(err),
      });
      // Fallback: notify worker even if escrow disbursement fails
      notifyWorkerJobCompleted({ job, workerId: application.workerId }).catch(() => {});
    });
  }
}

export async function handleEmployerCancelJob(params: {
  employer: typeof users.$inferSelect;
  to: string;
}) {
  const managingJobId = getManagingJobId(params.employer);
  if (!managingJobId) {
    await sendWhatsAppMessage({
      to: params.to,
      body: "No active job selected. Reply IN PROGRESS to view your jobs.",
    });
    return;
  }

  const db = getDb();
  const [job, application] = await Promise.all([
    db.query.workRequests.findFirst({ where: eq(workRequests.id, managingJobId) }),
    db.query.jobApplications.findFirst({
      where: and(
        eq(jobApplications.workRequestId, managingJobId),
        inArray(jobApplications.status, ["accepted"]),
      ),
    }),
  ]);

  if (!job) {
    await sendWhatsAppMessage({ to: params.to, body: "Job not found." });
    return;
  }

  await Promise.all([
    db.update(workRequests).set({ status: "cancelled", updatedAt: new Date() }).where(eq(workRequests.id, managingJobId)),
    application
      ? db.update(jobApplications).set({ status: "cancelled", updatedAt: new Date() }).where(eq(jobApplications.id, application.id))
      : Promise.resolve(),
  ]);

  await db
    .update(users)
    .set({
      onboardingData: {
        ...((params.employer.onboardingData as object) ?? {}),
        managingJobId: null,
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.employer.id));

  await sendWhatsAppMessage({
    to: params.to,
    body: "Job cancelled. The worker has been notified.",
  });

  if (application) {
    await notifyWorkerJobCancelled({ job, workerId: application.workerId }).catch((err) => {
      console.error("Failed to notify worker of cancellation", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
}

async function sendJobDetail(params: {
  employer: typeof users.$inferSelect;
  to: string;
  job: typeof workRequests.$inferSelect;
}) {
  const db = getDb();

  const application = await db.query.jobApplications.findFirst({
    where: and(
      eq(jobApplications.workRequestId, params.job.id),
      inArray(jobApplications.status, ["accepted"]),
    ),
  });

  let workerName = "Worker";
  if (application) {
    const workerUser = await db.query.users.findFirst({ where: eq(users.id, application.workerId) });
    workerName = workerUser?.displayName ?? "Worker";
  }

  await db
    .update(users)
    .set({
      onboardingData: {
        ...((params.employer.onboardingData as object) ?? {}),
        activeJobList: null,
        managingJobId: params.job.id,
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.employer.id));

  const started = formatDate(params.job.updatedAt);
  const isPendingCompletion = params.job.status === "pending_completion";
  const status = isPendingCompletion ? "Worker marked complete — confirm?" : "In Progress";

  if (env.twilio.employerJobDetailSid) {
    await sendWhatsAppContentMessage({
      to: params.to,
      contentSid: env.twilio.employerJobDetailSid,
      contentVariables: {
        "1": params.job.serviceType ?? "Job",
        "2": params.job.location ?? "Not specified",
        "3": workerName,
        "4": params.job.budget ?? "Not specified",
        "5": started,
        "6": status,
      },
    });
  } else {
    await sendWhatsAppMessage({
      to: params.to,
      body:
        `${params.job.serviceType ?? "Job"}\n\n` +
        `Location: ${params.job.location ?? "Not specified"}\n` +
        `Worker: ${workerName}\n` +
        `Budget: ${params.job.budget ?? "Not specified"}\n` +
        `Started: ${started}\n` +
        `Status: ${status}\n\n` +
        "Reply DONE to mark as completed.",
    });
  }
}

async function notifyWorkerJobCompleted(params: {
  job: typeof workRequests.$inferSelect;
  workerId: string;
}) {
  const db = getDb();
  const workerContact = await db.query.whatsappContacts.findFirst({
    where: eq(whatsappContacts.userId, params.workerId),
  });
  if (!workerContact) return;

  await sendWhatsAppMessage({
    to: workerContact.phoneNumber,
    body:
      `Job complete! The employer has confirmed.\n\n` +
      `Service: ${params.job.serviceType ?? "Job"}\n` +
      `Location: ${params.job.location ?? "Not specified"}\n\n` +
      "Well done! Keep an eye out for new opportunities.",
  });
}

async function notifyWorkerJobCancelled(params: {
  job: typeof workRequests.$inferSelect;
  workerId: string;
}) {
  const db = getDb();
  const workerContact = await db.query.whatsappContacts.findFirst({
    where: eq(whatsappContacts.userId, params.workerId),
  });
  if (!workerContact) return;

  await sendWhatsAppMessage({
    to: workerContact.phoneNumber,
    body:
      `The employer has cancelled the job.\n\n` +
      `Service: ${params.job.serviceType ?? "Job"}\n` +
      `Location: ${params.job.location ?? "Not specified"}\n\n` +
      "Don't worry — I'll keep sending you new opportunities.",
  });
}

export function getManagingJobId(employer: typeof users.$inferSelect): string | null {
  const data = employer.onboardingData;
  if (!data || typeof data !== "object") return null;
  return ("managingJobId" in data ? data.managingJobId : null) as string | null;
}

export function hasActiveJobList(employer: typeof users.$inferSelect): boolean {
  const data = employer.onboardingData;
  if (!data || typeof data !== "object") return false;
  const list = "activeJobList" in data ? data.activeJobList : null;
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
