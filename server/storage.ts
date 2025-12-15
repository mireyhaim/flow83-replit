import { 
  type User, type UpsertUser, 
  type Journey, type InsertJourney,
  type JourneyStep, type InsertJourneyStep,
  type JourneyBlock, type InsertJourneyBlock,
  type Participant, type InsertParticipant,
  users, journeys, journeySteps, journeyBlocks, participants
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getJourneys(): Promise<Journey[]>;
  getJourneysByCreator(creatorId: string): Promise<Journey[]>;
  getJourney(id: string): Promise<Journey | undefined>;
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
  updateJourneyBlock(id: string, block: Partial<InsertJourneyBlock>): Promise<JourneyBlock | undefined>;
  deleteJourneyBlock(id: string): Promise<void>;

  getParticipants(journeyId: string): Promise<Participant[]>;
  getParticipant(userId: string, journeyId: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: string, participant: Partial<InsertParticipant>): Promise<Participant | undefined>;
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

  async updateJourneyBlock(id: string, block: Partial<InsertJourneyBlock>): Promise<JourneyBlock | undefined> {
    const [updated] = await db.update(journeyBlocks).set(block).where(eq(journeyBlocks.id, id)).returning();
    return updated;
  }

  async deleteJourneyBlock(id: string): Promise<void> {
    await db.delete(journeyBlocks).where(eq(journeyBlocks.id, id));
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
}

export const storage = new DatabaseStorage();
