import { storage } from './storage';
import {
  sendInactivityReminderEmail,
  sendNotStartedReminderEmail,
  sendCompletionEmail
} from './email';

// Use production domain first, then fall back to dev domain
const getProductionDomain = () => {
  // REPLIT_DOMAINS contains the deployed app domain
  const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
  // Find a domain that doesn't contain 'dev' (production domain)
  const productionDomain = domains.find(d => !d.includes('.dev') && !d.includes('janeway'));
  if (productionDomain) return `https://${productionDomain}`;
  // Fall back to first available domain
  if (domains[0]) return `https://${domains[0]}`;
  // Fall back to custom domain
  return 'https://flow83.com';
};

const BASE_URL = getProductionDomain();

export async function processEmailNotifications(): Promise<{
  inactivityReminders: number;
  notStartedReminders: number;
  completionEmails: number;
}> {
  console.log('[EmailCron] Starting email notification processing...');
  
  const results = {
    inactivityReminders: 0,
    notStartedReminders: 0,
    completionEmails: 0
  };

  try {
    const allJourneys = await storage.getJourneys();
    const now = new Date();

    for (const journey of allJourneys) {
      if (!journey.creatorId) continue;
      
      const steps = await storage.getJourneySteps(journey.id);
      const totalSteps = steps.length;
      
      const mentorUser = await storage.getUser(journey.creatorId);
      const participants = await storage.getParticipants(journey.id);

      for (const participant of participants) {
        if (!participant.email) continue;

        const journeyLink = `${BASE_URL}/p/${participant.accessToken}`;
        const registeredAt = participant.startedAt || new Date();
        const daysSinceRegistration = Math.floor((now.getTime() - new Date(registeredAt).getTime()) / (24 * 60 * 60 * 1000));
        const lastActive = participant.lastActiveAt || participant.startedAt || new Date();
        const daysSinceActive = Math.floor((now.getTime() - new Date(lastActive).getTime()) / (24 * 60 * 60 * 1000));
        
        const currentDay = participant.currentDay || 1;

        if (participant.completedAt) {
          continue;
        }

        // Check if we already sent a reminder recently (within 3 days)
        const lastReminderSent = participant.lastReminderSentAt;
        if (lastReminderSent) {
          const daysSinceLastReminder = Math.floor((now.getTime() - new Date(lastReminderSent).getTime()) / (24 * 60 * 60 * 1000));
          if (daysSinceLastReminder < 3) {
            // Already sent a reminder within the last 3 days, skip
            continue;
          }
        }
        
        // Limit total reminders to 3 per participant
        const reminderCount = participant.reminderCount || 0;
        if (reminderCount >= 3) {
          continue;
        }

        // Check if participant never actually started the flow (conversationState is still START)
        const hasNeverStarted = participant.conversationState === 'START';
        
        // Get addressing style from participant onboarding config
        const addressingStyle = (participant.userOnboardingConfig as { addressing_style?: 'female' | 'male' | 'neutral' })?.addressing_style || 'neutral';

        let emailSent = false;

        if (hasNeverStarted && daysSinceRegistration >= 2) {
          // Send "not started" reminder for participants who registered 2+ days ago but never entered
          try {
            await sendNotStartedReminderEmail({
              participantEmail: participant.email,
              participantName: participant.name || 'משתתף/ת',
              journeyName: journey.name,
              journeyLink,
              daysSinceRegistration,
              mentorName: mentorUser?.firstName || undefined,
              language: (journey.language as 'he' | 'en') || 'he',
              addressingStyle
            });
            results.notStartedReminders++;
            emailSent = true;
            console.log(`[EmailCron] Sent not-started reminder to ${participant.email}`);
          } catch (error) {
            console.error(`[EmailCron] Failed to send not-started reminder to ${participant.email}:`, error);
          }
        } else if (!hasNeverStarted && daysSinceActive >= 2 && daysSinceActive <= 5) {
          // Send inactivity reminder for participants who started but haven't been active
          try {
            await sendInactivityReminderEmail({
              participantEmail: participant.email,
              participantName: participant.name || 'משתתף/ת',
              journeyName: journey.name,
              journeyLink,
              daysSinceActive,
              currentDay,
              mentorName: mentorUser?.firstName || undefined,
              language: (journey.language as 'he' | 'en') || 'he',
              addressingStyle
            });
            results.inactivityReminders++;
            emailSent = true;
            console.log(`[EmailCron] Sent inactivity reminder to ${participant.email}`);
          } catch (error) {
            console.error(`[EmailCron] Failed to send inactivity reminder to ${participant.email}:`, error);
          }
        }
        
        // Update participant reminder tracking if email was sent
        if (emailSent) {
          try {
            await storage.updateParticipantReminderSent(participant.id);
          } catch (error) {
            console.error(`[EmailCron] Failed to update reminder tracking for ${participant.email}:`, error);
          }
        }
      }
    }

    console.log(`[EmailCron] Completed: ${results.inactivityReminders} inactivity, ${results.notStartedReminders} not-started reminders sent`);
    return results;
  } catch (error) {
    console.error('[EmailCron] Error processing email notifications:', error);
    throw error;
  }
}

export async function sendCompletionNotification(participantId: string): Promise<boolean> {
  try {
    const participant = await storage.getParticipantById(participantId);
    if (!participant?.email) return false;

    const journey = await storage.getJourney(participant.journeyId);
    if (!journey) return false;

    const steps = await storage.getJourneySteps(journey.id);
    const mentorUser = journey.creatorId ? await storage.getUser(journey.creatorId) : null;

    // Get addressing style from participant onboarding config
    const addressingStyle = (participant.userOnboardingConfig as { addressing_style?: 'female' | 'male' | 'neutral' })?.addressing_style || 'neutral';

    await sendCompletionEmail({
      participantEmail: participant.email,
      participantName: participant.name || 'משתתף/ת',
      journeyName: journey.name,
      totalDays: steps.length,
      mentorName: mentorUser?.firstName || undefined,
      language: (journey.language as 'he' | 'en') || 'he',
      addressingStyle
    });

    console.log(`[EmailCron] Sent completion email to ${participant.email}`);
    return true;
  } catch (error) {
    console.error('[EmailCron] Failed to send completion notification:', error);
    return false;
  }
}

let dailyCronInterval: NodeJS.Timeout | null = null;

export function startEmailCron(): void {
  console.log('[EmailCron] Initializing email cron jobs...');

  const runDailyAt9AM = () => {
    const now = new Date();
    const next9AM = new Date();
    next9AM.setHours(9, 0, 0, 0);
    
    if (now >= next9AM) {
      next9AM.setDate(next9AM.getDate() + 1);
    }
    
    const msUntil9AM = next9AM.getTime() - now.getTime();
    
    console.log(`[EmailCron] Next daily email run scheduled for ${next9AM.toISOString()}`);
    
    setTimeout(() => {
      processEmailNotifications().catch(console.error);
      dailyCronInterval = setInterval(() => {
        processEmailNotifications().catch(console.error);
      }, 24 * 60 * 60 * 1000);
    }, msUntil9AM);
  };

  runDailyAt9AM();
}

export function stopEmailCron(): void {
  if (dailyCronInterval) {
    clearInterval(dailyCronInterval);
    dailyCronInterval = null;
  }
  console.log('[EmailCron] Email cron jobs stopped');
}
