import { and, eq } from "drizzle-orm";

import { getDb } from "../../db/client.js";
import { workRequests, type users } from "../../db/schema.js";
import { generateAndUploadJobCard } from "../job-card/job-card.service.js";
import { notifyMatchedWorkers } from "../worker/worker-notification.service.js";
import type { NormalizedWhatsAppMessage } from "../whatsapp/twilio-whatsapp.types.js";
import { sendWhatsAppMessage } from "../whatsapp/twilio-whatsapp.service.js";

type WorkRequestStep =
  | "service_type"
  | "location"
  | "budget"
  | "preferred_date"
  | "description"
  | "confirm";

type WorkRequestFlowData = {
  currentStep?: WorkRequestStep;
  serviceType?: string;
  location?: string;
  budget?: string;
  preferredDate?: string;
  description?: string;
};

type HandleWorkRequestMessageParams = {
  user: typeof users.$inferSelect;
  message: NormalizedWhatsAppMessage;
};

const workRequestSteps: WorkRequestStep[] = [
  "service_type",
  "location",
  "budget",
  "preferred_date",
  "description",
];

const cancelCommands = new Set(["cancel", "cancel request", "stop", "quit", "exit"]);

export async function handleWorkRequestMessage(
  params: HandleWorkRequestMessageParams,
) {
  const draft = await getDraftWorkRequest(params.user.id);
  const command = params.message.body.trim().toLowerCase();

  if (cancelCommands.has(command)) {
    await cancelDraftWorkRequest({ userId: params.user.id, draft });
    return;
  }

  if (!draft) {
    await startWorkRequestFlow({ userId: params.user.id, to: params.message.from });
    return;
  }

  await handleWorkRequestStep({ draft, message: params.message });
}

export async function getDraftWorkRequest(userId: string) {
  const db = getDb();
  return db.query.workRequests.findFirst({
    where: and(eq(workRequests.userId, userId), eq(workRequests.status, "draft")),
  });
}

async function startWorkRequestFlow(params: { userId: string; to: string }) {
  const db = getDb();

  const [draft] = await db
    .insert(workRequests)
    .values({
      userId: params.userId,
      status: "draft",
      metadata: { currentStep: "service_type" } satisfies WorkRequestFlowData,
    })
    .returning();

  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Let's post your work request. I'll ask you a few quick questions.\n\n" +
      "Reply CANCEL at any time to stop.\n\n" +
      getPromptForStep("service_type"),
  });

  return draft;
}

async function handleWorkRequestStep(params: {
  draft: typeof workRequests.$inferSelect;
  message: NormalizedWhatsAppMessage;
}) {
  const db = getDb();
  const data = normalizeFlowData(params.draft.metadata);
  const currentStep = data.currentStep ?? "service_type";
  const validationError = validateStepAnswer({ step: currentStep, answer: params.message.body });

  if (validationError) {
    await sendWhatsAppMessage({ to: params.message.from, body: validationError });
    return;
  }

  if (currentStep === "confirm") {
    await handleConfirmStep({ draft: params.draft, data, message: params.message });
    return;
  }

  const updatedData = recordStepAnswer({ data, step: currentStep, answer: params.message.body });
  const nextStep = getNextStep(currentStep);

  updatedData.currentStep = nextStep ?? "confirm";

  await db
    .update(workRequests)
    .set({
      serviceType: updatedData.serviceType,
      location: updatedData.location,
      budget: updatedData.budget,
      preferredDate: updatedData.preferredDate,
      description: updatedData.description,
      metadata: updatedData,
      updatedAt: new Date(),
    })
    .where(eq(workRequests.id, params.draft.id));

  if (!nextStep) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body: getRequestSummary(updatedData),
    });
    return;
  }

  await sendWhatsAppMessage({
    to: params.message.from,
    body: getPromptForStep(nextStep),
  });
}

async function handleConfirmStep(params: {
  draft: typeof workRequests.$inferSelect;
  data: WorkRequestFlowData;
  message: NormalizedWhatsAppMessage;
}) {
  const db = getDb();
  const answer = params.message.body.trim().toLowerCase();

  if (!["yes", "y", "confirm", "post", "publish"].includes(answer)) {
    await db
      .update(workRequests)
      .set({
        status: "draft",
        metadata: { currentStep: "service_type" } satisfies WorkRequestFlowData,
        serviceType: null,
        location: null,
        budget: null,
        preferredDate: null,
        description: null,
        updatedAt: new Date(),
      })
      .where(eq(workRequests.id, params.draft.id));

    await sendWhatsAppMessage({
      to: params.message.from,
      body: "No problem. Let's start over.\n\n" + getPromptForStep("service_type"),
    });
    return;
  }

  const [posted] = await db
    .update(workRequests)
    .set({
      status: "open",
      metadata: {},
      updatedAt: new Date(),
    })
    .where(eq(workRequests.id, params.draft.id))
    .returning();

  await sendWhatsAppMessage({
    to: params.message.from,
    body:
      "Your work request is posted.\n\n" +
      "I will match it with available workers on Zaa and notify you when someone is found.",
  });

  notifyWorkersInBackground({ workRequest: posted }).catch((error) => {
    console.error("Background worker notification failed", {
      workRequestId: posted.id,
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
  });
}

async function cancelDraftWorkRequest(params: {
  userId: string;
  draft: typeof workRequests.$inferSelect | undefined;
}) {
  const db = getDb();

  if (params.draft) {
    await db
      .update(workRequests)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(workRequests.id, params.draft.id));
  }

  await sendWhatsAppMessage({
    to: await getWhatsAppNumber(params.userId),
    body: "Work request cancelled. Reply POST WORK REQUEST whenever you're ready to try again.",
  });
}

async function getWhatsAppNumber(userId: string) {
  const db = getDb();
  const { whatsappContacts } = await import("../../db/schema.js");
  const contact = await db.query.whatsappContacts.findFirst({
    where: eq(whatsappContacts.userId, userId),
  });
  return contact?.phoneNumber ?? "";
}

function getPromptForStep(step: WorkRequestStep) {
  const prompts: Record<WorkRequestStep, string> = {
    service_type:
      "What service or skill do you need?\n\nExample: plumber, tailor, electrician, cleaner, delivery rider.",
    location:
      "Where is the job located?\n\nSend city and state. Example: Ikeja, Lagos.",
    budget:
      "What is your budget for this job?\n\nExample: ₦5,000, ₦10,000–₦20,000, negotiable.",
    preferred_date:
      "When do you need this done?\n\nExample: today, tomorrow, this weekend, or a specific date.",
    description:
      "Describe the work briefly. What exactly needs to be done?",
    confirm:
      "Reply YES to post this request, or NO to start over.",
  };

  return prompts[step];
}

function validateStepAnswer(params: { step: WorkRequestStep; answer: string }) {
  const answer = params.answer.trim();

  if (params.step === "confirm") {
    const normalized = answer.toLowerCase();
    if (!["yes", "y", "confirm", "post", "publish", "no", "n"].includes(normalized)) {
      return "Reply YES to post, or NO to start over.";
    }
    return null;
  }

  if (!answer) {
    return "Please enter a response.";
  }

  return null;
}

function recordStepAnswer(params: {
  data: WorkRequestFlowData;
  step: WorkRequestStep;
  answer: string;
}) {
  const answer = params.answer.trim();
  const data = { ...params.data };

  if (params.step === "service_type") data.serviceType = answer;
  if (params.step === "location") data.location = answer;
  if (params.step === "budget") data.budget = answer;
  if (params.step === "preferred_date") data.preferredDate = answer;
  if (params.step === "description") data.description = answer;

  return data;
}

function getNextStep(step: WorkRequestStep) {
  const currentIndex = workRequestSteps.indexOf(step);
  return workRequestSteps[currentIndex + 1];
}

function getRequestSummary(data: WorkRequestFlowData) {
  return [
    "Here is your work request:",
    "",
    `Service: ${data.serviceType ?? "Not set"}`,
    `Location: ${data.location ?? "Not set"}`,
    `Budget: ${data.budget ?? "Not set"}`,
    `Date: ${data.preferredDate ?? "Not set"}`,
    `Description: ${data.description ?? "Not set"}`,
    "",
    getPromptForStep("confirm"),
  ].join("\n");
}

function normalizeFlowData(
  value: Record<string, unknown> | WorkRequestFlowData | null,
): WorkRequestFlowData {
  return (value ?? {}) as WorkRequestFlowData;
}

async function notifyWorkersInBackground(params: {
  workRequest: typeof workRequests.$inferSelect;
}) {
  console.log("Worker notification: starting background job", {
    workRequestId: params.workRequest.id,
    serviceType: params.workRequest.serviceType,
    location: params.workRequest.location,
  });

  const jobCardImageUrl = await generateAndUploadJobCard({
    serviceType: params.workRequest.serviceType ?? "Job",
    location: params.workRequest.location ?? "Nigeria",
    budget: params.workRequest.budget ?? "Negotiable",
    preferredDate: params.workRequest.preferredDate ?? "Flexible",
  });

  console.log("Worker notification: job card uploaded", { jobCardImageUrl });

  await notifyMatchedWorkers({
    workRequest: params.workRequest,
    jobCardImageUrl,
  });
}
