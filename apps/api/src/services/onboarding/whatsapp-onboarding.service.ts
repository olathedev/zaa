import { eq, or } from "drizzle-orm";

import { getDb } from "../../db/client.js";
import { messages, users, whatsappContacts } from "../../db/schema.js";
import type { NormalizedWhatsAppMessage } from "../whatsapp/twilio-whatsapp.types.js";
import {
  sendOnboardingAccountTypePrompt,
  sendWhatsAppMessage,
} from "../whatsapp/twilio-whatsapp.service.js";
import { parseAccountType } from "./account-type.js";

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
      metadata: params.message.raw,
    })
    .onConflictDoNothing();
}

async function handleAccountTypeStep(
  userWithContact: UserWithContact,
  message: NormalizedWhatsAppMessage,
) {
  const db = getDb();
  const accountType = parseAccountType(message.buttonPayload ?? message.buttonText ?? message.body);

  if (!accountType) {
    await sendOnboardingAccountTypePrompt(message.from);
    return;
  }

  await db
    .update(users)
    .set({
      accountType,
      onboardingStage: "profile_pending",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userWithContact.user.id));

  await sendWhatsAppMessage({
    to: message.from,
    body: getAccountTypeConfirmation(accountType),
  });
}

function getAccountTypeConfirmation(accountType: "worker" | "employer") {
  if (accountType === "worker") {
    return "Great. I will help you build your work profile and find income opportunities. What work do you currently do, or what work are you looking for?";
  }

  return "Great. I will help you find capable hands. What service or role do you need help with?";
}

function stripWhatsAppPrefix(value: string) {
  return value.replace("whatsapp:", "");
}
