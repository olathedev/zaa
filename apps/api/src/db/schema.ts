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

export const workerProfileStatus = pgEnum("worker_profile_status", [
  "not_started",
  "in_progress",
  "assessment_pending",
  "assessment_in_progress",
  "completed",
]);

export const workerAssessmentStatus = pgEnum("worker_assessment_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
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

export const walletBalances = pgTable(
  "wallet_balances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    availableBalance: integer("available_balance").default(0).notNull(),
    ledgerBalance: integer("ledger_balance").default(0).notNull(),
    currency: text("currency").default("NGN").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("wallet_balances_user_id_idx").on(table.userId)],
);

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    virtualAccountId: uuid("virtual_account_id")
      .notNull()
      .references(() => virtualAccounts.id, { onDelete: "cascade" }),
    provider: text("provider").default("squad").notNull(),
    transactionReference: text("transaction_reference").notNull().unique(),
    gatewayReference: text("gateway_reference"),
    amount: integer("amount").notNull(),
    settledAmount: integer("settled_amount").notNull(),
    fee: integer("fee").default(0).notNull(),
    currency: text("currency").default("NGN").notNull(),
    status: text("status").notNull(),
    channel: text("channel"),
    customerIdentifier: text("customer_identifier").notNull(),
    virtualAccountNumber: text("virtual_account_number").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payment_transactions_user_id_idx").on(table.userId),
    index("payment_transactions_virtual_account_id_idx").on(table.virtualAccountId),
  ],
);

export const workerProfiles = pgTable("worker_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  occupation: text("occupation"),
  serviceTitle: text("service_title"),
  location: text("location"),
  incomeRange: text("income_range"),
  skills: text("skills").array().default([]).notNull(),
  experienceLevel: text("experience_level"),
  availability: text("availability"),
  expectedPayRange: text("expected_pay_range"),
  proofType: text("proof_type"),
  profileStatus: workerProfileStatus("profile_status")
    .default("not_started")
    .notNull(),
  assessmentStatus: workerAssessmentStatus("assessment_status")
    .default("pending")
    .notNull(),
  assessmentScore: integer("assessment_score"),
  trustScore: integer("trust_score").default(0).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workerProfileAssessments = pgTable(
  "worker_profile_assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workerProfileId: uuid("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    serviceTitle: text("service_title").notNull(),
    questions: jsonb("questions").$type<Record<string, unknown>[]>().default([]).notNull(),
    answers: jsonb("answers").$type<Record<string, unknown>[]>().default([]).notNull(),
    score: integer("score"),
    status: workerAssessmentStatus("status").default("pending").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("worker_profile_assessments_user_id_idx").on(table.userId),
    index("worker_profile_assessments_worker_profile_id_idx").on(table.workerProfileId),
  ],
);

export const workerTrustEvaluations = pgTable(
  "worker_trust_evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workerProfileId: uuid("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    assessmentId: uuid("assessment_id").references(() => workerProfileAssessments.id, {
      onDelete: "set null",
    }),
    trustScore: integer("trust_score").notNull(),
    skillScore: integer("skill_score").notNull(),
    reliabilityScore: integer("reliability_score").notNull(),
    profileStrengthScore: integer("profile_strength_score").notNull(),
    riskLevel: text("risk_level").notNull(),
    reasons: jsonb("reasons").$type<string[]>().default([]).notNull(),
    improvementTips: jsonb("improvement_tips").$type<string[]>().default([]).notNull(),
    inputSignals: jsonb("input_signals").$type<Record<string, unknown>>().default({}).notNull(),
    aiOutput: jsonb("ai_output").$type<Record<string, unknown>>().default({}).notNull(),
    evaluator: text("evaluator").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("worker_trust_evaluations_user_id_idx").on(table.userId),
    index("worker_trust_evaluations_worker_profile_id_idx").on(table.workerProfileId),
  ],
);

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
