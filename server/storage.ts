import { InsertUser, User, NewsItem, InsertNewsItem, Integration, InsertIntegration } from '../shared/schema';

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // News methods
  getAllNewsItems(): Promise<NewsItem[]>;
  getNewsItem(id: number): Promise<NewsItem | undefined>;
  createNewsItem(newsItem: InsertNewsItem): Promise<NewsItem>;
  updateNewsItem(id: number, data: Partial<NewsItem>): Promise<NewsItem>;
  deleteNewsItem(id: number): Promise<void>;
  
  // Integration methods
  getAllIntegrations(): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  getIntegrationsByType(type: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, data: Partial<Integration>): Promise<Integration>;
  deleteIntegration(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private newsItems: Map<number, NewsItem>;
  private integrations: Map<number, Integration>;
  private userIdCounter: number;
  private newsIdCounter: number;
  private integrationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.newsItems = new Map();
    this.integrations = new Map();
    this.userIdCounter = 1;
    this.newsIdCounter = 1;
    this.integrationIdCounter = 1;
    
    // Add sample data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Sample news items
    const sampleNews: InsertNewsItem[] = [
      {
        title: "Federal Reserve announces 0.25% interest rate hike",
        content: "The Federal Reserve has announced a 0.25% increase in interest rates, bringing the target range to 5.25-5.50%. Officials cited continuing inflation concerns as the primary reason for the decision.",
        source: "Financial Discord Channel",
        sourceType: "discord"
      },
      {
        title: "NVIDIA reports record quarterly revenue of $13.5B",
        content: "NVIDIA has announced record quarterly revenue of $13.5 billion, up 88% from a year ago. The company's data center segment saw particularly strong growth driven by AI chip demand.",
        source: "Financial Discord Channel",
        sourceType: "discord"
      },
      {
        title: "Apple unveils new MacBook Pro with M3 chip",
        content: "Apple has announced a new MacBook Pro featuring the M3 chip, which they claim offers up to 40% better performance than the previous generation. The new laptops will be available next week.",
        source: "Tech News Discord",
        sourceType: "discord"
      }
    ];
    
    // Sample integrations
    const sampleIntegrations: InsertIntegration[] = [
      {
        name: "Financial News Channel",
        type: "discord",
        apiKey: "sample_discord_api_key",
        webhookUrl: "https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz",
        isSource: false,
        isDestination: true,
        status: "connected",
        lastSyncAt: new Date(),
        additionalConfig: { channelId: "708365137660215330", serverId: "708365137660215327" }
      },
      {
        name: "Delta One X Feed",
        type: "twitter",
        apiKey: "sample_twitter_api_key",
        apiSecret: "sample_twitter_api_secret",
        accessToken: "sample_twitter_access_token",
        refreshToken: "sample_twitter_refresh_token",
        isSource: true,
        isDestination: false,
        status: "connected",
        lastSyncAt: new Date(Date.now() - 1800000), // 30 mins ago
        additionalConfig: { username: "DeItaone", accountId: "1156910898" }
      },
      {
        name: "Company Twitter Account",
        type: "twitter",
        apiKey: "sample_twitter_api_key_2",
        apiSecret: "sample_twitter_api_secret_2",
        accessToken: "sample_twitter_access_token_2",
        refreshToken: "sample_twitter_refresh_token_2",
        isSource: false,
        isDestination: true,
        status: "connected",
        lastSyncAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        name: "Corporate Blog",
        type: "wordpress",
        apiKey: "sample_wordpress_api_key",
        webhookUrl: "https://example.com/wp-json/wp/v2",
        isSource: false,
        isDestination: true,
        status: "connected",
        lastSyncAt: new Date(Date.now() - 10800000), // 3 hours ago
      }
    ];
    
    // Add sample news
    for (const news of sampleNews) {
      this.createNewsItem(news);
    }
    
    // Add sample integrations
    for (const integration of sampleIntegrations) {
      this.createIntegration(integration);
    }
    
    // Set shared platforms for some news items
    this.updateNewsItem(1, { sharedTo: ["discord"] });
    this.updateNewsItem(2, { sharedTo: ["discord", "twitter", "wordpress"] });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  // News methods
  async getAllNewsItems(): Promise<NewsItem[]> {
    return Array.from(this.newsItems.values()).sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }
  
  async getNewsItem(id: number): Promise<NewsItem | undefined> {
    return this.newsItems.get(id);
  }
  
  async createNewsItem(insertNewsItem: InsertNewsItem): Promise<NewsItem> {
    const id = this.newsIdCounter++;
    
    // Use the provided publishedAt date if it exists, otherwise use current time
    const publishedAt = insertNewsItem.publishedAt instanceof Date 
      ? insertNewsItem.publishedAt 
      : new Date();
      
    const newsItem: NewsItem = {
      ...insertNewsItem,
      id,
      publishedAt, // Use the date from above logic
      sharedTo: []
    };
    
    this.newsItems.set(id, newsItem);
    return newsItem;
  }
  
  async updateNewsItem(id: number, data: Partial<NewsItem>): Promise<NewsItem> {
    const newsItem = this.newsItems.get(id);
    
    if (!newsItem) {
      throw new Error(`News item with ID ${id} not found`);
    }
    
    const updatedItem = { ...newsItem, ...data };
    this.newsItems.set(id, updatedItem);
    
    return updatedItem;
  }
  
  async deleteNewsItem(id: number): Promise<void> {
    if (!this.newsItems.has(id)) {
      throw new Error(`News item with ID ${id} not found`);
    }
    
    this.newsItems.delete(id);
  }
  
  // Integration methods
  async getAllIntegrations(): Promise<Integration[]> {
    return Array.from(this.integrations.values());
  }
  
  async getIntegration(id: number): Promise<Integration | undefined> {
    return this.integrations.get(id);
  }
  
  async getIntegrationsByType(type: string): Promise<Integration[]> {
    return Array.from(this.integrations.values()).filter(
      (integration) => integration.type === type
    );
  }
  
  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const id = this.integrationIdCounter++;
    const integration: Integration = {
      ...insertIntegration,
      id,
      createdAt: new Date()
    };
    
    this.integrations.set(id, integration);
    return integration;
  }
  
  async updateIntegration(id: number, data: Partial<Integration>): Promise<Integration> {
    const integration = this.integrations.get(id);
    
    if (!integration) {
      throw new Error(`Integration with ID ${id} not found`);
    }
    
    const updatedIntegration = { ...integration, ...data };
    this.integrations.set(id, updatedIntegration);
    
    return updatedIntegration;
  }
  
  async deleteIntegration(id: number): Promise<void> {
    if (!this.integrations.has(id)) {
      throw new Error(`Integration with ID ${id} not found`);
    }
    
    this.integrations.delete(id);
  }
}

export const storage = new MemStorage();
