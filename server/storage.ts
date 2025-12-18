import { 
  type User, type UpsertUser, 
  type Journey, type InsertJourney,
  type JourneyStep, type InsertJourneyStep,
  type JourneyBlock, type InsertJourneyBlock,
  type Participant, type InsertParticipant,
  type JourneyMessage, type InsertJourneyMessage,
  type ActivityEvent, type InsertActivityEvent,
  type NotificationSettings, type InsertNotificationSettings,
  type UserDayState, type InsertUserDayState,
  type Payment, type InsertPayment,
  users, journeys, journeySteps, journeyBlocks, participants, journeyMessages, activityEvents, notificationSettings, userDayState, payments
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc, desc, inArray, lt, isNull, or, sum } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getJourneys(): Promise<Journey[]>;
  getJourneysByCreator(creatorId: string): Promise<Journey[]>;
  getJourney(id: string): Promise<Journey | undefined>;
  getJourneyByShortCode(shortCode: string): Promise<Journey | undefined>;
  createJourney(journey: InsertJourney): Promise<Journey>;
  updateJourney(id: string, journey: Partial<InsertJourney>): Promise<Journey | undefined>;
  deleteJourney(id: string): Promise<void>;

  getJourneySteps(journeyId: string): Promise<JourneyStep[]>;
  getJourneyStep(id: string): Promise<JourneyStep | undefined>;
  createJourneyStep(step: InsertJourneyStep): Promise<JourneyStep>;
  updateJourneyStep(id: string, step: Partial<InsertJourneyStep>): Promise<JourneyStep | undefined>;
  deleteJourneyStep(id: string): Promise<void>;

  getJourneyBlocks(stepId: string): Promise<JourneyBlock[]>;
  getJourneyBlock(id: string): Promise<JourneyBlock | undefined>;
  createJourneyBlock(block: InsertJourneyBlock): Promise<JourneyBlock>;
  createJourneyBlocks(blocks: InsertJourneyBlock[]): Promise<JourneyBlock[]>;
  updateJourneyBlock(id: string, block: Partial<InsertJourneyBlock>): Promise<JourneyBlock | undefined>;
  deleteJourneyBlock(id: string): Promise<void>;
  deleteJourneyStepsByJourneyId(journeyId: string): Promise<void>;

  getParticipants(journeyId: string): Promise<Participant[]>;
  getParticipant(userId: string, journeyId: string): Promise<Participant | undefined>;
  getParticipantById(id: string): Promise<Participant | undefined>;
  getParticipantByAccessToken(accessToken: string): Promise<Participant | undefined>;
  getParticipantByStripeSession(stripeSessionId: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  createExternalParticipant(journeyId: string, email: string, name?: string, stripeSessionId?: string): Promise<Participant>;
  updateParticipant(id: string, participant: Partial<InsertParticipant>): Promise<Participant | undefined>;

  getMessages(participantId: string, stepId: string): Promise<JourneyMessage[]>;
  createMessage(message: InsertJourneyMessage): Promise<JourneyMessage>;

  getActivityEvents(creatorId: string, limit?: number): Promise<ActivityEvent[]>;
  createActivityEvent(event: InsertActivityEvent): Promise<ActivityEvent>;
  getInactiveParticipants(creatorId: string, daysSinceActive: number): Promise<(Participant & { journey: Journey; user: User })[]>;
  getParticipantsByCreator(creatorId: string): Promise<Participant[]>;

  getNotificationSettings(userId: string): Promise<NotificationSettings | undefined>;
  upsertNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;

  // Day state tracking (PRD 5, 6.6)
  createOrUpdateDayState(participantId: string, dayNumber: number): Promise<UserDayState>;
  completeDayState(participantId: string, dayNumber: number, summary: Partial<InsertUserDayState>): Promise<UserDayState | undefined>;
  getLatestDaySummary(participantId: string, maxDayNumber: number): Promise<UserDayState | undefined>;
  getDayState(participantId: string, dayNumber: number): Promise<UserDayState | undefined>;

  // Payment tracking
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByMentor(mentorId: string): Promise<Payment[]>;
  getTotalEarningsByMentor(mentorId: string): Promise<number>;
  getPaymentByStripeSession(stripeSessionId: string): Promise<Payment | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getJourneys(): Promise<Journey[]> {
    return db.select().from(journeys);
  }

  async getJourneysByCreator(creatorId: string): Promise<Journey[]> {
    return db.select().from(journeys).where(eq(journeys.creatorId, creatorId));
  }

  async getJourney(id: string): Promise<Journey | undefined> {
    const [journey] = await db.select().from(journeys).where(eq(journeys.id, id));
    return journey;
  }

  async getJourneyByShortCode(shortCode: string): Promise<Journey | undefined> {
    const [journey] = await db.select().from(journeys).where(eq(journeys.shortCode, shortCode));
    return journey;
  }

  async createJourney(journey: InsertJourney): Promise<Journey> {
    const [created] = await db.insert(journeys).values(journey).returning();
    return created;
  }

  async updateJourney(id: string, journey: Partial<InsertJourney>): Promise<Journey | undefined> {
    const [updated] = await db.update(journeys).set(journey).where(eq(journeys.id, id)).returning();
    return updated;
  }

  async deleteJourney(id: string): Promise<void> {
    await db.delete(journeys).where(eq(journeys.id, id));
  }

  async getJourneySteps(journeyId: string): Promise<JourneyStep[]> {
    return db.select().from(journeySteps).where(eq(journeySteps.journeyId, journeyId));
  }

  async getJourneyStep(id: string): Promise<JourneyStep | undefined> {
    const [step] = await db.select().from(journeySteps).where(eq(journeySteps.id, id));
    return step;
  }

  async createJourneyStep(step: InsertJourneyStep): Promise<JourneyStep> {
    const [created] = await db.insert(journeySteps).values(step).returning();
    return created;
  }

  async updateJourneyStep(id: string, step: Partial<InsertJourneyStep>): Promise<JourneyStep | undefined> {
    const [updated] = await db.update(journeySteps).set(step).where(eq(journeySteps.id, id)).returning();
    return updated;
  }

  async deleteJourneyStep(id: string): Promise<void> {
    await db.delete(journeySteps).where(eq(journeySteps.id, id));
  }

  async getJourneyBlocks(stepId: string): Promise<JourneyBlock[]> {
    return db.select().from(journeyBlocks).where(eq(journeyBlocks.stepId, stepId));
  }

  async getJourneyBlock(id: string): Promise<JourneyBlock | undefined> {
    const [block] = await db.select().from(journeyBlocks).where(eq(journeyBlocks.id, id));
    return block;
  }

  async createJourneyBlock(block: InsertJourneyBlock): Promise<JourneyBlock> {
    const [created] = await db.insert(journeyBlocks).values(block).returning();
    return created;
  }

  async createJourneyBlocks(blocks: InsertJourneyBlock[]): Promise<JourneyBlock[]> {
    if (blocks.length === 0) return [];
    return db.insert(journeyBlocks).values(blocks).returning();
  }

  async updateJourneyBlock(id: string, block: Partial<InsertJourneyBlock>): Promise<JourneyBlock | undefined> {
    const [updated] = await db.update(journeyBlocks).set(block).where(eq(journeyBlocks.id, id)).returning();
    return updated;
  }

  async deleteJourneyBlock(id: string): Promise<void> {
    await db.delete(journeyBlocks).where(eq(journeyBlocks.id, id));
  }

  async deleteJourneyStepsByJourneyId(journeyId: string): Promise<void> {
    const steps = await this.getJourneySteps(journeyId);
    if (steps.length > 0) {
      const stepIds = steps.map(s => s.id);
      await db.delete(journeyBlocks).where(inArray(journeyBlocks.stepId, stepIds));
    }
    await db.delete(journeySteps).where(eq(journeySteps.journeyId, journeyId));
  }

  async getParticipants(journeyId: string): Promise<Participant[]> {
    return db.select().from(participants).where(eq(participants.journeyId, journeyId));
  }

  async getParticipant(userId: string, journeyId: string): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(
      and(eq(participants.userId, userId), eq(participants.journeyId, journeyId))
    );
    return participant;
  }

  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const [created] = await db.insert(participants).values(participant).returning();
    return created;
  }

  async updateParticipant(id: string, participant: Partial<InsertParticipant>): Promise<Participant | undefined> {
    const [updated] = await db.update(participants).set(participant).where(eq(participants.id, id)).returning();
    return updated;
  }

  async getParticipantById(id: string): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(eq(participants.id, id));
    return participant;
  }

  async getParticipantByAccessToken(accessToken: string): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(eq(participants.accessToken, accessToken));
    return participant;
  }

  async getParticipantByStripeSession(stripeSessionId: string): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(eq(participants.stripeSessionId, stripeSessionId));
    return participant;
  }

  async createExternalParticipant(journeyId: string, email: string, name?: string, stripeSessionId?: string): Promise<Participant> {
    const [created] = await db.insert(participants).values({
      journeyId,
      email,
      name,
      stripeSessionId,
    }).returning();
    return created;
  }

  async getMessages(participantId: string, stepId: string): Promise<JourneyMessage[]> {
    return db.select().from(journeyMessages)
      .where(and(eq(journeyMessages.participantId, participantId), eq(journeyMessages.stepId, stepId)))
      .orderBy(asc(journeyMessages.createdAt));
  }

  async createMessage(message: InsertJourneyMessage): Promise<JourneyMessage> {
    const [created] = await db.insert(journeyMessages).values(message).returning();
    return created;
  }

  async getActivityEvents(creatorId: string, limit: number = 10): Promise<ActivityEvent[]> {
    return db.select().from(activityEvents)
      .where(eq(activityEvents.creatorId, creatorId))
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit);
  }

  async createActivityEvent(event: InsertActivityEvent): Promise<ActivityEvent> {
    const [created] = await db.insert(activityEvents).values(event).returning();
    return created;
  }

  async getInactiveParticipants(creatorId: string, daysSinceActive: number): Promise<(Participant & { journey: Journey; user: User })[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceActive);
    
    const results = await db
      .select()
      .from(participants)
      .innerJoin(journeys, eq(participants.journeyId, journeys.id))
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          eq(journeys.creatorId, creatorId),
          or(
            isNull(participants.lastActiveAt),
            lt(participants.lastActiveAt, cutoffDate)
          ),
          isNull(participants.completedAt)
        )
      )
      .orderBy(asc(participants.lastActiveAt))
      .limit(10);
    
    return results.map(r => ({
      ...r.participants,
      journey: r.journeys,
      user: r.users,
    }));
  }

  async getParticipantsByCreator(creatorId: string): Promise<Participant[]> {
    return db
      .select({ participant: participants })
      .from(participants)
      .innerJoin(journeys, eq(participants.journeyId, journeys.id))
      .where(eq(journeys.creatorId, creatorId))
      .then(results => results.map(r => r.participant));
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettings | undefined> {
    const [settings] = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId));
    return settings;
  }

  async upsertNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const [result] = await db
      .insert(notificationSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: notificationSettings.userId,
        set: {
          notifyOnJoin: settings.notifyOnJoin,
          notifyOnDayComplete: settings.notifyOnDayComplete,
          notifyOnFlowComplete: settings.notifyOnFlowComplete,
          notifyOnInactivity: settings.notifyOnInactivity,
          inactivityThresholdDays: settings.inactivityThresholdDays,
          dailySummary: settings.dailySummary,
          weeklySummary: settings.weeklySummary,
        },
      })
      .returning();
    return result;
  }

  // PRD Day State tracking methods
  async createOrUpdateDayState(participantId: string, dayNumber: number): Promise<UserDayState> {
    const existing = await this.getDayState(participantId, dayNumber);
    if (existing) {
      return existing;
    }
    const [state] = await db.insert(userDayState).values({
      participantId,
      dayNumber,
    }).returning();
    return state;
  }

  async completeDayState(participantId: string, dayNumber: number, summary: Partial<InsertUserDayState>): Promise<UserDayState | undefined> {
    const [updated] = await db
      .update(userDayState)
      .set({
        completedAt: new Date(),
        summaryChallenge: summary.summaryChallenge,
        summaryEmotionalTone: summary.summaryEmotionalTone,
        summaryInsight: summary.summaryInsight,
        summaryResistance: summary.summaryResistance,
      })
      .where(and(
        eq(userDayState.participantId, participantId),
        eq(userDayState.dayNumber, dayNumber)
      ))
      .returning();
    return updated;
  }

  async getLatestDaySummary(participantId: string, maxDayNumber: number): Promise<UserDayState | undefined> {
    if (maxDayNumber < 1) return undefined;
    
    const [state] = await db
      .select()
      .from(userDayState)
      .where(and(
        eq(userDayState.participantId, participantId),
        lt(userDayState.dayNumber, maxDayNumber + 1)
      ))
      .orderBy(desc(userDayState.dayNumber))
      .limit(1);
    return state;
  }

  async getDayState(participantId: string, dayNumber: number): Promise<UserDayState | undefined> {
    const [state] = await db
      .select()
      .from(userDayState)
      .where(and(
        eq(userDayState.participantId, participantId),
        eq(userDayState.dayNumber, dayNumber)
      ));
    return state;
  }

  // Payment tracking methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async getPaymentsByMentor(mentorId: string): Promise<Payment[]> {
    return db.select().from(payments)
      .where(eq(payments.mentorId, mentorId))
      .orderBy(desc(payments.createdAt));
  }

  async getTotalEarningsByMentor(mentorId: string): Promise<number> {
    const [result] = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(and(
        eq(payments.mentorId, mentorId),
        eq(payments.status, "completed")
      ));
    return Number(result?.total || 0);
  }

  async getPaymentByStripeSession(stripeSessionId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments)
      .where(eq(payments.stripeCheckoutSessionId, stripeSessionId));
    return payment;
  }
}

export const storage = new DatabaseStorage();
