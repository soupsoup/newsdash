import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { InsertNewsItem } from '../../shared/schema';
import https from 'https';
import { Rettiwt } from 'rettiwt-api';

interface ScrapedTweet {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  name: string;
  profileImageUrl: string;
}

// Cache for storing successful Nitter instances
const nitterInstanceCache = new Map<string, {
  lastSuccess: number;
  failureCount: number;
}>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCounts = new Map<string, number[]>();

// Create a custom HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Checks if we're rate limited for a given instance
 */
function isRateLimited(instance: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Get request timestamps for this instance
  const requests = requestCounts.get(instance) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  requestCounts.set(instance, recentRequests);
  
  // Check if we've exceeded the rate limit
  return recentRequests.length >= MAX_REQUESTS_PER_WINDOW;
}

/**
 * Records a request for rate limiting
 */
function recordRequest(instance: string) {
  const requests = requestCounts.get(instance) || [];
  requests.push(Date.now());
  requestCounts.set(instance, requests);
}

/**
 * Gets the best Nitter instance to use based on past performance
 */
function getBestNitterInstance(): string {
  // Updated list of more reliable Nitter instances
  const instances = [
    'https://nitter.net',
    'https://nitter.privacydev.net',
    'https://nitter.unixfox.eu',
    'https://nitter.42l.fr',
    'https://nitter.poast.org',
    'https://nitter.1d4.us',
    'https://nitter.kavin.rocks',
    'https://nitter.moomoo.me',
    'https://nitter.woodland.cafe',
    'https://nitter.weiler.rocks',
    'https://nitter.13ad.de',
    'https://nitter.pussthecat.org',
    'https://nitter.nixnet.services',
    'https://nitter.fdn.fr',
    'https://nitter.40two.app'
  ];

  // Sort instances by success rate and recency
  return instances.sort((a, b) => {
    const aStats = nitterInstanceCache.get(a) || { lastSuccess: 0, failureCount: 0 };
    const bStats = nitterInstanceCache.get(b) || { lastSuccess: 0, failureCount: 0 };
    
    // Prefer instances with fewer failures
    if (aStats.failureCount !== bStats.failureCount) {
      return aStats.failureCount - bStats.failureCount;
    }
    
    // Then prefer more recently successful instances
    return bStats.lastSuccess - aStats.lastSuccess;
  })[0];
}

/**
 * Scrapes tweets from a Nitter profile
 * @param username The Twitter/X username to scrape (without @)
 * @param maxTweets Maximum number of tweets to scrape
 * @returns An array of scraped tweets
 */
export async function scrapeNitterProfile(username: string, maxTweets = 25): Promise<ScrapedTweet[]> {
  try {
    let html = '';
    let attempts = 0;
    const MAX_ATTEMPTS = 5; // Increased from 3 to 5
    
    while (attempts < MAX_ATTEMPTS) {
      const instance = getBestNitterInstance();
      
      if (isRateLimited(instance)) {
        console.log(`Rate limited on ${instance}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WINDOW));
        continue;
      }
      
      try {
        const nitterUrl = `${instance}/${username}`;
        console.log(`Attempting to scrape ${nitterUrl} (attempt ${attempts + 1}/${MAX_ATTEMPTS})`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000); // Increased timeout to 20 seconds
        
        recordRequest(instance);
        
        const response = await fetch(nitterUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          agent: httpsAgent, // Use custom HTTPS agent
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
          html = await response.text();
          // Update instance cache with success
          nitterInstanceCache.set(instance, {
            lastSuccess: Date.now(),
            failureCount: 0
          });
          break;
        } else if (response.status === 429) {
          console.log(`Rate limited by ${instance}, updating cache...`);
          const stats = nitterInstanceCache.get(instance) || { lastSuccess: 0, failureCount: 0 };
          nitterInstanceCache.set(instance, {
            ...stats,
            failureCount: stats.failureCount + 1
          });
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
        } else {
          console.error(`Error with Nitter instance ${instance}: ${response.status} ${response.statusText}`);
          const stats = nitterInstanceCache.get(instance) || { lastSuccess: 0, failureCount: 0 };
          nitterInstanceCache.set(instance, {
            ...stats,
            failureCount: stats.failureCount + 1
          });
        }
      } catch (error) {
        console.error(`Error with Nitter instance:`, error);
        const stats = nitterInstanceCache.get(instance) || { lastSuccess: 0, failureCount: 0 };
        nitterInstanceCache.set(instance, {
          ...stats,
          failureCount: stats.failureCount + 1
        });
      }
      
      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        // Exponential backoff: 2s, 4s, 8s, 16s
        const backoffTime = Math.min(2000 * Math.pow(2, attempts - 1), 16000);
        console.log(`Waiting ${backoffTime/1000} seconds before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
    
    if (!html) {
      // Fallback: Try Rettiwt-API
      console.warn('All Nitter instances failed. Trying Rettiwt-API fallback...');
      try {
        const rettiwt = new Rettiwt();
        // Get user details to extract numeric user ID
        const user = await rettiwt.user.details(username);
        const userId = user?.id;
        if (!userId) throw new Error('Could not resolve user ID from username');
        const timeline = await rettiwt.user.timeline(userId, maxTweets);
        if (!timeline || !timeline.list || !timeline.list.length) {
          throw new Error('Rettiwt-API returned no tweets');
        }
        // Map Rettiwt tweet format to ScrapedTweet
        const tweets: ScrapedTweet[] = timeline.list.map((tweet: any) => ({
          id: tweet.id,
          text: tweet.fullText || tweet.text || '',
          timestamp: tweet.createdAt,
          username: tweet.user?.userName || username,
          name: tweet.user?.fullName || username,
          profileImageUrl: tweet.user?.profileImage || ''
        })).filter((t: any) => t.id && t.text);
        if (!tweets.length) throw new Error('Rettiwt-API returned no valid tweets');
        console.log(`Successfully scraped ${tweets.length} tweets from ${username} using Rettiwt-API fallback`);
        return tweets;
      } catch (rettiwtError) {
        console.error('Rettiwt-API fallback failed:', rettiwtError);
        throw new Error('All Nitter instances and Rettiwt-API fallback failed');
      }
    }
    
    // Parse the HTML with cheerio
    const $ = cheerio.load(html);
    const tweets: ScrapedTweet[] = [];
    
    // Select all tweet elements
    const tweetElements = $('.timeline-item').slice(0, maxTweets);
    
    // Get profile info once (from the first tweet)
    const profileImageUrl = $('.profile-card-avatar img').attr('src') || '';
    const name = $('.profile-card-fullname').text().trim();
    const profileUsername = $('.profile-card-username').text().trim().replace('@', '');
    
    tweetElements.each((index: number, element: any) => {
      try {
        const tweetElement = $(element);
        
        // Extract tweet ID from permalink
        const permalink = tweetElement.find('.tweet-link').attr('href') || '';
        const id = permalink.split('/').pop() || '';
        
        // Extract text content
        const textContent = tweetElement.find('.tweet-content').text().trim();
        
        // Extract timestamp
        const timestampElement = tweetElement.find('.tweet-date a');
        const timestamp = timestampElement.attr('title') || '';
        
        if (id && textContent) {
          tweets.push({
            id,
            text: textContent,
            timestamp,
            username: profileUsername || username,
            name: name || username,
            profileImageUrl: profileImageUrl.startsWith('http') 
              ? profileImageUrl 
              : `https://nitter.net${profileImageUrl}`
          });
        }
      } catch (error) {
        console.error('Error parsing tweet element:', error);
      }
    });
    
    if (tweets.length === 0) {
      throw new Error('No tweets found or failed to parse tweets');
    }
    
    console.log(`Successfully scraped ${tweets.length} tweets from ${username}'s Nitter profile`);
    return tweets;
  } catch (error) {
    console.error(`Error scraping Nitter profile for ${username}:`, error);
    throw error;
  }
}

/**
 * Converts scraped tweets to news items
 * @param tweets The scraped tweets
 * @param sourceName Name of the source (e.g., "DeItaone on X")
 * @returns An array of news items ready to insert into the database
 */
export function tweetsToNewsItems(tweets: ScrapedTweet[], sourceName: string): InsertNewsItem[] {
  return tweets.map(tweet => {
    // Parse the timestamp from Nitter format (e.g., "Jul 15, 2023 · 10:23 AM UTC")
    let publishedAt: Date;
    try {
      publishedAt = new Date(tweet.timestamp);
      // If the date is invalid, use current date
      if (isNaN(publishedAt.getTime())) {
        publishedAt = new Date();
      }
    } catch (error) {
      console.error(`Error parsing timestamp ${tweet.timestamp}:`, error);
      publishedAt = new Date();
    }
    
    return {
      title: tweet.text.split('\n')[0].substring(0, 100), // First line of the tweet, max 100 chars
      content: tweet.text,
      source: sourceName.startsWith("Nitter:") ? sourceName : `Nitter: ${sourceName}`,
      sourceType: 'nitter',
      externalId: tweet.id,
      publishedAt,
      metadata: {
        tweetId: [tweet.id] as [string, ...string[]],
        username: [tweet.username] as [string, ...string[]],
        name: [tweet.name] as [string, ...string[]],
        profileImageUrl: [tweet.profileImageUrl] as [string, ...string[]],
        timestamp: [tweet.timestamp] as [string, ...string[]]
      }
    };
  });
}