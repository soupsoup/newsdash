import express from "express";
import { scrapeNitterProfile, tweetsToNewsItems } from '../services/nitterScraper';
import { storage } from '../storage';

export interface DiscordIntegration {
  id: number;
  name: string;
  purpose: "source" | "destination" | "both";
  webhookUrl?: string;
  channelId: string;
  apiKey?: string;
  status: "connected" | "error" | "disconnected";
  lastSyncAt?: Date;
}

const router = express.Router();
let integrations: DiscordIntegration[] = [];
let nextId = 1;

// Create
router.post("/api/discord-integrations", (req, res) => {
  const { name, purpose, webhookUrl, channelId, apiKey } = req.body;
  if (!name || !purpose || !channelId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const integration: DiscordIntegration = {
    id: nextId++,
    name,
    purpose,
    webhookUrl,
    channelId,
    apiKey,
    status: "connected",
    lastSyncAt: new Date(),
  };
  integrations.push(integration);
  res.status(201).json(integration);
});

// Read all
router.get("/api/discord-integrations", (req, res) => {
  res.json(integrations);
});

// Update
router.put("/api/discord-integrations/:id", (req, res) => {
  const id = Number(req.params.id);
  const integration = integrations.find(i => i.id === id);
  if (!integration) return res.status(404).json({ error: "Not found" });

  const { name, purpose, webhookUrl, channelId, apiKey, status } = req.body;
  if (!name || !purpose || !channelId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  integration.name = name;
  integration.purpose = purpose;
  integration.webhookUrl = webhookUrl;
  integration.channelId = channelId;
  integration.apiKey = apiKey;
  integration.status = status || integration.status;
  integration.lastSyncAt = new Date();
  res.json(integration);
});

// Delete
router.delete("/api/discord-integrations/:id", (req, res) => {
  const id = Number(req.params.id);
  integrations = integrations.filter(i => i.id !== id);
  res.status(204).send();
});

// Manual Nitter sync endpoint
router.post('/api/integrations/nitter/sync', async (req, res) => {
  try {
    const { username = 'DeItaone', maxTweets = 25 } = req.body || {};
    const tweets = await scrapeNitterProfile(username, maxTweets);
    if (!tweets.length) {
      return res.status(404).json({ success: false, message: 'No tweets found.' });
    }
    // Convert tweets to news items
    const newsItems = tweetsToNewsItems(tweets, username);
    // Store news items in the database
    const created = [];
    for (const item of newsItems) {
      const result = await storage.createNewsItem(item);
      created.push(result);
    }
    res.json({ success: true, count: created.length, items: created });
  } catch (error) {
    console.error('Manual Nitter sync error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: 'Failed to sync Nitter updates', error: errorMessage });
  }
});

export default router; 