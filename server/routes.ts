import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertJourneySchema, insertJourneyStepSchema, insertJourneyBlockSchema, insertParticipantSchema } from "@shared/schema";

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
  
  // Journey routes - public read, authenticated write
  app.get("/api/journeys", async (req, res) => {
    try {
      const journeys = await storage.getJourneys();
      res.json(journeys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journeys" });
    }
  });

  // Get current user's journeys
  app.get("/api/journeys/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const journeys = await storage.getJourneysByCreator(userId);
      res.json(journeys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your journeys" });
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

  app.get("/api/journeys/:id", async (req, res) => {
    try {
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Journey not found" });
      }
      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journey" });
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
      res.status(500).json({ error: "Failed to create journey" });
    }
  });

  app.put("/api/journeys/:id", isAuthenticated, async (req, res) => {
    try {
      const journey = await storage.updateJourney(req.params.id, req.body);
      if (!journey) {
        return res.status(404).json({ error: "Journey not found" });
      }
      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: "Failed to update journey" });
    }
  });

  app.delete("/api/journeys/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJourney(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete journey" });
    }
  });

  // Journey with full details (steps + blocks)
  app.get("/api/journeys/:id/full", async (req, res) => {
    try {
      const journey = await storage.getJourney(req.params.id);
      if (!journey) {
        return res.status(404).json({ error: "Journey not found" });
      }
      const steps = await storage.getJourneySteps(req.params.id);
      const stepsWithBlocks = await Promise.all(
        steps.map(async (step) => ({
          ...step,
          blocks: await storage.getJourneyBlocks(step.id),
        }))
      );
      res.json({ ...journey, steps: stepsWithBlocks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journey details" });
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
      
      const nextDay = Math.min(dayNumber + 1, totalDays + 1);
      
      const participant = await storage.updateParticipant(id, {
        currentDay: nextDay,
      });
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete day" });
    }
  });

  return httpServer;
}
