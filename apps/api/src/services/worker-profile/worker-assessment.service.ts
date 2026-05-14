import { env } from "../../config/env.js";

export type AssessmentOptionKey = "A" | "B" | "C";

export type WorkerAssessmentQuestion = {
  id: string;
  prompt: string;
  options: {
    key: AssessmentOptionKey;
    text: string;
  }[];
  correctOption: AssessmentOptionKey;
  explanation: string;
};

export type WorkerAssessmentAnswer = {
  questionId: string;
  selectedOption: AssessmentOptionKey;
  isCorrect: boolean;
};

type GenerateWorkerAssessmentParams = {
  serviceTitle: string;
  skills: string[];
  experienceLevel: string;
  location: string;
};

export async function generateWorkerAssessment(
  params: GenerateWorkerAssessmentParams,
): Promise<WorkerAssessmentQuestion[]> {
  if (!env.ai.claudeApiKey) {
    return buildFallbackAssessment(params);
  }

  try {
    const generatedQuestions = await generateWithClaude(params);

    if (generatedQuestions.length === 5) {
      return generatedQuestions;
    }
  } catch (error) {
    console.error("Worker assessment AI generation failed", {
      serviceTitle: params.serviceTitle,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return buildFallbackAssessment(params);
}

export function scoreWorkerAssessment(params: {
  questions: WorkerAssessmentQuestion[];
  answers: WorkerAssessmentAnswer[];
}) {
  if (params.questions.length === 0) {
    return 0;
  }

  const correctAnswers = params.answers.filter((answer) => answer.isCorrect).length;

  return Math.round((correctAnswers / params.questions.length) * 100);
}

export function toAssessmentOption(value: string): AssessmentOptionKey | null {
  const normalized = value.trim().toUpperCase();

  if (normalized.startsWith("A") || normalized === "1") {
    return "A";
  }

  if (normalized.startsWith("B") || normalized === "2") {
    return "B";
  }

  if (normalized.startsWith("C") || normalized === "3") {
    return "C";
  }

  return null;
}

export function formatAssessmentQuestion(params: {
  question: WorkerAssessmentQuestion;
  questionNumber: number;
  totalQuestions: number;
}) {
  return [
    `Question ${params.questionNumber}/${params.totalQuestions}`,
    params.question.prompt,
    "",
    ...params.question.options.map((option) => `${option.key}. ${option.text}`),
    "",
    "Reply A, B, or C.",
  ].join("\n");
}

async function generateWithClaude(
  params: GenerateWorkerAssessmentParams,
): Promise<WorkerAssessmentQuestion[]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ai.claudeApiKey!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.ai.claudeModel,
      max_tokens: 2048,
      temperature: 0.4,
      system:
        "You create short WhatsApp competence tests for Nigerian workers. " +
        "Return only valid JSON with no markdown or extra text. Questions must test the worker's actual stated service and skills, not generic workplace behavior. " +
        "Use practical real-life Nigerian scenarios a customer or employer would care about. " +
        "Keep each question short enough for WhatsApp and easy to answer with A, B, or C.",
      messages: [
        {
          role: "user",
          content:
            "Create exactly 5 multiple-choice questions for this worker profile.\n" +
            `Service: ${params.serviceTitle}\n` +
            `Skills: ${params.skills.join(", ")}\n` +
            `Experience: ${params.experienceLevel}\n` +
            `Location: ${params.location}\n\n` +
            "Rules:\n" +
            "- Each question must be specific to the service and skills above.\n" +
            "- Use practical scenarios from real jobs, customer requests, tools, materials, pricing, safety, quality checks, or common mistakes.\n" +
            "- Avoid generic questions like communication, punctuality, or customer service unless they are tied to the actual work.\n" +
            "- Make the correct answer show real competence in the stated service.\n" +
            "- Keep options realistic; wrong answers should be plausible but clearly weaker.\n\n" +
            "JSON shape: {\"questions\":[{\"id\":\"q1\",\"prompt\":\"...\",\"options\":[{\"key\":\"A\",\"text\":\"...\"},{\"key\":\"B\",\"text\":\"...\"},{\"key\":\"C\",\"text\":\"...\"}],\"correctOption\":\"A\",\"explanation\":\"...\"}]}",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude assessment request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    content?: { type: string; text: string }[];
  };
  const content = payload.content?.[0]?.text;

  if (!content) {
    throw new Error("Claude assessment response was empty");
  }

  const parsed = JSON.parse(stripMarkdownJson(content)) as { questions?: WorkerAssessmentQuestion[] };

  return normalizeQuestions(parsed.questions ?? []);
}

function stripMarkdownJson(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function normalizeQuestions(questions: WorkerAssessmentQuestion[]) {
  return questions
    .filter((question) => {
      const optionKeys = new Set(question.options?.map((option) => option.key));

      return (
        question.prompt &&
        question.options?.length === 3 &&
        optionKeys.has("A") &&
        optionKeys.has("B") &&
        optionKeys.has("C") &&
        ["A", "B", "C"].includes(question.correctOption)
      );
    })
    .slice(0, 5)
    .map((question, index) => ({
      ...question,
      id: question.id || `q${index + 1}`,
    }));
}

function buildFallbackAssessment(
  params: GenerateWorkerAssessmentParams,
): WorkerAssessmentQuestion[] {
  const service = params.serviceTitle || "your service";

  return [
    {
      id: "q1",
      prompt: `A customer says your price for ${service} is too high. What should you do first?`,
      options: [
        { key: "A", text: "Insult the customer and end the chat" },
        { key: "B", text: "Explain the work clearly and agree on scope before starting" },
        { key: "C", text: "Start the work without agreeing on price" },
      ],
      correctOption: "B",
      explanation: "Good workers agree scope and price before starting.",
    },
    {
      id: "q2",
      prompt: "You notice a safety risk before starting a job. What is the best action?",
      options: [
        { key: "A", text: "Ignore it so you can finish quickly" },
        { key: "B", text: "Tell the customer and fix or avoid the risk first" },
        { key: "C", text: "Ask for full payment and leave" },
      ],
      correctOption: "B",
      explanation: "Safety and honesty build trust.",
    },
    {
      id: "q3",
      prompt: "You will arrive late because of traffic. What should you do?",
      options: [
        { key: "A", text: "Keep quiet until the customer calls" },
        { key: "B", text: "Send an update early with your new arrival time" },
        { key: "C", text: "Cancel without explaining" },
      ],
      correctOption: "B",
      explanation: "Clear communication improves reliability.",
    },
    {
      id: "q4",
      prompt: `Before accepting a ${service} request, what detail matters most?`,
      options: [
        { key: "A", text: "The customer's full job requirement and location" },
        { key: "B", text: "The customer's phone wallpaper" },
        { key: "C", text: "How many groups the customer belongs to" },
      ],
      correctOption: "A",
      explanation: "You need scope and location to price and plan well.",
    },
    {
      id: "q5",
      prompt: "After finishing a job, the customer complains about one small issue. What should you do?",
      options: [
        { key: "A", text: "Listen, inspect the issue, and resolve it if it is part of the job" },
        { key: "B", text: "Block the customer immediately" },
        { key: "C", text: "Demand extra payment before listening" },
      ],
      correctOption: "A",
      explanation: "Responsible follow-up helps you get repeat work.",
    },
  ];
}
