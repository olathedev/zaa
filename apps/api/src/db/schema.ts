import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const messageDirection = pgEnum("message_direction", [
  "inbound",
  "outbound",
]);

export const opportunityType = pgEnum("opportunity_type", [
  "job",
  "training",
  "grant",
  "loan",
  "savings",
]);

export const accountType = pgEnum("account_type", [
  "worker",
  "employer",
  "partner",
]);

export const onboardingStage = pgEnum("onboarding_stage", [
  "account_type_pending",
  "profile_pending",
  "completed",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name"),
  accountType: accountType("account_type"),
  onboardingStage: onboardingStage("onboarding_stage")
    .default("account_type_pending")
    .notNull(),
  onboardingData: jsonb("onboarding_data").$type<Record<string, unknown>>().default({}).notNull(),
  preferredLanguage: text("preferred_language").default("en").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSecurity = pgTable("user_security", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  transactionPinHash: text("transaction_pin_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const whatsappContacts = pgTable(
  "whatsapp_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull().unique(),
    whatsappId: text("whatsapp_id").notNull().unique(),
    isVerified: boolean("is_verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("whatsapp_contacts_user_id_idx").on(table.userId)],
);

export const virtualAccounts = pgTable(
  "virtual_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").default("squad").notNull(),
    customerIdentifier: text("customer_identifier").notNull().unique(),
    virtualAccountNumber: text("virtual_account_number").notNull().unique(),
    bankCode: text("bank_code"),
    beneficiaryAccount: text("beneficiary_account"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("virtual_accounts_user_id_idx").on(table.userId)],
);

export const workerProfiles = pgTable("worker_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  occupation: text("occupation"),
  location: text("location"),
  incomeRange: text("income_range"),
  skills: text("skills").array().default([]).notNull(),
  trustScore: integer("trust_score").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    whatsappMessageId: text("whatsapp_message_id").unique(),
    direction: messageDirection("direction").notNull(),
    body: text("body").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_user_id_idx").on(table.userId),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);

export const opportunities = pgTable("opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  provider: text("provider").notNull(),
  type: opportunityType("type").notNull(),
  location: text("location"),
  eligibility: text("eligibility"),
  applicationUrl: text("application_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
