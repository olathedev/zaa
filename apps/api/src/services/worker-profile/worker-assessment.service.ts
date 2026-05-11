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
  if (!env.ai.openaiApiKey) {
    return buildFallbackAssessment(params);
  }

  try {
    const generatedQuestions = await generateWithOpenAi(params);

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

async function generateWithOpenAi(
  params: GenerateWorkerAssessmentParams,
): Promise<WorkerAssessmentQuestion[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.ai.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.ai.openaiModel,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You create short WhatsApp competence tests for Nigerian workers. " +
            "Return only valid JSON. Keep questions practical, local, and easy to answer.",
        },
        {
          role: "user",
          content:
            "Create exactly 5 multiple-choice questions for this worker profile.\n" +
            `Service: ${params.serviceTitle}\n` +
            `Skills: ${params.skills.join(", ")}\n` +
            `Experience: ${params.experienceLevel}\n` +
            `Location: ${params.location}\n\n` +
            "JSON shape: {\"questions\":[{\"id\":\"q1\",\"prompt\":\"...\",\"options\":[{\"key\":\"A\",\"text\":\"...\"},{\"key\":\"B\",\"text\":\"...\"},{\"key\":\"C\",\"text\":\"...\"}],\"correctOption\":\"A\",\"explanation\":\"...\"}]}",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI assessment request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI assessment response was empty");
  }

  const parsed = JSON.parse(content) as { questions?: WorkerAssessmentQuestion[] };

  return normalizeQuestions(parsed.questions ?? []);
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
