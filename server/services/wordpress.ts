import { Express } from "express";
import { IStorage } from "../storage";

// WordPress API endpoints would normally use WordPress REST API client
// but we'll implement the core functionality without dependencies

export function setupWordPressService(app: Express, storage: IStorage) {
  // API endpoint to share news to WordPress
  app.post("/api/integrations/wordpress/share", async (req, res) => {
    try {
      const { newsId, postTitle, postContent, categories, tags, status } = req.body;

      if (!newsId) {
        return res.status(400).json({ message: "News ID is required" });
      }

      // Get the news item
      const newsItem = await storage.getNewsItem(Number(newsId));
      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }

      // Get active WordPress integrations
      const wordpressIntegrations = await storage.getIntegrationsByType("wordpress");
      const activeIntegrations = wordpressIntegrations.filter(
        (integration) => integration.isDestination && integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active WordPress integrations found" });
      }

      // In a real implementation, we would use the WordPress REST API to create posts
      // For now, simulate successful sharing

      // Create the post content
      const title = postTitle || newsItem.title;
      const content = postContent || `<p>${newsItem.content}</p>`;
      const postStatus = status || "publish";
      const postCategories = categories || ["News"];
      const postTags = tags || ["financial", "news"];

      // Update the shared platforms for the news item
      const currentSharedTo = newsItem.sharedTo || [];
      if (!currentSharedTo.includes("wordpress")) {
        const updatedNewsItem = await storage.updateNewsItem(newsItem.id, {
          sharedTo: [...currentSharedTo, "wordpress"],
        });
      }

      res.json({
        message: "News shared to WordPress successfully",
        platforms: ["wordpress"],
        newsItem,
        wordpressPost: {
          id: Math.floor(Math.random() * 10000),
          title,
          url: `https://example.com/blog/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}`,
          status: postStatus,
          categories: postCategories,
          tags: postTags,
          date: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("WordPress share error:", error);
      res.status(500).json({ message: "WordPress share processing error" });
    }
  });

  // Endpoint to test WordPress API connection
  app.post("/api/integrations/wordpress/test", async (req, res) => {
    try {
      const { apiKey, webhookUrl } = req.body;

      if (!apiKey || !webhookUrl) {
        return res.status(400).json({
          success: false,
          message: "API key and WordPress site URL are required",
        });
      }

      // Validate WordPress URL format
      if (!webhookUrl.includes('wp-json')) {
        return res.status(400).json({
          success: false,
          message: "WordPress URL should contain the REST API endpoint (wp-json)",
        });
      }

      // In a real implementation, we would test the connection to WordPress
      // For now, simulate a successful connection
      res.json({
        success: true,
        message: "Successfully connected to WordPress",
      });
    } catch (error) {
      console.error("WordPress test connection error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to connect to WordPress",
        error: (error as Error).message,
      });
    }
  });

  // API endpoint to get WordPress site information
  app.get("/api/integrations/wordpress/site", async (req, res) => {
    try {
      // Get active WordPress integrations
      const wordpressIntegrations = await storage.getIntegrationsByType("wordpress");
      const activeIntegrations = wordpressIntegrations.filter(
        (integration) => integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active WordPress integrations found" });
      }

      // Use the first active integration
      const integration = activeIntegrations[0];

      // In a real implementation, we would fetch site info from WordPress
      // For now, return sample site data
      res.json({
        name: "Corporate News Blog",
        description: "The latest financial and market news",
        url: integration.webhookUrl?.replace('/wp-json/wp/v2', '') || 'https://example.com',
        posts: 156,
        categories: [
          { id: 1, name: "Financial News", count: 87 },
          { id: 2, name: "Market Updates", count: 45 },
          { id: 3, name: "Company News", count: 24 },
        ],
        recentPosts: [
          {
            id: 1234,
            title: "NVIDIA reports record quarterly revenue of $13.5B",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            url: "https://example.com/blog/nvidia-reports-record-quarterly-revenue",
          },
          {
            id: 1233,
            title: "Federal Reserve announces 0.25% interest rate hike",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            url: "https://example.com/blog/federal-reserve-announces-interest-rate-hike",
          },
        ],
      });
    } catch (error) {
      console.error("WordPress site info error:", error);
      res.status(500).json({ message: "Failed to fetch WordPress site information" });
    }
  });

  // API endpoint to get WordPress categories and tags
  app.get("/api/integrations/wordpress/taxonomies", async (req, res) => {
    try {
      // Get active WordPress integrations
      const wordpressIntegrations = await storage.getIntegrationsByType("wordpress");
      const activeIntegrations = wordpressIntegrations.filter(
        (integration) => integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active WordPress integrations found" });
      }

      // In a real implementation, we would fetch taxonomies from WordPress
      // For now, return sample taxonomies
      res.json({
        categories: [
          { id: 1, name: "Financial News", count: 87 },
          { id: 2, name: "Market Updates", count: 45 },
          { id: 3, name: "Company News", count: 24 },
          { id: 4, name: "Economic Trends", count: 18 },
          { id: 5, name: "Technology", count: 32 },
        ],
        tags: [
          { id: 1, name: "finance", count: 124 },
          { id: 2, name: "stocks", count: 98 },
          { id: 3, name: "market", count: 112 },
          { id: 4, name: "economy", count: 76 },
          { id: 5, name: "federal reserve", count: 42 },
          { id: 6, name: "interest rates", count: 35 },
          { id: 7, name: "tech", count: 68 },
          { id: 8, name: "ai", count: 53 },
        ],
      });
    } catch (error) {
      console.error("WordPress taxonomies error:", error);
      res.status(500).json({ message: "Failed to fetch WordPress taxonomies" });
    }
  });

  // API endpoint to get WordPress post formats/templates
  app.get("/api/integrations/wordpress/templates", async (req, res) => {
    try {
      // Get active WordPress integrations
      const wordpressIntegrations = await storage.getIntegrationsByType("wordpress");
      const activeIntegrations = wordpressIntegrations.filter(
        (integration) => integration.status === "connected"
      );

      if (activeIntegrations.length === 0) {
        return res.status(400).json({ message: "No active WordPress integrations found" });
      }

      // In a real implementation, we would fetch templates from WordPress
      // For now, return sample templates
      res.json({
        templates: [
          { 
            id: "news",
            name: "News Article",
            format: "<h1>{title}</h1>\n<p class=\"date\">{date}</p>\n<div class=\"content\">{content}</div>\n<div class=\"source\">Source: {source}</div>"
          },
          { 
            id: "market-update",
            name: "Market Update",
            format: "<h1>{title}</h1>\n<div class=\"market-summary\">\n  <p>{content}</p>\n</div>\n<p class=\"disclaimer\">This information is for educational purposes only.</p>"
          },
          { 
            id: "press-release",
            name: "Press Release",
            format: "<h1>{title}</h1>\n<p class=\"date\">{date}</p>\n<h2>For Immediate Release</h2>\n<div class=\"content\">{content}</div>\n<div class=\"contact\">Contact: press@example.com</div>"
          },
        ],
      });
    } catch (error) {
      console.error("WordPress templates error:", error);
      res.status(500).json({ message: "Failed to fetch WordPress templates" });
    }
  });
}
