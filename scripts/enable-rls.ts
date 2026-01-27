import { db } from "../server/db";
import { sql } from "drizzle-orm";

const TABLES = [
  "users",
  "sessions",
  "journeys",
  "journey_steps",
  "journey_blocks",
  "journey_messages",
  "journey_feedback",
  "participants",
  "payments",
  "user_day_state",
  "activity_events",
  "notification_settings",
  "external_payment_sessions",
  "system_errors",
  "invoices",
  "mentor_business_profiles",
  "mentor_wallets",
  "wallet_transactions",
  "withdrawal_requests",
  "refund_requests",
];

async function enableRLS() {
  console.log("Enabling RLS on all tables...");

  for (const table of TABLES) {
    try {
      await db.execute(sql.raw(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`));
      console.log(`✓ RLS enabled on ${table}`);
    } catch (error: any) {
      if (error.message?.includes("does not exist")) {
        console.log(`⊘ Table ${table} does not exist, skipping`);
      } else {
        console.error(`✗ Failed to enable RLS on ${table}:`, error.message);
      }
    }
  }

  console.log("\nCreating RLS policies...");

  for (const table of TABLES) {
    const policyName = `service_role_all_${table}`;
    try {
      await db.execute(sql.raw(`DROP POLICY IF EXISTS ${policyName} ON public.${table}`));
      await db.execute(
        sql.raw(
          `CREATE POLICY ${policyName} ON public.${table} FOR ALL USING (current_setting('app.role', true) = 'service')`
        )
      );
      console.log(`✓ Policy created for ${table}`);
    } catch (error: any) {
      if (error.message?.includes("does not exist")) {
        console.log(`⊘ Table ${table} does not exist, skipping policy`);
      } else {
        console.error(`✗ Failed to create policy for ${table}:`, error.message);
      }
    }
  }

  console.log("\n✓ RLS setup complete!");
  process.exit(0);
}

enableRLS().catch((err) => {
  console.error("Error enabling RLS:", err);
  process.exit(1);
});
