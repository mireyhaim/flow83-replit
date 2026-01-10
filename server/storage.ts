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
  type JourneyFeedback, type InsertJourneyFeedback,
  type ExternalPaymentSession, type InsertExternalPaymentSession,
  type SystemError, type InsertSystemError,
  users, journeys, journeySteps, journeyBlocks, participants, journeyMessages, activityEvents, notificationSettings, userDayState, payments, journeyFeedback, externalPaymentSessions, systemErrors
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc, desc, inArray, lt, isNull, or, sum, gte, count, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User>;
  updateUserProfileImage(userId: string, imageUrl: string): Promise<User>;
  migrateUserData(oldUserId: string, newUserId: string): Promise<void>;
  
  // Trial management (21-day internal trial)
  startUserTrial(userId: string): Promise<User>;
  getUserTrialStatus(userId: string): Promise<{ isActive: boolean; daysRemaining: number; status: string | null; trialEndsAt: Date | null }>;
  expireUserTrial(userId: string): Promise<User>;

  getJourneys(): Promise<Journey[]>;
  getJourneysByCreator(creatorId: string): Promise<Journey[]>;
  getArchivedJourneysByCreator(creatorId: string): Promise<Journey[]>;
  getJourney(id: string): Promise<Journey | undefined>;
  getJourneyByShortCode(shortCode: string): Promise<Journey | undefined>;
  createJourney(journey: InsertJourney): Promise<Journey>;
  updateJourney(id: string, journey: Partial<InsertJourney>): Promise<Journey | undefined>;
  deleteJourney(id: string): Promise<void>;
  archiveJourney(id: string, archivedBy: string): Promise<Journey | undefined>;
  restoreJourney(id: string): Promise<Journey | undefined>;
  getJourneyParticipantCount(journeyId: string): Promise<number>;

  getJourneySteps(journeyId: string): Promise<JourneyStep[]>;
  getJourneyStep(id: string): Promise<JourneyStep | undefined>;
  createJourneyStep(step: InsertJourneyStep): Promise<JourneyStep>;
  updateJourneyStep(id: string, step: Partial<InsertJourneyStep>): Promise<JourneyStep | undefined>;
  deleteJourneyStep(id: string): Promise<void>;

  getJourneyBlocks(stepId: string): Promise<JourneyBlock[]>;
  getAllBlocksForJourney(journeyId: string): Promise<JourneyBlock[]>;
  getJourneyBlock(id: string): Promise<JourneyBlock | undefined>;
  createJourneyBlock(block: InsertJourneyBlock): Promise<JourneyBlock>;
  createJourneyBlocks(blocks: InsertJourneyBlock[]): Promise<JourneyBlock[]>;
  updateJourneyBlock(id: string, block: Partial<InsertJourneyBlock>): Promise<JourneyBlock | undefined>;
  deleteJourneyBlock(id: string): Promise<void>;
  deleteJourneyStepsByJourneyId(journeyId: string): Promise<void>;

  getParticipants(journeyId: string): Promise<Participant[]>;
  getParticipant(userId: string, journeyId: string): Promise<Participant | undefined>;
  getParticipantByEmail(email: string, journeyId: string): Promise<Participant | undefined>;
  getParticipantById(id: string): Promise<Participant | undefined>;
  getParticipantByAccessToken(accessToken: string): Promise<Participant | undefined>;
  getParticipantByStripeSession(stripeSessionId: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  createExternalParticipant(journeyId: string, email: string, name?: string, idNumber?: string, stripeSessionId?: string): Promise<Participant>;
  updateParticipant(id: string, participant: Partial<InsertParticipant>): Promise<Participant | undefined>;

  getMessages(participantId: string, stepId: string): Promise<JourneyMessage[]>;
  createMessage(message: InsertJourneyMessage): Promise<JourneyMessage>;

  getActivityEvents(creatorId: string, limit?: number): Promise<ActivityEvent[]>;
  createActivityEvent(event: InsertActivityEvent): Promise<ActivityEvent>;
  getInactiveParticipants(creatorId: string, daysSinceActive: number): Promise<(Participant & { journey: Journey; user: User })[]>;
  getParticipantsByCreator(creatorId: string): Promise<Participant[]>;
  getParticipantsWithJourneyByCreator(creatorId: string): Promise<(Participant & { journeyName: string })[]>;

  getNotificationSettings(userId: string): Promise<NotificationSettings | undefined>;
  upsertNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;

  // Day state tracking (PRD 5, 6.6)
  createOrUpdateDayState(participantId: string, dayNumber: number): Promise<UserDayState>;
  completeDayState(participantId: string, dayNumber: number, summary: Partial<InsertUserDayState>): Promise<UserDayState | undefined>;
  getLatestDaySummary(participantId: string, maxDayNumber: number): Promise<UserDayState | undefined>;
  getDayState(participantId: string, dayNumber: number): Promise<UserDayState | undefined>;
  getAllDaySummaries(participantId: string): Promise<UserDayState[]>;

  // Payment tracking
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByMentor(mentorId: string): Promise<Payment[]>;
  getTotalEarningsByMentor(mentorId: string): Promise<number>;
  getPaymentByStripeSession(stripeSessionId: string): Promise<Payment | undefined>;

  // Participant feedback
  createFeedback(feedback: InsertJourneyFeedback): Promise<JourneyFeedback>;
  getFeedbackByMentor(mentorId: string): Promise<JourneyFeedback[]>;
  getFeedbackByMentorWithDetails(mentorId: string): Promise<{
    feedback: JourneyFeedback;
    journeyName: string | null;
    participantName: string | null;
    participantEmail: string | null;
  }[]>;
  getFeedbackByJourney(journeyId: string): Promise<JourneyFeedback[]>;

  // External payment sessions (for mentor's own payment links)
  createExternalPaymentSession(session: InsertExternalPaymentSession): Promise<ExternalPaymentSession>;
  getExternalPaymentSessionByToken(token: string): Promise<ExternalPaymentSession | undefined>;
  completeExternalPaymentSession(token: string): Promise<ExternalPaymentSession | undefined>;

  // Admin functions
  getAllUsers(): Promise<User[]>;
  getAllParticipantsWithDetails(): Promise<(Participant & { journey: Journey | null; user: User | null })[]>;
  getAllJourneysWithStats(): Promise<(Journey & { mentor: User | null; participantCount: number; completedCount: number })[]>;
  getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalMentors: number;
    activeFlows: number;
    journeysStarted30d: number;
    journeysCompleted30d: number;
  }>;
  createSystemError(error: InsertSystemError): Promise<SystemError>;
  getSystemErrors(limit?: number): Promise<SystemError[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async migrateUserData(oldUserId: string, newUserId: string): Promise<void> {
    await db.update(journeys).set({ creatorId: newUserId }).where(eq(journeys.creatorId, oldUserId));
    await db.update(participants).set({ userId: newUserId }).where(eq(participants.userId, oldUserId));
    await db.update(activityEvents).set({ creatorId: newUserId }).where(eq(activityEvents.creatorId, oldUserId));
    await db.update(notificationSettings).set({ userId: newUserId }).where(eq(notificationSettings.userId, oldUserId));
    await db.update(payments).set({ mentorId: newUserId }).where(eq(payments.mentorId, oldUserId));
    await db.update(journeyFeedback).set({ mentorId: newUserId }).where(eq(journeyFeedback.mentorId, oldUserId));
    await db.delete(users).where(eq(users.id, oldUserId));
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

  async updateUserProfileImage(userId: string, imageUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ profileImageUrl: imageUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Trial management (21-day internal trial)
  async startUserTrial(userId: string): Promise<User> {
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 21 days from now
    
    const [user] = await db
      .update(users)
      .set({
        trialStartedAt: now,
        trialEndsAt: trialEndsAt,
        subscriptionStatus: 'on_trial',
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserTrialStatus(userId: string): Promise<{ isActive: boolean; daysRemaining: number; status: string | null; trialEndsAt: Date | null }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { isActive: false, daysRemaining: 0, status: null, trialEndsAt: null };
    }

    const now = new Date();
    const status = user.subscriptionStatus;
    
    // If user has an active paid subscription, they're good
    if (status === 'active') {
      return { isActive: true, daysRemaining: -1, status, trialEndsAt: user.trialEndsAt };
    }
    
    // If user is on trial, check if it's still valid
    if (status === 'on_trial' && user.trialEndsAt) {
      const daysRemaining = Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      if (daysRemaining > 0) {
        return { isActive: true, daysRemaining, status, trialEndsAt: user.trialEndsAt };
      } else {
        // Trial has expired - persist the expiration status
        await this.expireUserTrial(userId);
        return { isActive: false, daysRemaining: 0, status: 'trial_expired', trialEndsAt: user.trialEndsAt };
      }
    }
    
    // If trial_expired, expired, past_due, or no subscription
    return { isActive: false, daysRemaining: 0, status, trialEndsAt: user.trialEndsAt };
  }

  async expireUserTrial(userId: string): Promise<User> {
    // Update user's subscription status to trial_expired
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: 'trial_expired',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Unpublish all mentor's published journeys (freeze them)
    await db
      .update(journeys)
      .set({ status: 'draft' })
      .where(and(
        eq(journeys.creatorId, userId),
        eq(journeys.status, 'published')
      ));
    
    return user;
  }

  async getJourneys(): Promise<Journey[]> {
    return db.select().from(journeys);
  }

  async getJourneysByCreator(creatorId: string): Promise<Journey[]> {
    return db.select().from(journeys).where(
      and(
        eq(journeys.creatorId, creatorId),
        isNull(journeys.archivedAt)
      )
    );
  }

  async getArchivedJourneysByCreator(creatorId: string): Promise<Journey[]> {
    return db.select().from(journeys).where(
      and(
        eq(journeys.creatorId, creatorId),
        sql`${journeys.archivedAt} IS NOT NULL`
      )
    );
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

  async archiveJourney(id: string, archivedBy: string): Promise<Journey | undefined> {
    const [updated] = await db.update(journeys)
      .set({ 
        archivedAt: new Date(),
        archivedBy: archivedBy
      })
      .where(eq(journeys.id, id))
      .returning();
    return updated;
  }

  async restoreJourney(id: string): Promise<Journey | undefined> {
    const [updated] = await db.update(journeys)
      .set({ 
        archivedAt: null,
        archivedBy: null
      })
      .where(eq(journeys.id, id))
      .returning();
    return updated;
  }

  async getJourneyParticipantCount(journeyId: string): Promise<number> {
    const result = await db.select({ count: count() })
      .from(participants)
      .where(eq(participants.journeyId, journeyId));
    return result[0]?.count || 0;
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

  async getAllBlocksForJourney(journeyId: string): Promise<JourneyBlock[]> {
    const steps = await db.select({ id: journeySteps.id }).from(journeySteps).where(eq(journeySteps.journeyId, journeyId));
    if (steps.length === 0) return [];
    const stepIds = steps.map(s => s.id);
    return db.select().from(journeyBlocks).where(inArray(journeyBlocks.stepId, stepIds));
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

  async getParticipantByEmail(email: string, journeyId: string): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(
      and(eq(participants.email, email), eq(participants.journeyId, journeyId))
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

  async createExternalParticipant(journeyId: string, email: string, name?: string, idNumber?: string, stripeSessionId?: string): Promise<Participant> {
    const [created] = await db.insert(participants).values({
      journeyId,
      email,
      name,
      idNumber,
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

  async getParticipantsWithJourneyByCreator(creatorId: string): Promise<(Participant & { journeyName: string })[]> {
    const results = await db
      .select({
        participant: participants,
        journeyName: journeys.name,
      })
      .from(participants)
      .innerJoin(journeys, eq(participants.journeyId, journeys.id))
      .where(eq(journeys.creatorId, creatorId))
      .orderBy(desc(participants.startedAt));
    
    return results.map(r => ({
      ...r.participant,
      journeyName: r.journeyName,
    }));
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
        participantSummary: summary.participantSummary,
      })
      .where(and(
        eq(userDayState.participantId, participantId),
        eq(userDayState.dayNumber, dayNumber)
      ))
      .returning();
    return updated;
  }

  async getAllDaySummaries(participantId: string): Promise<UserDayState[]> {
    return db
      .select()
      .from(userDayState)
      .where(eq(userDayState.participantId, participantId))
      .orderBy(userDayState.dayNumber);
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

  // Feedback methods
  async createFeedback(feedback: InsertJourneyFeedback): Promise<JourneyFeedback> {
    const [created] = await db.insert(journeyFeedback).values(feedback).returning();
    return created;
  }

  async getFeedbackByMentor(mentorId: string): Promise<JourneyFeedback[]> {
    return db.select().from(journeyFeedback)
      .where(eq(journeyFeedback.mentorId, mentorId))
      .orderBy(desc(journeyFeedback.createdAt));
  }

  async getFeedbackByMentorWithDetails(mentorId: string): Promise<{
    feedback: JourneyFeedback;
    journeyName: string | null;
    participantName: string | null;
    participantEmail: string | null;
  }[]> {
    const results = await db
      .select({
        feedback: journeyFeedback,
        journeyName: journeys.name,
        participantName: participants.name,
        participantEmail: participants.email,
      })
      .from(journeyFeedback)
      .leftJoin(journeys, eq(journeyFeedback.journeyId, journeys.id))
      .leftJoin(participants, eq(journeyFeedback.participantId, participants.id))
      .where(eq(journeyFeedback.mentorId, mentorId))
      .orderBy(desc(journeyFeedback.createdAt));
    return results;
  }

  async getFeedbackByJourney(journeyId: string): Promise<JourneyFeedback[]> {
    return db.select().from(journeyFeedback)
      .where(eq(journeyFeedback.journeyId, journeyId))
      .orderBy(desc(journeyFeedback.createdAt));
  }

  // External payment session methods
  async createExternalPaymentSession(session: InsertExternalPaymentSession): Promise<ExternalPaymentSession> {
    const [created] = await db.insert(externalPaymentSessions).values(session).returning();
    return created;
  }

  async getExternalPaymentSessionByToken(token: string): Promise<ExternalPaymentSession | undefined> {
    const [session] = await db.select().from(externalPaymentSessions)
      .where(eq(externalPaymentSessions.token, token));
    return session;
  }

  async completeExternalPaymentSession(token: string): Promise<ExternalPaymentSession | undefined> {
    const [updated] = await db.update(externalPaymentSessions)
      .set({ 
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(externalPaymentSessions.token, token))
      .returning();
    return updated;
  }

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllParticipantsWithDetails(): Promise<(Participant & { journey: Journey | null; user: User | null })[]> {
    const results = await db
      .select({
        participant: participants,
        journey: journeys,
        user: users,
      })
      .from(participants)
      .leftJoin(journeys, eq(participants.journeyId, journeys.id))
      .leftJoin(users, eq(participants.userId, users.id))
      .orderBy(desc(participants.lastActiveAt));
    
    return results.map(r => ({
      ...r.participant,
      journey: r.journey,
      user: r.user,
    }));
  }

  async getAllJourneysWithStats(): Promise<(Journey & { mentor: User | null; participantCount: number; completedCount: number })[]> {
    const allJourneys = await db
      .select({
        journey: journeys,
        mentor: users,
      })
      .from(journeys)
      .leftJoin(users, eq(journeys.creatorId, users.id))
      .orderBy(desc(journeys.id));

    const results = await Promise.all(allJourneys.map(async (r) => {
      const participantStats = await db
        .select({
          total: count(),
          completed: sql<number>`COUNT(CASE WHEN ${participants.completedAt} IS NOT NULL THEN 1 END)`,
        })
        .from(participants)
        .where(eq(participants.journeyId, r.journey.id));

      return {
        ...r.journey,
        mentor: r.mentor,
        participantCount: Number(participantStats[0]?.total ?? 0),
        completedCount: Number(participantStats[0]?.completed ?? 0),
      };
    }));

    return results;
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalMentors: number;
    activeFlows: number;
    journeysStarted30d: number;
    journeysCompleted30d: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [userCount] = await db.select({ count: count() }).from(users);
    
    const [activeUserCount] = await db
      .select({ count: count() })
      .from(participants)
      .where(gte(participants.lastActiveAt, sevenDaysAgo));

    const mentorIds = await db
      .selectDistinct({ creatorId: journeys.creatorId })
      .from(journeys)
      .where(eq(journeys.status, "published"));
    
    const [activeFlowCount] = await db
      .select({ count: count() })
      .from(journeys)
      .where(eq(journeys.status, "published"));

    const [journeysStarted] = await db
      .select({ count: count() })
      .from(participants)
      .where(gte(participants.startedAt, thirtyDaysAgo));

    const [journeysCompleted] = await db
      .select({ count: count() })
      .from(participants)
      .where(and(
        gte(participants.completedAt, thirtyDaysAgo),
        sql`${participants.completedAt} IS NOT NULL`
      ));

    return {
      totalUsers: Number(userCount?.count ?? 0),
      activeUsers: Number(activeUserCount?.count ?? 0),
      totalMentors: mentorIds.length,
      activeFlows: Number(activeFlowCount?.count ?? 0),
      journeysStarted30d: Number(journeysStarted?.count ?? 0),
      journeysCompleted30d: Number(journeysCompleted?.count ?? 0),
    };
  }

  async createSystemError(error: InsertSystemError): Promise<SystemError> {
    const [created] = await db.insert(systemErrors).values(error).returning();
    return created;
  }

  async getSystemErrors(limit = 100): Promise<SystemError[]> {
    return db.select().from(systemErrors)
      .orderBy(desc(systemErrors.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
