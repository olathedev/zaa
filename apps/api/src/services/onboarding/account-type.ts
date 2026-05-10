export type AccountType = "worker" | "employer";

const accountTypeByPayload: Record<string, AccountType> = {
  worker: "worker",
  trader: "worker",
  job_seeker: "worker",
  career_seeker: "worker",
  employer: "employer",
  customer: "employer",
};

export function parseAccountType(input: string | undefined): AccountType | null {
  if (!input) {
    return null;
  }

  const normalized = input.trim().toLowerCase();

  if (accountTypeByPayload[normalized]) {
    return accountTypeByPayload[normalized];
  }

  if (
    normalized === "1" ||
    normalized.includes("worker") ||
    normalized.includes("trader") ||
    normalized.includes("career")
  ) {
    return "worker";
  }

  if (normalized === "2" || normalized.includes("employer") || normalized.includes("customer")) {
    return "employer";
  }

  return null;
}
