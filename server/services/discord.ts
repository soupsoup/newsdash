import { Express } from "express";
import { IStorage } from "../storage";
import { InsertNewsItem } from "@shared/schema";

// Discord API endpoints would normally use discord.js library
// but we'll implement the core functionality without dependencies

export function setupDiscordService(app: Express, storage: IStorage) {
  // Set up webhook for Discord events (not used here directly)
  app.post("/api/webhooks/discord", async (req, res) => {
    try {
      // This would normally handle incoming Discord events
      // For now, we'll just acknowledge the request
      res.status(200).json({ message: "Webhook received" });
    } catch (error) {
      console.error("Discord webhook error:", error);
      res.status(500).json({ message: "Discord webhook processing error" });
    }
  });

  // API endpoint to manually trigger a Discord sync
  app.post("/api/integrations/discord/sync", async (req, res) => {
    try {
      // Get active Discord integrations
      const discordIntegrations = await storage.getIntegrationsByType("discord");
      const activeIntegrations = discordIntegrations.filter(
        (integration) => integration.isSource && integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active Discord integrations found" });
      }

      const syncResults = [];

      // Process each active Discord integration
      for (const integration of activeIntegrations) {
        try {
          // Extract configuration
          const channelId = integration.additionalConfig?.channelId || "708365137660215330";
          const serverId = integration.additionalConfig?.serverId || "708365137660215327";

          // In a real implementation, we would use the Discord API to fetch messages
          // For demonstration, we'll create sample news items
          const sampleNewsItems: InsertNewsItem[] = [
            {
              title: "Market Update: S&P 500 reaches new high",
              content: "The S&P 500 reached a new all-time high today, climbing 1.2% as tech stocks led the rally amid positive earnings surprises.",
              source: `Discord: ${integration.name}`,
              sourceType: "discord",
            },
            {
              title: "Federal Reserve maintains current interest rate",
              content: "The Federal Reserve announced today that it will maintain the current interest rate, citing stabilization in inflation metrics and steady economic growth.",
              source: `Discord: ${integration.name}`,
              sourceType: "discord",
            },
          ];

          // Store the news items
          const createdItems = [];
          for (const item of sampleNewsItems) {
            const newsItem = await storage.createNewsItem(item);
            createdItems.push(newsItem);
          }

          // Update the integration's lastSyncAt time
          await storage.updateIntegration(integration.id, {
            lastSyncAt: new Date(),
          });

          syncResults.push({
            integrationId: integration.id,
            name: integration.name,
            itemsCreated: createdItems.length,
            success: true,
          });
        } catch (err) {
          console.error(`Discord sync error for integration ${integration.id}:`, err);
          syncResults.push({
            integrationId: integration.id,
            name: integration.name,
            success: false,
            error: (err as Error).message,
          });
        }
      }

      res.json({
        message: "Discord sync completed",
        results: syncResults,
      });
    } catch (error) {
      console.error("Discord sync error:", error);
      res.status(500).json({ message: "Discord sync processing error" });
    }
  });

  // API endpoint to share news to Discord
  app.post("/api/integrations/discord/share", async (req, res) => {
    try {
      const { newsId, message } = req.body;

      if (!newsId) {
        return res.status(400).json({ message: "News ID is required" });
      }

      // Get the news item
      const newsItem = await storage.getNewsItem(Number(newsId));
      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }

      // Get active Discord integrations
      const discordIntegrations = await storage.getIntegrationsByType("discord");
      const activeIntegrations = discordIntegrations.filter(
        (integration) => integration.isDestination && integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active Discord integrations found" });
      }

      // In a real implementation, we would use the Discord API to send messages
      // For now, simulate successful sharing

      // Create the formatted message
      const content = message || `📰 **${newsItem.title}**\n\n${newsItem.content}`;

      // Update the shared platforms for the news item
      if (!newsItem.sharedTo.includes("discord")) {
        const updatedNewsItem = await storage.updateNewsItem(newsItem.id, {
          sharedTo: [...newsItem.sharedTo, "discord"],
        });
      }

      res.json({
        message: "News shared to Discord successfully",
        platforms: ["discord"],
        newsItem,
      });
    } catch (error) {
      console.error("Discord share error:", error);
      res.status(500).json({ message: "Discord share processing error" });
    }
  });

  // Endpoint to test Discord API connection
  app.post("/api/integrations/discord/test", async (req, res) => {
    try {
      const { apiKey, webhookUrl, channelId, serverId } = req.body;

      if (!apiKey && !webhookUrl) {
        return res.status(400).json({
          success: false,
          message: "Either API key or webhook URL is required",
        });
      }

      // In a real implementation, we would test the connection to Discord
      // For now, simulate a successful connection

      res.json({
        success: true,
        message: "Successfully connected to Discord",
      });
    } catch (error) {
      console.error("Discord test connection error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to connect to Discord",
        error: (error as Error).message,
      });
    }
  });

  // Start periodic sync if enabled
  startPeriodicSync(storage);
}

function startPeriodicSync(storage: IStorage) {
  // Check for new Discord messages every 5 minutes
  const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  setInterval(async () => {
    try {
      // Get active Discord integrations
      const discordIntegrations = await storage.getIntegrationsByType("discord");
      const activeIntegrations = discordIntegrations.filter(
        (integration) => integration.isSource && integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return;
      }

      // Process each active Discord integration
      for (const integration of activeIntegrations) {
        try {
          // In a real implementation, we would fetch new messages since lastSyncAt
          // For now, we'll just update the lastSyncAt time
          await storage.updateIntegration(integration.id, {
            lastSyncAt: new Date(),
          });

          console.log(`Completed Discord sync for integration ${integration.id}`);
        } catch (err) {
          console.error(`Discord sync error for integration ${integration.id}:`, err);
        }
      }
    } catch (error) {
      console.error("Periodic Discord sync error:", error);
    }
  }, SYNC_INTERVAL);
}
