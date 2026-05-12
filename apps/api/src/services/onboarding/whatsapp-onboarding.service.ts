import { eq, or } from "drizzle-orm";

import { env } from "../../config/env.js";
import { getDb } from "../../db/client.js";
import {
  messages,
  userSecurity,
  users,
  virtualAccounts,
  whatsappContacts,
} from "../../db/schema.js";
import {
  handleEmployerMenuMessage,
  sendEmployerHomeMenu,
} from "../employer/employer-menu.service.js";
import { hashTransactionPin } from "../security/pin.service.js";
import {
  createSquadVirtualAccount,
  SquadVirtualAccountError,
} from "../squad/squad-virtual-account.service.js";
import type { NormalizedWhatsAppMessage } from "../whatsapp/twilio-whatsapp.types.js";
import {
  sendOnboardingAccountTypePrompt,
  sendOnboardingStartPrompt,
  sendWhatsAppMediaMessage,
  sendWhatsAppMessage,
} from "../whatsapp/twilio-whatsapp.service.js";
import {
  handleWorkerProfileMessage,
  sendWorkerProfileStartInvite,
} from "../worker-profile/worker-profile-flow.service.js";
import { parseAccountType } from "./account-type.js";
import {
  getInitialOnboardingData,
  getNextStep,
  getPromptForStep,
  isValidStepAnswer,
  normalizeData,
  recordStepAnswer,
  type ConversationalOnboardingStep,
} from "./conversational-onboarding.js";

type UserWithContact = {
  user: typeof users.$inferSelect;
  contact: typeof whatsappContacts.$inferSelect;
  isNewUser: boolean;
};

export async function handleIncomingWhatsAppMessage(
  message: NormalizedWhatsAppMessage,
) {
  const userWithContact = await findOrCreateUserFromWhatsApp(message);

  await saveInboundMessage({
    userId: userWithContact.user.id,
    message,
  });

  if (
    userWithContact.isNewUser ||
    userWithContact.user.onboardingStage === "account_type_pending"
  ) {
    await handleAccountTypeStep(userWithContact, message);
    return;
  }

  if (userWithContact.user.onboardingStage === "profile_pending") {
    await handleProfilePendingStep(userWithContact, message);
    return;
  }

  if (
    userWithContact.user.onboardingStage === "completed" &&
    userWithContact.user.accountType === "worker"
  ) {
    await handleWorkerProfileMessage({
      user: userWithContact.user,
      message,
    });
    return;
  }

  if (
    userWithContact.user.onboardingStage === "completed" &&
    userWithContact.user.accountType === "employer"
  ) {
    await handleEmployerMenuMessage({
      user: userWithContact.user,
      message,
    });
    return;
  }

  console.log("Existing onboarded WhatsApp user", {
    userId: userWithContact.user.id,
    from: message.from,
    body: message.body,
  });
}

async function findOrCreateUserFromWhatsApp(
  message: NormalizedWhatsAppMessage,
): Promise<UserWithContact> {
  const db = getDb();
  const whatsappId = message.whatsappId ?? stripWhatsAppPrefix(message.from);

  const existingContact = await db.query.whatsappContacts.findFirst({
    where: or(
      eq(whatsappContacts.whatsappId, whatsappId),
      eq(whatsappContacts.phoneNumber, message.from),
    ),
  });

  if (existingContact) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, existingContact.userId),
    });

    if (!existingUser) {
      throw new Error(`Missing user for WhatsApp contact ${existingContact.id}`);
    }

    return {
      user: existingUser,
      contact: existingContact,
      isNewUser: false,
    };
  }

  const [user] = await db
    .insert(users)
    .values({
      displayName: message.profileName,
    })
    .returning();

  const [contact] = await db
    .insert(whatsappContacts)
    .values({
      userId: user.id,
      phoneNumber: message.from,
      whatsappId,
      isVerified: true,
    })
    .returning();

  return {
    user,
    contact,
    isNewUser: true,
  };
}

async function saveInboundMessage(params: {
  userId: string;
  message: NormalizedWhatsAppMessage;
}) {
  const db = getDb();

  await db
    .insert(messages)
    .values({
      userId: params.userId,
      whatsappMessageId: params.message.messageId,
      direction: "inbound",
      body: params.message.body,
      metadata: removeSensitiveWebhookFields(params.message.raw),
    })
    .onConflictDoNothing();
}

async function sendWorkerWelcomeImage(params: { to: string }) {
  if (!env.twilio.workerWelcomeImageUrl) {
    return;
  }

  try {
    await sendWhatsAppMediaMessage({
      to: params.to,
      mediaUrl: env.twilio.workerWelcomeImageUrl,
    });
  } catch (error) {
    console.error("Failed to send worker welcome image", {
      to: params.to,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function sendEmployerWelcomeImage(params: { to: string }) {
  if (!env.twilio.employerWelcomeImageUrl) {
    return;
  }

  try {
    await sendWhatsAppMediaMessage({
      to: params.to,
      mediaUrl: env.twilio.employerWelcomeImageUrl,
    });
  } catch (error) {
    console.error("Failed to send employer welcome image", {
      to: params.to,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleAccountTypeStep(
  userWithContact: UserWithContact,
  message: NormalizedWhatsAppMessage,
) {
  const db = getDb();
  const accountType = parseAccountType(
    message.listId ??
      message.listTitle ??
      message.buttonPayload ??
      message.buttonText ??
      message.body,
  );

  if (!accountType) {
    await sendOnboardingAccountTypePrompt(message.from);
    return;
  }

  await db
    .update(users)
    .set({
      accountType,
      onboardingStage: "profile_pending",
      onboardingData: getInitialOnboardingData(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userWithContact.user.id));

  await sendOnboardingStartPrompt(message.from);
  await sendWhatsAppMessage({
    to: message.from,
    body: getPromptForStep("first_name"),
  });
}

async function handleProfilePendingStep(
  userWithContact: UserWithContact,
  message: NormalizedWhatsAppMessage,
) {
  console.log("Received profile-pending WhatsApp message", {
    from: message.from,
    hasFlowData: Boolean(message.flowData ?? message.interactiveData),
  });

  if (!message.flowData && !message.interactiveData) {
    await handleConversationalOnboardingStep(userWithContact, message);
  }
}

async function handleConversationalOnboardingStep(
  userWithContact: UserWithContact,
  message: NormalizedWhatsAppMessage,
) {
  const db = getDb();
  const onboardingData = normalizeData(userWithContact.user.onboardingData);
  const currentStep = onboardingData.currentStep as ConversationalOnboardingStep;
  const validationError = isValidStepAnswer({
    data: onboardingData,
    step: currentStep,
    answer: message.body,
  });

  if (validationError) {
    await sendWhatsAppMessage({
      to: message.from,
      body: validationError,
    });
    return;
  }

  const updatedData = recordStepAnswer({
    data: onboardingData,
    step: currentStep,
    answer: message.body,
  });
  const nextStep = getNextStep(currentStep);

  if (!nextStep) {
    const completionResult = await completeOnboarding({
      userWithContact,
      onboardingData: updatedData,
      from: message.from,
    });

    await db
      .update(users)
      .set({
        onboardingStage: completionResult.completed ? "completed" : "profile_pending",
        onboardingData: completionResult.completed
          ? stripTransientOnboardingData(updatedData)
          : {
              ...updatedData,
              currentStep: completionResult.retryStep,
            },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userWithContact.user.id));

    await sendWhatsAppMessage({
      to: message.from,
      body: completionResult.message,
    });

    if (
      completionResult.completed &&
      userWithContact.user.accountType === "worker"
    ) {
      await sendWorkerWelcomeImage({
        to: message.from,
      });
      await sendWorkerProfileStartInvite({
        to: message.from,
      });
    }

    if (
      completionResult.completed &&
      userWithContact.user.accountType === "employer"
    ) {
      await sendEmployerWelcomeImage({
        to: message.from,
      });
      await sendEmployerHomeMenu({
        to: message.from,
      });
    }

    return;
  }

  updatedData.currentStep = nextStep;

  await db
    .update(users)
    .set({
      onboardingData: updatedData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userWithContact.user.id));

  await sendWhatsAppMessage({
    to: message.from,
    body: getPromptForStep(nextStep),
  });
}

function stripWhatsAppPrefix(value: string) {
  return value.replace("whatsapp:", "");
}

function removeSensitiveWebhookFields(raw: Record<string, unknown>) {
  const { FlowData: _flowData, InteractiveData: _interactiveData, ...safeRaw } = raw;

  return safeRaw;
}

async function completeOnboarding(params: {
  userWithContact: UserWithContact;
  onboardingData: ReturnType<typeof normalizeData>;
  from: string;
}) {
  const db = getDb();
  const profile = params.onboardingData.profile;
  const address = params.onboardingData.address;
  const security = params.onboardingData.security;
  const transient = params.onboardingData.transient;
  const validationError = getCompletionValidationError(params.onboardingData);

  if (validationError) {
    return {
      completed: false,
      message: validationError,
    };
  }

  const firstName = requireValue(profile.firstName, "first name");
  const lastName = requireValue(profile.lastName, "last name");
  const dob = requireValue(profile.dob, "date of birth");
  const gender = requireValue(profile.gender, "gender");
  const bvn = requireValue(transient.bvn, "BVN");
  const street = requireValue(address.street, "street");
  const city = requireValue(address.city, "city");
  const state = requireValue(address.state, "state");
  const pin = requireValue(security.pin, "transaction PIN");
  const pinHash = await hashTransactionPin(pin);
  let squadAccount: Awaited<ReturnType<typeof createSquadVirtualAccount>>;

  try {
    squadAccount = await createSquadVirtualAccount({
      customerIdentifier: createCustomerIdentifier(params.userWithContact.user.id),
      firstName,
      lastName,
      middleName: profile.middleName ?? "N/A",
      mobileNumber: toLocalNigerianMobileNumber(params.from),
      dob: toSquadDateOfBirth(dob),
      email: profile.email ?? createFallbackEmail(params.userWithContact.user.id),
      bvn,
      gender: toSquadGender(gender),
      address: [street, city, state].join(", "),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const retryStep = getRetryStepForSquadError(message);
    const failureReason = getSquadFailureReason(error);

    logSquadVirtualAccountError({
      error,
      userId: params.userWithContact.user.id,
      accountType: params.userWithContact.user.accountType,
      retryStep,
    });

    return {
      completed: false,
      retryStep,
      message:
        "I couldn't finish creating your virtual account yet.\n\n" +
        getRetryMessageForStep({
          step: retryStep,
          failureReason,
        }),
    };
  }
  const customerIdentifier = requireValue(
    squadAccount.customer_identifier,
    "Squad customer identifier",
  );
  const virtualAccountNumber = requireValue(
    squadAccount.virtual_account_number,
    "Squad virtual account number",
  );

  await db
    .insert(userSecurity)
    .values({
      userId: params.userWithContact.user.id,
      transactionPinHash: pinHash,
    })
    .onConflictDoUpdate({
      target: userSecurity.userId,
      set: {
        transactionPinHash: pinHash,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(virtualAccounts)
    .values({
      userId: params.userWithContact.user.id,
      provider: "squad",
      customerIdentifier,
      virtualAccountNumber,
      bankCode: squadAccount.bank_code,
      beneficiaryAccount: squadAccount.beneficiary_account ?? undefined,
      metadata: {
        firstName: squadAccount.first_name,
        lastName: squadAccount.last_name,
        createdAt: squadAccount.created_at,
        updatedAt: squadAccount.updated_at,
      },
    })
    .onConflictDoUpdate({
      target: virtualAccounts.customerIdentifier,
      set: {
        virtualAccountNumber,
        bankCode: squadAccount.bank_code,
        beneficiaryAccount: squadAccount.beneficiary_account ?? undefined,
        metadata: {
          firstName: squadAccount.first_name,
          lastName: squadAccount.last_name,
          createdAt: squadAccount.created_at,
          updatedAt: squadAccount.updated_at,
        },
        updatedAt: new Date(),
      },
    });

  return {
    completed: true,
    retryStep: undefined,
    message: getOnboardingCompletionMessage({
      accountType: params.userWithContact.user.accountType,
      virtualAccountNumber,
      bankCode: squadAccount.bank_code,
    }),
  };
}

function getOnboardingCompletionMessage(params: {
  accountType: string | null;
  virtualAccountNumber: string;
  bankCode?: string | null;
}) {
  const baseMessage =
    "Your Zaa account is ready.\n\n" +
    `Virtual account: ${params.virtualAccountNumber}\n` +
    `Bank code: ${params.bankCode ?? "pending"}\n\n`;

  if (params.accountType === "employer") {
    return baseMessage + "You can now post work requests and manage wallet payments.";
  }

  return baseMessage + "You can now receive payments and build your work profile for opportunities.";
}

function stripTransientOnboardingData(
  data: ReturnType<typeof normalizeData>,
): Record<string, unknown> {
  const { transient: _transient, security: _security, ...safeData } = data;

  return safeData;
}

function getCompletionValidationError(data: ReturnType<typeof normalizeData>) {
  const requiredFields = [
    data.profile.firstName,
    data.profile.lastName,
    data.profile.dob,
    data.profile.gender,
    data.transient.bvn,
    data.address.street,
    data.address.city,
    data.address.state,
    data.security.pin,
  ];

  if (requiredFields.some((value) => !value)) {
    return "Some onboarding details are missing. Please reply START to restart onboarding.";
  }

  return null;
}

function requireValue(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`Missing ${label}`);
  }

  return value;
}

function createCustomerIdentifier(userId: string) {
  return `ZAA${userId.replaceAll("-", "").slice(0, 24)}`;
}

function toLocalNigerianMobileNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("234")) {
    return `0${digits.slice(3)}`;
  }

  return digits;
}

function toSquadDateOfBirth(value: string) {
  const [day, month, year] = value.split("-");

  if (!day || !month || !year) {
    return value;
  }

  return `${month}/${day}/${year}`;
}

function toSquadGender(value: string) {
  return value.trim().toLowerCase().startsWith("f") ? "2" : "1";
}

function createFallbackEmail(userId: string) {
  return env.onboarding.defaultEmail ?? `user-${userId.replaceAll("-", "")}@example.com`;
}

type SquadFailureReason = "bvn_already_registered" | "email" | "bvn" | "unknown";

function getSquadFailureReason(error: unknown): SquadFailureReason {
  const normalized = getSquadErrorText(error);

  if (
    normalized.includes("already") ||
    normalized.includes("exist") ||
    normalized.includes("duplicate") ||
    normalized.includes("registered")
  ) {
    if (normalized.includes("bvn") || normalized.includes("customer")) {
      return "bvn_already_registered";
    }
  }

  if (normalized.includes("email")) {
    return "email";
  }

  if (normalized.includes("bvn")) {
    return "bvn";
  }

  return "unknown";
}

function getRetryStepForSquadError(message: string): ConversationalOnboardingStep {
  const normalized = message.toLowerCase();

  if (normalized.includes("email")) {
    return "email";
  }

  if (normalized.includes("bvn")) {
    return "bvn";
  }

  return "bvn";
}

function getRetryMessageForStep(params: {
  step: ConversationalOnboardingStep;
  failureReason: SquadFailureReason;
}) {
  if (params.failureReason === "bvn_already_registered") {
    return (
      "This BVN already appears to be linked to a virtual account.\n\n" +
      "Please use a BVN that has not been used on Zaa before, or contact support if this BVN belongs to you."
    );
  }

  if (params.step === "email") {
    return "Please reply with a valid email address so I can try again.";
  }

  return "Please check your BVN and reply with the correct 11-digit BVN so I can try again.";
}

function logSquadVirtualAccountError(params: {
  error: unknown;
  userId: string;
  accountType: string | null;
  retryStep: ConversationalOnboardingStep;
}) {
  if (params.error instanceof SquadVirtualAccountError) {
    console.error("Squad virtual account creation failed", {
      userId: params.userId,
      accountType: params.accountType,
      retryStep: params.retryStep,
      status: params.error.status,
      responseBody: redactSensitiveSquadFields(params.error.responseBody),
    });
    return;
  }

  console.error("Squad virtual account creation failed", {
    userId: params.userId,
    accountType: params.accountType,
    retryStep: params.retryStep,
    error: params.error instanceof Error ? params.error.message : String(params.error),
  });
}

function getSquadErrorText(error: unknown) {
  if (error instanceof SquadVirtualAccountError) {
    return JSON.stringify(error.responseBody).toLowerCase();
  }

  return error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
}

function redactSensitiveSquadFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveSquadFields(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      if (["bvn", "pin", "password", "secret", "token"].includes(key.toLowerCase())) {
        return [key, "[redacted]"];
      }

      return [key, redactSensitiveSquadFields(nestedValue)];
    }),
  );
}
