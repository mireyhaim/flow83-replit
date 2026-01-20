-- Enable Row Level Security (RLS) for all tables
-- This provides defense-in-depth security by restricting data access at the database level

-- Create helper function to get current user ID from session context
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '');
$$ LANGUAGE SQL STABLE;

-- Create helper function to get current participant ID from session context
CREATE OR REPLACE FUNCTION current_participant_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.participant_id', true), '');
$$ LANGUAGE SQL STABLE;

-- Create helper function to check if current request is from admin/service
CREATE OR REPLACE FUNCTION is_service_role() RETURNS BOOLEAN AS $$
  SELECT current_setting('app.role', true) = 'service';
$$ LANGUAGE SQL STABLE;

-- ===============================
-- SESSIONS TABLE
-- ===============================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Sessions are managed by the system only
CREATE POLICY sessions_service_all ON sessions
  FOR ALL USING (is_service_role());

-- ===============================
-- USERS TABLE  
-- ===============================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY users_service_all ON users
  FOR ALL USING (is_service_role());

-- Users can read their own data
CREATE POLICY users_read_own ON users
  FOR SELECT USING (id = current_user_id());

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (id = current_user_id());

-- ===============================
-- JOURNEYS TABLE
-- ===============================
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY journeys_service_all ON journeys
  FOR ALL USING (is_service_role());

-- Mentors can manage their own journeys
CREATE POLICY journeys_owner_all ON journeys
  FOR ALL USING (creator_id = current_user_id());

-- Anyone can read published journeys
CREATE POLICY journeys_read_published ON journeys
  FOR SELECT USING (status = 'published');

-- ===============================
-- JOURNEY_STEPS TABLE
-- ===============================
ALTER TABLE journey_steps ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY journey_steps_service_all ON journey_steps
  FOR ALL USING (is_service_role());

-- Mentors can manage steps for their journeys
CREATE POLICY journey_steps_owner_all ON journey_steps
  FOR ALL USING (
    journey_id IN (SELECT id FROM journeys WHERE creator_id = current_user_id())
  );

-- Participants can read steps for journeys they're enrolled in
CREATE POLICY journey_steps_participant_read ON journey_steps
  FOR SELECT USING (
    journey_id IN (SELECT journey_id FROM participants WHERE id = current_participant_id())
  );

-- ===============================
-- JOURNEY_BLOCKS TABLE
-- ===============================
ALTER TABLE journey_blocks ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY journey_blocks_service_all ON journey_blocks
  FOR ALL USING (is_service_role());

-- Mentors can manage blocks for their journeys
CREATE POLICY journey_blocks_owner_all ON journey_blocks
  FOR ALL USING (
    step_id IN (
      SELECT js.id FROM journey_steps js
      JOIN journeys j ON js.journey_id = j.id
      WHERE j.creator_id = current_user_id()
    )
  );

-- Participants can read blocks for journeys they're enrolled in
CREATE POLICY journey_blocks_participant_read ON journey_blocks
  FOR SELECT USING (
    step_id IN (
      SELECT js.id FROM journey_steps js
      JOIN participants p ON js.journey_id = p.journey_id
      WHERE p.id = current_participant_id()
    )
  );

-- ===============================
-- PARTICIPANTS TABLE
-- ===============================
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY participants_service_all ON participants
  FOR ALL USING (is_service_role());

-- Mentors can read/manage participants in their journeys
CREATE POLICY participants_mentor_all ON participants
  FOR ALL USING (
    journey_id IN (SELECT id FROM journeys WHERE creator_id = current_user_id())
  );

-- Participants can read/update their own record
CREATE POLICY participants_own_read ON participants
  FOR SELECT USING (id = current_participant_id() OR user_id = current_user_id());

CREATE POLICY participants_own_update ON participants
  FOR UPDATE USING (id = current_participant_id() OR user_id = current_user_id());

-- ===============================
-- JOURNEY_MESSAGES TABLE
-- ===============================
ALTER TABLE journey_messages ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY journey_messages_service_all ON journey_messages
  FOR ALL USING (is_service_role());

-- Mentors can read messages for their journeys
CREATE POLICY journey_messages_mentor_read ON journey_messages
  FOR SELECT USING (
    participant_id IN (
      SELECT p.id FROM participants p
      JOIN journeys j ON p.journey_id = j.id
      WHERE j.creator_id = current_user_id()
    )
  );

-- Participants can manage their own messages
CREATE POLICY journey_messages_participant_all ON journey_messages
  FOR ALL USING (participant_id = current_participant_id());

-- ===============================
-- JOURNEY_FEEDBACK TABLE
-- ===============================
ALTER TABLE journey_feedback ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY journey_feedback_service_all ON journey_feedback
  FOR ALL USING (is_service_role());

-- Mentors can read feedback for their journeys
CREATE POLICY journey_feedback_mentor_read ON journey_feedback
  FOR SELECT USING (
    journey_id IN (SELECT id FROM journeys WHERE creator_id = current_user_id())
  );

-- Participants can manage their own feedback
CREATE POLICY journey_feedback_participant_all ON journey_feedback
  FOR ALL USING (participant_id = current_participant_id());

-- ===============================
-- USER_DAY_STATE TABLE
-- ===============================
ALTER TABLE user_day_state ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY user_day_state_service_all ON user_day_state
  FOR ALL USING (is_service_role());

-- Mentors can read day state for participants in their journeys
CREATE POLICY user_day_state_mentor_read ON user_day_state
  FOR SELECT USING (
    participant_id IN (
      SELECT p.id FROM participants p
      JOIN journeys j ON p.journey_id = j.id
      WHERE j.creator_id = current_user_id()
    )
  );

-- Participants can manage their own day state
CREATE POLICY user_day_state_participant_all ON user_day_state
  FOR ALL USING (participant_id = current_participant_id());

-- ===============================
-- NOTIFICATION_SETTINGS TABLE
-- ===============================
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY notification_settings_service_all ON notification_settings
  FOR ALL USING (is_service_role());

-- Users can manage their own notification settings
CREATE POLICY notification_settings_owner_all ON notification_settings
  FOR ALL USING (user_id = current_user_id());

-- ===============================
-- PAYMENTS TABLE
-- ===============================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY payments_service_all ON payments
  FOR ALL USING (is_service_role());

-- Mentors can read payments for their journeys
CREATE POLICY payments_mentor_read ON payments
  FOR SELECT USING (
    mentor_id = current_user_id()
  );

-- ===============================
-- INVOICES TABLE
-- ===============================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY invoices_service_all ON invoices
  FOR ALL USING (is_service_role());

-- Mentors can read their own invoices
CREATE POLICY invoices_mentor_read ON invoices
  FOR SELECT USING (mentor_id = current_user_id());

-- ===============================
-- MENTOR_BUSINESS_PROFILES TABLE
-- ===============================
ALTER TABLE mentor_business_profiles ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY mentor_business_profiles_service_all ON mentor_business_profiles
  FOR ALL USING (is_service_role());

-- Mentors can manage their own business profile
CREATE POLICY mentor_business_profiles_owner_all ON mentor_business_profiles
  FOR ALL USING (user_id = current_user_id());

-- ===============================
-- MENTOR_WALLETS TABLE
-- ===============================
ALTER TABLE mentor_wallets ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY mentor_wallets_service_all ON mentor_wallets
  FOR ALL USING (is_service_role());

-- Mentors can read their own wallet
CREATE POLICY mentor_wallets_owner_read ON mentor_wallets
  FOR SELECT USING (user_id = current_user_id());

-- ===============================
-- WALLET_TRANSACTIONS TABLE
-- ===============================
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY wallet_transactions_service_all ON wallet_transactions
  FOR ALL USING (is_service_role());

-- Mentors can read their own transactions
CREATE POLICY wallet_transactions_owner_read ON wallet_transactions
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM mentor_wallets WHERE user_id = current_user_id())
  );

-- ===============================
-- WITHDRAWAL_REQUESTS TABLE
-- ===============================
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY withdrawal_requests_service_all ON withdrawal_requests
  FOR ALL USING (is_service_role());

-- Mentors can manage their own withdrawal requests
CREATE POLICY withdrawal_requests_owner_all ON withdrawal_requests
  FOR ALL USING (
    wallet_id IN (SELECT id FROM mentor_wallets WHERE user_id = current_user_id())
  );

-- ===============================
-- SYSTEM_ERRORS TABLE
-- ===============================
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;

-- Only service role can access system errors
CREATE POLICY system_errors_service_all ON system_errors
  FOR ALL USING (is_service_role());

-- ===============================
-- ACTIVITY_EVENTS TABLE (if exists)
-- ===============================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_events') THEN
    EXECUTE 'ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY activity_events_service_all ON activity_events FOR ALL USING (is_service_role())';
    EXECUTE 'CREATE POLICY activity_events_mentor_read ON activity_events FOR SELECT USING (creator_id = current_user_id())';
  END IF;
END $$;

-- ===============================
-- EXTERNAL_PAYMENT_SESSIONS TABLE (if exists)
-- ===============================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'external_payment_sessions') THEN
    EXECUTE 'ALTER TABLE external_payment_sessions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY external_payment_sessions_service_all ON external_payment_sessions FOR ALL USING (is_service_role())';
  END IF;
END $$;
