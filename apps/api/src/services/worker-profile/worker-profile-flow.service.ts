import { eq } from "drizzle-orm";

import { env } from "../../config/env.js";
import { getDb } from "../../db/client.js";
import {
  workerProfileAssessments,
  workerProfiles,
  type users,
} from "../../db/schema.js";
import type { NormalizedWhatsAppMessage } from "../whatsapp/twilio-whatsapp.types.js";
import { sendWhatsAppMessage } from "../whatsapp/twilio-whatsapp.service.js";
import {
  formatAssessmentQuestion,
  generateWorkerAssessment,
  scoreWorkerAssessment,
  toAssessmentOption,
  type WorkerAssessmentAnswer,
  type WorkerAssessmentQuestion,
} from "./worker-assessment.service.js";

type WorkerProfileStep =
  | "service_title"
  | "skills"
  | "experience_level"
  | "location"
  | "availability"
  | "expected_pay_range"
  | "proof_type"
  | "confirm_profile";

type WorkerProfileFlowData = {
  currentStep?: WorkerProfileStep;
  serviceTitle?: string;
  skills?: string[];
  experienceLevel?: string;
  location?: string;
  availability?: string;
  expectedPayRange?: string;
  proofType?: string;
  proofMedia?: {
    mediaCount: number;
    mediaUrls: string[];
  };
  assessmentId?: string;
  currentQuestionIndex?: number;
};

type HandleWorkerProfileMessageParams = {
  user: typeof users.$inferSelect;
  message: NormalizedWhatsAppMessage;
};

const profileSteps: WorkerProfileStep[] = [
  "service_title",
  "skills",
  "experience_level",
  "location",
  "availability",
  "expected_pay_range",
  "proof_type",
];

const startCommands = new Set(["profile", "start profile", "work profile", "start"]);
const restartCommands = new Set(["restart profile", "reset profile"]);

export async function handleWorkerProfileMessage(
  params: HandleWorkerProfileMessageParams,
) {
  const profile = await ensureWorkerProfile(params.user.id);
  const command = params.message.body.trim().toLowerCase();

  if (restartCommands.has(command)) {
    await startWorkerProfileFlow({
      userId: params.user.id,
      to: params.message.from,
      reset: true,
    });
    return;
  }

  if (command === "help") {
    await sendWhatsAppMessage({
      to: params.message.from,
      body: getHelpMessage(profile.profileStatus, normalizeProfileFlowData(profile.metadata)),
    });
    return;
  }

  if (
    profile.profileStatus === "not_started" ||
    (profile.profileStatus === "completed" && startCommands.has(command))
  ) {
    await startWorkerProfileFlow({
      userId: params.user.id,
      to: params.message.from,
      reset: profile.profileStatus === "completed",
    });
    return;
  }

  if (profile.profileStatus === "completed") {
    await sendCompletedProfileMessage({
      to: params.message.from,
      profile,
    });
    return;
  }

  if (profile.profileStatus === "assessment_in_progress") {
    await handleAssessmentAnswer({
      profile,
      message: params.message,
    });
    return;
  }

  if (profile.profileStatus === "assessment_pending") {
    await handleAssessmentStart({
      profile,
      message: params.message,
    });
    return;
  }

  await handleProfileStep({
    profile,
    message: params.message,
  });
}

export async function sendWorkerProfileStartInvite(params: {
  to: string;
}) {
  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Next, let's build your work profile so I can match you with jobs, customers, and income opportunities.\n\n" +
      "Reply START PROFILE when you're ready.",
  });
}

async function ensureWorkerProfile(userId: string) {
  const db = getDb();
  const existingProfile = await db.query.workerProfiles.findFirst({
    where: eq(workerProfiles.userId, userId),
  });

  if (existingProfile) {
    return existingProfile;
  }

  const [profile] = await db
    .insert(workerProfiles)
    .values({
      userId,
    })
    .returning();

  return profile;
}

async function startWorkerProfileFlow(params: {
  userId: string;
  to: string;
  reset: boolean;
}) {
  const db = getDb();
  const metadata: WorkerProfileFlowData = {
    currentStep: "service_title",
  };

  await db
    .update(workerProfiles)
    .set({
      serviceTitle: params.reset ? null : undefined,
      occupation: params.reset ? null : undefined,
      location: params.reset ? null : undefined,
      incomeRange: params.reset ? null : undefined,
      skills: params.reset ? [] : undefined,
      experienceLevel: params.reset ? null : undefined,
      availability: params.reset ? null : undefined,
      expectedPayRange: params.reset ? null : undefined,
      proofType: params.reset ? null : undefined,
      profileStatus: "in_progress",
      assessmentStatus: "pending",
      assessmentScore: params.reset ? null : undefined,
      metadata,
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.userId, params.userId));

  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Let's set up your work profile. This helps Zaa match you with jobs and customers.\n\n" +
      getPromptForStep("service_title"),
  });
}

async function handleProfileStep(params: {
  profile: typeof workerProfiles.$inferSelect;
  message: NormalizedWhatsAppMessage;
}) {
  const db = getDb();
  const data = normalizeProfileFlowData(params.profile.metadata);
  const currentStep = data.currentStep ?? "service_title";
  const validationError = validateStepAnswer({
    step: currentStep,
    message: params.message,
  });

  if (validationError) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body: validationError,
    });
    return;
  }

  if (currentStep === "confirm_profile") {
    await handleProfileConfirmation({
      profile: params.profile,
      data,
      message: params.message,
    });
    return;
  }

  const updatedData = recordProfileAnswer({
    data,
    step: currentStep,
    message: params.message,
  });
  const nextStep = getNextStep(currentStep);

  updatedData.currentStep = nextStep ?? "confirm_profile";

  await db
    .update(workerProfiles)
    .set({
      serviceTitle: updatedData.serviceTitle,
      occupation: updatedData.serviceTitle,
      location: updatedData.location,
      incomeRange: updatedData.expectedPayRange,
      skills: updatedData.skills ?? [],
      experienceLevel: updatedData.experienceLevel,
      availability: updatedData.availability,
      expectedPayRange: updatedData.expectedPayRange,
      proofType: updatedData.proofType,
      metadata: updatedData,
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.id, params.profile.id));

  if (!nextStep) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body: getProfileSummary(updatedData),
    });
    return;
  }

  await sendWhatsAppMessage({
    to: params.message.from,
    body:
      `Nice. ${getProgressNumber(nextStep) - 1} of ${profileSteps.length} done.\n\n` +
      getPromptForStep(nextStep),
  });
}

async function handleProfileConfirmation(params: {
  profile: typeof workerProfiles.$inferSelect;
  data: WorkerProfileFlowData;
  message: NormalizedWhatsAppMessage;
}) {
  const db = getDb();
  const answer = params.message.body.trim().toLowerCase();

  if (!["yes", "y", "confirm", "correct"].includes(answer)) {
    await db
      .update(workerProfiles)
      .set({
        profileStatus: "in_progress",
        metadata: { currentStep: "service_title" },
        updatedAt: new Date(),
      })
      .where(eq(workerProfiles.id, params.profile.id));

    await sendWhatsAppMessage({
      to: params.message.from,
      body:
        "No problem. Let's update it from the top.\n\n" +
        getPromptForStep("service_title"),
    });
    return;
  }

  await db
    .update(workerProfiles)
    .set({
      profileStatus: "assessment_pending",
      assessmentStatus: "pending",
      serviceTitle: params.data.serviceTitle,
      occupation: params.data.serviceTitle,
      location: params.data.location,
      incomeRange: params.data.expectedPayRange,
      skills: params.data.skills ?? [],
      experienceLevel: params.data.experienceLevel,
      availability: params.data.availability,
      expectedPayRange: params.data.expectedPayRange,
      proofType: params.data.proofType,
      metadata: {
        ...params.data,
        currentStep: undefined,
      },
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.id, params.profile.id));

  await sendWhatsAppMessage({
    to: params.message.from,
    body:
      "Good. Your work profile is saved.\n\n" +
      "Next is a short 5-question skill check. Reply START TEST when you're ready.",
  });
}

async function handleAssessmentStart(params: {
  profile: typeof workerProfiles.$inferSelect;
  message: NormalizedWhatsAppMessage;
}) {
  const command = params.message.body.trim().toLowerCase();

  if (!["start test", "start", "test", "yes", "y"].includes(command)) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body:
        "Your work profile is saved. Reply START TEST when you're ready for the short skill check.",
    });
    return;
  }

  const db = getDb();
  const data = normalizeProfileFlowData(params.profile.metadata);
  const questions = await generateWorkerAssessment({
    serviceTitle: requireProfileValue(data.serviceTitle, "service"),
    skills: data.skills ?? [],
    experienceLevel: requireProfileValue(data.experienceLevel, "experience level"),
    location: requireProfileValue(data.location, "location"),
  });
  const [assessment] = await db
    .insert(workerProfileAssessments)
    .values({
      userId: params.profile.userId,
      workerProfileId: params.profile.id,
      serviceTitle: requireProfileValue(data.serviceTitle, "service"),
      questions,
      answers: [],
      status: "in_progress",
      metadata: {
        generatedBy: envLabel(),
      },
    })
    .returning();

  await db
    .update(workerProfiles)
    .set({
      profileStatus: "assessment_in_progress",
      assessmentStatus: "in_progress",
      metadata: {
        ...data,
        assessmentId: assessment.id,
        currentQuestionIndex: 0,
      },
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.id, params.profile.id));

  await sendWhatsAppMessage({
    to: params.message.from,
    body:
      "Let's do it. Answer with A, B, or C.\n\n" +
      formatAssessmentQuestion({
        question: questions[0],
        questionNumber: 1,
        totalQuestions: questions.length,
      }),
  });
}

async function handleAssessmentAnswer(params: {
  profile: typeof workerProfiles.$inferSelect;
  message: NormalizedWhatsAppMessage;
}) {
  const db = getDb();
  const option = toAssessmentOption(params.message.body);

  if (!option) {
    await sendWhatsAppMessage({
      to: params.message.from,
      body: "Please reply with A, B, or C.",
    });
    return;
  }

  const data = normalizeProfileFlowData(params.profile.metadata);

  if (!data.assessmentId) {
    await db
      .update(workerProfiles)
      .set({
        profileStatus: "assessment_pending",
        assessmentStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(workerProfiles.id, params.profile.id));

    await sendWhatsAppMessage({
      to: params.message.from,
      body: "I need to restart your skill check. Reply START TEST when you're ready.",
    });
    return;
  }

  const assessment = await db.query.workerProfileAssessments.findFirst({
    where: eq(workerProfileAssessments.id, data.assessmentId),
  });

  if (!assessment) {
    throw new Error(`Missing worker assessment ${data.assessmentId}`);
  }

  const questions = assessment.questions as WorkerAssessmentQuestion[];
  const currentQuestionIndex = data.currentQuestionIndex ?? 0;
  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    await completeAssessment({
      profile: params.profile,
      assessment,
      to: params.message.from,
    });
    return;
  }

  const answer: WorkerAssessmentAnswer = {
    questionId: currentQuestion.id,
    selectedOption: option,
    isCorrect: option === currentQuestion.correctOption,
  };
  const answers = [...(assessment.answers as WorkerAssessmentAnswer[]), answer];
  const nextQuestionIndex = currentQuestionIndex + 1;
  const nextQuestion = questions[nextQuestionIndex];

  await db
    .update(workerProfileAssessments)
    .set({
      answers,
      updatedAt: new Date(),
    })
    .where(eq(workerProfileAssessments.id, assessment.id));

  if (nextQuestion) {
    await db
      .update(workerProfiles)
      .set({
        metadata: {
          ...data,
          currentQuestionIndex: nextQuestionIndex,
        },
        updatedAt: new Date(),
      })
      .where(eq(workerProfiles.id, params.profile.id));

    await sendWhatsAppMessage({
      to: params.message.from,
      body: formatAssessmentQuestion({
        question: nextQuestion,
        questionNumber: nextQuestionIndex + 1,
        totalQuestions: questions.length,
      }),
    });
    return;
  }

  await completeAssessment({
    profile: params.profile,
    assessment: {
      ...assessment,
      answers,
    },
    to: params.message.from,
  });
}

async function completeAssessment(params: {
  profile: typeof workerProfiles.$inferSelect;
  assessment: typeof workerProfileAssessments.$inferSelect;
  to: string;
}) {
  const db = getDb();
  const questions = params.assessment.questions as WorkerAssessmentQuestion[];
  const answers = params.assessment.answers as WorkerAssessmentAnswer[];
  const score = scoreWorkerAssessment({
    questions,
    answers,
  });
  const trustScore = Math.min(100, Math.max(params.profile.trustScore, 40 + Math.round(score * 0.6)));
  const data = normalizeProfileFlowData(params.profile.metadata);

  await db
    .update(workerProfileAssessments)
    .set({
      score,
      status: "completed",
      updatedAt: new Date(),
    })
    .where(eq(workerProfileAssessments.id, params.assessment.id));

  await db
    .update(workerProfiles)
    .set({
      profileStatus: "completed",
      assessmentStatus: "completed",
      assessmentScore: score,
      trustScore,
      metadata: {
        ...data,
        currentQuestionIndex: undefined,
        lastAssessmentId: params.assessment.id,
      },
      updatedAt: new Date(),
    })
    .where(eq(workerProfiles.id, params.profile.id));

  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Your profile is ready. I'll start matching you with suitable opportunities.\n\n" +
      `Skill check score: ${score}%\n` +
      `Zaa trust score: ${trustScore}/100\n\n` +
      "You can now receive job matches and customer requests here.",
  });
}

function normalizeProfileFlowData(
  value: Record<string, unknown> | WorkerProfileFlowData | null,
): WorkerProfileFlowData {
  return (value ?? {}) as WorkerProfileFlowData;
}

function getPromptForStep(step: WorkerProfileStep) {
  const prompts: Record<WorkerProfileStep, string> = {
    service_title: "What work or service do you offer?\n\nExample: tailoring, makeup, plumbing, delivery, POS agent.",
    skills: "List 2-5 things you can do well.\n\nSeparate them with commas.",
    experience_level:
      "What is your experience level?\n\n1. Beginner\n2. Intermediate\n3. Experienced",
    location: "Where do you work from?\n\nSend your city and state. Example: Yaba, Lagos.",
    availability:
      "When are you available?\n\nReply full-time, part-time, weekends, or on-demand.",
    expected_pay_range:
      "What pay range or job type do you prefer?\n\nExample: daily jobs above 5k, monthly role, contract work.",
    proof_type:
      "What proof can help customers trust your work?\n\nReply certificate, past work, customer reference, send a photo, or skip.",
    confirm_profile: "Reply YES to confirm, or NO to restart.",
  };

  return prompts[step];
}

function validateStepAnswer(params: {
  step: WorkerProfileStep;
  message: NormalizedWhatsAppMessage;
}) {
  const answer = params.message.body.trim();

  if (params.step === "proof_type" && params.message.mediaCount > 0) {
    return null;
  }

  if (!answer) {
    return "Please enter a response.";
  }

  if (params.step === "skills" && parseSkills(answer).length < 2) {
    return "Please list at least 2 skills, separated with commas.";
  }

  if (params.step === "experience_level" && !normalizeExperienceLevel(answer)) {
    return "Please reply beginner, intermediate, experienced, or choose 1, 2, or 3.";
  }

  if (params.step === "availability" && !normalizeAvailability(answer)) {
    return "Please reply full-time, part-time, weekends, or on-demand.";
  }

  if (params.step === "confirm_profile") {
    const normalized = answer.toLowerCase();

    if (!["yes", "y", "confirm", "correct", "no", "n"].includes(normalized)) {
      return "Reply YES to confirm, or NO to restart.";
    }
  }

  return null;
}

function recordProfileAnswer(params: {
  data: WorkerProfileFlowData;
  step: WorkerProfileStep;
  message: NormalizedWhatsAppMessage;
}) {
  const answer = params.message.body.trim();
  const data = { ...params.data };

  if (params.step === "service_title") {
    data.serviceTitle = answer;
  }

  if (params.step === "skills") {
    data.skills = parseSkills(answer);
  }

  if (params.step === "experience_level") {
    data.experienceLevel = normalizeExperienceLevel(answer) ?? answer;
  }

  if (params.step === "location") {
    data.location = answer;
  }

  if (params.step === "availability") {
    data.availability = normalizeAvailability(answer) ?? answer;
  }

  if (params.step === "expected_pay_range") {
    data.expectedPayRange = answer;
  }

  if (params.step === "proof_type") {
    if (params.message.mediaCount > 0) {
      data.proofType = "work_photo";
      data.proofMedia = {
        mediaCount: params.message.mediaCount,
        mediaUrls: getInboundMediaUrls(params.message.raw),
      };
    } else {
      data.proofType = answer.toLowerCase() === "skip" ? "skipped" : answer;
    }
  }

  return data;
}

function getNextStep(step: WorkerProfileStep) {
  const currentIndex = profileSteps.indexOf(step);

  return profileSteps[currentIndex + 1];
}

function getProgressNumber(step: WorkerProfileStep) {
  return profileSteps.indexOf(step) + 1;
}

function getProfileSummary(data: WorkerProfileFlowData) {
  return [
    "Here is your work profile:",
    "",
    `Service: ${data.serviceTitle ?? "Not set"}`,
    `Skills: ${(data.skills ?? []).join(", ") || "Not set"}`,
    `Experience: ${data.experienceLevel ?? "Not set"}`,
    `Location: ${data.location ?? "Not set"}`,
    `Availability: ${data.availability ?? "Not set"}`,
    `Pay preference: ${data.expectedPayRange ?? "Not set"}`,
    `Proof: ${data.proofType ?? "Not set"}`,
    "",
    getPromptForStep("confirm_profile"),
  ].join("\n");
}

function parseSkills(value: string) {
  return value
    .split(/[,\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeExperienceLevel(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "1" || normalized.startsWith("begin")) {
    return "beginner";
  }

  if (normalized === "2" || normalized.startsWith("inter")) {
    return "intermediate";
  }

  if (normalized === "3" || normalized.startsWith("exper")) {
    return "experienced";
  }

  return null;
}

function normalizeAvailability(value: string) {
  const normalized = value.trim().toLowerCase();

  if (["full-time", "full time", "fulltime"].includes(normalized)) {
    return "full-time";
  }

  if (["part-time", "part time", "parttime"].includes(normalized)) {
    return "part-time";
  }

  if (normalized === "weekends" || normalized === "weekend") {
    return "weekends";
  }

  if (["on-demand", "on demand", "ondemand"].includes(normalized)) {
    return "on-demand";
  }

  return null;
}

function getInboundMediaUrls(raw: Record<string, string | undefined>) {
  return Object.entries(raw)
    .filter(([key, value]) => key.startsWith("MediaUrl") && Boolean(value))
    .map(([, value]) => value as string);
}

function requireProfileValue(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`Missing worker profile ${label}`);
  }

  return value;
}

function getHelpMessage(
  profileStatus: string,
  data: WorkerProfileFlowData,
) {
  if (profileStatus === "in_progress") {
    return `${getPromptForStep(data.currentStep ?? "service_title")}\n\nYou can reply RESTART PROFILE to start again.`;
  }

  if (profileStatus === "assessment_pending") {
    return "Reply START TEST to begin your 5-question skill check.";
  }

  if (profileStatus === "assessment_in_progress") {
    return "Answer the current question with A, B, or C.";
  }

  return "Reply PROFILE to view or restart your work profile.";
}

async function sendCompletedProfileMessage(params: {
  to: string;
  profile: typeof workerProfiles.$inferSelect;
}) {
  await sendWhatsAppMessage({
    to: params.to,
    body:
      "Your work profile is ready.\n\n" +
      `Service: ${params.profile.serviceTitle ?? params.profile.occupation ?? "Not set"}\n` +
      `Location: ${params.profile.location ?? "Not set"}\n` +
      `Trust score: ${params.profile.trustScore}/100\n\n` +
      "I'll use this to match you with suitable jobs and customer requests.",
  });
}

function envLabel() {
  return env.ai.openaiApiKey ? "openai" : "fallback";
}
