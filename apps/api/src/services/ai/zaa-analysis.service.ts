import Anthropic from "@anthropic-ai/sdk";

import { env } from "../../config/env.js";

type WorkerAnalysisParams = {
  workerName: string;
  serviceTitle: string;
  skills: string[];
  experienceLevel: string;
  location: string;
  trustScore: number;
  assessmentScore: number;
};

export async function generateWorkerAnalysis(
  params: WorkerAnalysisParams,
): Promise<string> {
  if (!env.ai.claudeApiKey) {
    return buildFallbackAnalysis(params);
  }

  try {
    const client = new Anthropic({ apiKey: env.ai.claudeApiKey });

    const response = await client.messages.create({
      model: env.ai.claudeModel,
      max_tokens: 120,
      messages: [
        {
          role: "user",
          content:
            "You are Zaa AI. Write exactly 1-2 sentences assessing this worker for an employer. Be direct and honest. No greetings, no labels — just the assessment.\n\n" +
            `Name: ${params.workerName}\n` +
            `Service: ${params.serviceTitle}\n` +
            `Skills: ${params.skills.join(", ")}\n` +
            `Experience: ${params.experienceLevel}\n` +
            `Location: ${params.location}\n` +
            `Trust Score: ${params.trustScore}/100\n` +
            `Skill Assessment: ${params.assessmentScore}%`,
        },
      ],
    });

    const content = response.content[0];
    return content.type === "text" ? content.text.trim() : buildFallbackAnalysis(params);
  } catch (error) {
    console.error("Zaa analysis generation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return buildFallbackAnalysis(params);
  }
}

function buildFallbackAnalysis(params: WorkerAnalysisParams): string {
  if (params.trustScore >= 75 && params.assessmentScore >= 70) {
    return `Strong ${params.experienceLevel} candidate with high trust and skill scores — looks reliable.`;
  }

  if (params.trustScore >= 60) {
    return `${params.experienceLevel.charAt(0).toUpperCase() + params.experienceLevel.slice(1)} worker with decent trust score. Worth considering.`;
  }

  return `${params.experienceLevel.charAt(0).toUpperCase() + params.experienceLevel.slice(1)} level worker. Review profile carefully before accepting.`;
}
