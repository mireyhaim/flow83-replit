import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { db, setServiceContext } from "./db";
import { sql } from "drizzle-orm";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { insertJourneySchema, insertJourneyStepSchema, insertJourneyBlockSchema, insertParticipantSchema } from "@shared/schema";
import { generateJourneyContent, generateChatResponse, generateDayOpeningMessage, generateFlowDays, generateDaySummary, generateParticipantSummary, generateJourneySummary, generateLandingPageContent, analyzeMentorContent, detectPhaseTransition, generateChatResponseWithDirector, initializeDirectorState, toDirectorPhase, generateChatResponseWithFacilitator, extractInsightFromMessage, extractCurrentBelief, generateDaySummaryForState, type ConversationPhase } from "./ai";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { SUBSCRIPTION_PLANS, calculateCommission, type PlanType } from "./subscriptionService";
import { sendJourneyAccessEmail, sendNewParticipantNotification, sendFlowApprovalRequestEmail, sendFlowApprovedEmail } from "./email";
import { processEmailNotifications, sendCompletionNotification } from "./emailCron";
import multer from "multer";
import mammoth from "mammoth";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// Generate a unique 6-character short code for flow URLs
function generateShortCode(): string {
  return Date.now().toString(36).slice(-3) + Math.random().toString(36).slice(2, 5);
}

// Get production URL for email links (prefer production domain over dev domain)
function getProductionBaseUrl(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
  // Find a domain that doesn't contain 'dev' or 'janeway' (production domain)
  const productionDomain = domains.find(d => !d.includes('.dev') && !d.includes('janeway'));
  if (productionDomain) return `https://${productionDomain}`;
  // Fall back to first available domain
  if (domains[0]) return `https://${domains[0]}`;
  // Fall back to custom domain
  return 'https://flow83.com';
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // RLS Context Middleware - Set appropriate context for all API requests
  // For authenticated requests: sets user context for true defense-in-depth
  // For unauthenticated requests: sets service role for public endpoints
  app.use('/api', async (req: any, res, next) => {
    try {
      const userId = req.user?.claims?.sub;
      if (userId) {
        // Authenticated request - set user context for RLS enforcement
        await db.execute(sql`SELECT 
          set_config('app.user_id', ${userId}, true),
          set_config('app.participant_id', '', true),
          set_config('app.role', 'service', true)
        `);
      } else {
        // Unauthenticated request - use service role for public endpoints
        await setServiceContext();
      }
      next();
    } catch (error) {
      console.error('Failed to set RLS context:', error);
      next();
    }
  });
  
  // Setup Replit Auth (Google, GitHub, email, etc.)
  await setupAuth(app);
  registerAuthRoutes(app);

  // Test email endpoint (for verifying Resend connection)
  app.post('/api/test-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ success: false, error: 'No email found for user' });
      }

      const result = await sendJourneyAccessEmail({
        participantEmail: user.email,
        participantName: user.firstName || 'Test User',
        journeyName: 'Test Flow',
        journeyLink: `${process.env.REPLIT_DOMAINS?.split(',')[0] ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://flow83.replit.app'}/dashboard`,
        mentorName: 'Flow 83 Team',
        language: 'he'
      });

      if (result) {
        res.json({ success: true, message: `Test email sent to ${user.email}` });
      } else {
        res.status(500).json({ success: false, error: 'Failed to send email' });
      }
    } catch (error: any) {
      console.error('Test email error:', error);
      res.status(500).json({ success: false, error: error.message || 'Unknown error' });
    }
  });

  // Update user profile
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { firstName, lastName, email, bio, website, specialty, methodology, uniqueApproach } = req.body;
      
      const user = await storage.upsertUser({
        id: userId,
        firstName,
        lastName,
        email,
        bio,
        website,
        specialty,
        methodology,
        uniqueApproach,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Accept Terms of Service and Privacy Policy
  app.post('/api/user/accept-terms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      await storage.updateUser(userId, {
        termsAcceptedAt: new Date(),
      });
      
      res.json({ success: true, termsAcceptedAt: new Date() });
    } catch (error) {
      console.error("Error accepting terms:", error);
      res.status(500).json({ error: "Failed to accept terms" });
    }
  });

  // Upload profile image
  app.post('/api/profile/image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const file = req.file as Express.Multer.File;
      
      if (!file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image." });
      }

      // Convert to base64 data URL for storage
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64}`;

      // Update user profile with image URL
      const user = await storage.updateUserProfileImage(userId, dataUrl);
      
      res.json({ profileImageUrl: user.profileImageUrl });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  
  // Journey routes - public read returns only published flows from active mentors
  app.get("/api/journeys", async (req, res) => {
    try {
      const journeys = await storage.getJourneys();
      // Only return published journeys for public access (security)
      const publishedJourneys = journeys.filter(j => j.status === "published");
      
      // No trial filtering in new pricing model - all published journeys are visible
      res.json(publishedJourneys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flows" });
    }
  });

  // Get current user's journeys
  app.get("/api/journeys/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const journeys = await storage.getJourneysByCreator(userId);
      res.json(journeys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your flows" });
    }
  });

  // Get archived journeys for a mentor (must be before :id route)
  app.get("/api/journeys/archived", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const archived = await storage.getArchivedJourneysByCreator(userId);
      res.json(archived);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch archived flows" });
    }
  });

  // Get subscription plan status for current user
  app.get("/api/subscription-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // New pricing model - return plan info
      const plan = (user.subscriptionPlan as PlanType) || 'free';
      const planDetails = SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.free;
      res.json({
        plan,
        planName: planDetails.name,
        planNameHe: planDetails.nameHe,
        commissionRate: planDetails.commissionRate,
        monthlyFee: planDetails.amount / 100, // Convert from agorot to ILS
        isActive: true, // All plans are active in new model
        planChangedAt: user.planChangedAt?.toISOString() || null, // When plan was last changed
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  // Get dashboard stats for current user (optimized with parallel queries)
  app.get("/api/stats/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const journeys = await storage.getJourneysByCreator(userId);
      
      if (journeys.length === 0) {
        return res.json({
          totalJourneys: 0,
          publishedJourneys: 0,
          draftJourneys: 0,
          totalParticipants: 0,
          activeParticipants: 0,
          completedParticipants: 0,
          completionRate: 0,
        });
      }
      
      // Fetch all participants and steps in parallel for all journeys
      const [allParticipantsResults, allStepsResults] = await Promise.all([
        Promise.all(journeys.map(j => storage.getParticipants(j.id))),
        Promise.all(journeys.map(j => storage.getJourneySteps(j.id)))
      ]);
      
      let totalParticipants = 0;
      let activeParticipants = 0;
      let completedParticipants = 0;
      
      for (let i = 0; i < journeys.length; i++) {
        const participants = allParticipantsResults[i];
        const steps = allStepsResults[i];
        const totalDays = steps.length || 7;
        
        totalParticipants += participants.length;
        
        for (const p of participants) {
          if ((p.currentDay ?? 1) > totalDays) {
            completedParticipants++;
          } else {
            activeParticipants++;
          }
        }
      }
      
      const completionRate = totalParticipants > 0 
        ? Math.round((completedParticipants / totalParticipants) * 100) 
        : 0;
      
      res.json({
        totalJourneys: journeys.length,
        publishedJourneys: journeys.filter(j => j.status === "published").length,
        draftJourneys: journeys.filter(j => j.status === "draft").length,
        totalParticipants,
        activeParticipants,
        completedParticipants,
        completionRate,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get recent activity for creator's dashboard
  app.get("/api/activity/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const events = await storage.getActivityEvents(userId, 10);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // Get inactive participants needing attention
  app.get("/api/participants/inactive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const daysSinceActive = parseInt(req.query.days as string) || 3;
      const inactive = await storage.getInactiveParticipants(userId, daysSinceActive);
      res.json(inactive);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inactive participants" });
    }
  });

  // Get all participants for mentor dashboard
  app.get("/api/participants/all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const participants = await storage.getParticipantsWithJourneyByCreator(userId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Resend journey access email to participant
  app.post("/api/participants/:id/resend-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const participantId = req.params.id;
      console.log(`[ResendEmail] Request for participant ${participantId} by user ${userId}`);
      
      const participant = await storage.getParticipantById(participantId);
      if (!participant) {
        console.log(`[ResendEmail] Participant ${participantId} not found`);
        return res.status(404).json({ error: "Participant not found" });
      }
      
      if (!participant.email) {
        return res.status(400).json({ error: "Participant has no email" });
      }
      
      const journey = await storage.getJourney(participant.journeyId);
      if (!journey || journey.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const mentor = await storage.getUser(userId);
      const baseUrl = getProductionBaseUrl();
      const journeyLink = `${baseUrl}/p/${participant.accessToken}`;
      
      console.log(`[ResendEmail] Sending email to ${participant.email} for journey ${journey.name}`);
      
      const success = await sendJourneyAccessEmail({
        participantEmail: participant.email,
        participantName: participant.name || participant.email.split('@')[0],
        participantIdNumber: participant.idNumber || undefined,
        journeyName: journey.name,
        journeyLink,
        mentorName: mentor?.firstName || undefined,
        language: (journey.language as 'he' | 'en') || 'he'
      });
      
      if (success) {
        console.log(`[ResendEmail] Email sent successfully to ${participant.email}`);
        res.json({ success: true, message: "Email sent successfully" });
      } else {
        console.log(`[ResendEmail] Failed to send email to ${participant.email}`);
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("[ResendEmail] Error:", error);
      res.status(500).json({ error: "Failed to resend email" });
    }
  });

  // Notification settings routes
  app.get("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const settings = await storage.getNotificationSettings(userId);
      if (!settings) {
        // Return defaults if no settings exist
        return res.json({
          userId,
          notifyOnJoin: "email",
          notifyOnDayComplete: "none",
          notifyOnFlowComplete: "email",
          notifyOnInactivity: "email",
          inactivityThresholdDays: 2,
          dailySummary: "none",
          weeklySummary: "email",
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const body = req.body;
      
      // Validate required fields are present
      const notifyOptionSchema = z.enum(["email", "none"]);
      const validationSchema = z.object({
        notifyOnJoin: notifyOptionSchema,
        notifyOnDayComplete: notifyOptionSchema,
        notifyOnFlowComplete: notifyOptionSchema,
        notifyOnInactivity: notifyOptionSchema,
        inactivityThresholdDays: z.number().min(1).max(7),
        dailySummary: notifyOptionSchema,
        weeklySummary: notifyOptionSchema,
      });
      
      const parsed = validationSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid notification settings", details: parsed.error.issues });
      }
      
      const settings = await storage.upsertNotificationSettings({
        userId,
        ...parsed.data,
      });
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Mentor earnings endpoints
  app.get("/api/earnings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      const totalCents = await storage.getTotalEarningsByMentor(userId);
      const payments = await storage.getPaymentsByMentor(userId);
      
      // Get user's plan and calculate commission breakdown
      const plan = (user?.subscriptionPlan as PlanType) || 'free';
      const grossAmount = totalCents / 100;
      const commissionBreakdown = calculateCommission(grossAmount, plan);
      
      res.json({ 
        totalEarnings: commissionBreakdown.netAmount, // Net after commission
        grossEarnings: grossAmount,
        commissionFees: commissionBreakdown.commissionAmount,
        commissionRate: commissionBreakdown.commissionRate,
        plan,
        totalCents,
        currency: "ILS",
        paymentCount: payments.length,
        recentPayments: payments.slice(0, 10).map(p => {
          const paymentCommission = calculateCommission(p.amount / 100, plan);
          return {
            id: p.id,
            amount: p.amount / 100,
            netAmount: paymentCommission.netAmount,
            commissionFee: paymentCommission.commissionAmount,
            currency: p.currency,
            customerEmail: p.customerEmail,
            customerName: p.customerName,
            createdAt: p.createdAt,
          };
        }),
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });

  // Mentor business profile endpoints
  app.get("/api/mentor/business-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const profile = await storage.getMentorBusinessProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching business profile:", error);
      res.status(500).json({ error: "Failed to fetch business profile" });
    }
  });

  app.post("/api/mentor/business-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { 
        businessName, businessType, businessId, vatRegistered,
        businessAddress, businessCity, businessPostalCode,
        bankName, bankBranch, bankAccountNumber, bankAccountName,
        selfBillingAgreed
      } = req.body;

      const profile = await storage.upsertMentorBusinessProfile({
        userId,
        businessName,
        businessType,
        businessId,
        vatRegistered: !!vatRegistered,
        businessAddress,
        businessCity,
        businessPostalCode,
        bankName,
        bankBranch,
        bankAccountNumber,
        bankAccountName,
        selfBillingAgreedAt: selfBillingAgreed ? new Date() : null,
        selfBillingAgreementVersion: selfBillingAgreed ? "1.0" : null,
        verificationStatus: "pending",
      });

      res.json(profile);
    } catch (error) {
      console.error("Error saving business profile:", error);
      res.status(500).json({ error: "Failed to save business profile" });
    }
  });

  // Report error endpoint - for mentors to report issues that need admin attention
  app.post("/api/report-error", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      const { errorType, errorMessage, context } = req.body;
      
      await storage.createSystemError({
        errorType: errorType || 'mentor_report',
        errorMessage: errorMessage || 'User reported an issue',
        errorStack: JSON.stringify(context || {}),
        userId: userId,
        relatedEntityType: context?.journeyId ? 'journey' : null,
        relatedEntityId: context?.journeyId || null,
        resolved: false,
      });
      
      console.log(`[Report Error] User ${user?.firstName || userId} reported: ${errorType} - ${errorMessage}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error reporting issue:", error);
      res.status(500).json({ error: "Failed to report issue" });
    }
  });

  // Mentor wallet endpoints
  app.get("/api/mentor/wallet", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const wallet = await storage.getOrCreateMentorWallet(userId);
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  app.get("/api/mentor/wallet/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const wallet = await storage.getMentorWallet(userId);
      if (!wallet) {
        return res.json([]);
      }
      const transactions = await storage.getWalletTransactions(wallet.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Monthly report endpoint
  app.get("/api/mentor/monthly-report", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const report = await storage.getMonthlyReport(userId, year, month);
      res.json(report);
    } catch (error) {
      console.error("Error fetching monthly report:", error);
      res.status(500).json({ error: "Failed to fetch monthly report" });
    }
  });

  // Mentor invoices endpoints
  app.get("/api/mentor/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const invoiceList = await storage.getInvoicesByMentor(userId);
      res.json(invoiceList);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  // Withdrawal request endpoints
  app.get("/api/mentor/withdrawals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const withdrawals = await storage.getWithdrawalRequestsByMentor(userId);
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  app.post("/api/mentor/withdrawals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      
      // Get wallet and verify balance
      const wallet = await storage.getMentorWallet(userId);
      const walletBalance = wallet?.balance ?? 0;
      if (!wallet || walletBalance <= 0) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Get business profile for bank details
      const profile = await storage.getMentorBusinessProfile(userId);
      if (!profile) {
        return res.status(400).json({ error: "Business profile required for withdrawal" });
      }

      if (!profile.selfBillingAgreedAt) {
        return res.status(400).json({ error: "Self-billing agreement required" });
      }

      if (!profile.bankAccountNumber || !profile.bankName) {
        return res.status(400).json({ error: "Bank details required for withdrawal" });
      }

      // Process withdrawal atomically in a transaction
      const result = await storage.processWithdrawal({
        userId,
        wallet,
        profile,
      });

      res.json({ 
        withdrawal: result.withdrawal, 
        invoice: result.invoice,
        message: "Withdrawal request created successfully" 
      });
    } catch (error: any) {
      console.error("Error creating withdrawal:", error);
      if (error.message === "Insufficient balance") {
        return res.status(409).json({ error: "Insufficient balance - concurrent withdrawal detected" });
      }
      // Handle unique constraint violations after retry exhaustion
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        return res.status(409).json({ error: "Concurrent withdrawal - please try again" });
      }
      res.status(500).json({ error: "Failed to create withdrawal request" });
    }
  });

  // Mentor feedback endpoint - get all feedback with journey/participant details
  app.get("/api/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const feedbackList = await storage.getFeedbackByMentorWithDetails(userId);
      res.json(feedbackList.map(item => ({
        id: item.feedback.id,
        rating: item.feedback.rating,
        comment: item.feedback.comment,
        dayNumber: item.feedback.dayNumber,
        feedbackType: item.feedback.feedbackType,
        createdAt: item.feedback.createdAt,
        journeyName: item.journeyName || "Unknown Flow",
        participantName: item.participantName || item.participantEmail || "Anonymous",
      })));
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.get("/api/journeys/:id", async (req, res) => {
    try {
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }
      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flow" });
    }
  });

  app.post("/api/journeys", isAuthenticated, async (req: any, res) => {
    console.log("[journey] POST /api/journeys - Creating new journey");
    try {
      const userId = (req.user as any)?.claims?.sub;
      console.log("[journey] User ID:", userId);
      
      // No trial restrictions in new pricing model - anyone can create flows
      
      const data = { ...req.body, creatorId: userId };
      const parsed = insertJourneySchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const journey = await storage.createJourney(parsed.data);
      res.status(201).json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to create flow" });
    }
  });

  app.put("/api/journeys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const existingJourney = await storage.getJourney(req.params.id);
      if (!existingJourney) {
        return res.status(404).json({ error: "Flow not found" });
      }

      // No restrictions in new pricing model - unlimited edits and publishes for all plans
      const userId = req.user?.claims?.sub;

      // Generate short code when publishing for the first time
      let updateData = { ...req.body };
      if (req.body.status === "published" && !existingJourney.shortCode) {
        updateData.shortCode = generateShortCode();
      }

      // Handle approval status change to pending_approval
      if (req.body.approvalStatus === "pending_approval" && existingJourney.approvalStatus !== "pending_approval") {
        updateData.submittedForApprovalAt = new Date();
        
        // Generate short code if not already set
        if (!existingJourney.shortCode && !updateData.shortCode) {
          updateData.shortCode = generateShortCode();
        }
        
        // Generate landing page content if not already set
        if (!existingJourney.landingPageContent) {
          try {
            const steps = await storage.getJourneySteps(req.params.id);
            let mentorName = "";
            if (existingJourney.creatorId) {
              const mentor = await storage.getUser(existingJourney.creatorId);
              mentorName = mentor ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() : "";
            }
            
            const landingContent = await generateLandingPageContent({
              name: existingJourney.name,
              goal: existingJourney.goal || "",
              audience: existingJourney.audience || "",
              duration: existingJourney.duration || 7,
              description: existingJourney.description || "",
              mentorName,
              language: existingJourney.language || undefined,
              steps: steps.map(s => ({
                title: s.title,
                goal: s.goal || "",
                explanation: s.explanation || "",
              })),
            });
            updateData.landingPageContent = landingContent;
          } catch (landingError) {
            console.error("Failed to generate landing page content:", landingError);
          }
        }
        
        // Send email notification to admin
        const baseUrl = getProductionBaseUrl();
        const mentor = existingJourney.creatorId ? await storage.getUser(existingJourney.creatorId) : null;
        const mentorName = mentor ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() : "Unknown";
        const mentorEmail = mentor?.email || "";
        
        // Send to admin (using the ADMIN_USERNAME secret which should be admin email)
        const adminEmail = process.env.ADMIN_USERNAME;
        if (adminEmail) {
          sendFlowApprovalRequestEmail({
            adminEmail,
            mentorName,
            mentorEmail,
            flowName: existingJourney.name,
            flowPrice: req.body.price || existingJourney.price || 0,
            flowId: req.params.id,
            adminDashboardLink: `${baseUrl}/admin/ann83`
          }).catch(err => console.error("Failed to send admin notification:", err));
        }
      }

      // Generate landing page content when publishing for the first time
      if (req.body.status === "published" && !existingJourney.landingPageContent) {
        try {
          const steps = await storage.getJourneySteps(req.params.id);
          let mentorName = "";
          if (existingJourney.creatorId) {
            const mentor = await storage.getUser(existingJourney.creatorId);
            mentorName = mentor ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() : "";
          }
          
          const landingContent = await generateLandingPageContent({
            name: existingJourney.name,
            goal: existingJourney.goal || "",
            audience: existingJourney.audience || "",
            duration: existingJourney.duration || 7,
            description: existingJourney.description || "",
            mentorName,
            language: existingJourney.language || undefined,
            steps: steps.map(s => ({
              title: s.title,
              goal: s.goal || "",
              explanation: s.explanation || "",
            })),
          });
          updateData.landingPageContent = landingContent;
        } catch (landingError) {
          console.error("Failed to generate landing page content:", landingError);
        }
      }

      const journey = await storage.updateJourney(req.params.id, updateData);
      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to update flow" });
    }
  });

  // Regenerate landing page content on demand
  app.post("/api/journeys/:id/regenerate-landing", isAuthenticated, async (req: any, res) => {
    try {
      // No restrictions in new pricing model
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      const steps = await storage.getJourneySteps(req.params.id);
      let mentorName = "";
      if (journey.creatorId) {
        const mentor = await storage.getUser(journey.creatorId);
        mentorName = mentor ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() : "";
      }

      const landingContent = await generateLandingPageContent({
        name: journey.name,
        goal: journey.goal || "",
        audience: journey.audience || "",
        duration: journey.duration || 7,
        description: journey.description || "",
        mentorName,
        language: journey.language || undefined,
        steps: steps.map(s => ({
          title: s.title,
          goal: s.goal || "",
          explanation: s.explanation || "",
        })),
      });

      const updatedJourney = await storage.updateJourney(req.params.id, {
        landingPageContent: landingContent,
      });

      res.json(updatedJourney);
    } catch (error) {
      console.error("Failed to regenerate landing page:", error);
      res.status(500).json({ error: "Failed to regenerate landing page" });
    }
  });

  // Get journey by short code (for short links)
  app.get("/api/journeys/code/:shortCode", async (req, res) => {
    try {
      const journey = await storage.getJourneyByShortCode(req.params.shortCode);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      // No trial restrictions in new pricing model - all published flows are accessible
      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flow" });
    }
  });

  app.delete("/api/journeys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Check ownership first
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }
      if (journey.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this flow" });
      }
      
      // No trial restrictions in new pricing model
      
      // Check if this flow has participants - if so, block hard delete
      const participantCount = await storage.getJourneyParticipantCount(req.params.id);
      if (participantCount > 0) {
        return res.status(400).json({ 
          error: "has_participants", 
          participantCount,
          message: "Cannot delete a flow with participants. Archive it instead to protect their access."
        });
      }
      
      await storage.deleteJourney(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete flow" });
    }
  });

  // Archive a journey (soft delete - participants keep access)
  app.post("/api/journeys/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      if (journey.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized to archive this flow" });
      }
      
      const archived = await storage.archiveJourney(req.params.id, userId);
      res.json(archived);
    } catch (error) {
      console.error("Failed to archive flow:", error);
      res.status(500).json({ error: "Failed to archive flow" });
    }
  });

  // Restore an archived journey
  app.post("/api/journeys/:id/restore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      if (journey.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized to restore this flow" });
      }
      
      const restored = await storage.restoreJourney(req.params.id);
      res.json(restored);
    } catch (error) {
      console.error("Failed to restore flow:", error);
      res.status(500).json({ error: "Failed to restore flow" });
    }
  });

  // Get participant count for a journey
  app.get("/api/journeys/:id/participant-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }
      if (journey.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized to access this flow" });
      }
      
      const count = await storage.getJourneyParticipantCount(req.params.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get participant count" });
    }
  });

  // Journey with full details (steps + blocks) - optimized with parallel queries
  app.get("/api/journeys/:id/full", async (req, res) => {
    try {
      const journeyId = req.params.id;
      
      // Run all queries in parallel for better performance
      const [journey, steps, allBlocks] = await Promise.all([
        storage.getJourney(journeyId),
        storage.getJourneySteps(journeyId),
        storage.getAllBlocksForJourney(journeyId),
      ]);
      
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }
      
      // No trial restrictions in new pricing model - all published flows are accessible
      
      // Get mentor in parallel if needed
      const mentor = journey.creatorId ? await storage.getUser(journey.creatorId) : null;
      
      // Group blocks by stepId in memory (much faster than N queries)
      const blocksByStep = new Map<string, typeof allBlocks>();
      for (const block of allBlocks) {
        const existing = blocksByStep.get(block.stepId) || [];
        existing.push(block);
        blocksByStep.set(block.stepId, existing);
      }
      
      const stepsWithBlocks = steps.map(step => ({
        ...step,
        blocks: blocksByStep.get(step.id) || [],
      }));
      
      res.json({ ...journey, steps: stepsWithBlocks, mentor });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flow details" });
    }
  });

  // Journey steps routes
  app.get("/api/journeys/:journeyId/steps", async (req, res) => {
    try {
      const steps = await storage.getJourneySteps(req.params.journeyId);
      res.json(steps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch steps" });
    }
  });

  app.post("/api/journeys/:journeyId/steps", isAuthenticated, async (req: any, res) => {
    try {
      // No trial restrictions in new pricing model
      const data = { ...req.body, journeyId: req.params.journeyId };
      const parsed = insertJourneyStepSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const step = await storage.createJourneyStep(parsed.data);
      res.status(201).json(step);
    } catch (error) {
      res.status(500).json({ error: "Failed to create step" });
    }
  });

  app.put("/api/steps/:id", isAuthenticated, async (req: any, res) => {
    try {
      // No trial restrictions in new pricing model
      const step = await storage.updateJourneyStep(req.params.id, req.body);
      if (!step) {
        return res.status(404).json({ error: "Step not found" });
      }
      res.json(step);
    } catch (error) {
      res.status(500).json({ error: "Failed to update step" });
    }
  });

  app.delete("/api/steps/:id", isAuthenticated, async (req: any, res) => {
    try {
      // No trial restrictions in new pricing model
      await storage.deleteJourneyStep(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete step" });
    }
  });

  // Journey blocks routes
  app.get("/api/steps/:stepId/blocks", async (req, res) => {
    try {
      const blocks = await storage.getJourneyBlocks(req.params.stepId);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blocks" });
    }
  });

  app.post("/api/steps/:stepId/blocks", isAuthenticated, async (req: any, res) => {
    try {
      // No trial restrictions in new pricing model
      const data = { ...req.body, stepId: req.params.stepId };
      const parsed = insertJourneyBlockSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const block = await storage.createJourneyBlock(parsed.data);
      res.status(201).json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to create block" });
    }
  });

  app.put("/api/blocks/:id", isAuthenticated, async (req: any, res) => {
    try {
      // No trial restrictions in new pricing model
      const block = await storage.updateJourneyBlock(req.params.id, req.body);
      if (!block) {
        return res.status(404).json({ error: "Block not found" });
      }
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to update block" });
    }
  });

  app.delete("/api/blocks/:id", isAuthenticated, async (req: any, res) => {
    try {
      // No trial restrictions in new pricing model
      await storage.deleteJourneyBlock(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete block" });
    }
  });

  // Participant routes
  app.get("/api/participants/journey/:journeyId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const journeyId = req.params.journeyId;
      
      let participant = await storage.getParticipant(userId, journeyId);
      
      if (!participant) {
        // No participant limits in new pricing model - unlimited participants for all plans
        const journey = await storage.getJourney(journeyId);
        
        const parsed = insertParticipantSchema.safeParse({
          userId,
          journeyId,
          currentDay: 1,
          completedBlocks: [],
        });
        if (!parsed.success) {
          return res.status(400).json({ error: parsed.error.issues });
        }
        participant = await storage.createParticipant(parsed.data);
        
        // Create activity event for joining (reuse journey from above)
        const user = await storage.getUser(userId);
        if (journey?.creatorId) {
          await storage.createActivityEvent({
            creatorId: journey.creatorId,
            participantId: participant.id,
            journeyId,
            eventType: 'joined',
            eventData: {
              userName: user?.firstName || user?.email || 'Someone',
              journeyName: journey.name,
            },
          });
          
        }
      }
      
      res.json(participant);
    } catch (error) {
      console.error("Error fetching participant:", error);
      res.status(500).json({ error: "Failed to fetch participant" });
    }
  });

  app.put("/api/participants/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { id } = req.params;
      const { journeyId } = req.body;
      
      const existingParticipant = await storage.getParticipant(userId, journeyId);
      if (!existingParticipant || existingParticipant.id !== id) {
        return res.status(403).json({ error: "Not authorized to update this participant" });
      }
      
      const participant = await storage.updateParticipant(id, req.body);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update participant" });
    }
  });

  // Validation schema for onboarding config
  const onboardingConfigSchema = z.object({
    addressing_style: z.enum(["female", "male", "neutral"]),
    tone_preference: z.enum(["direct", "balanced", "soft"]),
  });

  app.post("/api/participants/:id/onboarding-config", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { id } = req.params;
      
      const parseResult = onboardingConfigSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid onboarding config", details: parseResult.error.errors });
      }
      const config = parseResult.data;
      
      const participant = await storage.getParticipantById(id);
      if (!participant || participant.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      await storage.updateParticipant(id, {
        userOnboardingConfig: config,
        conversationState: "MICRO_ONBOARDING",
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving onboarding config:", error);
      res.status(500).json({ error: "Failed to save onboarding config" });
    }
  });

  app.post("/api/participants/:id/complete-day", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { id } = req.params;
      const { dayNumber, journeyId } = req.body;
      
      const existingParticipant = await storage.getParticipant(userId, journeyId);
      if (!existingParticipant || existingParticipant.id !== id) {
        return res.status(403).json({ error: "Not authorized to complete this day" });
      }
      
      const steps = await storage.getJourneySteps(journeyId);
      const totalDays = steps.length || 7;
      const currentStep = steps.find(s => s.dayNumber === dayNumber);
      
      const nextDay = Math.min(dayNumber + 1, totalDays + 1);
      const isJourneyComplete = nextDay > totalDays;
      
      // PRD 7.2 - Generate user summary at day completion
      if (currentStep) {
        try {
          const allMessages = await storage.getMessages(id, currentStep.id);
          
          // Filter out any existing summary messages to avoid feedback loops
          const messages = allMessages.filter(m => !m.isSummary);
          
          // Get actual mentor name from journey creator
          const journey = await storage.getJourney(journeyId);
          const mentor = journey?.creatorId ? await storage.getUser(journey.creatorId) : null;
          
          // Mentor name is required for personalization - use journey name as backup context
          const mentorName = mentor?.firstName 
            ? `${mentor.firstName}${mentor.lastName ? ' ' + mentor.lastName : ''}`
            : journey?.name || "Guide";
          
          // Convert messages to structured conversation format
          const conversation = messages.map(m => ({
            role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.content,
          }));
          
          if (conversation.length > 0) {
            // Generate internal summary for AI memory
            const summary = await generateDaySummary({
              conversation,
              dayGoal: currentStep.goal || currentStep.description || "Day goal",
              dayTask: currentStep.task || "Day task",
              mentorName,
            });
            
            // Generate participant-visible summary
            const participantSummary = await generateParticipantSummary({
              conversation,
              dayNumber,
              totalDays,
              dayTitle: currentStep.title || `Day ${dayNumber}`,
              dayGoal: currentStep.goal || currentStep.description || "Day goal",
              participantName: existingParticipant.name || undefined,
              journeyName: journey?.name || "Your Journey",
              mentorName,
            });
            
            // Store both summaries in day state
            await storage.completeDayState(id, dayNumber, {
              summaryChallenge: summary.challenge,
              summaryEmotionalTone: summary.emotionalTone,
              summaryInsight: summary.insight,
              summaryResistance: summary.resistance,
              participantSummary,
            });
          }
        } catch (summaryError) {
          console.error("Failed to generate day summary:", summaryError);
        }
      }
      
      const participant = await storage.updateParticipant(id, {
        currentDay: nextDay,
        currentPhase: 'intro', // Reset phase for new day
        conversationState: 'ORIENTATION', // Reset ProcessFacilitator state for new day
        clarifyCount: 0, // Reset clarify counter
        taskSupportCount: 0, // Reset task support counter
        lastActiveAt: new Date(),
        ...(isJourneyComplete ? { completedAt: new Date() } : {}),
      });
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      
      // Create activity events (use participant.id from the updated record)
      const journey = await storage.getJourney(journeyId);
      const user = await storage.getUser(userId);
      if (journey?.creatorId && participant) {
        try {
          if (isJourneyComplete) {
            await storage.createActivityEvent({
              creatorId: journey.creatorId,
              participantId: participant.id,
              journeyId,
              eventType: 'completed_journey',
              eventData: {
                userName: user?.firstName || user?.email || 'Someone',
                journeyName: journey.name,
              },
            });
            
            // Send completion email to participant
            sendCompletionNotification(participant.id).catch(err => 
              console.error('Failed to send completion email:', err)
            );
          } else {
            await storage.createActivityEvent({
              creatorId: journey.creatorId,
              participantId: participant.id,
              journeyId,
              eventType: 'completed_day',
              eventData: {
                userName: user?.firstName || user?.email || 'Someone',
                journeyName: journey.name,
                dayNumber,
              },
            });
          }
        } catch (activityError) {
          console.error("Failed to create activity event:", activityError);
        }
      }
      
      res.json(participant);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete day" });
    }
  });

  // External participant onboarding config - uses access token instead of auth
  app.post("/api/participant/token/:accessToken/onboarding-config", async (req: any, res) => {
    try {
      const { accessToken } = req.params;
      
      const parseResult = onboardingConfigSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid onboarding config", details: parseResult.error.errors });
      }
      const config = parseResult.data;
      
      const participant = await storage.getParticipantByAccessToken(accessToken);
      if (!participant) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      await storage.updateParticipant(participant.id, {
        userOnboardingConfig: config,
        conversationState: "MICRO_ONBOARDING",
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving onboarding config:", error);
      res.status(500).json({ error: "Failed to save onboarding config" });
    }
  });

  // External participant complete day - uses access token instead of auth
  app.post("/api/participant/token/:accessToken/complete-day", async (req: any, res) => {
    try {
      const { accessToken } = req.params;
      const { dayNumber, journeyId } = req.body;
      
      const existingParticipant = await storage.getParticipantByAccessToken(accessToken);
      if (!existingParticipant || existingParticipant.journeyId !== journeyId) {
        return res.status(403).json({ error: "Not authorized to complete this day" });
      }
      
      const id = existingParticipant.id;
      
      const steps = await storage.getJourneySteps(journeyId);
      const totalDays = steps.length || 7;
      const currentStep = steps.find(s => s.dayNumber === dayNumber);
      
      const nextDay = Math.min(dayNumber + 1, totalDays + 1);
      const isJourneyComplete = nextDay > totalDays;
      
      // PRD 7.2 - Generate user summary at day completion
      if (currentStep) {
        try {
          const allMessages = await storage.getMessages(id, currentStep.id);
          const messages = allMessages.filter(m => !m.isSummary);
          
          const journey = await storage.getJourney(journeyId);
          const mentor = journey?.creatorId ? await storage.getUser(journey.creatorId) : null;
          
          const mentorName = mentor?.firstName 
            ? `${mentor.firstName}${mentor.lastName ? ' ' + mentor.lastName : ''}`
            : journey?.name || "Guide";
          
          const conversation = messages.map(m => ({
            role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.content,
          }));
          
          if (conversation.length > 0) {
            const summary = await generateDaySummary({
              conversation,
              dayGoal: currentStep.goal || currentStep.description || "Day goal",
              dayTask: currentStep.task || "Day task",
              mentorName,
            });
            
            const participantSummary = await generateParticipantSummary({
              conversation,
              dayNumber,
              totalDays,
              dayTitle: currentStep.title || `Day ${dayNumber}`,
              dayGoal: currentStep.goal || currentStep.description || "Day goal",
              participantName: existingParticipant.name || undefined,
              journeyName: journey?.name || "Your Journey",
              mentorName,
            });
            
            await storage.completeDayState(id, dayNumber, {
              summaryChallenge: summary.challenge,
              summaryEmotionalTone: summary.emotionalTone,
              summaryInsight: summary.insight,
              summaryResistance: summary.resistance,
              participantSummary,
            });
          }
        } catch (summaryError) {
          console.error("Failed to generate day summary:", summaryError);
        }
      }
      
      const participant = await storage.updateParticipant(id, {
        currentDay: nextDay,
        currentPhase: 'intro', // Reset phase for new day
        conversationState: 'ORIENTATION', // Reset ProcessFacilitator state for new day
        clarifyCount: 0, // Reset clarify counter
        taskSupportCount: 0, // Reset task support counter
        lastActiveAt: new Date(),
        ...(isJourneyComplete ? { completedAt: new Date() } : {}),
      });
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      
      // Create activity events for external participants
      const journey = await storage.getJourney(journeyId);
      if (journey?.creatorId && participant) {
        try {
          if (isJourneyComplete) {
            await storage.createActivityEvent({
              creatorId: journey.creatorId,
              participantId: participant.id,
              journeyId,
              eventType: 'completed_journey',
              eventData: {
                userName: existingParticipant.name || existingParticipant.email || 'Someone',
                journeyName: journey.name,
              },
            });
            
            // Send completion email to participant
            sendCompletionNotification(participant.id).catch(err => 
              console.error('Failed to send completion email:', err)
            );
          } else {
            await storage.createActivityEvent({
              creatorId: journey.creatorId,
              participantId: participant.id,
              journeyId,
              eventType: 'completed_day',
              eventData: {
                userName: existingParticipant.name || existingParticipant.email || 'Someone',
                journeyName: journey.name,
                dayNumber,
              },
            });
          }
        } catch (activityError) {
          console.error("Failed to create activity event:", activityError);
        }
      }
      
      res.json(participant);
    } catch (error) {
      console.error("Error completing day for external participant:", error);
      res.status(500).json({ error: "Failed to complete day" });
    }
  });

  // Get all day summaries for a participant
  app.get("/api/participants/:participantId/summaries", async (req: any, res) => {
    try {
      const { participantId } = req.params;
      
      const summaries = await storage.getAllDaySummaries(participantId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching summaries:", error);
      res.status(500).json({ error: "Failed to fetch summaries" });
    }
  });

  // Parse uploaded files (PDF, TXT)
  app.post("/api/parse-files", isAuthenticated, upload.array("files", 10), async (req: any, res) => {
    console.log("[parse-files] POST /api/parse-files - Parsing uploaded files");
    try {
      const files = req.files as Express.Multer.File[];
      console.log("[parse-files] Files received:", files?.length || 0);
      if (!files || files.length === 0) {
        console.log("[parse-files] No files uploaded");
        return res.status(400).json({ error: "No files uploaded" });
      }

      let combinedText = "";
      
      for (const file of files) {
        if (file.mimetype === "application/pdf" || file.originalname.endsWith(".pdf")) {
          const pdfData = await pdf(file.buffer);
          combinedText += "\n\n" + pdfData.text;
        } else if (file.originalname.endsWith(".docx") || file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          combinedText += "\n\n" + result.value;
        } else if (file.originalname.endsWith(".doc") || file.mimetype === "application/msword") {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          combinedText += "\n\n" + result.value;
        } else if (file.mimetype === "text/plain" || file.originalname.endsWith(".txt")) {
          combinedText += "\n\n" + file.buffer.toString("utf-8");
        }
      }

      res.json({ text: combinedText.trim() });
    } catch (error) {
      console.error("Error parsing files:", error);
      res.status(500).json({ error: "Failed to parse files" });
    }
  });

  // AI-powered journey content generation with SSE progress
  app.post("/api/journeys/:id/generate-content", isAuthenticated, async (req: any, res) => {
    console.log("[generate-content] === REQUEST RECEIVED ===");
    console.log("[generate-content] Journey ID:", req.params.id);
    console.log("[generate-content] User:", req.user?.id);
    console.log("[generate-content] Content length:", req.body?.content?.length || 0);
    
    const journeyId = req.params.id;
    const { content } = req.body;
    const useSSE = req.headers.accept === "text/event-stream";
    
    // No trial restrictions in new pricing model
    
    const sendProgress = (stage: string, progress: number, message: string) => {
      if (useSSE) {
        res.write(`data: ${JSON.stringify({ stage, progress, message })}\n\n`);
      }
    };

    try {
      if (useSSE) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
      }
      
      if (!content || content.trim().length === 0) {
        if (useSSE) {
          res.write(`data: ${JSON.stringify({ error: "Content is required for AI generation" })}\n\n`);
          return res.end();
        }
        return res.status(400).json({ error: "Content is required for AI generation" });
      }

      sendProgress("init", 5, "מכין את הנתונים...");

      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        if (useSSE) {
          res.write(`data: ${JSON.stringify({ error: "Flow not found" })}\n\n`);
          return res.end();
        }
        return res.status(404).json({ error: "Flow not found" });
      }

      sendProgress("ai", 10, "מנתח את סגנון ההוראה שלך... (שלב 1/3)");

      // Analyze ALL uploaded content to extract mentor's unique style
      console.log("[generate-content] Analyzing mentor content, length:", content.length);
      let mentorStyle;
      
      // Progress callback for intermediate updates during analysis
      const onAnalysisProgress = (progress: number, message: string) => {
        // Map analysis progress (0-100) to our range (10-28)
        const mappedProgress = 10 + Math.round(progress * 0.18);
        sendProgress("ai", mappedProgress, message);
      };
      
      try {
        mentorStyle = await analyzeMentorContent(content, journey.language || undefined, onAnalysisProgress);
        console.log("[generate-content] Mentor style extracted:", {
          tone: mentorStyle.toneOfVoice?.substring(0, 100),
          phrases: mentorStyle.keyPhrases?.length,
          summaryLength: mentorStyle.contentSummary?.length
        });
      } catch (analyzeError: any) {
        console.error("[generate-content] Error analyzing mentor content:", analyzeError.message);
        // Use fallback empty style
        mentorStyle = {
          toneOfVoice: "",
          keyPhrases: [],
          teachingStyle: "",
          corePhilosophy: "",
          contentSummary: content.substring(0, 3000),
          language: journey.language || "he"
        };
      }

      sendProgress("ai", 30, "יוצר תוכן בסגנון שלך... (שלב 2/3)");

      const intent = {
        journeyName: journey.name,
        mainGoal: journey.goal || "",
        targetAudience: journey.audience || "",
        duration: journey.duration || 7,
        desiredFeeling: "",
        additionalNotes: journey.description || "",
        language: journey.language || undefined,
        // Flow building questions - critical for personalized content
        clientChallenges: journey.clientChallenges || "",
        profession: journey.profession || "",
        tone: journey.tone || "",
        mentorStyle, // Include extracted style profile
      };

      console.log("[generate-content] Intent:", JSON.stringify({ ...intent, mentorStyle: { ...mentorStyle, contentSummary: `${mentorStyle.contentSummary?.length || 0} chars` } }));
      console.log("[generate-content] Content length:", content.length);
      
      let generatedDays;
      
      // Start heartbeat to keep SSE connection alive during long AI generation
      let heartbeatProgress = 30;
      const heartbeatMessages = [
        "ה-AI עובד על התוכן... (עוד רגע)",
        "יוצר ימים מותאמים אישית...",
        "מעבד את הסגנון שלך...",
        "בונה את המסע...",
        "כמעט שם..."
      ];
      let heartbeatIndex = 0;
      const heartbeatInterval = useSSE ? setInterval(() => {
        heartbeatProgress = Math.min(heartbeatProgress + 5, 55);
        const message = heartbeatMessages[heartbeatIndex % heartbeatMessages.length];
        sendProgress("ai", heartbeatProgress, message);
        heartbeatIndex++;
      }, 10000) : null; // Send heartbeat every 10 seconds
      
      try {
        generatedDays = await generateJourneyContent(intent, content);
        console.log("[generate-content] Generated days count:", generatedDays.length);
      } catch (genError: any) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        console.error("[generate-content] Error generating journey content:", genError.message);
        if (useSSE) {
          res.write(`data: ${JSON.stringify({ error: "Failed to generate content: " + genError.message })}\n\n`);
          return res.end();
        }
        return res.status(500).json({ error: "Failed to generate content" });
      }
      
      // Stop heartbeat after generation completes
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      
      // Log sample day to verify AI response
      if (generatedDays.length > 0) {
        const sampleDay = generatedDays[0];
        console.log("[generate-content] Sample day:", {
          dayNumber: sampleDay.dayNumber,
          title: sampleDay.title,
          goalLength: sampleDay.goal?.length || 0,
          explanationLength: sampleDay.explanation?.length || 0,
          taskLength: sampleDay.task?.length || 0,
          blocksCount: sampleDay.blocks?.length || 0,
        });
      }

      sendProgress("cleanup", 60, "מנקה תוכן ישן... (שלב 3/3 - כחצי דקה)");

      await storage.deleteJourneyStepsByJourneyId(journeyId);

      sendProgress("saving", 70, "שומר את הימים שנוצרו... (עוד רגע מסיימים!)");

      const totalDays = generatedDays.length;
      for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const day = generatedDays[dayIndex];
        const dayProgress = 70 + Math.round((dayIndex / totalDays) * 25);
        sendProgress("saving", dayProgress, `שומר יום ${day.dayNumber} מתוך ${totalDays}... (עוד רגע מסיימים!)`);

        console.log(`[generate-content] Saving day ${day.dayNumber}: goal=${day.goal?.length || 0} chars, explanation=${day.explanation?.length || 0} chars, task=${day.task?.length || 0} chars`);
        const step = await storage.createJourneyStep({
          journeyId,
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
          goal: day.goal || "",
          explanation: day.explanation || "",
          task: day.task || "",
        });

        // Filter and validate blocks - only insert blocks that have required fields
        const validBlocks = (day.blocks || []).filter((block: any) => 
          block && block.type && typeof block.type === 'string'
        );
        
        // If no valid blocks, create default blocks from day content
        const blocksToUse = validBlocks.length > 0 ? validBlocks : [
          { type: "text", content: { text: day.explanation || "" } },
          { type: "reflection", content: { question: journey.language === 'he' ? "מה מהדברים שלמדת היום מהדהד אצלך ביותר?" : "What resonates with you most from today's lesson?" } },
          { type: "task", content: { task: day.task || "" } },
        ];
        
        const blocksToInsert = blocksToUse.map((block: any, i: number) => ({
          stepId: step.id,
          type: block.type,
          content: block.content || {},
          orderIndex: i,
        }));

        await storage.createJourneyBlocks(blocksToInsert);
      }

      sendProgress("done", 100, "התהליך נוצר בהצלחה!");

      if (useSSE) {
        res.write(`data: ${JSON.stringify({ success: true, daysGenerated: generatedDays.length })}\n\n`);
        res.end();
      } else {
        res.json({ success: true, daysGenerated: generatedDays.length });
      }
    } catch (error) {
      console.error("Error generating flow content:", error);
      if (useSSE) {
        res.write(`data: ${JSON.stringify({ error: "Failed to generate flow content" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate flow content" });
      }
    }
  });

  // Auto-generate flow days when entering editor (if no steps exist)
  app.post("/api/journeys/:id/auto-generate", isAuthenticated, async (req: any, res) => {
    const journeyId = req.params.id;
    
    try {
      // No trial restrictions in new pricing model
      
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      // Check if steps already exist
      const existingSteps = await storage.getJourneySteps(journeyId);
      if (existingSteps.length > 0) {
        return res.json({ success: true, stepsExist: true, steps: existingSteps });
      }

      // Fetch mentor profile for richer AI context
      const mentor = journey.creatorId ? await storage.getUser(journey.creatorId) : null;
      
      // Generate new days using AI
      const intent = {
        journeyName: journey.name,
        mainGoal: journey.goal || "",
        targetAudience: journey.audience || "",
        duration: journey.duration || 7,
        desiredFeeling: "",
        additionalNotes: journey.description || "",
        language: journey.language || undefined,
        // Flow building questions - critical for personalized content
        clientChallenges: journey.clientChallenges || "",
        profession: journey.profession || "",
        tone: journey.tone || "",
        // Mentor profile data for authentic content
        mentorName: mentor ? `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() : undefined,
        mentorSpecialty: mentor?.specialty || undefined,
        mentorMethodology: mentor?.methodology || undefined,
        mentorUniqueApproach: mentor?.uniqueApproach || undefined,
      };

      console.log("[auto-generate] Intent:", JSON.stringify(intent));
      const generatedDays = await generateFlowDays(intent);
      console.log("[auto-generate] Generated days count:", generatedDays.length);
      
      // Log sample day data to verify AI response
      if (generatedDays.length > 0) {
        const sampleDay = generatedDays[0];
        console.log("[auto-generate] Sample day:", {
          dayNumber: sampleDay.dayNumber,
          title: sampleDay.title,
          goalLength: sampleDay.goal?.length || 0,
          explanationLength: sampleDay.explanation?.length || 0,
          taskLength: sampleDay.task?.length || 0,
          goalPreview: sampleDay.goal?.substring(0, 100) || "EMPTY",
        });
      }

      // Save generated days to database with blocks for chat compatibility
      const createdSteps = [];
      for (const day of generatedDays) {
        console.log(`[auto-generate] Saving day ${day.dayNumber}: goal=${day.goal?.length || 0} chars, explanation=${day.explanation?.length || 0} chars, task=${day.task?.length || 0} chars`);
        const step = await storage.createJourneyStep({
          journeyId,
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.goal,
          goal: day.goal,
          explanation: day.explanation,
          task: day.task,
        });
        
        // Create blocks for chat compatibility
        const blocksToInsert = [
          { stepId: step.id, type: "text", content: { text: day.explanation }, orderIndex: 0 },
          { stepId: step.id, type: "reflection", content: { question: `Reflecting on today's goal: ${day.goal}. What resonates with you about this?` }, orderIndex: 1 },
          { stepId: step.id, type: "task", content: { task: day.task }, orderIndex: 2 },
        ];
        await storage.createJourneyBlocks(blocksToInsert);
        
        createdSteps.push(step);
      }

      res.json({ success: true, stepsExist: false, steps: createdSteps });
    } catch (error) {
      console.error("Error auto-generating flow:", error);
      res.status(500).json({ error: "Failed to generate flow content" });
    }
  });

  // Chat messages routes
  app.get("/api/participants/:participantId/steps/:stepId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { participantId, stepId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      const participant = await storage.getParticipantById(participantId);
      if (!participant || participant.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const step = await storage.getJourneyStep(stepId);
      if (!step || step.journeyId !== participant.journeyId) {
        return res.status(403).json({ error: "Step does not belong to this flow" });
      }

      const messages = await storage.getMessages(participantId, stepId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/participants/:participantId/steps/:stepId/start-day", async (req: any, res) => {
    try {
      const { participantId, stepId } = req.params;
      
      const participant = await storage.getParticipantById(participantId);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      
      // Authorization: Allow if:
      // 1. External participant (has accessToken) - token-based auth handled by having valid participantId
      // 2. Authenticated user who is the journey creator
      const isExternalParticipant = !!participant.accessToken;
      const isJourneyCreator = req.user?.claims?.sub === participant.userId;
      
      if (!isExternalParticipant && !isJourneyCreator) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const step = await storage.getJourneyStep(stepId);
      if (!step || step.journeyId !== participant.journeyId) {
        return res.status(403).json({ error: "Step does not belong to this flow" });
      }

      const existingMessages = await storage.getMessages(participantId, stepId);
      if (existingMessages.length > 0) {
        // Check if day was already completed (any message with isSummary: true)
        const dayCompleted = existingMessages.some(m => m.isSummary === true);
        return res.json({ messages: existingMessages, dayCompleted });
      }

      const journey = await storage.getJourney(step.journeyId);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      // Get mentor info for PRD-compliant context
      const mentor = journey.creatorId ? await storage.getUser(journey.creatorId) : null;
      const mentorName = mentor ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() || "Your Guide" : "Your Guide";
      const totalDays = journey.duration || 7;
      
      // Get participant's name - for external participants use their stored name
      let participantName: string | undefined;
      if (participant.userId) {
        const participantUser = await storage.getUser(participant.userId);
        participantName = participantUser ? `${participantUser.firstName || ""}`.trim() || undefined : undefined;
      } else {
        participantName = participant.name || participant.email?.split('@')[0] || undefined;
      }

      // PRD-compliant context for day opening
      const openingMessage = await generateDayOpeningMessage({
        journeyName: journey.name,
        dayNumber: step.dayNumber,
        totalDays,
        dayTitle: step.title,
        dayGoal: step.goal || step.description || "Focus on today's growth",
        dayTask: step.task || "Complete today's exercise",
        dayExplanation: step.explanation || undefined,
        dayClosingMessage: step.closingMessage || undefined,
        mentorName,
        mentorToneOfVoice: mentor?.toneOfVoice || undefined,
        mentorMethodDescription: mentor?.methodDescription || undefined,
        mentorBehavioralRules: mentor?.behavioralRules || undefined,
        participantName,
        language: journey.language || undefined,
      });

      const message = await storage.createMessage({
        participantId,
        stepId,
        role: "assistant",
        content: openingMessage,
      });

      // Track day state
      await storage.createOrUpdateDayState(participantId, step.dayNumber);

      res.json({ messages: [message], dayCompleted: false });
    } catch (error) {
      console.error("Error starting day:", error);
      res.status(500).json({ error: "Failed to start day" });
    }
  });

  app.post("/api/participants/:participantId/steps/:stepId/messages", async (req: any, res) => {
    try {
      const { participantId, stepId } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const participant = await storage.getParticipantById(participantId);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      
      // Authorization: Allow if:
      // 1. External participant (has accessToken) - token-based auth handled by having valid participantId
      // 2. Authenticated user who is the journey creator
      const isExternalParticipant = !!participant.accessToken;
      const isJourneyCreator = req.user?.claims?.sub === participant.userId;
      
      if (!isExternalParticipant && !isJourneyCreator) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const step = await storage.getJourneyStep(stepId);
      if (!step || step.journeyId !== participant.journeyId) {
        return res.status(403).json({ error: "Step does not belong to this flow" });
      }

      // Check if day is already complete - block further messages
      const existingMessages = await storage.getMessages(participantId, stepId);
      const dayAlreadyComplete = existingMessages.some(m => m.isSummary === true);
      if (dayAlreadyComplete) {
        return res.status(400).json({ error: "Day is already complete. Please continue to the next day.", dayCompleted: true });
      }

      const journey = await storage.getJourney(step.journeyId);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      const userMessage = await storage.createMessage({
        participantId,
        stepId,
        role: "user",
        content: content.trim(),
      });

      // Persist userIntentAnchor when in MICRO_ONBOARDING state
      if (participant.conversationState === "MICRO_ONBOARDING" && !participant.userIntentAnchor) {
        await storage.updateParticipant(participantId, {
          userIntentAnchor: content.trim() || "", // Allow empty string for skip
        });
        console.log(`[Onboarding] Saved userIntentAnchor for participant ${participantId}`);
      }

      // PRD 7.1 - Get only last 5 messages for short-term memory
      const history = await storage.getMessages(participantId, stepId);
      const recentMessages = history.slice(-5).map(m => ({ 
        role: m.role === "assistant" ? "assistant" : "user", 
        content: m.content 
      }));

      // Get mentor info for PRD-compliant context
      const mentor = journey.creatorId ? await storage.getUser(journey.creatorId) : null;
      const mentorName = mentor ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() || "Your Guide" : "Your Guide";
      const totalDays = journey.duration || 7;
      
      // Get participant's name for personalized conversation
      let participantName: string | undefined;
      if (participant.userId) {
        const participantUser = await storage.getUser(participant.userId);
        participantName = participantUser ? `${participantUser.firstName || ""}`.trim() || undefined : undefined;
      } else {
        participantName = participant.name || participant.email?.split('@')[0] || undefined;
      }

      // PRD 7.2 - Get user summary from previous days (long-term memory)
      const previousDaySummary = await storage.getLatestDaySummary(participantId, step.dayNumber - 1);

      // Get content blocks for this step
      const stepBlocks = await storage.getJourneyBlocks(stepId);
      const contentBlocks = stepBlocks.map(b => {
        let contentText = "";
        try {
          const parsed = typeof b.content === 'string' ? JSON.parse(b.content) : b.content;
          contentText = parsed?.text || parsed?.question || parsed?.task || parsed?.content || String(b.content || "");
        } catch {
          contentText = String(b.content || "");
        }
        return { type: b.type, content: contentText };
      });

      // Get current phase from participant (default to intro)
      const currentPhase = (participant.currentPhase as ConversationPhase) || 'intro';
      const dayGoal = step.goal || step.description || "Focus on today's growth";
      const dayTask = step.task || "Complete today's exercise";

      let botResponse: string;
      let dayCompleted = false;
      let phaseForResponse = currentPhase;

      // Use ProcessFacilitator (new state machine) for all flows
      // This provides human, confident, non-robotic facilitation
      const useFacilitator = true; // Always use new system
      const useDirector = !!journey.mentorStyle && !useFacilitator; // Fallback to Director if not using Facilitator
      
      if (useFacilitator) {
        console.log(`[Facilitator] Using ProcessFacilitator system`);
        
        // Generate response using ProcessFacilitator
        const result = await generateChatResponseWithFacilitator(
          {
            participant,
            journey,
            step,
            recentMessages
          },
          content.trim()
        );
        
        botResponse = result.response;
        dayCompleted = result.dayCompleted;
        
        // Journey State Updates - Extract insights and save day summaries
        const updatedParticipant: Partial<typeof participant> = { 
          conversationState: result.nextState,
          clarifyCount: result.clarifyCount,
          taskSupportCount: result.taskSupportCount,
          lastBotMessage: result.response,
          // Conversation dynamics tracking
          totalMessagesInDay: result.totalMessagesInDay,
          messageCountInPhase: result.messageCountInPhase,
          lastEmpathyMessageIndex: result.lastEmpathyMessageIndex,
          beliefIdentified: result.beliefIdentified,
          // Goal achievement tracking
          goalAchieved: result.goalAchieved,
          goalSummary: result.goalSummary
        };
        
        // Get current state for transition detection (use persisted state, never fallback to START if state exists)
        const currentState = participant.conversationState || "START";
        const lang = (journey.language === "he" ? "hebrew" : "english") as "hebrew" | "english";
        
        // Extract insight from user message after meaningful state transitions
        // Triggers: ORIENTATION→INTERPRET, CORE_QUESTION→INTERPRET, TASK→CLOSURE, TASK_SUPPORT→CLOSURE
        try {
          const insight = await extractInsightFromMessage(content.trim(), {
            currentState: currentState as any,
            nextState: result.nextState,
            dayGoal: step.goal || step.title,
            language: lang
          });
          
          if (insight) {
            const currentInsights = (participant.journeyInsights as string[]) || [];
            (updatedParticipant as any).journeyInsights = [...currentInsights.slice(-9), insight];
            console.log(`[JourneyState] Saved insight: ${insight}`);
          }
        } catch (e) {
          console.error("[JourneyState] Failed to extract insight:", e);
        }
        
        // Extract current belief/pattern when transitioning TO INTERPRET
        // This captures the user's interpretive response (their answer to core question)
        if (result.nextState === "INTERPRET" && currentState !== "INTERPRET") {
          try {
            const newBelief = await extractCurrentBelief(
              content.trim(),
              participant.currentBelief || null,
              lang
            );
            
            if (newBelief && newBelief !== participant.currentBelief) {
              (updatedParticipant as any).currentBelief = newBelief;
              console.log(`[JourneyState] Updated belief: ${newBelief}`);
            }
          } catch (e) {
            console.error("[JourneyState] Failed to extract belief:", e);
          }
        }
        
        // Generate and save day summary when day completes
        if (dayCompleted) {
          try {
            // Include the bot's final response in the summary
            // Note: recentMessages may not include the current user message yet, so we append it
            // Check if last message is already the current user message to avoid duplication
            const lastMsg = recentMessages[recentMessages.length - 1];
            const userMsgAlreadyIncluded = lastMsg?.role === "user" && lastMsg?.content === content.trim();
            
            const messagesForSummary = userMsgAlreadyIncluded
              ? [...recentMessages, { role: "assistant", content: botResponse }]
              : [...recentMessages, { role: "user", content: content.trim() }, { role: "assistant", content: botResponse }];
            
            const daySummary = await generateDaySummaryForState(
              step.dayNumber,
              step.goal || step.title,
              messagesForSummary,
              result.nextState === "DONE",
              lang
            );
            
            if (daySummary) {
              const currentSummaries = (participant.daySummaries as any[]) || [];
              (updatedParticipant as any).daySummaries = [
                ...currentSummaries.filter((s: any) => s.day !== step.dayNumber),
                {
                  day: step.dayNumber,
                  summary: daySummary.summary,
                  keyInsight: daySummary.keyInsight,
                  taskCompleted: result.nextState === "DONE"
                }
              ];
              console.log(`[JourneyState] Saved day ${step.dayNumber} summary`);
            }
          } catch (e) {
            console.error("[JourneyState] Failed to generate day summary:", e);
          }
        }
        
        // Persist conversation state and journey state to participant record
        await storage.updateParticipant(participantId, updatedParticipant as any);
        
        console.log(`[Facilitator] Result: state=${result.nextState}, intent=${result.log.detected_intent}, dayCompleted=${dayCompleted}`);
      } else if (useDirector) {
        console.log(`[Director] Using Director system for journey with mentorStyle: ${journey.mentorStyle}`);
        
        // Restore conversation state from participant record
        const conversationState = initializeDirectorState(dayTask, dayGoal);
        conversationState.phase = toDirectorPhase(currentPhase);
        conversationState.messageCountInPhase = participant.messageCountInPhase || 0;
        conversationState.questionsAskedInPhase = participant.questionsAskedInPhase || 0;
        conversationState.totalMessageCount = history.length;
        
        // Generate response using Director system
        const result = await generateChatResponseWithDirector(
          {
            journeyName: journey.name,
            dayNumber: step.dayNumber,
            totalDays,
            dayGoal,
            dayTask,
            mentorName,
            mentorStyle: journey.mentorStyle || undefined,
            mentorTone: journey.tone || mentor?.toneOfVoice || undefined,
            participantName,
            recentMessages,
            language: (journey.language === 'he' ? 'he' : 'en') as 'he' | 'en',
            conversationState
          },
          content.trim()
        );
        
        botResponse = result.response;
        dayCompleted = result.dayCompleted;
        phaseForResponse = result.newState.phase;
        
        // Persist conversation state to participant record
        await storage.updateParticipant(participantId, { 
          currentPhase: result.newState.phase,
          messageCountInPhase: result.newState.messageCountInPhase,
          questionsAskedInPhase: result.newState.questionsAskedInPhase
        });
        
        console.log(`[Director] Result: action=${result.decision.action}, phase=${result.newState.phase}, dayCompleted=${dayCompleted}`);
      } else {
        // Legacy system - for journeys without mentorStyle
        console.log(`[Phase] Using legacy phase system, current phase: ${currentPhase}`);
        
        // Pre-transition detection (without bot response - based on user message only)
        const transitionResult = await detectPhaseTransition(
          currentPhase,
          content.trim(),
          "", // Empty bot response - we're detecting based on user input only
          dayGoal,
          dayTask
        );
        console.log(`[Phase] Pre-response transition check:`, transitionResult);
        
        if (transitionResult.shouldTransition && transitionResult.nextPhase) {
          phaseForResponse = transitionResult.nextPhase;
          console.log(`[Phase] Transitioning BEFORE response: ${currentPhase} -> ${phaseForResponse} (${transitionResult.reason})`);
          
          // Update participant's current phase before generating response
          await storage.updateParticipant(participantId, { currentPhase: phaseForResponse });
        } else if (transitionResult.shouldTransition && !transitionResult.nextPhase) {
          // Day is complete (integration phase finished)
          dayCompleted = true;
          console.log(`Day completion via phase transition: ${transitionResult.reason}`);
        }

        // Generate response using the NEW phase (after transition)
        botResponse = await generateChatResponse(
          {
            journeyName: journey.name,
            dayNumber: step.dayNumber,
            totalDays,
            dayTitle: step.title,
            dayGoal,
            dayTask,
            dayExplanation: step.explanation || undefined,
            dayClosingMessage: step.closingMessage || undefined,
            contentBlocks,
            mentorName,
            mentorToneOfVoice: mentor?.toneOfVoice || undefined,
            mentorMethodDescription: mentor?.methodDescription || undefined,
            mentorBehavioralRules: mentor?.behavioralRules || undefined,
            participantName,
            recentMessages,
            messageCount: history.length,
            userSummary: previousDaySummary ? {
              challenge: previousDaySummary.summaryChallenge || undefined,
              emotionalTone: previousDaySummary.summaryEmotionalTone || undefined,
              insight: previousDaySummary.summaryInsight || undefined,
              resistance: previousDaySummary.summaryResistance || undefined,
            } : undefined,
            language: journey.language || undefined,
            currentPhase: phaseForResponse, // Use the NEW phase after transition
          },
          content.trim()
        );

        // Check if AI marked the day as complete
        if (botResponse.includes("[DAY_COMPLETE]")) {
          dayCompleted = true;
          // Remove the marker from the visible message
          botResponse = botResponse.replace("[DAY_COMPLETE]", "").trim();
        } else if (!dayCompleted) {
          // Secondary detection: farewell patterns (AI sometimes forgets the marker)
          const farewellPatterns = [
            /see you tomorrow/i,
            /I'll see you in Day/i,
            /see you in day/i,
            /until tomorrow/i,
            /see you next time/i,
            /נתראה מחר/i,
            /נפגש מחר/i,
            /להתראות מחר/i,
          ];
          const hasFarewell = farewellPatterns.some(pattern => pattern.test(botResponse));
          
          // Also check if we're in integration phase
          if (hasFarewell || phaseForResponse === 'integration') {
            dayCompleted = true;
            console.log("Day completion detected via farewell pattern or integration phase");
          }
        }
      }

      // Reset phase and state counters if day completed (for next day)
      if (dayCompleted) {
        await storage.updateParticipant(participantId, { 
          currentPhase: 'intro',
          messageCountInPhase: 0,
          questionsAskedInPhase: 0,
          // Reset conversation dynamics tracking for next day
          totalMessagesInDay: 0,
          lastEmpathyMessageIndex: 0,
          beliefIdentified: false,
          // Reset goal tracking for next day
          goalAchieved: false,
          goalSummary: null
        });
      }

      const botMessage = await storage.createMessage({
        participantId,
        stepId,
        role: "assistant",
        content: botResponse,
        isSummary: dayCompleted,
      });

      res.json({ userMessage, botMessage, dayCompleted, currentPhase: dayCompleted ? 'intro' : phaseForResponse });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Payment routes
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Stripe not configured" });
    }
  });

  // Stripe Connect routes for mentors
  app.post("/api/stripe/connect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let accountId = user.stripeAccountId;
      
      if (!accountId) {
        const account = await stripeService.createConnectAccount(
          user.email || "",
          userId
        );
        accountId = account.id;
        
        await storage.upsertUser({
          id: userId,
          stripeAccountId: accountId,
          stripeAccountStatus: "pending",
        });
      }

      const baseUrl = `https://${req.get("host")}`;
      const accountLink = await stripeService.createConnectAccountLink(
        accountId,
        `${baseUrl}/api/stripe/connect/refresh`,
        `${baseUrl}/api/stripe/connect/return`
      );

      res.json({ url: accountLink.url });
    } catch (error) {
      console.error("Error creating Stripe Connect account:", error);
      res.status(500).json({ error: "Failed to connect Stripe account" });
    }
  });

  app.get("/api/stripe/connect/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeAccountId) {
        return res.redirect("/journeys");
      }

      const baseUrl = `https://${req.get("host")}`;
      const accountLink = await stripeService.createConnectAccountLink(
        user.stripeAccountId,
        `${baseUrl}/api/stripe/connect/refresh`,
        `${baseUrl}/api/stripe/connect/return`
      );

      res.redirect(accountLink.url);
    } catch (error) {
      console.error("Error refreshing Stripe Connect link:", error);
      res.redirect("/journeys?error=stripe_connect_failed");
    }
  });

  app.get("/api/stripe/connect/return", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.stripeAccountId) {
        const account = await stripeService.getConnectAccount(user.stripeAccountId);
        const status = account.charges_enabled ? "active" : "pending";
        
        await storage.upsertUser({
          id: userId,
          stripeAccountStatus: status,
        });
      }

      res.redirect("/journeys?stripe_connected=true");
    } catch (error) {
      console.error("Error processing Stripe Connect return:", error);
      res.redirect("/journeys?error=stripe_connect_failed");
    }
  });

  app.get("/api/stripe/connect/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeAccountId) {
        return res.json({ connected: false });
      }

      try {
        const account = await stripeService.getConnectAccount(user.stripeAccountId);
        const status = account.charges_enabled ? "active" : "pending";
        
        if (user.stripeAccountStatus !== status) {
          await storage.upsertUser({
            id: userId,
            stripeAccountStatus: status,
          });
        }

        res.json({ 
          connected: true, 
          status,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        });
      } catch (error) {
        res.json({ connected: false, error: "Account not found" });
      }
    } catch (error) {
      console.error("Error checking Stripe Connect status:", error);
      res.status(500).json({ error: "Failed to check Stripe status" });
    }
  });

  app.post("/api/join/journey/:journeyId", async (req, res) => {
    try {
      const { journeyId } = req.params;
      const { email, name, idNumber } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      
      if (!idNumber) {
        return res.status(400).json({ error: "ID number is required" });
      }

      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      if (journey.status !== "published") {
        return res.status(400).json({ error: "Flow is not available" });
      }

      const price = journey.price || 0;
      
      if (price > 0) {
        const baseUrl = `https://${req.get("host")}`;
        
        // Check if admin has configured a payment URL (Grow/Meshulam via manual approval)
        const paymentUrl = journey.adminPaymentUrl || journey.externalPaymentUrl;
        if (paymentUrl) {
          // Generate a unique token for this payment session
          const token = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour expiry
          
          await storage.createExternalPaymentSession({
            journeyId,
            email,
            name: name || null,
            idNumber: idNumber || null,
            token,
            status: "pending",
            expiresAt,
          });
          
          // Build the return URL with the token
          const returnUrl = `${baseUrl}/payment/external-success?token=${token}`;
          
          res.json({ 
            requiresPayment: true,
            paymentType: "external",
            externalPaymentUrl: paymentUrl,
            returnUrl, // Tell participant where to return after payment
            token,
          });
          return;
        }

        let mentor = null;
        if (journey.creatorId) {
          mentor = await storage.getUser(journey.creatorId);
        }

        if (mentor?.stripeAccountId && mentor.stripeAccountStatus === "active") {
          const session = await stripeService.createConnectedCheckoutSession({
            connectedAccountId: mentor.stripeAccountId,
            customerEmail: email,
            amount: price * 100,
            currency: (journey.currency || "USD").toLowerCase(),
            productName: journey.name,
            successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&connected_account=${mentor.stripeAccountId}`,
            cancelUrl: `${baseUrl}/j/${journeyId}`,
            metadata: {
              journeyId,
              customerEmail: email,
              customerName: name || "",
              connectedAccountId: mentor.stripeAccountId,
            },
          });

          res.json({ 
            requiresPayment: true, 
            paymentType: "stripe",
            checkoutUrl: session.url, 
            sessionId: session.id 
          });
        } else {
          const session = await stripeService.createOneTimePaymentSession({
            customerEmail: email,
            amount: price * 100,
            currency: (journey.currency || "USD").toLowerCase(),
            productName: journey.name,
            successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${baseUrl}/j/${journeyId}`,
            metadata: {
              journeyId,
              customerEmail: email,
              customerName: name || "",
            },
          });

          res.json({ 
            requiresPayment: true, 
            paymentType: "stripe",
            checkoutUrl: session.url, 
            sessionId: session.id 
          });
        }
      } else {
        const participant = await storage.createExternalParticipant(
          journeyId,
          email,
          name,
          idNumber
        );

        if (journey.creatorId) {
          await storage.createActivityEvent({
            creatorId: journey.creatorId,
            participantId: participant.id,
            journeyId,
            eventType: 'joined',
            eventData: { participantName: name || email },
          });
        }

        res.json({ 
          requiresPayment: false, 
          accessToken: participant.accessToken 
        });
      }
    } catch (error) {
      console.error("Error joining journey:", error);
      res.status(500).json({ error: "Failed to join flow" });
    }
  });

  // External payment verification - participant returns after paying via external link
  // POST method - requires identity verification (name, email, idNumber)
  app.post("/api/payment/external-verify/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { name, email, idNumber } = req.body;
      
      // Validate required fields
      if (!name || !email || !idNumber) {
        return res.status(400).json({ error: "missing_fields", message: "All fields are required" });
      }
      
      const session = await storage.getExternalPaymentSessionByToken(token);
      
      if (!session) {
        return res.status(404).json({ error: "session_not_found", message: "Payment session not found" });
      }

      // Check if session has expired
      if (new Date() > session.expiresAt) {
        return res.status(400).json({ error: "session_expired", message: "Payment session has expired" });
      }

      // Verify identity matches the session data
      const emailMatch = session.email.toLowerCase() === email.toLowerCase();
      // ID comparison: if session has no ID stored, skip check (backwards compatibility)
      // Also normalize by removing leading zeros for comparison
      const normalizeId = (id: string | null) => id ? id.replace(/^0+/, '') : null;
      const idMatch = !session.idNumber || normalizeId(session.idNumber) === normalizeId(idNumber);
      // Name comparison: case-insensitive and trim
      // If session has no name stored, skip name check (verify by email + ID only)
      const nameMatch = !session.name || session.name.toLowerCase().trim() === name.toLowerCase().trim();
      
      if (!emailMatch || !idMatch || !nameMatch) {
        console.log("Identity verification failed:", { 
          emailMatch, 
          idMatch, 
          nameMatch,
          sessionEmail: session.email,
          inputEmail: email,
          sessionId: session.idNumber,
          inputId: idNumber
        });
        return res.status(400).json({ error: "identity_mismatch", message: "Identity verification failed" });
      }

      if (session.status === "completed") {
        // Session already completed, find the participant
        const participant = await storage.getParticipantByEmail(session.email, session.journeyId);
        if (participant) {
          return res.json({ 
            success: true, 
            accessToken: participant.accessToken 
          });
        }
        return res.status(400).json({ error: "participant_not_found", message: "Participant not found" });
      }

      // Complete the session and create participant
      await storage.completeExternalPaymentSession(token);
      
      const journey = await storage.getJourney(session.journeyId);
      if (!journey) {
        return res.status(404).json({ error: "flow_not_found", message: "Flow not found" });
      }

      // No participant limits in new pricing model - unlimited participants for all plans

      const participant = await storage.createExternalParticipant(
        session.journeyId,
        session.email,
        session.name || undefined,
        session.idNumber || undefined
      );

      if (journey.creatorId) {
        await storage.createActivityEvent({
          creatorId: journey.creatorId,
          participantId: participant.id,
          journeyId: session.journeyId,
          eventType: 'joined',
          eventData: { participantName: session.name || session.email },
        });

        // Get mentor's current plan for commission calculation
        const mentor = await storage.getUser(journey.creatorId);
        const mentorPlan = (mentor?.subscriptionPlan as PlanType) || 'free';
        const { calculateCommission } = await import('./subscriptionService');
        const amountInAgorot = (journey.price || 0) * 100; // Amount in agorot
        const commission = calculateCommission(amountInAgorot, mentorPlan);

        // Record payment with commission (external payment via Grow)
        await storage.createPayment({
          participantId: participant.id,
          journeyId: session.journeyId,
          mentorId: journey.creatorId,
          amount: amountInAgorot,
          currency: journey.currency || "ILS",
          status: "completed",
          stripeCheckoutSessionId: `external_${token}`, // Mark as external
          customerEmail: session.email,
          customerName: session.name,
          commissionRate: Math.round(commission.commissionRate * 100), // Store as percentage (17, 15, 11)
          commissionAmount: Math.round(commission.commissionAmount),
          netAmount: Math.round(commission.netAmount),
        });

        // Send welcome email with journey access link (mentor already fetched above)
        const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
          : 'https://flow83.replit.app';
        const journeyLink = `${baseUrl}/p/${participant.accessToken}`;
        
        try {
          await sendJourneyAccessEmail({
            participantEmail: session.email,
            participantName: session.name || session.email.split('@')[0],
            participantIdNumber: session.idNumber || undefined,
            journeyName: journey.name,
            journeyLink,
            mentorName: mentor?.firstName ? `${mentor.firstName} ${mentor.lastName || ''}`.trim() : undefined,
            language: (journey.language as 'he' | 'en') || 'he'
          });
          console.log(`Welcome email sent to ${session.email} for journey ${journey.name}`);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }

        // Send notification to mentor about new participant
        if (mentor?.email) {
          try {
            await sendNewParticipantNotification({
              mentorEmail: mentor.email,
              mentorName: mentor.firstName || 'מנטור',
              participantName: session.name || session.email.split('@')[0],
              participantEmail: session.email,
              journeyName: journey.name,
              language: (journey.language as 'he' | 'en') || 'he'
            });
            console.log(`Mentor notification sent to ${mentor.email} for new participant ${session.email}`);
          } catch (emailError) {
            console.error('Failed to send mentor notification:', emailError);
          }
          
        }
      }

      res.json({ 
        success: true, 
        accessToken: participant.accessToken 
      });
    } catch (error) {
      console.error("Error verifying external payment:", error);
      res.status(500).json({ error: "server_error", message: "Failed to verify payment" });
    }
  });

  // Legacy GET method - redirects to proper flow (kept for backwards compatibility)
  app.get("/api/payment/external-verify/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const session = await storage.getExternalPaymentSessionByToken(token);
      
      if (!session) {
        return res.status(404).json({ error: "Payment session not found" });
      }

      if (session.status === "completed") {
        // Session already completed, find the participant by email
        const participant = await storage.getParticipantByEmail(session.email, session.journeyId);
        if (participant) {
          return res.json({ 
            success: true, 
            accessToken: participant.accessToken 
          });
        }
        return res.status(400).json({ error: "Participant not found" });
      }

      // For pending sessions, return info that verification form is required
      return res.json({ 
        success: false, 
        requiresVerification: true,
        message: "Identity verification required" 
      });
    } catch (error) {
      console.error("Error checking external payment:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  app.get("/api/payment/verify/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const connectedAccount = req.query.connected_account as string | undefined;
      
      let participant = await storage.getParticipantByStripeSession(sessionId);
      
      if (participant) {
        return res.json({ 
          success: true, 
          accessToken: participant.accessToken 
        });
      }

      let session;
      if (connectedAccount) {
        session = await stripeService.getConnectedCheckoutSession(sessionId, connectedAccount);
      } else {
        session = await stripeService.getCheckoutSession(sessionId);
      }
      
      if (session.payment_status !== "paid") {
        return res.json({ success: false, status: session.payment_status });
      }

      const journeyId = session.metadata?.journeyId;
      const email = session.customer_email || session.metadata?.customerEmail;
      const name = session.metadata?.customerName;

      if (!journeyId || !email) {
        return res.status(400).json({ error: "Invalid session data" });
      }

      participant = await storage.createExternalParticipant(
        journeyId,
        email,
        name || undefined,
        sessionId
      );

      const journey = await storage.getJourney(journeyId);
      if (journey?.creatorId) {
        await storage.createActivityEvent({
          creatorId: journey.creatorId,
          participantId: participant.id,
          journeyId,
          eventType: 'joined',
          eventData: { participantName: name || email, paymentVerified: true },
        });

        // Record payment for mentor earnings tracking with commission
        const amountPaid = session.amount_total || 0;
        if (amountPaid > 0) {
          try {
            // Get mentor's plan for commission calculation
            const mentor = await storage.getUser(journey.creatorId);
            const mentorPlan = (mentor?.subscriptionPlan as PlanType) || 'free';
            const { calculateCommission } = await import('./subscriptionService');
            const commission = calculateCommission(amountPaid, mentorPlan);

            await storage.createPayment({
              journeyId,
              participantId: participant.id,
              mentorId: journey.creatorId,
              stripeCheckoutSessionId: sessionId,
              stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
              amount: amountPaid,
              currency: session.currency?.toUpperCase() || "ILS",
              status: "completed",
              customerEmail: email,
              customerName: name || undefined,
              commissionRate: Math.round(commission.commissionRate * 100),
              commissionAmount: Math.round(commission.commissionAmount),
              netAmount: Math.round(commission.netAmount),
            });
            console.log(`Payment recorded: ₪${amountPaid / 100} for journey ${journeyId} (${mentorPlan} plan, ${Math.round(commission.commissionRate * 100)}% commission)`);
          } catch (paymentErr) {
            console.error("Error recording payment (non-blocking):", paymentErr);
          }
        }
      }

      res.json({ 
        success: true, 
        accessToken: participant.accessToken 
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Dynamic manifest for journey-specific PWA
  // Accepts journeyId as path param and optional token as query param for external participants
  app.get("/api/manifest/:journeyId", async (req, res) => {
    try {
      const { journeyId } = req.params;
      const { token } = req.query; // Access token for external participants
      const journey = await storage.getJourney(journeyId);
      
      // Use access token for start_url if provided (external participants)
      // Otherwise use journey ID (for mentor preview)
      const startUrl = token ? `/p/${token}` : (journeyId ? `/p/${journeyId}` : "/");
      
      const manifest = {
        name: journey?.name || "Flow 83",
        short_name: journey?.name?.slice(0, 12) || "Flow 83",
        description: journey?.goal || "מסע טרנספורמציה דיגיטלי",
        start_url: startUrl,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#7c3aed",
        orientation: "portrait",
        icons: [
          {
            src: journey?.coverImage || "/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: journey?.coverImage || "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      };
      
      res.setHeader("Content-Type", "application/manifest+json");
      res.json(manifest);
    } catch (error) {
      console.error("Error generating manifest:", error);
      res.status(500).json({ error: "Failed to generate manifest" });
    }
  });

  app.get("/api/participant/token/:accessToken", async (req, res) => {
    try {
      const { accessToken } = req.params;
      
      const participant = await storage.getParticipantByAccessToken(accessToken);
      console.log("Participant found:", participant?.id);
      
      if (!participant) {
        return res.status(404).json({ error: "Invalid access token" });
      }

      console.log("Getting journey:", participant.journeyId);
      const journey = await storage.getJourney(participant.journeyId);
      console.log("Journey found:", journey?.id);
      
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      // Get steps with blocks for the journey
      console.log("Getting steps for journey");
      const steps = await storage.getJourneySteps(participant.journeyId);
      console.log("Steps found:", steps.length);
      
      const stepsWithBlocks = await Promise.all(
        steps.map(async (step) => {
          const blocks = await storage.getJourneyBlocks(step.id);
          return { ...step, blocks };
        })
      );

      // Get mentor info
      let mentor = null;
      if (journey.creatorId) {
        console.log("Getting mentor:", journey.creatorId);
        mentor = await storage.getUser(journey.creatorId);
      }

      // Check if mentor's payment has failed for more than 5 days
      if (mentor?.paymentFailedAt) {
        const failedDate = new Date(mentor.paymentFailedAt);
        const gracePeriodMs = 5 * 24 * 60 * 60 * 1000; // 5 days
        const gracePeriodEnds = new Date(failedDate.getTime() + gracePeriodMs);
        
        if (Date.now() > gracePeriodEnds.getTime()) {
          return res.status(403).json({ 
            error: "This flow is temporarily unavailable", 
            blocked: true,
            message: "The creator of this flow is updating their account. Please check back soon."
          });
        }
      }

      console.log("Returning participant data successfully");
      res.json({ 
        participant, 
        journey: {
          ...journey,
          steps: stepsWithBlocks,
          mentor
        }
      });
    } catch (error) {
      console.error("Error fetching participant - full error:", error);
      res.status(500).json({ error: "Failed to fetch participant data" });
    }
  });

  // Participant feedback routes
  app.post("/api/feedback", async (req, res) => {
    try {
      const { participantId, journeyId, rating, comment, dayNumber, feedbackType } = req.body;

      if (!participantId || !journeyId || !rating) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const participant = await storage.getParticipantById(participantId);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Security: verify participant belongs to this journey
      if (participant.journeyId !== journeyId) {
        return res.status(403).json({ error: "Participant does not belong to this journey" });
      }

      const journey = await storage.getJourney(journeyId);
      if (!journey || !journey.creatorId) {
        return res.status(404).json({ error: "Journey not found" });
      }

      const feedback = await storage.createFeedback({
        participantId,
        journeyId,
        mentorId: journey.creatorId,
        rating,
        comment: comment || null,
        dayNumber: dayNumber || null,
        feedbackType: feedbackType || "day",
      });

      // Create activity event for mentor
      await storage.createActivityEvent({
        creatorId: journey.creatorId,
        participantId,
        journeyId,
        eventType: 'feedback',
        eventData: { 
          rating,
          journeyName: journey.name,
          dayNumber,
        },
      });

      res.json(feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Get feedback for mentor's journeys
  app.get("/api/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const feedback = await storage.getFeedbackByMentor(userId);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  // ============== SUBSCRIPTION ROUTES ==============
  
  // Create subscription checkout session (GET for browser redirect, POST for API)
  const handleSubscriptionCheckout = async (req: any, res: any) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const plan = req.query?.plan || req.body?.plan;
      const returnToJourney = req.query?.returnToJourney || req.body?.returnToJourney;
      
      // New plan names: free (no checkout needed), pro, scale
      if (!plan || !['pro', 'scale'].includes(plan)) {
        return res.status(400).json({ error: "Invalid plan. Use 'pro' or 'scale'." });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { subscriptionService } = await import('./subscriptionService');
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const successUrl = returnToJourney 
        ? `${baseUrl}/journey/${returnToJourney}/edit?subscription=success`
        : `${baseUrl}/dashboard?subscription=success`;
      const cancelUrl = returnToJourney
        ? `${baseUrl}/journey/${returnToJourney}/edit?subscription=canceled`
        : `${baseUrl}/pricing?subscription=canceled`;
      
      const result = await subscriptionService.createSubscriptionCheckout({
        userId,
        email: user.email || '',
        plan,
        successUrl,
        cancelUrl,
        customerId: user.stripeCustomerId || undefined,
      });

      // For GET requests, redirect directly to Stripe
      if (req.method === 'GET') {
        return res.redirect(result.url);
      }

      res.json({ url: result.url, sessionId: result.sessionId });
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  };

  app.get("/api/subscription/checkout", isAuthenticated, handleSubscriptionCheckout);
  app.post("/api/subscription/checkout", isAuthenticated, handleSubscriptionCheckout);

  // Get customer portal URL for managing subscription
  app.get("/api/subscription/portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No active subscription" });
      }

      const { subscriptionService } = await import('./subscriptionService');
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const portalUrl = await subscriptionService.getCustomerPortalUrl(
        user.stripeCustomerId,
        `${baseUrl}/dashboard`
      );

      res.json({ url: portalUrl });
    } catch (error) {
      console.error("Error getting portal URL:", error);
      res.status(500).json({ error: "Failed to get billing portal" });
    }
  });

  // Get current user subscription status
  app.get("/api/subscription/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Default to 'free' plan if no subscription
      const currentPlan = user.subscriptionPlan || 'free';
      const commissionRates: Record<string, number> = { free: 17, pro: 15, scale: 11 };
      const commissionRate = commissionRates[currentPlan] || 17;

      res.json({
        plan: currentPlan,
        status: user.subscriptionStatus || (currentPlan === 'free' ? 'active' : null),
        commissionRate,
        subscriptionEndsAt: user.subscriptionEndsAt || null,
        paymentFailedAt: user.paymentFailedAt || null,
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  // Cancel subscription
  app.post("/api/subscription/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.subscriptionId) {
        return res.status(400).json({ error: "No active subscription" });
      }

      const { subscriptionService } = await import('./subscriptionService');
      await subscriptionService.cancelSubscription(user.subscriptionId);
      
      await storage.upsertUser({
        id: userId,
        subscriptionStatus: 'canceling',
      });

      res.json({ success: true, message: "Subscription will be canceled at end of billing period" });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Reactivate canceled subscription
  app.post("/api/subscription/reactivate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.subscriptionId) {
        return res.status(400).json({ error: "No subscription to reactivate" });
      }

      const { subscriptionService } = await import('./subscriptionService');
      await subscriptionService.reactivateSubscription(user.subscriptionId);
      
      await storage.upsertUser({
        id: userId,
        subscriptionStatus: 'active',
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ error: "Failed to reactivate subscription" });
    }
  });

  // Switch subscription plan (upgrade/downgrade)
  app.post("/api/subscription/change-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { newPlan } = req.body;
      
      if (!newPlan || !['free', 'pro', 'scale'].includes(newPlan)) {
        return res.status(400).json({ error: "Invalid plan. Use 'free', 'pro', or 'scale'." });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentPlan = user.subscriptionPlan || 'free';
      
      // Same plan - no action needed
      if (currentPlan === newPlan) {
        return res.json({ success: true, message: "Already on this plan" });
      }

      const { subscriptionService } = await import('./subscriptionService');

      // Downgrading to free - cancel existing subscription
      if (newPlan === 'free') {
        if (user.subscriptionId) {
          await subscriptionService.cancelSubscription(user.subscriptionId);
        }
        await storage.upsertUser({
          id: userId,
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          planChangedAt: new Date(),
        });
        return res.json({ success: true, message: "Switched to Free plan" });
      }

      // Upgrading from free - need to create new subscription
      if (currentPlan === 'free') {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const result = await subscriptionService.createSubscriptionCheckout({
          userId,
          email: user.email || '',
          plan: newPlan as 'pro' | 'scale',
          successUrl: `${baseUrl}/dashboard?subscription=success&plan=${newPlan}`,
          cancelUrl: `${baseUrl}/dashboard?subscription=canceled`,
          customerId: user.stripeCustomerId || undefined,
        });
        return res.json({ success: true, checkoutUrl: result.url });
      }

      // Switching between paid plans (pro <-> scale)
      if (user.subscriptionId) {
        await subscriptionService.changePlan(user.subscriptionId, newPlan as 'pro' | 'scale');
        await storage.upsertUser({
          id: userId,
          subscriptionPlan: newPlan,
          planChangedAt: new Date(),
        });
        return res.json({ success: true, message: `Switched to ${newPlan} plan` });
      }

      res.status(400).json({ error: "Unable to change plan" });
    } catch (error) {
      console.error("Error changing plan:", error);
      res.status(500).json({ error: "Failed to change plan" });
    }
  });

  // LemonSqueezy webhook handler (no auth - LemonSqueezy calls this)
  app.post("/api/webhooks/lemonsqueezy", async (req, res) => {
    try {
      const crypto = await import('crypto');
      const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
      
      if (!secret) {
        console.error("Missing LEMONSQUEEZY_WEBHOOK_SECRET");
        return res.status(500).json({ error: "Webhook not configured" });
      }

      // Get signature from header (handle array headers)
      const signatureHeader = req.headers['x-signature'];
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
      if (!signature) {
        console.error("Missing X-Signature header");
        return res.status(400).json({ error: "Missing signature" });
      }

      // Verify signature using raw body (stored by express.json verify function)
      const rawBody = (req as any).rawBody;
      if (!rawBody || !Buffer.isBuffer(rawBody)) {
        console.error("Missing raw body for webhook verification");
        return res.status(400).json({ error: "Missing raw body" });
      }
      
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(rawBody).digest('hex');
      
      // Case-insensitive, constant-time comparison
      const digestBuffer = Buffer.from(digest.toLowerCase(), 'utf8');
      const signatureBuffer = Buffer.from(signature.toLowerCase(), 'utf8');
      
      if (digestBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
        console.error("Invalid webhook signature");
        return res.status(403).json({ error: "Invalid signature" });
      }

      // Parse event
      const payload = req.body;
      const eventName = payload.meta?.event_name;
      const customData = payload.meta?.custom_data || {};
      const attributes = payload.data?.attributes || {};
      
      console.log(`LemonSqueezy webhook: ${eventName}`, { customData });

      // Extract user identifier from custom data or email
      const userEmail = attributes.user_email || customData.email;
      const userId = customData.user_id;
      
      // Determine plan from product/variant
      const productName = attributes.product_name?.toLowerCase() || '';
      let plan = 'starter';
      if (productName.includes('pro')) plan = 'pro';
      else if (productName.includes('business')) plan = 'business';
      
      // Map LemonSqueezy status to our status
      const lsStatus = attributes.status;
      let subscriptionStatus = lsStatus; // on_trial, active, cancelled, expired, past_due, paused
      
      switch (eventName) {
        case 'subscription_created':
        case 'subscription_updated':
        case 'subscription_resumed':
        case 'subscription_unpaused': {
          // Find user by ID or email
          let user;
          if (userId) {
            user = await storage.getUser(userId);
          }
          if (!user && userEmail) {
            user = await storage.getUserByEmail(userEmail);
          }
          
          if (!user) {
            console.log(`User not found for subscription event: ${userEmail || userId}`);
            return res.json({ received: true, warning: "User not found" });
          }

          // Update subscription data
          await storage.upsertUser({
            id: user.id,
            lemonSqueezyCustomerId: String(attributes.customer_id),
            subscriptionId: String(payload.data.id),
            subscriptionPlan: plan,
            subscriptionStatus: subscriptionStatus,
            trialEndsAt: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
            subscriptionEndsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
            planChangedAt: new Date(),
          });
          
          console.log(`Updated subscription for user ${user.id}: ${plan} (${subscriptionStatus})`);
          break;
        }
        
        case 'subscription_cancelled': {
          let user;
          if (userId) {
            user = await storage.getUser(userId);
          }
          if (!user && userEmail) {
            user = await storage.getUserByEmail(userEmail);
          }
          
          if (user) {
            await storage.upsertUser({
              id: user.id,
              subscriptionStatus: 'cancelled',
              subscriptionEndsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
            });
            console.log(`Subscription cancelled for user ${user.id}`);
          }
          break;
        }
        
        case 'subscription_expired': {
          let user;
          if (userId) {
            user = await storage.getUser(userId);
          }
          if (!user && userEmail) {
            user = await storage.getUserByEmail(userEmail);
          }
          
          if (user) {
            await storage.upsertUser({
              id: user.id,
              subscriptionStatus: 'expired',
              subscriptionEndsAt: new Date(),
            });
            console.log(`Subscription expired for user ${user.id}`);
          }
          break;
        }
        
        case 'subscription_payment_failed': {
          let user;
          if (userId) {
            user = await storage.getUser(userId);
          }
          if (!user && userEmail) {
            user = await storage.getUserByEmail(userEmail);
          }
          
          if (user) {
            // Only set paymentFailedAt if not already set (first failure starts the grace period)
            const paymentFailedAt = user.paymentFailedAt || new Date();
            await storage.upsertUser({
              id: user.id,
              subscriptionStatus: 'past_due',
              paymentFailedAt: paymentFailedAt,
            });
            console.log(`Payment failed for user ${user.id}, grace period started at ${paymentFailedAt}`);
          }
          break;
        }
        
        case 'subscription_payment_success':
        case 'subscription_payment_recovered': {
          let user;
          if (userId) {
            user = await storage.getUser(userId);
          }
          if (!user && userEmail) {
            user = await storage.getUserByEmail(userEmail);
          }
          
          if (user) {
            // Clear paymentFailedAt when payment succeeds - restores full access
            await storage.upsertUser({
              id: user.id,
              subscriptionStatus: 'active',
              paymentFailedAt: null,
            });
            console.log(`Payment successful for user ${user.id}, grace period cleared`);
          }
          break;
        }
        
        case 'subscription_plan_changed': {
          let user;
          if (userId) {
            user = await storage.getUser(userId);
          }
          if (!user && userEmail) {
            user = await storage.getUserByEmail(userEmail);
          }
          
          if (user) {
            await storage.upsertUser({
              id: user.id,
              subscriptionPlan: plan,
              subscriptionStatus: subscriptionStatus,
            });
            console.log(`Plan changed for user ${user.id}: ${plan}`);
          }
          break;
        }
        
        case 'subscription_paused': {
          let user;
          if (userId) {
            user = await storage.getUser(userId);
          }
          if (!user && userEmail) {
            user = await storage.getUserByEmail(userEmail);
          }
          
          if (user) {
            await storage.upsertUser({
              id: user.id,
              subscriptionStatus: 'paused',
            });
            console.log(`Subscription paused for user ${user.id}`);
          }
          break;
        }
        
        default:
          console.log(`Unhandled LemonSqueezy event: ${eventName}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("LemonSqueezy webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Grow (Israeli payment provider) webhook endpoint
  app.post("/api/webhooks/grow", async (req, res) => {
    try {
      const crypto = await import('crypto');
      const secret = process.env.GROW_WEBHOOK_SECRET;
      
      if (!secret) {
        console.error("Missing GROW_WEBHOOK_SECRET");
        return res.status(500).json({ error: "Webhook not configured" });
      }

      // Get signature from header (Grow may use different header name - adjust as needed)
      const signatureHeader = req.headers['x-grow-signature'] || req.headers['x-signature'];
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
      
      // Verify signature using raw body
      const rawBody = (req as any).rawBody;
      if (!rawBody || !Buffer.isBuffer(rawBody)) {
        console.error("Missing raw body for Grow webhook verification");
        return res.status(400).json({ error: "Missing raw body" });
      }
      
      // Require signature header for security
      if (!signature) {
        console.error("Missing Grow webhook signature header");
        return res.status(403).json({ error: "Missing signature" });
      }
      
      // Verify HMAC signature (adjust algorithm if Grow uses different method)
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(rawBody).digest('hex');
      
      const digestBuffer = Buffer.from(digest.toLowerCase(), 'utf8');
      const signatureBuffer = Buffer.from(signature.toLowerCase(), 'utf8');
      
      if (digestBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
        console.error("Invalid Grow webhook signature");
        return res.status(403).json({ error: "Invalid signature" });
      }

      // Parse the webhook payload
      const payload = req.body;
      console.log("Grow webhook received:", JSON.stringify(payload, null, 2));

      // Extract event info - adjust field names based on actual Grow webhook format
      const eventType = payload.type || payload.event || payload.eventType;
      const customerEmail = payload.customer?.email || payload.email || payload.buyer_email;
      const productId = payload.product?.id || payload.productId;
      const orderId = payload.order?.id || payload.orderId || payload.transaction_id;

      // Determine plan from product ID or name
      let plan = 'starter';
      const productName = (payload.product?.name || payload.productName || '').toLowerCase();
      if (productName.includes('pro') || productId?.includes('pro')) {
        plan = 'pro';
      } else if (productName.includes('business') || productId?.includes('business')) {
        plan = 'business';
      }

      // Handle different event types
      switch (eventType) {
        case 'payment.completed':
        case 'order.completed':
        case 'subscription.created':
        case 'subscription.activated':
        case 'charge.succeeded': {
          // Find user by email
          if (!customerEmail) {
            console.log("No customer email in Grow webhook");
            return res.json({ received: true, warning: "No customer email" });
          }

          const user = await storage.getUserByEmail(customerEmail);
          
          if (!user) {
            console.log(`User not found for Grow payment: ${customerEmail}`);
            // Store event for later reconciliation
            return res.json({ received: true, warning: "User not found" });
          }

          // Activate subscription
          await storage.upsertUser({
            id: user.id,
            subscriptionPlan: plan,
            subscriptionStatus: 'active',
            subscriptionProvider: 'grow',
            paymentFailedAt: null,
            trialEndsAt: null, // Clear trial since they've paid
          });
          
          console.log(`Grow payment successful for user ${user.id}: ${plan}`);
          break;
        }

        case 'subscription.cancelled':
        case 'subscription.expired':
        case 'order.refunded': {
          if (!customerEmail) {
            return res.json({ received: true });
          }

          const user = await storage.getUserByEmail(customerEmail);
          if (user) {
            await storage.upsertUser({
              id: user.id,
              subscriptionStatus: eventType === 'order.refunded' ? 'cancelled' : 'expired',
            });
            console.log(`Grow subscription ${eventType} for user ${user.id}`);
          }
          break;
        }

        case 'payment.failed':
        case 'subscription.payment_failed': {
          if (!customerEmail) {
            return res.json({ received: true });
          }

          const user = await storage.getUserByEmail(customerEmail);
          if (user) {
            const paymentFailedAt = user.paymentFailedAt || new Date();
            await storage.upsertUser({
              id: user.id,
              subscriptionStatus: 'past_due',
              paymentFailedAt: paymentFailedAt,
            });
            console.log(`Grow payment failed for user ${user.id}`);
          }
          break;
        }

        default:
          console.log(`Unhandled Grow event: ${eventType}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Grow webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // ============ ADMIN ROUTES ============
  // Simple admin authentication with username/password from secrets
  const adminSessions = new Set<string>();
  
  // Admin login route - separate from Replit Auth
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminUsername || !adminPassword) {
        console.error("Admin credentials not configured in secrets");
        return res.status(500).json({ error: "Admin authentication not configured" });
      }
      
      if (username === adminUsername && password === adminPassword) {
        // Generate a session token
        const token = crypto.randomUUID();
        adminSessions.add(token);
        
        // Auto-expire after 24 hours
        setTimeout(() => {
          adminSessions.delete(token);
        }, 24 * 60 * 60 * 1000);
        
        return res.json({ success: true, token });
      }
      
      return res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });
  
  // Admin logout route
  app.post("/api/admin/logout", async (req, res) => {
    const token = req.headers['x-admin-token'] as string;
    if (token) {
      adminSessions.delete(token);
    }
    res.json({ success: true });
  });
  
  // Admin session verification
  app.get("/api/admin/verify", async (req, res) => {
    const token = req.headers['x-admin-token'] as string;
    if (token && adminSessions.has(token)) {
      return res.json({ valid: true });
    }
    return res.status(401).json({ valid: false });
  });
  
  // Admin middleware - check for valid admin session token
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      if (!token || !adminSessions.has(token)) {
        return res.status(401).json({ error: "Admin authentication required" });
      }
      next();
    } catch (error) {
      return res.status(500).json({ error: "Server error" });
    }
  };

  // Admin dashboard stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin users list
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin participants list with details
  app.get("/api/admin/participants", isAdmin, async (req, res) => {
    try {
      const participants = await storage.getAllParticipantsWithDetails();
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Admin flows/journeys list with stats
  app.get("/api/admin/flows", isAdmin, async (req, res) => {
    try {
      const flows = await storage.getAllJourneysWithStats();
      res.json(flows);
    } catch (error) {
      console.error("Error fetching flows:", error);
      res.status(500).json({ error: "Failed to fetch flows" });
    }
  });

  // Admin pending flows list (pending approval)
  app.get("/api/admin/pending-flows", isAdmin, async (req, res) => {
    try {
      const pendingFlows = await storage.getPendingFlows();
      res.json(pendingFlows);
    } catch (error) {
      console.error("Error fetching pending flows:", error);
      res.status(500).json({ error: "Failed to fetch pending flows" });
    }
  });

  // Admin activate flow (publish and set payment URL, but don't send email yet)
  app.post("/api/admin/flows/:id/activate", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminPaymentUrl } = req.body;

      // Get the flow details
      const journey = await storage.getJourney(id);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      // For paid flows, payment link is required
      if (journey.price && journey.price > 0 && !adminPaymentUrl) {
        return res.status(400).json({ error: "Payment link is required for paid flows" });
      }

      // Update the journey - set payment URL but don't publish yet (will be published when email is sent)
      await storage.updateJourney(id, {
        adminPaymentUrl: adminPaymentUrl || null,
        adminApprovedAt: new Date(),
      });

      // Get the updated journey to return the correct link
      const updatedJourney = await storage.getJourney(id);
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
        ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
        : 'https://flow83.com';
      const miniSiteUrl = updatedJourney?.shortCode 
        ? `${baseUrl}/f/${updatedJourney.shortCode}`
        : `${baseUrl}/j/${id}`;

      res.json({ success: true, miniSiteUrl, flowId: id });
    } catch (error) {
      console.error("Error activating flow:", error);
      res.status(500).json({ error: "Failed to activate flow" });
    }
  });

  // Admin approve flow and send email to mentor
  app.post("/api/admin/flows/:id/approve", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Get the flow details
      const journey = await storage.getJourney(parseInt(id));
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      // Guard: Flow must be activated before approval (check if adminApprovedAt is set)
      if (!journey.adminApprovedAt) {
        return res.status(400).json({ error: "Flow must be activated first" });
      }

      // Guard: Paid flows must have a payment URL set
      if (journey.price && journey.price > 0 && !journey.adminPaymentUrl) {
        return res.status(400).json({ error: "Payment link is required for paid flows" });
      }

      // Get the mentor
      const mentor = await storage.getUser(journey.creatorId);
      if (!mentor) {
        return res.status(404).json({ error: "Mentor not found" });
      }

      // Update the journey with final approval - now publish the flow
      await storage.updateJourney(parseInt(id), {
        status: "published",
        approvalStatus: "approved",
        sentToMentorAt: new Date(),
      });

      // Send email to mentor with mini-site link
      if (mentor.email) {
        try {
          const { sendFlowApprovedEmail } = await import('./email');
          const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
            ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
            : 'https://flow83.com';
          const miniSiteUrl = journey.shortCode 
            ? `${baseUrl}/f/${journey.shortCode}`
            : `${baseUrl}/j/${journey.id}`;
          
          await sendFlowApprovedEmail({
            mentorEmail: mentor.email,
            mentorName: mentor.firstName || mentor.email || 'מנטור',
            flowName: journey.name,
            miniSiteLink: miniSiteUrl
          });
        } catch (emailError) {
          console.error("Error sending approval email:", emailError);
        }
      } else {
        console.warn(`Mentor ${mentor.id} has no email, skipping approval notification`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error approving flow:", error);
      res.status(500).json({ error: "Failed to approve flow" });
    }
  });

  // Admin errors list
  app.get("/api/admin/errors", isAdmin, async (req, res) => {
    try {
      const errors = await storage.getSystemErrors(200);
      res.json(errors);
    } catch (error) {
      console.error("Error fetching system errors:", error);
      res.status(500).json({ error: "Failed to fetch errors" });
    }
  });

  // Check if current user is admin
  app.get("/api/admin/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      res.json({ isAdmin: user?.role === "super_admin" });
    } catch (error) {
      res.json({ isAdmin: false });
    }
  });

  // Legacy Stripe subscription webhook handler (kept for backwards compatibility)
  app.post("/api/subscription/webhook", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      if (!sig) {
        return res.status(400).json({ error: "Missing signature" });
      }

      const { subscriptionService } = await import('./subscriptionService');
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("Missing STRIPE_SUBSCRIPTION_WEBHOOK_SECRET");
        return res.status(500).json({ error: "Webhook not configured" });
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: "Invalid signature" });
      }

      const result = await subscriptionService.handleSubscriptionWebhook(event);
      
      if (result && result.userId) {
        await storage.upsertUser({
          id: result.userId,
          stripeCustomerId: result.customerId,
          subscriptionId: result.subscriptionId,
          subscriptionPlan: result.plan,
          subscriptionStatus: result.status,
          trialEndsAt: result.trialEnd,
          subscriptionEndsAt: result.currentPeriodEnd,
        });
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Email API endpoints (admin only)
  app.post("/api/admin/email/trigger-daily", isAdmin, async (req, res) => {
    try {
      console.log("[Admin] Manually triggering daily email notifications...");
      const results = await processEmailNotifications();
      res.json({ 
        success: true, 
        message: "Daily email notifications sent",
        results 
      });
    } catch (error) {
      console.error("Error triggering daily emails:", error);
      res.status(500).json({ error: "Failed to send daily emails" });
    }
  });

  // Send completion email for a specific participant
  app.post("/api/admin/email/send-completion/:participantId", isAdmin, async (req, res) => {
    try {
      const { participantId } = req.params;
      const success = await sendCompletionNotification(participantId);
      if (success) {
        res.json({ success: true, message: "Completion email sent" });
      } else {
        res.status(400).json({ error: "Could not send completion email" });
      }
    } catch (error) {
      console.error("Error sending completion email:", error);
      res.status(500).json({ error: "Failed to send completion email" });
    }
  });

  // Admin platform stats (extended)
  app.get("/api/admin/platform-stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting platform stats:", error);
      res.status(500).json({ error: "Failed to get platform stats" });
    }
  });

  // Admin withdrawal requests management
  app.get("/api/admin/withdrawal-requests", isAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllWithdrawalRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error getting withdrawal requests:", error);
      res.status(500).json({ error: "Failed to get withdrawal requests" });
    }
  });

  app.patch("/api/admin/withdrawal-requests/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason, transactionReference } = req.body;
      
      const updates: any = { status };
      if (status === "rejected" && rejectionReason) {
        updates.rejectionReason = rejectionReason;
      }
      if (status === "approved") {
        updates.approvedAt = new Date();
      }
      if (status === "completed") {
        updates.completedAt = new Date();
        if (transactionReference) {
          updates.transactionReference = transactionReference;
        }
      }
      
      const updated = await storage.updateWithdrawalRequest(id, updates);
      if (!updated) {
        return res.status(404).json({ error: "Withdrawal request not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating withdrawal request:", error);
      res.status(500).json({ error: "Failed to update withdrawal request" });
    }
  });

  // Admin refund requests management
  app.get("/api/admin/refund-requests", isAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllRefundRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error getting refund requests:", error);
      res.status(500).json({ error: "Failed to get refund requests" });
    }
  });

  app.patch("/api/admin/refund-requests/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      const updates: any = { status };
      if (adminNotes) {
        updates.adminNotes = adminNotes;
      }
      if (status === "approved" || status === "rejected") {
        updates.reviewedAt = new Date();
      }
      if (status === "completed") {
        updates.completedAt = new Date();
      }
      
      const updated = await storage.updateRefundRequest(id, updates);
      if (!updated) {
        return res.status(404).json({ error: "Refund request not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating refund request:", error);
      res.status(500).json({ error: "Failed to update refund request" });
    }
  });

  // Admin payments history
  app.get("/api/admin/payments", isAdmin, async (req, res) => {
    try {
      const payments = await storage.getAllPaymentsWithDetails();
      res.json(payments);
    } catch (error) {
      console.error("Error getting payments:", error);
      res.status(500).json({ error: "Failed to get payments" });
    }
  });

  // Update user subscription plan (for admin)
  app.patch("/api/admin/users/:id/plan", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { subscriptionPlan } = req.body;
      
      const updated = await storage.updateUser(id, { subscriptionPlan });
      res.json(updated);
    } catch (error) {
      console.error("Error updating user plan:", error);
      res.status(500).json({ error: "Failed to update user plan" });
    }
  });

  // Mentor withdrawal request endpoint
  app.post("/api/mentor/withdrawal-request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get mentor profile and wallet
      const profile = await storage.getMentorBusinessProfile(userId);
      if (!profile?.bankAccountNumber) {
        return res.status(400).json({ error: "נא למלא פרטי בנק לפני בקשת משיכה" });
      }
      
      const wallet = await storage.getMentorWallet(userId);
      if (!wallet || (wallet.balance ?? 0) < 1000) { // Minimum 10 ILS
        return res.status(400).json({ error: "יתרה לא מספיקה למשיכה (מינימום ₪10)" });
      }
      
      // Process the withdrawal
      const result = await storage.processWithdrawal({
        userId,
        wallet,
        profile,
      });
      
      res.json({
        success: true,
        withdrawal: result.withdrawal,
        invoice: result.invoice,
      });
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ error: "Failed to create withdrawal request" });
    }
  });

  // Mentor refund request endpoint
  app.post("/api/mentor/refund-request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { participantId, journeyId, paymentId, type, amount, reason, participantEmail, participantName } = req.body;
      
      const refund = await storage.createRefundRequest({
        mentorId: userId,
        participantId,
        journeyId,
        paymentId,
        type: type || "refund",
        amount,
        reason,
        participantEmail,
        participantName,
        status: "pending",
      });
      
      res.json(refund);
    } catch (error) {
      console.error("Error creating refund request:", error);
      res.status(500).json({ error: "Failed to create refund request" });
    }
  });

  // Get mentor's refund requests
  app.get("/api/mentor/refund-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const requests = await storage.getRefundRequestsByMentor(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error getting refund requests:", error);
      res.status(500).json({ error: "Failed to get refund requests" });
    }
  });

  return httpServer;
}
