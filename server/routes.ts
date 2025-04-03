import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get all birds
  app.get("/api/birds", async (_req, res) => {
    try {
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

  const httpServer = createServer(app);
  return httpServer;
}
