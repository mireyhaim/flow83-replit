import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export interface RLSContext {
  userId?: string;
  participantId?: string;
  role?: 'user' | 'service';
}

export async function setRLSContext(context: RLSContext): Promise<void> {
  await db.execute(sql`SELECT 
    set_config('app.user_id', ${context.userId || ''}, true),
    set_config('app.participant_id', ${context.participantId || ''}, true),
    set_config('app.role', ${context.role || 'user'}, true)
  `);
}

export async function setServiceContext(): Promise<void> {
  await db.execute(sql`SELECT 
    set_config('app.user_id', '', true),
    set_config('app.participant_id', '', true),
    set_config('app.role', 'service', true)
  `);
}

export async function withRLSContext<T>(
  context: RLSContext,
  fn: () => Promise<T>
): Promise<T> {
  await setRLSContext(context);
  return fn();
}

export async function withServiceContext<T>(
  fn: () => Promise<T>
): Promise<T> {
  await setServiceContext();
  return fn();
}
