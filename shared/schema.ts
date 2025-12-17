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
  // Mentor personality fields (from onboarding questionnaire)
  toneOfVoice: text("tone_of_voice"), // e.g., "warm and supportive", "direct and practical"
  methodDescription: text("method_description"), // summary of mentor's approach
  behavioralRules: text("behavioral_rules"), // do's and don'ts for the AI
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
  stripeSessionId: varchar("stripe_session_id"),
  currentDay: integer("current_day").default(1),
  completedBlocks: text("completed_blocks").array().default(sql`'{}'::text[]`),
  startedAt: timestamp("started_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  completedAt: timestamp("completed_at"),
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
  // Summary generated at day completion
  summaryChallenge: text("summary_challenge"), // Main challenge identified
  summaryEmotionalTone: text("summary_emotional_tone"), // User's emotional state
  summaryInsight: text("summary_insight"), // Key insight reached
  summaryResistance: text("summary_resistance"), // Any resistance or blockage detected
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
