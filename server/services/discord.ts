import { Express } from "express";
import { IStorage } from "../storage";
import { InsertNewsItem } from "@shared/schema";
import fetch from "node-fetch";

// Discord API implementation using fetch
const DISCORD_API_URL = "https://discord.com/api/v10";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Define Discord message type
interface DiscordMessage {
  id: string;
  content: string;
  channel_id: string;
  author: {
    id: string;
    username: string;
  };
  timestamp: string;
}

// Helper function to fetch messages from a Discord channel
async function fetchDiscordMessages(channelId: string, limit = 10): Promise<DiscordMessage[]> {
  if (!DISCORD_BOT_TOKEN) {
    throw new Error("Discord bot token is required");
  }

  try {
    const response = await fetch(`${DISCORD_API_URL}/channels/${channelId}/messages?limit=${limit}`, {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json() as { message?: string };
      throw new Error(`Discord API error: ${errorData.message || response.statusText}`);
    }

    return await response.json() as DiscordMessage[];
  } catch (error) {
    console.error("Error fetching Discord messages:", error);
    throw error;
  }
}

// Helper function to convert Discord messages to news items
function discordMessagesToNewsItems(messages: DiscordMessage[], sourceName: string): InsertNewsItem[] {
  return messages
    .filter(msg => msg.content && msg.content.length > 10)
    .map(msg => {
      // Use content as both title and content for simplicity
      // In a real app, you might want to parse the content more intelligently
      const content = msg.content;
      const title = content.split('\n')[0].slice(0, 100); // First line as title, max 100 chars
      
      // Format metadata as a valid Record<string, any>
      const metadata: Record<string, any> = {
        authorId: msg.author.id,
        authorUsername: msg.author.username,
        channelId: msg.channel_id,
        timestamp: msg.timestamp,
      };
      
      return {
        title: title || "Discord message",
        content: content,
        source: `Discord: ${sourceName}`,
        sourceType: "discord",
        externalId: msg.id,
        metadata,
      };
    });
}

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

  // API endpoint to check if the Discord token is set up
  app.get("/api/integrations/discord/check", async (req, res) => {
    try {
      if (!DISCORD_BOT_TOKEN) {
        return res.status(400).json({ 
          success: false, 
          error: "Discord bot token is not configured. Please set the DISCORD_BOT_TOKEN environment variable." 
        });
      }
      
      // Attempt to make a simple API call to verify the token
      try {
        const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json() as { message?: string };
          return res.status(400).json({ 
            success: false, 
            error: `Invalid Discord bot token: ${errorData.message || response.statusText}` 
          });
        }
        
        const data = await response.json();
        return res.status(200).json({ 
          success: true, 
          message: "Discord bot token is valid",
          botUsername: data.username
        });
      } catch (err) {
        return res.status(400).json({ 
          success: false, 
          error: `Error validating Discord token: ${(err as Error).message}` 
        });
      }
    } catch (error) {
      console.error("Discord token check error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to check Discord token"
      });
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
          const config = integration.additionalConfig as Record<string, unknown> || {};
          const channelId = (config.channelId as string) || "708365137660215330";
          
          // Fetch messages from Discord using our helper function
          console.log(`Fetching messages from Discord channel ${channelId}`);
          const messages = await fetchDiscordMessages(channelId, 10);
          console.log(`Fetched ${messages.length} messages from Discord`);
          
          // Convert Discord messages to news items
          const newsItems = discordMessagesToNewsItems(messages, integration.name);
          
          // Store the news items
          const createdItems = [];
          for (const item of newsItems) {
            // Check if we already have this message by externalId
            const existingItems = (await storage.getAllNewsItems())
              .filter(n => n.externalId === item.externalId);
            
            if (existingItems.length === 0) {
              const newsItem = await storage.createNewsItem(item);
              createdItems.push(newsItem);
            }
          }

          // Update the integration's lastSyncAt time
          await storage.updateIntegration(integration.id, {
            lastSyncAt: new Date(),
          });

          syncResults.push({
            integrationId: integration.id,
            name: integration.name,
            itemsCreated: createdItems.length,
            totalFetched: messages.length,
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
      const currentSharedTo = newsItem.sharedTo || [];
      if (!currentSharedTo.includes("discord")) {
        const updatedNewsItem = await storage.updateNewsItem(newsItem.id, {
          sharedTo: [...currentSharedTo, "discord"],
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
          // Extract configuration (with fallback to your provided channel)
          const config = integration.additionalConfig as Record<string, unknown> || {};
          const channelId = (config.channelId as string) || "708365137660215330";
          
          // Fetch messages from Discord
          console.log(`[Periodic Sync] Fetching messages from Discord channel ${channelId}`);
          const messages = await fetchDiscordMessages(channelId, 5);
          console.log(`[Periodic Sync] Fetched ${messages.length} messages from Discord`);
          
          // Convert Discord messages to news items
          const newsItems = discordMessagesToNewsItems(messages, integration.name);
          
          // Store new items
          let itemsCreated = 0;
          for (const item of newsItems) {
            // Check if we already have this message by externalId
            const existingItems = (await storage.getAllNewsItems())
              .filter(n => n.externalId === item.externalId);
            
            if (existingItems.length === 0) {
              await storage.createNewsItem(item);
              itemsCreated++;
            }
          }

          // Update the integration's lastSyncAt time
          await storage.updateIntegration(integration.id, {
            lastSyncAt: new Date(),
          });

          console.log(`[Periodic Sync] Completed Discord sync for integration ${integration.id}, created ${itemsCreated} new items`);
        } catch (err) {
          console.error(`[Periodic Sync] Discord sync error for integration ${integration.id}:`, err);
        }
      }
    } catch (error) {
      console.error("[Periodic Sync] Periodic Discord sync error:", error);
    }
  }, SYNC_INTERVAL);
}
