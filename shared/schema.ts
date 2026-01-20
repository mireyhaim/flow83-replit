import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  website: varchar("website"),
  specialty: varchar("specialty"),
  methodology: text("methodology"), // Names of the mentor's methods/approaches (e.g., "שיטת הנשימה המודעת, CBT, NLP")
  uniqueApproach: text("unique_approach"), // Description of what makes the mentor's approach unique
  role: varchar("role").default("user"), // 'user' | 'super_admin'
  // Mentor personality fields (from onboarding questionnaire)
  toneOfVoice: text("tone_of_voice"), // e.g., "warm and supportive", "direct and practical"
  methodDescription: text("method_description"), // summary of mentor's approach
  behavioralRules: text("behavioral_rules"), // do's and don'ts for the AI
  // Stripe Connect for receiving payments from participants
  stripeAccountId: varchar("stripe_account_id"),
  stripeAccountStatus: varchar("stripe_account_status"), // 'pending' | 'active' | 'restricted'
  // Platform subscription fields (LemonSqueezy / Grow)
  lemonSqueezyCustomerId: varchar("lemonsqueezy_customer_id"),
  growCustomerId: varchar("grow_customer_id"), // Grow (Israeli payment provider) customer ID
  stripeCustomerId: varchar("stripe_customer_id"), // Legacy - kept for backwards compatibility
  subscriptionId: varchar("subscription_id"),
  subscriptionPlan: varchar("subscription_plan"), // 'starter' | 'pro' | 'business'
  subscriptionStatus: varchar("subscription_status"), // 'on_trial' | 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused' | 'trial_expired'
  subscriptionProvider: varchar("subscription_provider"), // 'lemonsqueezy' | 'grow' - which payment provider user is using
  trialStartedAt: timestamp("trial_started_at"), // When internal 21-day trial started
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  paymentFailedAt: timestamp("payment_failed_at"), // When payment failed - used for 5-day grace period
  lastParticipantThresholdNotified: integer("last_participant_threshold_notified"), // 15, 18, or 20 - last threshold we notified about
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const journeys = pgTable("journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goal: text("goal"),
  audience: text("audience"),
  duration: integer("duration").default(7),
  status: text("status").default("draft"),
  coverImage: text("cover_image"),
  description: text("description"),
  price: integer("price").default(0),
  currency: text("currency").default("USD"),
  mentorMessage: text("mentor_message"),
  shortCode: varchar("short_code").unique(),
  landingPageContent: jsonb("landing_page_content"),
  // External payment settings (mentor's own payment link)
  externalPaymentUrl: text("external_payment_url"), // PayPal/Stripe Payment Link
  paymentProvider: text("payment_provider"), // 'grow' | 'paypal' | 'stripe' | 'other' - for future integrations
  // Language preference for the journey (he = Hebrew, en = English)
  language: text("language").default("en"),
  // Flow building questions - mentor's input about their process
  clientChallenges: text("client_challenges"), // What challenges do the clients face?
  profession: text("profession"), // therapist, coach, healer, mentor, counselor, other
  tone: text("tone"), // warm, professional, direct, gentle, motivating, spiritual
  mentorStyle: text("mentor_style"), // practical, emotional, spiritual, structured, custom
  // Soft delete / archive functionality
  archivedAt: timestamp("archived_at"), // When the journey was archived (null = not archived)
  archivedBy: varchar("archived_by").references(() => users.id), // Who archived it
});

export const insertJourneySchema = createInsertSchema(journeys).omit({
  id: true,
});

export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Journey = typeof journeys.$inferSelect;

export const journeySteps = pgTable("journey_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "cascade" }).notNull(),
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  goal: text("goal"),
  explanation: text("explanation"),
  task: text("task"),
  closingMessage: text("closing_message"),
  // Structured day plan for ProcessFacilitator bot
  dayPlan: jsonb("day_plan"),
});

export const insertJourneyStepSchema = createInsertSchema(journeySteps).omit({
  id: true,
});

export type InsertJourneyStep = z.infer<typeof insertJourneyStepSchema>;
export type JourneyStep = typeof journeySteps.$inferSelect;

export const journeyBlocks = pgTable("journey_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stepId: varchar("step_id").references(() => journeySteps.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  content: jsonb("content").notNull(),
  orderIndex: integer("order_index").default(0),
});

export const insertJourneyBlockSchema = createInsertSchema(journeyBlocks).omit({
  id: true,
});

export type InsertJourneyBlock = z.infer<typeof insertJourneyBlockSchema>;
export type JourneyBlock = typeof journeyBlocks.$inferSelect;

export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "cascade" }).notNull(),
  accessToken: varchar("access_token").unique().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  name: varchar("name"),
  idNumber: varchar("id_number"),
  stripeSessionId: varchar("stripe_session_id"),
  currentDay: integer("current_day").default(1),
  currentPhase: text("current_phase").default("intro"), // intro | reflection | task | integration
  messageCountInPhase: integer("message_count_in_phase").default(0), // Director state tracking
  questionsAskedInPhase: integer("questions_asked_in_phase").default(0), // Director state tracking
  completedBlocks: text("completed_blocks").array().default(sql`'{}'::text[]`),
  startedAt: timestamp("started_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  // ProcessFacilitator state machine
  conversationState: text("conversation_state").default("START"), // START|MICRO_ONBOARDING|ORIENTATION|CORE_QUESTION|CLARIFY|INTERPRET|TASK|TASK_SUPPORT|CLOSURE|DONE
  clarifyCount: integer("clarify_count").default(0), // Max 2 per day
  taskSupportCount: integer("task_support_count").default(0), // Max 1 per day
  lastBotMessage: text("last_bot_message"), // For no-repetition check
  // Two-Phase Onboarding (from BOT SPEC)
  userOnboardingConfig: jsonb("user_onboarding_config").$type<{
    addressing_style: "female" | "male" | "neutral";
    tone_preference: "direct" | "balanced" | "soft";
  }>(),
  userIntentAnchor: text("user_intent_anchor"), // Micro onboarding answer - WHY user entered the process
});

export const activityEvents = pgTable("activity_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "cascade" }),
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // 'joined' | 'completed_day' | 'completed_journey' | 'feedback'
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityEventSchema = createInsertSchema(activityEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityEvent = z.infer<typeof insertActivityEventSchema>;
export type ActivityEvent = typeof activityEvents.$inferSelect;

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  startedAt: true,
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

export const journeyMessages = pgTable("journey_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "cascade" }).notNull(),
  stepId: varchar("step_id").references(() => journeySteps.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // 'assistant' | 'user'
  content: text("content").notNull(),
  isSummary: boolean("is_summary").default(false), // true for day summaries used in memory
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJourneyMessageSchema = createInsertSchema(journeyMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertJourneyMessage = z.infer<typeof insertJourneyMessageSchema>;
export type JourneyMessage = typeof journeyMessages.$inferSelect;

// Track day state per participant (when started, when completed)
export const userDayState = pgTable("user_day_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "cascade" }).notNull(),
  dayNumber: integer("day_number").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  // Summary generated at day completion (internal for AI memory)
  summaryChallenge: text("summary_challenge"), // Main challenge identified
  summaryEmotionalTone: text("summary_emotional_tone"), // User's emotional state
  summaryInsight: text("summary_insight"), // Key insight reached
  summaryResistance: text("summary_resistance"), // Any resistance or blockage detected
  // Participant-visible summary (shown to user)
  participantSummary: text("participant_summary"), // Daily summary for the participant to see
});

export const insertUserDayStateSchema = createInsertSchema(userDayState).omit({
  id: true,
  startedAt: true,
});

export type InsertUserDayState = z.infer<typeof insertUserDayStateSchema>;
export type UserDayState = typeof userDayState.$inferSelect;

// Notification settings for mentors
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  // Milestone notifications
  notifyOnJoin: text("notify_on_join").default("email"), // 'email' | 'push' | 'both' | 'none'
  notifyOnDayComplete: text("notify_on_day_complete").default("none"),
  notifyOnFlowComplete: text("notify_on_flow_complete").default("email"),
  // Inactivity notifications
  notifyOnInactivity: text("notify_on_inactivity").default("email"),
  inactivityThresholdDays: integer("inactivity_threshold_days").default(2),
  // Summary notifications
  dailySummary: text("daily_summary").default("none"), // 'email' | 'none'
  weeklySummary: text("weekly_summary").default("email"),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
});

export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;

// Payment records for tracking mentor earnings
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "cascade" }).notNull(),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "set null" }),
  mentorId: varchar("mentor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id"),
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").default("USD"),
  status: text("status").default("completed"), // 'pending' | 'completed' | 'failed' | 'refunded'
  customerEmail: varchar("customer_email"),
  customerName: varchar("customer_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Participant feedback for journeys
export const journeyFeedback = pgTable("journey_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "cascade" }).notNull(),
  mentorId: varchar("mentor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "set null" }),
  dayNumber: integer("day_number"), // null for overall journey feedback
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  feedbackType: text("feedback_type").default("day"), // 'day' | 'final' | 'general'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJourneyFeedbackSchema = createInsertSchema(journeyFeedback).omit({
  id: true,
  createdAt: true,
});

export type InsertJourneyFeedback = z.infer<typeof insertJourneyFeedbackSchema>;
export type JourneyFeedback = typeof journeyFeedback.$inferSelect;

// External payment sessions for tracking payment flow without Stripe Connect
export const externalPaymentSessions = pgTable("external_payment_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email").notNull(),
  name: varchar("name"),
  idNumber: varchar("id_number"),
  token: varchar("token").unique().notNull(), // Unique token to verify return
  status: text("status").default("pending"), // 'pending' | 'completed'
  expiresAt: timestamp("expires_at").notNull(), // Session expires after some time
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});


export const insertExternalPaymentSessionSchema = createInsertSchema(externalPaymentSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertExternalPaymentSession = z.infer<typeof insertExternalPaymentSessionSchema>;
export type ExternalPaymentSession = typeof externalPaymentSessions.$inferSelect;

// Mentor business profiles for Self-Billing invoices
export const mentorBusinessProfiles = pgTable("mentor_business_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  // Business identification
  businessName: varchar("business_name"), // שם העסק
  businessType: varchar("business_type"), // 'osek_murshe' | 'osek_patur' | 'company' | 'amuta'
  businessId: varchar("business_id"), // ח"פ / עוסק מורשה number (9 digits)
  vatRegistered: boolean("vat_registered").default(false), // האם רשום למע"מ
  // Address for invoices
  businessAddress: text("business_address"),
  businessCity: varchar("business_city"),
  businessPostalCode: varchar("business_postal_code"),
  businessCountry: varchar("business_country").default("IL"),
  // Bank details for withdrawals
  bankName: varchar("bank_name"),
  bankBranch: varchar("bank_branch"), // סניף
  bankAccountNumber: varchar("bank_account_number"),
  bankAccountName: varchar("bank_account_name"), // שם בעל החשבון
  // Self-billing authorization
  selfBillingAgreedAt: timestamp("self_billing_agreed_at"), // When they agreed to self-billing terms
  selfBillingAgreementVersion: varchar("self_billing_agreement_version"), // Version of agreement signed
  // Status
  verificationStatus: varchar("verification_status").default("pending"), // 'pending' | 'verified' | 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMentorBusinessProfileSchema = createInsertSchema(mentorBusinessProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMentorBusinessProfile = z.infer<typeof insertMentorBusinessProfileSchema>;
export type MentorBusinessProfile = typeof mentorBusinessProfiles.$inferSelect;

// Virtual wallet for mentor earnings
export const mentorWallets = pgTable("mentor_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  balance: integer("balance").default(0), // Current balance in agorot (cents)
  currency: varchar("currency").default("ILS"),
  totalEarned: integer("total_earned").default(0), // Total lifetime earnings
  totalWithdrawn: integer("total_withdrawn").default(0), // Total withdrawn
  lastTransactionAt: timestamp("last_transaction_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMentorWalletSchema = createInsertSchema(mentorWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMentorWallet = z.infer<typeof insertMentorWalletSchema>;
export type MentorWallet = typeof mentorWallets.$inferSelect;

// Wallet transactions (deposits from payments, withdrawals)
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => mentorWallets.id, { onDelete: "cascade" }).notNull(),
  mentorId: varchar("mentor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type").notNull(), // 'deposit' | 'withdrawal' | 'refund' | 'fee'
  amount: integer("amount").notNull(), // Amount in agorot (positive for deposits, negative for withdrawals)
  balanceAfter: integer("balance_after").notNull(), // Balance after this transaction
  description: text("description"),
  // References
  paymentId: varchar("payment_id").references(() => payments.id, { onDelete: "set null" }),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "set null" }),
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "set null" }),
  withdrawalRequestId: varchar("withdrawal_request_id"), // Reference to withdrawal if applicable
  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

// Invoices (for participants and self-billing)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").unique().notNull(), // Sequential invoice number
  type: varchar("type").notNull(), // 'participant' | 'self_billing' | 'platform_fee'
  // Who is issuing / receiving
  issuerId: varchar("issuer_id").references(() => users.id, { onDelete: "set null" }), // Who is issuing (mentor for participant, platform for self-billing)
  recipientId: varchar("recipient_id").references(() => users.id, { onDelete: "set null" }), // Who receives (participant email or mentor)
  // For participant invoices - issued in mentor's name
  mentorId: varchar("mentor_id").references(() => users.id, { onDelete: "cascade" }),
  // Amounts
  subtotal: integer("subtotal").notNull(), // Before VAT
  vatAmount: integer("vat_amount").default(0), // VAT if applicable
  total: integer("total").notNull(), // Final amount
  currency: varchar("currency").default("ILS"),
  // Recipient details (for PDF)
  recipientName: varchar("recipient_name"),
  recipientEmail: varchar("recipient_email"),
  recipientAddress: text("recipient_address"),
  recipientBusinessId: varchar("recipient_business_id"), // ח"פ if business
  // Issuer details (for PDF - snapshot at time of invoice)
  issuerName: varchar("issuer_name"),
  issuerBusinessId: varchar("issuer_business_id"),
  issuerAddress: text("issuer_address"),
  // References
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "set null" }),
  paymentId: varchar("payment_id").references(() => payments.id, { onDelete: "set null" }),
  withdrawalRequestId: varchar("withdrawal_request_id"),
  // Invoice content
  lineItems: jsonb("line_items").$type<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>(),
  notes: text("notes"),
  // PDF storage
  pdfUrl: text("pdf_url"),
  // Status
  status: varchar("status").default("draft"), // 'draft' | 'issued' | 'paid' | 'cancelled'
  issuedAt: timestamp("issued_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Withdrawal requests from mentors
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  walletId: varchar("wallet_id").references(() => mentorWallets.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(), // Amount to withdraw in agorot
  currency: varchar("currency").default("ILS"),
  // Bank details snapshot at time of request
  bankName: varchar("bank_name"),
  bankBranch: varchar("bank_branch"),
  bankAccountNumber: varchar("bank_account_number"),
  bankAccountName: varchar("bank_account_name"),
  // Self-billing invoice reference
  selfBillingInvoiceId: varchar("self_billing_invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  // Status tracking
  status: varchar("status").default("pending"), // 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
  rejectionReason: text("rejection_reason"),
  // Dates
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  // Period covered (for monthly summaries)
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  // Transaction details
  transactionReference: varchar("transaction_reference"), // Bank transfer reference
  metadata: jsonb("metadata"),
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  requestedAt: true,
});

export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

// System errors for admin monitoring
export const systemErrors = pgTable("system_errors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  errorType: text("error_type").notNull(), // 'ai_generation' | 'flow_creation' | 'payment' | 'runtime'
  errorMessage: text("error_message").notNull(),
  errorStack: text("error_stack"),
  relatedEntityType: text("related_entity_type"), // 'user' | 'journey' | 'participant'
  relatedEntityId: varchar("related_entity_id"),
  userId: varchar("user_id"),
  metadata: jsonb("metadata"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSystemErrorSchema = createInsertSchema(systemErrors).omit({
  id: true,
  createdAt: true,
});

export type InsertSystemError = z.infer<typeof insertSystemErrorSchema>;
export type SystemError = typeof systemErrors.$inferSelect;
