import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBirdSightingSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get all birds
  app.get("/api/birds", async (req, res) => {
    try {
      // Check if we should include seen status
      const userIdParam = req.query.userId;
      let userId: number | undefined = undefined;
      
      if (userIdParam && typeof userIdParam === 'string') {
        userId = parseInt(userIdParam);
        if (isNaN(userId)) {
          userId = undefined;
        }
      }
      
      // If userId is provided, return birds with seen status
      if (userId !== undefined) {
        const birdsWithStatus = await storage.getBirdsWithSeenStatus(userId);
        return res.json(birdsWithStatus);
      }
      
      // Otherwise return all birds
      const birds = await storage.getBirds();
      res.json(birds);
    } catch (error) {
      console.error("Error fetching birds:", error);
      res.status(500).json({ message: "Failed to fetch birds" });
    }
  });

  // API endpoint to get a specific bird by ID
  app.get("/api/birds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bird ID" });
      }

      const bird = await storage.getBird(id);
      if (!bird) {
        return res.status(404).json({ message: "Bird not found" });
      }

      res.json(bird);
    } catch (error) {
      console.error(`Error fetching bird ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch bird details" });
    }
  });
  
  // API endpoint to add a bird sighting (mark as seen)
  app.post("/api/sightings", async (req, res) => {
    try {
      const validationResult = insertBirdSightingSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid sighting data", 
          errors: validationResult.error.errors 
        });
      }
      
      const sighting = await storage.addBirdSighting(validationResult.data);
      res.status(201).json(sighting);
    } catch (error) {
      console.error("Error adding bird sighting:", error);
      res.status(500).json({ message: "Failed to add bird sighting" });
    }
  });
  
  // API endpoint to remove a bird sighting (mark as not seen)
  app.delete("/api/sightings", async (req, res) => {
    try {
      const { userId, birdId } = req.body;
      
      if (typeof userId !== 'number' || typeof birdId !== 'number') {
        return res.status(400).json({ message: "Invalid userId or birdId" });
      }
      
      const result = await storage.removeBirdSighting(userId, birdId);
      
      if (result) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Sighting not found" });
      }
    } catch (error) {
      console.error("Error removing bird sighting:", error);
      res.status(500).json({ message: "Failed to remove bird sighting" });
    }
  });
  
  // API endpoint to get all bird sightings for a user
  app.get("/api/sightings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const sightings = await storage.getBirdSightings(userId);
      res.json(sightings);
    } catch (error) {
      console.error(`Error fetching sightings for user ${req.params.userId}:`, error);
      res.status(500).json({ message: "Failed to fetch sightings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
