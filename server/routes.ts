import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertJourneySchema, insertJourneyStepSchema, insertJourneyBlockSchema, insertParticipantSchema } from "@shared/schema";
import { generateJourneyContent, generateChatResponse, generateDayOpeningMessage, generateFlowDays, generateDaySummary } from "./ai";
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
  
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, email, bio, website, specialty } = req.body;
      
      const user = await storage.upsertUser({
        id: userId,
        firstName,
        lastName,
        email,
        bio,
        website,
        specialty,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Journey routes - public read, authenticated write
  app.get("/api/journeys", async (req, res) => {
    try {
      const journeys = await storage.getJourneys();
      res.json(journeys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flows" });
    }
  });

  // Get current user's journeys
  app.get("/api/journeys/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const journeys = await storage.getJourneysByCreator(userId);
      res.json(journeys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your flows" });
    }
  });

  // Get dashboard stats for current user
  app.get("/api/stats/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const journeys = await storage.getJourneysByCreator(userId);
      
      // Calculate participant stats across all user's journeys
      let totalParticipants = 0;
      let activeParticipants = 0;
      let completedParticipants = 0;
      
      for (const journey of journeys) {
        const participants = await storage.getParticipants(journey.id);
        const steps = await storage.getJourneySteps(journey.id);
        const totalDays = steps.length || 7; // Default to 7 if no steps yet
        
        totalParticipants += participants.length;
        
        for (const p of participants) {
          // Consider completed only if they've passed the final day
          // currentDay is 1-indexed, so day 8 means they finished a 7-day journey
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
      const userId = req.user.claims.sub;
      const events = await storage.getActivityEvents(userId, 10);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // Get inactive participants needing attention
  app.get("/api/participants/inactive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
    try {
      const userId = req.user.claims.sub;
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

  app.put("/api/journeys/:id", isAuthenticated, async (req, res) => {
    try {
      const existingJourney = await storage.getJourney(req.params.id);
      if (!existingJourney) {
        return res.status(404).json({ error: "Flow not found" });
      }

      // Generate short code when publishing for the first time
      let updateData = { ...req.body };
      if (req.body.status === "published" && !existingJourney.shortCode) {
        updateData.shortCode = generateShortCode();
      }

      const journey = await storage.updateJourney(req.params.id, updateData);
      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to update flow" });
    }
  });

  // Get journey by short code (for short links)
  app.get("/api/journeys/code/:shortCode", async (req, res) => {
    try {
      const journey = await storage.getJourneyByShortCode(req.params.shortCode);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }
      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flow" });
    }
  });

  app.delete("/api/journeys/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJourney(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete flow" });
    }
  });

  // Journey with full details (steps + blocks)
  app.get("/api/journeys/:id/full", async (req, res) => {
    try {
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }
      const steps = await storage.getJourneySteps(req.params.id);
      const stepsWithBlocks = await Promise.all(
        steps.map(async (step) => ({
          ...step,
          blocks: await storage.getJourneyBlocks(step.id),
        }))
      );
      
      // Get creator (mentor) info
      let mentor = null;
      if (journey.creatorId) {
        mentor = await storage.getUser(journey.creatorId);
      }
      
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

  app.post("/api/journeys/:journeyId/steps", isAuthenticated, async (req, res) => {
    try {
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

  app.put("/api/steps/:id", isAuthenticated, async (req, res) => {
    try {
      const step = await storage.updateJourneyStep(req.params.id, req.body);
      if (!step) {
        return res.status(404).json({ error: "Step not found" });
      }
      res.json(step);
    } catch (error) {
      res.status(500).json({ error: "Failed to update step" });
    }
  });

  app.delete("/api/steps/:id", isAuthenticated, async (req, res) => {
    try {
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

  app.post("/api/steps/:stepId/blocks", isAuthenticated, async (req, res) => {
    try {
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

  app.put("/api/blocks/:id", isAuthenticated, async (req, res) => {
    try {
      const block = await storage.updateJourneyBlock(req.params.id, req.body);
      if (!block) {
        return res.status(404).json({ error: "Block not found" });
      }
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to update block" });
    }
  });

  app.delete("/api/blocks/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJourneyBlock(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete block" });
    }
  });

  // Participant routes
  app.get("/api/participants/journey/:journeyId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const journeyId = req.params.journeyId;
      
      let participant = await storage.getParticipant(userId, journeyId);
      
      if (!participant) {
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
        
        // Create activity event for joining
        const journey = await storage.getJourney(journeyId);
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
            const summary = await generateDaySummary({
              conversation,
              dayGoal: currentStep.goal || currentStep.description || "Day goal",
              dayTask: currentStep.task || "Day task",
              mentorName,
            });
            
            // Store the summary in day state
            await storage.completeDayState(id, dayNumber, {
              summaryChallenge: summary.challenge,
              summaryEmotionalTone: summary.emotionalTone,
              summaryInsight: summary.insight,
              summaryResistance: summary.resistance,
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

  // Parse uploaded files (PDF, TXT)
  app.post("/api/parse-files", isAuthenticated, upload.array("files", 10), async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
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

      sendProgress("ai", 10, "Creating content with AI...");

      const intent = {
        journeyName: journey.name,
        mainGoal: journey.goal || "",
        targetAudience: journey.audience || "",
        duration: journey.duration || 7,
        desiredFeeling: "",
        additionalNotes: journey.description || "",
      };

      const generatedDays = await generateJourneyContent(intent, content);

      sendProgress("cleanup", 60, "Cleaning up old content...");

      await storage.deleteJourneyStepsByJourneyId(journeyId);

      sendProgress("saving", 70, "Saving generated days...");

      const totalDays = generatedDays.length;
      for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const day = generatedDays[dayIndex];
        const dayProgress = 70 + Math.round((dayIndex / totalDays) * 25);
        sendProgress("saving", dayProgress, `Saving day ${day.dayNumber} of ${totalDays}...`);

        const step = await storage.createJourneyStep({
          journeyId,
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
        });

        const blocksToInsert = day.blocks.map((block: any, i: number) => ({
          stepId: step.id,
          type: block.type,
          content: block.content,
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
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      // Check if steps already exist
      const existingSteps = await storage.getJourneySteps(journeyId);
      if (existingSteps.length > 0) {
        return res.json({ success: true, stepsExist: true, steps: existingSteps });
      }

      // Generate new days using AI
      const intent = {
        journeyName: journey.name,
        mainGoal: journey.goal || "",
        targetAudience: journey.audience || "",
        duration: journey.duration || 7,
        desiredFeeling: "",
        additionalNotes: journey.description || "",
      };

      const generatedDays = await generateFlowDays(intent);

      // Save generated days to database with blocks for chat compatibility
      const createdSteps = [];
      for (const day of generatedDays) {
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
      const userId = req.user.claims.sub;
      
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

  app.post("/api/participants/:participantId/steps/:stepId/start-day", isAuthenticated, async (req: any, res) => {
    try {
      const { participantId, stepId } = req.params;
      const userId = req.user.claims.sub;
      
      const participant = await storage.getParticipantById(participantId);
      if (!participant || participant.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const step = await storage.getJourneyStep(stepId);
      if (!step || step.journeyId !== participant.journeyId) {
        return res.status(403).json({ error: "Step does not belong to this flow" });
      }

      const existingMessages = await storage.getMessages(participantId, stepId);
      if (existingMessages.length > 0) {
        return res.json(existingMessages);
      }

      const journey = await storage.getJourney(step.journeyId);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      // Get mentor info for PRD-compliant context
      const mentor = journey.creatorId ? await storage.getUser(journey.creatorId) : null;
      const mentorName = mentor ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() || "Your Guide" : "Your Guide";
      const totalDays = journey.duration || 7;
      
      // Get participant's name
      const participantUser = await storage.getUser(userId);
      const participantName = participantUser ? `${participantUser.firstName || ""}`.trim() || undefined : undefined;

      // PRD-compliant context for day opening
      const openingMessage = await generateDayOpeningMessage({
        journeyName: journey.name,
        dayNumber: step.dayNumber,
        totalDays,
        dayTitle: step.title,
        dayGoal: step.goal || step.description || "Focus on today's growth",
        dayTask: step.task || "Complete today's exercise",
        dayExplanation: step.explanation || undefined,
        mentorName,
        mentorToneOfVoice: mentor?.toneOfVoice || undefined,
        mentorMethodDescription: mentor?.methodDescription || undefined,
        mentorBehavioralRules: mentor?.behavioralRules || undefined,
        participantName,
      });

      const message = await storage.createMessage({
        participantId,
        stepId,
        role: "assistant",
        content: openingMessage,
      });

      // Track day state
      await storage.createOrUpdateDayState(participantId, step.dayNumber);

      res.json([message]);
    } catch (error) {
      console.error("Error starting day:", error);
      res.status(500).json({ error: "Failed to start day" });
    }
  });

  app.post("/api/participants/:participantId/steps/:stepId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { participantId, stepId } = req.params;
      const { content } = req.body;
      const userId = req.user.claims.sub;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const participant = await storage.getParticipantById(participantId);
      if (!participant || participant.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const step = await storage.getJourneyStep(stepId);
      if (!step || step.journeyId !== participant.journeyId) {
        return res.status(403).json({ error: "Step does not belong to this flow" });
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
      const participantUser = await storage.getUser(userId);
      const participantName = participantUser ? `${participantUser.firstName || ""}`.trim() || undefined : undefined;

      // PRD 7.2 - Get user summary from previous days (long-term memory)
      const previousDaySummary = await storage.getLatestDaySummary(participantId, step.dayNumber - 1);

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
          mentorName,
          mentorToneOfVoice: mentor?.toneOfVoice || undefined,
          mentorMethodDescription: mentor?.methodDescription || undefined,
          mentorBehavioralRules: mentor?.behavioralRules || undefined,
          participantName,
          recentMessages,
          userSummary: previousDaySummary ? {
            challenge: previousDaySummary.summaryChallenge || undefined,
            emotionalTone: previousDaySummary.summaryEmotionalTone || undefined,
            insight: previousDaySummary.summaryInsight || undefined,
            resistance: previousDaySummary.summaryResistance || undefined,
          } : undefined,
        },
        content.trim()
      );

      // Check if AI marked the day as complete - just signal to frontend, don't auto-advance
      let dayCompleted = false;
      if (botResponse.startsWith("[DAY_COMPLETE]")) {
        dayCompleted = true;
        // Remove the marker from the visible message
        botResponse = botResponse.replace("[DAY_COMPLETE]", "").trim();
        // Note: Don't call completeDayState here - let the user click "Continue" to advance
      }

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
        
        const session = await stripeService.createOneTimePaymentSession({
          customerEmail: email,
          amount: price * 100,
          currency: (journey.currency || "ILS").toLowerCase(),
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
          checkoutUrl: session.url, 
          sessionId: session.id 
        });
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

  app.get("/api/payment/verify/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      let participant = await storage.getParticipantByStripeSession(sessionId);
      
      if (participant) {
        return res.json({ 
          success: true, 
          accessToken: participant.accessToken 
        });
      }

      const session = await stripeService.getCheckoutSession(sessionId);
      
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
      
      if (!participant) {
        return res.status(404).json({ error: "Invalid access token" });
      }

      const journey = await storage.getJourney(participant.journeyId);
      if (!journey) {
        return res.status(404).json({ error: "Flow not found" });
      }

      res.json({ participant, journey });
    } catch (error) {
      console.error("Error fetching participant:", error);
      res.status(500).json({ error: "Failed to fetch participant data" });
    }
  });

  return httpServer;
}
