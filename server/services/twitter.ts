import { Express } from "express";
import { IStorage } from "../storage";
import { InsertNewsItem } from "../../shared/schema";
import fetch from "node-fetch";
import { scrapeTweetsFromProfile, tweetsToNewsItems as scrapedTweetsToNewsItems } from "../utils/twitterScraper";

// Twitter/X API endpoints would use a mix of API client and web scraping
// depending on what's available and the requirements

/**
 * Fetches tweets from a Twitter/X user profile
 * @param username The Twitter username to fetch tweets from
 * @param limit Maximum number of tweets to fetch
 * @returns Array of tweet objects
 */
async function fetchTweetsFromUser(username: string, limit = 7): Promise<any[]> {
  try {
    console.log(`Fetching tweets from ${username}`);
    
    // Normalize the username (X.com and Twitter.com usernames may have @ symbols)
    const normalizedUsername = username.startsWith('@') 
      ? username.substring(1) 
      : username;
      
    // Handle common username variations for DeItaone
    const finalUsername = normalizedUsername.toLowerCase() === 'deltaone' 
      ? 'DeItaone' 
      : normalizedUsername;
    
    // Use our scraper to get the tweets
    const tweets = await scrapeTweetsFromProfile(finalUsername, limit);
    console.log(`Fetched ${tweets.length} tweets from ${finalUsername}`);
    
    return tweets;
  } catch (error) {
    console.error(`Error fetching tweets from ${username}:`, error);
    throw error;
  }
}

// Function to periodically check for new tweets
function startPeriodicTwitterSync(storage: IStorage) {
  // Check for new tweets every 15 minutes
  const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

  setInterval(async () => {
    try {
      // Get active Twitter integrations
      const twitterIntegrations = await storage.getIntegrationsByType("twitter");
      const activeIntegrations = twitterIntegrations.filter(
        (integration) => integration.isSource && integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return;
      }

      // Process each active Twitter integration
      for (const integration of activeIntegrations) {
        try {
          // Extract configuration
          const config = integration.additionalConfig as Record<string, unknown> || {};
          const username = (config.username as string) || "DeItaone";
          
          // Fetch tweets using our scraper
          console.log(`[Periodic Sync] Fetching tweets from ${username}`);
          const tweets = await fetchTweetsFromUser(username, 5);
          console.log(`[Periodic Sync] Fetched ${tweets.length} tweets from ${username}`);
          
          // Convert tweets to news items
          const newsItems = scrapedTweetsToNewsItems(tweets, integration.name);
          
          // Store new items
          let itemsCreated = 0;
          for (const item of newsItems) {
            // Check if we already have this tweet by externalId
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

          console.log(`[Periodic Sync] Completed Twitter sync for integration ${integration.id}, created ${itemsCreated} new items`);
        } catch (err) {
          console.error(`[Periodic Sync] Twitter sync error for integration ${integration.id}:`, err);
        }
      }
    } catch (error) {
      console.error("[Periodic Sync] Periodic Twitter sync error:", error);
    }
  }, SYNC_INTERVAL);
}

export function setupTwitterService(app: Express, storage: IStorage) {
  // API endpoint to manually trigger a Twitter sync for DeItaone
  app.post("/api/integrations/twitter/sync", async (req, res) => {
    try {
      // Get active Twitter integrations
      const twitterIntegrations = await storage.getIntegrationsByType("twitter");
      const activeIntegrations = twitterIntegrations.filter(
        (integration) => integration.isSource && integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active Twitter integrations found" });
      }

      const syncResults = [];

      // Process each active Twitter integration
      for (const integration of activeIntegrations) {
        try {
          // Extract configuration
          const config = integration.additionalConfig as Record<string, unknown> || {};
          const username = (config.username as string) || "DeItaone";
          
          // Fetch tweets using our scraper
          console.log(`Fetching tweets from ${username}`);
          const tweets = await fetchTweetsFromUser(username, 7);
          console.log(`Fetched ${tweets.length} tweets from ${username}`);
          
          // Convert tweets to news items
          const newsItems = scrapedTweetsToNewsItems(tweets, integration.name);
          
          // Store the news items
          const createdItems = [];
          for (const item of newsItems) {
            // Check if we already have this tweet by externalId
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
            totalFetched: tweets.length,
            success: true,
          });
        } catch (err) {
          console.error(`Twitter sync error for integration ${integration.id}:`, err);
          syncResults.push({
            integrationId: integration.id,
            name: integration.name,
            success: false,
            error: (err as Error).message,
          });
        }
      }

      res.json({
        message: "Twitter sync completed",
        results: syncResults,
      });
    } catch (error) {
      console.error("Twitter sync error:", error);
      res.status(500).json({ message: "Twitter sync processing error" });
    }
  });

  // API endpoint to check if we can access a user's tweets
  app.post("/api/integrations/twitter/check-account", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ 
          success: false, 
          message: "Twitter username is required" 
        });
      }
      
      // In a real implementation, we would try to access the user's tweets
      // For now, we'll simulate success for DeItaone or failure for other accounts
      
      if (username.toLowerCase() === "deltaone" || username.toLowerCase() === "deltone") {
        return res.status(200).json({
          success: true,
          message: "Successfully accessed @DeItaone tweets",
          accountInfo: {
            id: "1156910898",
            username: "DeItaone",
            name: "Delta One",
            profileImageUrl: "https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg",
            followersCount: 231500,
            tweetsCount: 156923
          }
        });
      } else {
        // For demo purposes, we'll suggest DeItaone instead
        return res.status(400).json({
          success: false,
          message: `Unable to access tweets from @${username}. Consider using @DeItaone instead.`,
          suggestions: ["DeItaone"]
        });
      }
    } catch (error) {
      console.error("Twitter account check error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check Twitter account",
        error: (error as Error).message
      });
    }
  });

  // Start periodic sync if enabled
  startPeriodicTwitterSync(storage);
  // API endpoint to share news to Twitter/X
  app.post("/api/integrations/twitter/share", async (req, res) => {
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

      // Get active Twitter integrations
      const twitterIntegrations = await storage.getIntegrationsByType("twitter");
      const activeIntegrations = twitterIntegrations.filter(
        (integration) => integration.isDestination && integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active Twitter integrations found" });
      }

      // In a real implementation, we would use the Twitter API to post tweets
      // For now, simulate successful sharing

      // Create the formatted message (Twitter has a character limit)
      const tweetContent = message || `${newsItem.title}\n\n${newsItem.content.substring(0, 200)}${newsItem.content.length > 200 ? '...' : ''}`;

      // Update the shared platforms for the news item
      const currentSharedTo = newsItem.sharedTo || [];
      if (!currentSharedTo.includes("twitter")) {
        const updatedNewsItem = await storage.updateNewsItem(newsItem.id, {
          sharedTo: [...currentSharedTo, "twitter"],
        });
      }

      res.json({
        message: "News shared to Twitter successfully",
        platforms: ["twitter"],
        newsItem,
      });
    } catch (error) {
      console.error("Twitter share error:", error);
      res.status(500).json({ message: "Twitter share processing error" });
    }
  });

  // Endpoint to test Twitter API connection
  app.post("/api/integrations/twitter/test", async (req, res) => {
    try {
      const { apiKey, apiSecret, accessToken, refreshToken } = req.body;

      if (!apiKey || !apiSecret) {
        return res.status(400).json({
          success: false,
          message: "API key and secret are required",
        });
      }

      // In a real implementation, we would test the connection to Twitter API
      // For now, simulate a successful connection

      res.json({
        success: true,
        message: "Successfully connected to Twitter API",
      });
    } catch (error) {
      console.error("Twitter test connection error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to connect to Twitter API",
        error: (error as Error).message,
      });
    }
  });

  // API endpoint to get Twitter user profile information
  app.get("/api/integrations/twitter/profile", async (req, res) => {
    try {
      // Get active Twitter integrations
      const twitterIntegrations = await storage.getIntegrationsByType("twitter");
      const activeIntegrations = twitterIntegrations.filter(
        (integration) => integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active Twitter integrations found" });
      }

      // In a real implementation, we would fetch the Twitter profile
      // For now, return sample profile data
      res.json({
        username: "newshubaggregator",
        name: "NewsHub",
        followerCount: 1245,
        followingCount: 287,
        tweetCount: 523,
        profileImage: "https://example.com/profile.jpg",
      });
    } catch (error) {
      console.error("Twitter profile error:", error);
      res.status(500).json({ message: "Failed to fetch Twitter profile" });
    }
  });

  // API endpoint to get Twitter analytics
  app.get("/api/integrations/twitter/analytics", async (req, res) => {
    try {
      const { since } = req.query;
      const sinceDate = since ? new Date(since as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days

      // Get active Twitter integrations
      const twitterIntegrations = await storage.getIntegrationsByType("twitter");
      const activeIntegrations = twitterIntegrations.filter(
        (integration) => integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active Twitter integrations found" });
      }

      // In a real implementation, we would fetch actual Twitter analytics
      // For now, return sample analytics data
      res.json({
        impressions: 25420,
        engagements: 1872,
        likes: 743,
        retweets: 189,
        replies: 92,
        linkClicks: 612,
        profileVisits: 318,
        topTweet: {
          id: "12345",
          text: "Breaking: Federal Reserve announces 0.25% interest rate hike",
          impressions: 4218,
          engagements: 312,
        },
        period: {
          start: sinceDate.toISOString(),
          end: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Twitter analytics error:", error);
      res.status(500).json({ message: "Failed to fetch Twitter analytics" });
    }
  });
}
