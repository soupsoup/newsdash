import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertNewsItemSchema } from "@shared/schema";
import { insertIntegrationSchema } from "@shared/schema";
import { setupDiscordService } from "./services/discord";
import { setupTwitterService } from "./services/twitter";
import { setupWordPressService } from "./services/wordpress";
import { scrapeTweetsFromProfile, tweetsToNewsItems } from "./utils/twitterScraper";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // News API Routes
  app.get("/api/news", async (req, res) => {
    try {
      const newsItems = await storage.getAllNewsItems();
      res.json(newsItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news items" });
    }
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newsItem = await storage.getNewsItem(id);
      
      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }
      
      res.json(newsItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news item" });
    }
  });

  app.post("/api/news", async (req, res) => {
    try {
      const validatedData = insertNewsItemSchema.parse(req.body);
      const newsItem = await storage.createNewsItem(validatedData);
      res.status(201).json(newsItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid news item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create news item" });
    }
  });

  app.patch("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newsItem = await storage.getNewsItem(id);
      
      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }
      
      const updatedItem = await storage.updateNewsItem(id, req.body);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update news item" });
    }
  });

  app.delete("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newsItem = await storage.getNewsItem(id);
      
      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }
      
      await storage.deleteNewsItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete news item" });
    }
  });

  app.post("/api/news/:id/share", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { platforms } = req.body;
      
      if (!Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({ message: "No platforms specified for sharing" });
      }
      
      const newsItem = await storage.getNewsItem(id);
      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }
      
      const results = [];
      const newSharedTo = [...new Set([...newsItem.sharedTo, ...platforms])];
      
      // Attempt to share to each platform
      for (const platform of platforms) {
        let success = false;
        let message = "";
        
        try {
          if (platform === "discord") {
            // Share to Discord
            message = "Shared to Discord";
            success = true;
          } else if (platform === "twitter") {
            // Share to Twitter
            message = "Shared to Twitter";
            success = true;
          } else if (platform === "wordpress") {
            // Share to WordPress
            message = "Shared to WordPress";
            success = true;
          } else {
            message = `Unsupported platform: ${platform}`;
          }
        } catch (error) {
          message = `Failed to share to ${platform}: ${(error as Error).message}`;
        }
        
        results.push({ platform, success, message });
      }
      
      // Update the news item with new shared platforms
      const updatedNewsItem = await storage.updateNewsItem(id, { sharedTo: newSharedTo });
      
      res.json({ results, newsItem: updatedNewsItem });
    } catch (error) {
      res.status(500).json({ message: "Failed to share news item" });
    }
  });

  // Integration API Routes
  app.get("/api/integrations", async (req, res) => {
    try {
      const integrations = await storage.getAllIntegrations();
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.get("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      
      res.json(integration);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch integration" });
    }
  });

  app.post("/api/integrations", async (req, res) => {
    try {
      const validatedData = insertIntegrationSchema.parse(req.body);
      const integration = await storage.createIntegration(validatedData);
      res.status(201).json(integration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid integration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  app.patch("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      
      const updatedIntegration = await storage.updateIntegration(id, req.body);
      res.json(updatedIntegration);
    } catch (error) {
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  app.delete("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      
      await storage.deleteIntegration(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  // Test route for Twitter scraper (for development purposes)
  app.get("/api/test/twitter-scraper", async (req, res) => {
    try {
      const username = req.query.username as string || "DeItaone";
      const limit = parseInt(req.query.limit as string || "5");
      
      console.log(`Testing Twitter scraper for @${username} with limit ${limit}`);
      
      // Attempt to scrape tweets
      const tweets = await scrapeTweetsFromProfile(username, limit);
      
      // Convert to news items format
      const newsItems = tweetsToNewsItems(tweets, `X/Twitter: @${username}`);
      
      res.json({
        success: true,
        tweets: tweets,
        newsItems: newsItems,
        count: tweets.length
      });
    } catch (error) {
      console.error("Error testing Twitter scraper:", error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Register services
  setupDiscordService(app, storage);
  setupTwitterService(app, storage);
  setupWordPressService(app, storage);

  return httpServer;
}
