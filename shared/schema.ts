import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
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
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  journeyId: varchar("journey_id").references(() => journeys.id, { onDelete: "cascade" }).notNull(),
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
  role: text("role").notNull(), // 'bot' | 'user'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJourneyMessageSchema = createInsertSchema(journeyMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertJourneyMessage = z.infer<typeof insertJourneyMessageSchema>;
export type JourneyMessage = typeof journeyMessages.$inferSelect;
