export type ConversationalOnboardingStep =
  | "first_name"
  | "last_name"
  | "middle_name"
  | "dob"
  | "gender"
  | "email"
  | "bvn"
  | "street"
  | "city"
  | "state"
  | "pin"
  | "confirm_pin";

export type ConversationalOnboardingData = {
  currentStep?: ConversationalOnboardingStep;
  profile?: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dob?: string;
    gender?: string;
    email?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
  };
  security?: {
    pin?: string;
  };
  transient?: {
    bvn?: string;
  };
};

const steps: ConversationalOnboardingStep[] = [
  "first_name",
  "last_name",
  "middle_name",
  "dob",
  "gender",
  "email",
  "bvn",
  "street",
  "city",
  "state",
  "pin",
  "confirm_pin",
];

export function getInitialOnboardingData(): ConversationalOnboardingData {
  return {
    currentStep: "first_name",
    profile: {},
    address: {},
    security: {},
    transient: {},
  };
}

export function getPromptForStep(step: ConversationalOnboardingStep) {
  const prompts: Record<ConversationalOnboardingStep, string> = {
    first_name: "Let's finish your Zaa onboarding.\n\nWhat is your first name?",
    last_name: "What is your last name?",
    middle_name: "What is your middle name?\n\nReply NONE if you don't have one.",
    dob: "What is your date of birth?\n\nUse DD-MM-YYYY.",
    gender: "What is your gender?\n\nReply Male or Female.",
    email: "What is your email address?\n\nReply SKIP if you don't want to add one.",
    bvn: "Enter your BVN.\n\nWe only use this to request your virtual account. We do not store your BVN.",
    street: "What is your street address?",
    city: "What city are you in?",
    state: "What state are you in?",
    pin: "Create a 4-digit transaction PIN.",
    confirm_pin: "Confirm your 4-digit transaction PIN.",
  };

  return prompts[step];
}

export function recordStepAnswer(params: {
  data: ConversationalOnboardingData;
  step: ConversationalOnboardingStep;
  answer: string;
}) {
  const answer = params.answer.trim();
  const data = normalizeData(params.data);

  if (params.step === "first_name") {
    data.profile.firstName = answer;
  }

  if (params.step === "last_name") {
    data.profile.lastName = answer;
  }

  if (params.step === "middle_name") {
    data.profile.middleName = answer.toLowerCase() === "none" ? undefined : answer;
  }

  if (params.step === "dob") {
    data.profile.dob = answer;
  }

  if (params.step === "gender") {
    data.profile.gender = answer.toLowerCase();
  }

  if (params.step === "email") {
    data.profile.email = answer.toLowerCase() === "skip" ? undefined : answer;
  }

  if (params.step === "bvn") {
    data.transient.bvn = answer;
  }

  if (params.step === "street") {
    data.address.street = answer;
  }

  if (params.step === "city") {
    data.address.city = answer;
  }

  if (params.step === "state") {
    data.address.state = answer;
  }

  if (params.step === "pin") {
    data.security.pin = answer;
  }

  return data;
}

export function getNextStep(step: ConversationalOnboardingStep) {
  const currentIndex = steps.indexOf(step);

  return steps[currentIndex + 1];
}

export function isValidStepAnswer(params: {
  data: ConversationalOnboardingData;
  step: ConversationalOnboardingStep;
  answer: string;
}) {
  const answer = params.answer.trim();

  if (!answer) {
    return "Please enter a response.";
  }

  if (params.step === "bvn" && !/^\d{11}$/.test(answer)) {
    return "BVN should be 11 digits. Please enter your 11-digit BVN.";
  }

  if ((params.step === "pin" || params.step === "confirm_pin") && !/^\d{4}$/.test(answer)) {
    return "Your transaction PIN should be exactly 4 digits.";
  }

  if (params.step === "confirm_pin" && normalizeData(params.data).security.pin !== answer) {
    return "PINs do not match. Please enter the same 4-digit PIN again.";
  }

  return null;
}

export function normalizeData(
  value: Record<string, unknown> | ConversationalOnboardingData | null,
): Required<ConversationalOnboardingData> {
  const data = (value ?? {}) as ConversationalOnboardingData;

  return {
    currentStep: data.currentStep ?? "first_name",
    profile: data.profile ?? {},
    address: data.address ?? {},
    security: data.security ?? {},
    transient: data.transient ?? {},
  };
}

