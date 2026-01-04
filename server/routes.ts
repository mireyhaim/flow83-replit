import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { insertJourneySchema, insertJourneyStepSchema, insertJourneyBlockSchema, insertParticipantSchema } from "@shared/schema";
import { generateJourneyContent, generateChatResponse, generateDayOpeningMessage, generateFlowDays, generateDaySummary, generateParticipantSummary, generateJourneySummary, generateLandingPageContent, analyzeMentorContent } from "./ai";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import multer from "multer";
import mammoth from "mammoth";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// Generate a unique 6-character short code for flow URLs
function generateShortCode(): string {
  return Date.now().toString(36).slice(-3) + Math.random().toString(36).slice(2, 5);
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Replit Auth (Google, GitHub, email, etc.)
  await setupAuth(app);
  registerAuthRoutes(app);

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
      
      // Filter out journeys from expired mentors
      // This also triggers expireUserTrial() for any expired mentors on first access
      const activeJourneys = [];
      for (const journey of publishedJourneys) {
        if (journey.creatorId) {
          const mentorTrialStatus = await storage.getUserTrialStatus(journey.creatorId);
          if (mentorTrialStatus.isActive) {
            activeJourneys.push(journey);
          }
          // If trial expired, getUserTrialStatus already called expireUserTrial
          // which set this journey to draft, so it won't appear next time
        } else {
          // No creator - include it (system journey)
          activeJourneys.push(journey);
        }
      }
      
      res.json(activeJourneys);
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

  // Get trial/subscription status for current user
  app.get("/api/trial-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const trialStatus = await storage.getUserTrialStatus(userId);
      res.json(trialStatus);
    } catch (error) {
      console.error("Error fetching trial status:", error);
      res.status(500).json({ error: "Failed to fetch trial status" });
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
      const totalCents = await storage.getTotalEarningsByMentor(userId);
      const payments = await storage.getPaymentsByMentor(userId);
      res.json({ 
        totalEarnings: totalCents / 100,
        totalCents,
        currency: "USD",
        paymentCount: payments.length,
        recentPayments: payments.slice(0, 10).map(p => ({
          id: p.id,
          amount: p.amount / 100,
          currency: p.currency,
          customerEmail: p.customerEmail,
          customerName: p.customerName,
          createdAt: p.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
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
      
      // Check if this is user's first journey - start 21-day trial if so
      if (userId) {
        const user = await storage.getUser(userId);
        if (user && !user.trialStartedAt && !user.subscriptionStatus) {
          // Start the 21-day trial for new users creating their first flow
          await storage.startUserTrial(userId);
        } else {
          // Check trial status for existing users
          const trialStatus = await storage.getUserTrialStatus(userId);
          if (!trialStatus.isActive) {
            return res.status(402).json({ 
              error: "trial_expired", 
              message: "Your trial has expired. Please subscribe to create new flows.",
              trialStatus: trialStatus.status
            });
          }
        }
      }
      
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

      // Check trial status for all edits
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ 
            error: "trial_expired", 
            message: "Your trial has expired. Please subscribe to edit flows.",
            trialStatus: trialStatus.status
          });
        }
      }

      // Generate short code when publishing for the first time
      let updateData = { ...req.body };
      if (req.body.status === "published" && !existingJourney.shortCode) {
        updateData.shortCode = generateShortCode();
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
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to regenerate content." });
        }
      }
      
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
      
      // Always check mentor's trial status on public access
      // This ensures expiration is triggered even without authenticated calls
      if (journey.creatorId) {
        const mentorTrialStatus = await storage.getUserTrialStatus(journey.creatorId);
        if (!mentorTrialStatus.isActive) {
          // Trial expired - this triggers expireUserTrial which sets flows to draft
          // Return 404 to hide the flow from public access
          return res.status(404).json({ error: "Flow not found" });
        }
      }
      
      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flow" });
    }
  });

  app.delete("/api/journeys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to delete flows." });
        }
      }
      await storage.deleteJourney(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete flow" });
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
      
      // Always check mentor's trial status on public access
      // This ensures expiration is triggered even without authenticated calls
      if (journey.creatorId) {
        const mentorTrialStatus = await storage.getUserTrialStatus(journey.creatorId);
        if (!mentorTrialStatus.isActive) {
          // Trial expired - this triggers expireUserTrial which sets flows to draft
          // Return 404 to hide the flow from public access
          return res.status(404).json({ error: "Flow not found" });
        }
      }
      
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
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to add content." });
        }
      }
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
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to edit content." });
        }
      }
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
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to delete content." });
        }
      }
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
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to add content." });
        }
      }
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
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to edit content." });
        }
      }
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
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to delete content." });
        }
      }
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
        // Check if the mentor's trial is still active before allowing new participants
        const journey = await storage.getJourney(journeyId);
        if (journey?.creatorId) {
          const mentorTrialStatus = await storage.getUserTrialStatus(journey.creatorId);
          if (!mentorTrialStatus.isActive) {
            return res.status(402).json({ 
              error: "mentor_trial_expired", 
              message: "This flow is currently unavailable. Please try again later." 
            });
          }
        }
        
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
    const journeyId = req.params.id;
    const { content } = req.body;
    const useSSE = req.headers.accept === "text/event-stream";
    
    // Check trial status before any processing
    const userId = req.user?.claims?.sub;
    if (userId) {
      const trialStatus = await storage.getUserTrialStatus(userId);
      if (!trialStatus.isActive) {
        return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to generate content." });
      }
    }
    
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

      sendProgress("init", 5, "Preparing data...");

      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        if (useSSE) {
          res.write(`data: ${JSON.stringify({ error: "Flow not found" })}\n\n`);
          return res.end();
        }
        return res.status(404).json({ error: "Flow not found" });
      }

      sendProgress("ai", 10, "Analyzing your teaching style...");

      // Analyze ALL uploaded content to extract mentor's unique style
      console.log("[generate-content] Analyzing mentor content, length:", content.length);
      const mentorStyle = await analyzeMentorContent(content);
      console.log("[generate-content] Mentor style extracted:", {
        tone: mentorStyle.toneOfVoice?.substring(0, 100),
        phrases: mentorStyle.keyPhrases?.length,
        summaryLength: mentorStyle.contentSummary?.length
      });

      sendProgress("ai", 30, "Creating content in your voice...");

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
      
      const generatedDays = await generateJourneyContent(intent, content);
      console.log("[generate-content] Generated days count:", generatedDays.length);
      
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

      sendProgress("cleanup", 60, "Cleaning up old content...");

      await storage.deleteJourneyStepsByJourneyId(journeyId);

      sendProgress("saving", 70, "Saving generated days...");

      const totalDays = generatedDays.length;
      for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const day = generatedDays[dayIndex];
        const dayProgress = 70 + Math.round((dayIndex / totalDays) * 25);
        sendProgress("saving", dayProgress, `Saving day ${day.dayNumber} of ${totalDays}...`);

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

      sendProgress("done", 100, "Flow created successfully!");

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
      // Check trial status
      const userId = req.user?.claims?.sub;
      if (userId) {
        const trialStatus = await storage.getUserTrialStatus(userId);
        if (!trialStatus.isActive) {
          return res.status(402).json({ error: "trial_expired", message: "Your trial has expired. Please subscribe to generate content." });
        }
      }
      
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

      // PRD-compliant chat context
      let botResponse = await generateChatResponse(
        {
          journeyName: journey.name,
          dayNumber: step.dayNumber,
          totalDays,
          dayTitle: step.title,
          dayGoal: step.goal || step.description || "Focus on today's growth",
          dayTask: step.task || "Complete today's exercise",
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
        },
        content.trim()
      );

      // Check if AI marked the day as complete - just signal to frontend, don't auto-advance
      let dayCompleted = false;
      
      // Primary detection: explicit marker
      if (botResponse.startsWith("[DAY_COMPLETE]")) {
        dayCompleted = true;
        // Remove the marker from the visible message
        botResponse = botResponse.replace("[DAY_COMPLETE]", "").trim();
      } else {
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
        
        // Also check if we've had enough exchanges (at least 6 messages total)
        if (hasFarewell && history.length >= 5) {
          dayCompleted = true;
          console.log("Day completion detected via farewell pattern");
        }
      }
      // Note: Don't call completeDayState here - let the user click "Continue" to advance

      const botMessage = await storage.createMessage({
        participantId,
        stepId,
        role: "assistant",
        content: botResponse,
        isSummary: dayCompleted,
      });

      res.json({ userMessage, botMessage, dayCompleted });
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
      const { email, name } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
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
        
        // Check if mentor has configured external payment URL (PayPal/Stripe Payment Link)
        if (journey.externalPaymentUrl) {
          // Generate a unique token for this payment session
          const token = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour expiry
          
          await storage.createExternalPaymentSession({
            journeyId,
            email,
            name: name || null,
            token,
            status: "pending",
            expiresAt,
          });
          
          // Build the return URL with the token
          const returnUrl = `${baseUrl}/payment/external-success?token=${token}`;
          
          res.json({ 
            requiresPayment: true,
            paymentType: "external",
            externalPaymentUrl: journey.externalPaymentUrl,
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
          name
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

      // Check if session has expired
      if (new Date() > session.expiresAt) {
        return res.status(400).json({ error: "Payment session has expired" });
      }

      // Complete the session and create participant
      await storage.completeExternalPaymentSession(token);
      
      const journey = await storage.getJourney(session.journeyId);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      const participant = await storage.createExternalParticipant(
        session.journeyId,
        session.email,
        session.name || undefined
      );

      if (journey.creatorId) {
        await storage.createActivityEvent({
          creatorId: journey.creatorId,
          participantId: participant.id,
          journeyId: session.journeyId,
          eventType: 'joined',
          eventData: { participantName: session.name || session.email },
        });

        // Record payment (external payment)
        await storage.createPayment({
          participantId: participant.id,
          journeyId: session.journeyId,
          mentorId: journey.creatorId,
          amount: (journey.price || 0) * 100, // Amount in cents
          currency: journey.currency || "USD",
          status: "completed",
          stripeCheckoutSessionId: `external_${token}`, // Mark as external
          customerEmail: session.email,
          customerName: session.name,
        });
      }

      res.json({ 
        success: true, 
        accessToken: participant.accessToken 
      });
    } catch (error) {
      console.error("Error verifying external payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
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

        // Record payment for mentor earnings tracking
        const amountPaid = session.amount_total || 0;
        if (amountPaid > 0) {
          try {
            await storage.createPayment({
              journeyId,
              participantId: participant.id,
              mentorId: journey.creatorId,
              stripeCheckoutSessionId: sessionId,
              stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
              amount: amountPaid,
              currency: session.currency?.toUpperCase() || "USD",
              status: "completed",
              customerEmail: email,
              customerName: name || undefined,
            });
            console.log(`Payment recorded: $${amountPaid / 100} for journey ${journeyId}`);
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
  
  // Create subscription checkout session
  app.post("/api/subscription/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { plan, returnToJourney } = req.body;
      
      if (!plan || !['starter', 'pro', 'business'].includes(plan)) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { subscriptionService } = await import('./subscriptionService');
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // If returnToJourney is provided, return to the journey editor after subscription
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

      res.json({ url: result.url, sessionId: result.sessionId });
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

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

      res.json({
        plan: user.subscriptionPlan || null,
        status: user.subscriptionStatus || null,
        trialEndsAt: user.trialEndsAt || null,
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
  // Admin middleware - only allow SUPER_ADMIN users
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }
      next();
    } catch (error) {
      return res.status(500).json({ error: "Server error" });
    }
  };

  // Admin dashboard stats
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin users list
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin participants list with details
  app.get("/api/admin/participants", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const participants = await storage.getAllParticipantsWithDetails();
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Admin flows/journeys list with stats
  app.get("/api/admin/flows", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const flows = await storage.getAllJourneysWithStats();
      res.json(flows);
    } catch (error) {
      console.error("Error fetching flows:", error);
      res.status(500).json({ error: "Failed to fetch flows" });
    }
  });

  // Admin errors list
  app.get("/api/admin/errors", isAuthenticated, isAdmin, async (req, res) => {
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

  return httpServer;
}
