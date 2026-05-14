import { env } from "../../config/env.js";
import { getDb } from "../../db/client.js";
import {
  workerProfileAssessments,
  workerProfiles,
  workerTrustEvaluations,
} from "../../db/schema.js";

type RiskLevel = "low" | "medium" | "high";

type WorkerTrustSignals = {
  profile: {
    serviceTitle?: string | null;
    skills: string[];
    experienceLevel?: string | null;
    location?: string | null;
    availability?: string | null;
    expectedPayRange?: string | null;
    proofType?: string | null;
    profileStrengthScore: number;
  };
  assessment: {
    score: number;
    questionsAnswered: number;
  };
  platformWork: {
    completedJobs: number;
    cancelledJobs: number;
    lateDeliveries: number;
    unresolvedDisputes: number;
    repeatCustomers: number;
  };
  clientReviews: {
    averageRating: number | null;
    reviewCount: number;
  };
  reliability: {
    responseScore: number;
    completionScore: number;
  };
};

type AiTrustEvaluation = {
  trustScore: number;
  skillScore: number;
  reliabilityScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
  improvementTips: string[];
};

type EvaluateWorkerTrustParams = {
  profile: typeof workerProfiles.$inferSelect;
  assessment: typeof workerProfileAssessments.$inferSelect;
  assessmentScore: number;
};

export async function evaluateWorkerTrust(
  params: EvaluateWorkerTrustParams,
) {
  const db = getDb();
  const signals = buildWorkerTrustSignals(params);
  const aiEvaluation = await getAiTrustEvaluation(signals);
  const guardedEvaluation = applyTrustGuardrails({
    aiEvaluation,
    signals,
  });
  const [evaluation] = await db
    .insert(workerTrustEvaluations)
    .values({
      userId: params.profile.userId,
      workerProfileId: params.profile.id,
      assessmentId: params.assessment.id,
      trustScore: guardedEvaluation.trustScore,
      skillScore: guardedEvaluation.skillScore,
      reliabilityScore: guardedEvaluation.reliabilityScore,
      profileStrengthScore: signals.profile.profileStrengthScore,
      riskLevel: guardedEvaluation.riskLevel,
      reasons: guardedEvaluation.reasons,
      improvementTips: guardedEvaluation.improvementTips,
      inputSignals: signals,
      aiOutput: aiEvaluation,
      evaluator: env.ai.claudeApiKey ? "claude_with_guardrails" : "fallback_with_guardrails",
    })
    .returning();

  return evaluation;
}

function buildWorkerTrustSignals(params: EvaluateWorkerTrustParams): WorkerTrustSignals {
  const profileStrengthScore = calculateProfileStrength(params.profile);

  return {
    profile: {
      serviceTitle: params.profile.serviceTitle ?? params.profile.occupation,
      skills: params.profile.skills,
      experienceLevel: params.profile.experienceLevel,
      location: params.profile.location,
      availability: params.profile.availability,
      expectedPayRange: params.profile.expectedPayRange ?? params.profile.incomeRange,
      proofType: params.profile.proofType,
      profileStrengthScore,
    },
    assessment: {
      score: params.assessmentScore,
      questionsAnswered: Array.isArray(params.assessment.answers)
        ? params.assessment.answers.length
        : 0,
    },
    platformWork: {
      completedJobs: 0,
      cancelledJobs: 0,
      lateDeliveries: 0,
      unresolvedDisputes: 0,
      repeatCustomers: 0,
    },
    clientReviews: {
      averageRating: null,
      reviewCount: 0,
    },
    reliability: {
      responseScore: 50,
      completionScore: 50,
    },
  };
}

function calculateProfileStrength(profile: typeof workerProfiles.$inferSelect) {
  const checks = [
    Boolean(profile.serviceTitle ?? profile.occupation),
    profile.skills.length >= 2,
    Boolean(profile.experienceLevel),
    Boolean(profile.location),
    Boolean(profile.availability),
    Boolean(profile.expectedPayRange ?? profile.incomeRange),
    Boolean(profile.proofType && profile.proofType !== "skipped"),
  ];
  const completedChecks = checks.filter(Boolean).length;

  return Math.round((completedChecks / checks.length) * 100);
}

async function getAiTrustEvaluation(
  signals: WorkerTrustSignals,
): Promise<AiTrustEvaluation> {
  if (!env.ai.claudeApiKey) {
    return getFallbackTrustEvaluation(signals);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ai.claudeApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.ai.claudeModel,
        max_tokens: 512,
        temperature: 0.2,
        system:
          "You are Zaa's worker trust analyst for Nigerian informal workers. " +
          "Judge only from the provided signals. Return valid JSON only with no markdown or extra text. " +
          "Be fair to new users with little history, but do not over-score them.",
        messages: [
          {
            role: "user",
            content:
              "Evaluate this worker and return JSON with this shape: " +
              "{\"trustScore\":0,\"skillScore\":0,\"reliabilityScore\":0,\"riskLevel\":\"low|medium|high\",\"reasons\":[\"...\"],\"improvementTips\":[\"...\"]}\n\n" +
              JSON.stringify(signals),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude trust request failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      content?: { type: string; text: string }[];
    };
    const content = payload.content?.[0]?.text;

    if (!content) {
      throw new Error("Claude trust response was empty");
    }

    return normalizeAiTrustEvaluation(JSON.parse(stripMarkdownJson(content)));
  } catch (error) {
    console.error("AI trust evaluation failed", {
      serviceTitle: signals.profile.serviceTitle,
      message: error instanceof Error ? error.message : String(error),
    });

    return getFallbackTrustEvaluation(signals);
  }
}

function normalizeAiTrustEvaluation(value: unknown): AiTrustEvaluation {
  const data = value as Partial<AiTrustEvaluation>;

  return {
    trustScore: clampScore(data.trustScore),
    skillScore: clampScore(data.skillScore),
    reliabilityScore: clampScore(data.reliabilityScore),
    riskLevel: normalizeRiskLevel(data.riskLevel),
    reasons: normalizeStringList(data.reasons, [
      "Profile and assessment data were reviewed.",
    ]),
    improvementTips: normalizeStringList(data.improvementTips, [
      "Complete jobs successfully on Zaa to improve your trust score.",
    ]),
  };
}

function getFallbackTrustEvaluation(signals: WorkerTrustSignals): AiTrustEvaluation {
  const skillScore = signals.assessment.score;
  const reliabilityScore = Math.round(
    (signals.reliability.responseScore + signals.reliability.completionScore) / 2,
  );
  const trustScore = Math.round(
    signals.profile.profileStrengthScore * 0.25 +
      skillScore * 0.45 +
      reliabilityScore * 0.3,
  );

  return {
    trustScore,
    skillScore,
    reliabilityScore,
    riskLevel: "medium",
    reasons: [
      "Work profile has been reviewed.",
      `Skill check score is ${signals.assessment.score}%.`,
      "No completed Zaa jobs have been recorded yet.",
    ],
    improvementTips: [
      "Complete your first matched job successfully to grow your trust score.",
      "Upload proof of past work if available.",
    ],
  };
}

function applyTrustGuardrails(params: {
  aiEvaluation: AiTrustEvaluation;
  signals: WorkerTrustSignals;
}): AiTrustEvaluation {
  const reasons = [...params.aiEvaluation.reasons];
  const improvementTips = [...params.aiEvaluation.improvementTips];
  let trustScore = clampScore(params.aiEvaluation.trustScore);

  if (params.signals.platformWork.completedJobs === 0 && trustScore > 60) {
    trustScore = 60;
    reasons.push("Score is capped until the worker completes real jobs on Zaa.");
  }

  if (params.signals.platformWork.unresolvedDisputes > 0 && trustScore > 70) {
    trustScore = 70;
    reasons.push("Unresolved disputes limit the maximum trust score.");
  }

  if (
    params.signals.platformWork.completedJobs >= 10 &&
    (params.signals.clientReviews.averageRating ?? 0) >= 4.7 &&
    params.signals.platformWork.unresolvedDisputes === 0 &&
    trustScore < 75
  ) {
    trustScore = 75;
    reasons.push("Strong completed-job history prevents an unfairly low score.");
  }

  if (params.signals.profile.profileStrengthScore < 60) {
    improvementTips.push("Complete more profile details to strengthen your Zaa profile.");
  }

  if (params.signals.platformWork.completedJobs === 0) {
    improvementTips.push("Your score can grow after you complete jobs on Zaa.");
  }

  return {
    trustScore,
    skillScore: clampScore(params.aiEvaluation.skillScore),
    reliabilityScore: clampScore(params.aiEvaluation.reliabilityScore),
    riskLevel: normalizeRiskLevel(params.aiEvaluation.riskLevel),
    reasons: dedupeList(reasons).slice(0, 5),
    improvementTips: dedupeList(improvementTips).slice(0, 5),
  };
}

function clampScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeRiskLevel(value: unknown): RiskLevel {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "medium";
}

function normalizeStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => String(item).trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
}

function stripMarkdownJson(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function dedupeList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
