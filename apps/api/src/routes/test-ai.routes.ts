import { Router } from "express";

import { env } from "../config/env.js";
import { generateWorkerAssessment } from "../services/worker-profile/worker-assessment.service.js";

export const testAiRouter = Router();

// POST /test/ai/assessment
// Body: { serviceTitle, skills, experienceLevel, location }
testAiRouter.post("/assessment", async (req, res) => {
  const { serviceTitle, skills, experienceLevel, location } = req.body;

  const questions = await generateWorkerAssessment({
    serviceTitle: serviceTitle ?? "plumbing",
    skills: Array.isArray(skills) ? skills : ["pipe fitting", "leak repair"],
    experienceLevel: experienceLevel ?? "intermediate",
    location: location ?? "Lagos",
  });

  res.json({ source: env.ai.claudeApiKey ? "claude" : "fallback", questions });
});

// POST /test/ai/trust
// Body: { signals } — raw trust signals object
testAiRouter.post("/trust", async (req, res) => {
  if (!env.ai.claudeApiKey) {
    res.status(503).json({ error: "CLAUDE_API_KEY not set" });
    return;
  }

  const signals = req.body.signals ?? {
    profile: {
      serviceTitle: "plumbing",
      skills: ["pipe fitting", "leak repair"],
      experienceLevel: "intermediate",
      location: "Lagos",
      availability: "full-time",
      expectedPayRange: "daily jobs above 5k",
      proofType: "certificate",
      profileStrengthScore: 70,
    },
    assessment: { score: 80, questionsAnswered: 5 },
    platformWork: {
      completedJobs: 0,
      cancelledJobs: 0,
      lateDeliveries: 0,
      unresolvedDisputes: 0,
      repeatCustomers: 0,
    },
    clientReviews: { averageRating: null, reviewCount: 0 },
    reliability: { responseScore: 50, completionScore: 50 },
  };

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
            '{"trustScore":0,"skillScore":0,"reliabilityScore":0,"riskLevel":"low|medium|high","reasons":["..."],"improvementTips":["..."]}\n\n' +
            JSON.stringify(signals),
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    res.status(502).json({ error: `Claude returned ${response.status}`, detail: text });
    return;
  }

  const payload = (await response.json()) as {
    content?: { type: string; text: string }[];
  };
  const content = payload.content?.[0]?.text;

  const stripped = content?.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim() ?? "{}";

  res.json({ source: "claude", result: JSON.parse(stripped) });
});
