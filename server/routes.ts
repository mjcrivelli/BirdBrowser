import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, getSouthernHemisphereSeason } from "./storage";
import { insertBirdSightingSchema, insertSightingRecordSchema } from "@shared/schema";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function registerRoutes(app: Express): Promise<Server> {
  registerObjectStorageRoutes(app);
  // API endpoint to get all birds
  app.get("/api/birds", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    try {
      const visitorId = req.query.visitorId as string | undefined;
      
      if (visitorId) {
        const user = await storage.getOrCreateUserByVisitorId(visitorId);
        const birdsWithStatus = await storage.getBirdsWithSeenStatus(user.id);
        return res.json(birdsWithStatus);
      }

      const birds = await storage.getBirds();
      res.json(birds.map(bird => ({ ...bird, seen: false })));
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
      console.log("POST /api/sightings - Request body:", req.body);
      
      const { visitorId, birdId } = req.body;
      
      if (!visitorId || !birdId) {
        return res.status(400).json({ message: "Missing visitorId or birdId" });
      }
      
      const user = await storage.getOrCreateUserByVisitorId(visitorId);
      
      const sighting = await storage.addBirdSighting({ userId: user.id, birdId });
      console.log("Bird sighting added successfully:", sighting);
      
      const birdsWithStatus = await storage.getBirdsWithSeenStatus(user.id);
      
      res.status(201).json({
        sighting,
        birds: birdsWithStatus
      });
    } catch (error) {
      console.error("Error adding bird sighting:", error);
      res.status(500).json({ message: "Failed to add bird sighting" });
    }
  });

  // API endpoint to remove a bird sighting (mark as not seen)
  app.delete("/api/sightings/:visitorId/:birdId", async (req, res) => {
    try {
      const { visitorId, birdId: birdIdParam } = req.params;
      console.log(`DELETE /api/sightings/${visitorId}/${birdIdParam}`);
      
      const birdId = parseInt(birdIdParam);

      if (!visitorId || isNaN(birdId)) {
        console.log("Invalid parameters:", req.params);
        return res.status(400).json({ message: "Invalid visitorId or birdId" });
      }

      const user = await storage.getOrCreateUserByVisitorId(visitorId);
      const result = await storage.removeBirdSighting(user.id, birdId);
      console.log("Remove bird sighting result:", result);

      const birdsWithStatus = await storage.getBirdsWithSeenStatus(user.id);
      
      res.json({
        success: true,
        birds: birdsWithStatus
      });
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

  // API endpoint to record a bird sighting with location data
  app.post("/api/sighting-records", async (req, res) => {
    try {
      console.log("POST /api/sighting-records - Request body:", req.body);
      
      const recordSchema = z.object({
        birdId: z.number(),
        birdName: z.string(),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
      });
      
      const validationResult = recordSchema.safeParse(req.body);

      if (!validationResult.success) {
        console.log("Validation failed:", validationResult.error.errors);
        return res.status(400).json({ 
          message: "Invalid sighting record data", 
          errors: validationResult.error.errors 
        });
      }

      const season = getSouthernHemisphereSeason();
      
      const record = await storage.addSightingRecord({
        birdId: validationResult.data.birdId,
        birdName: validationResult.data.birdName,
        latitude: validationResult.data.latitude ?? null,
        longitude: validationResult.data.longitude ?? null,
        season,
      });
      
      console.log("Sighting record created:", record);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating sighting record:", error);
      res.status(500).json({ message: "Failed to create sighting record" });
    }
  });

  // API endpoint to get all sighting records
  app.get("/api/sighting-records", async (req, res) => {
    try {
      const records = await storage.getSightingRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching sighting records:", error);
      res.status(500).json({ message: "Failed to fetch sighting records" });
    }
  });

  // API endpoint to seed birds to database
  app.post("/api/seed-birds", async (req, res) => {
    try {
      const count = await storage.seedBirdsToDatabase();
      res.json({ success: true, count, message: `Seeded ${count} birds to database` });
    } catch (error) {
      console.error("Error seeding birds:", error);
      res.status(500).json({ message: "Failed to seed birds" });
    }
  });

  // API endpoint to record PDF generation event
  app.post("/api/pdf-generated", async (req, res) => {
    try {
      console.log("POST /api/pdf-generated - Request body:", req.body);
      
      const recordSchema = z.object({
        birdCount: z.number(),
        birdNames: z.array(z.string()),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
      });
      
      const validationResult = recordSchema.safeParse(req.body);

      if (!validationResult.success) {
        console.log("Validation failed:", validationResult.error.errors);
        return res.status(400).json({ 
          message: "Invalid PDF generation data", 
          errors: validationResult.error.errors 
        });
      }

      const season = getSouthernHemisphereSeason();
      
      const record = await storage.addSightingRecord({
        birdId: 0,
        birdName: `PDF Generated: ${validationResult.data.birdCount} birds (${validationResult.data.birdNames.join(', ')})`,
        latitude: validationResult.data.latitude ?? null,
        longitude: validationResult.data.longitude ?? null,
        season,
      });
      
      console.log("PDF generation record created:", record);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error recording PDF generation:", error);
      res.status(500).json({ message: "Failed to record PDF generation" });
    }
  });

  // Admin password verification endpoint
  app.post("/api/admin/verify", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  // Admin endpoint to update bird's custom image
  app.put("/api/admin/birds/:id/image", async (req, res) => {
    try {
      const { password, customImageUrl } = req.body;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bird ID" });
      }

      const updatedBird = await storage.updateBirdCustomImage(id, customImageUrl);
      if (!updatedBird) {
        return res.status(404).json({ message: "Bird not found" });
      }

      res.json(updatedBird);
    } catch (error) {
      console.error("Error updating bird image:", error);
      res.status(500).json({ message: "Failed to update bird image" });
    }
  });

  // Admin endpoint to update bird info
  app.put("/api/admin/birds/:id", async (req, res) => {
    try {
      const { password, name, scientificName, description, habitat, diet, wikipediaUrl } = req.body;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bird ID" });
      }

      console.log("Updating bird", id, "with data:", { name, scientificName, description, habitat, diet, wikipediaUrl });

      const updateData: Record<string, any> = {};
      if (name !== undefined && name !== null) updateData.name = name;
      if (scientificName !== undefined && scientificName !== null) updateData.scientificName = scientificName;
      if (description !== undefined && description !== null) updateData.description = description;
      if (habitat !== undefined && habitat !== null) updateData.habitat = habitat;
      if (diet !== undefined && diet !== null) updateData.diet = diet;
      if (wikipediaUrl !== undefined && wikipediaUrl !== null) updateData.wikipediaUrl = wikipediaUrl;

      console.log("Update data to apply:", updateData);

      const updatedBird = await storage.updateBirdInfo(id, updateData);
      console.log("Update result:", updatedBird);
      
      if (!updatedBird) {
        return res.status(404).json({ message: "Bird not found" });
      }

      res.json(updatedBird);
    } catch (error) {
      console.error("Error updating bird info:", error);
      res.status(500).json({ message: "Failed to update bird info" });
    }
  });

  // Get catalog about page content
  app.get("/api/catalog-about", async (req, res) => {
    try {
      const aboutData = await storage.getCatalogAbout();
      res.json(aboutData || { id: 1, title: "Sobre o Catálogo", content: "" });
    } catch (error) {
      console.error("Error fetching catalog about:", error);
      res.status(500).json({ message: "Failed to fetch catalog about" });
    }
  });

  // Update catalog about page content (admin only)
  app.put("/api/admin/catalog-about", async (req, res) => {
    try {
      const { password, title, content } = req.body;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updatedAbout = await storage.updateCatalogAbout({ title, content });
      
      if (!updatedAbout) {
        return res.status(500).json({ message: "Failed to update catalog about" });
      }

      res.json(updatedAbout);
    } catch (error) {
      console.error("Error updating catalog about:", error);
      res.status(500).json({ message: "Failed to update catalog about" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}