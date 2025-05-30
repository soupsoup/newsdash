import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { InsertNewsItem } from '../../shared/schema';

interface ScrapedTweet {
  id: string;
  text: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    name: string;
    profile_image_url: string;
  };
}

// List of reliable Nitter instances
const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.privacydev.net',
  'https://nitter.unixfox.eu',
  'https://nitter.42l.fr',
  'https://nitter.1d4.us',
  'https://nitter.kavin.rocks',
  'https://nitter.poast.org',
  'https://nitter.mint.lgbt',
  'https://nitter.woodland.cafe',
  'https://nitter.fdn.fr'
];

// List of reliable Twitter API proxies
const TWITTER_PROXIES = [
  {
    url: (username: string) => `https://cdn.syndication.twimg.com/timeline/profile?screen_name=${username}&with_replies=false&count=20`,
    type: 'official-embed',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://cdn.syndication.twimg.com/',
    }
  },
  {
    url: (username: string) => `https://api.fxtwitter.com/${username}`,
    type: 'fxtwitter'
  },
  {
    url: (username: string) => `https://api.vxtwitter.com/${username}`,
    type: 'vxtwitter'
  }
];

// Financial keywords for filtering
const FINANCIAL_KEYWORDS = [
  'FED', 'ECB', 'BOJ', 'GDP', 'CPI', 'INFLATION', 'DIMON', 'POWELL', 'RATE',
  'MARKETS?', 'STOCKS?', 'TRADING', 'ECONOMY', 'BANK', 'DOLLAR', 'EURO', 'YEN',
  'GOLD', 'OIL', 'TREASURY', 'YIELD', 'BOND', 'DEBT', 'DEFICIT', 'SURPLUS',
  'GROWTH', 'JOBS', 'EMPLOYMENT', 'RECESSION', 'INTEREST', 'CHAIRMAN',
  'PRESIDENT', 'MINISTER', 'STATEMENT', 'PRESS', 'RELEASE', 'QUARTER',
  'EARNINGS', 'PROFIT', 'REVENUE', 'PRICE', 'INCREASE', 'DECREASE', 'INDEX',
  'RAISES?', 'CUTS?', 'RALLY', 'CRASH', 'SURGE', 'PLUMMET', 'DROP', 'RISES?',
  'FALLS?', 'REPORT', 'DATA', 'FUND', 'INVEST', 'BULL', 'BEAR', 'VOLATILITY',
  'FORECAST'
];

const FINANCIAL_PATTERN = new RegExp(`\\b(${FINANCIAL_KEYWORDS.join('|')})\\b`, 'i');

/**
 * Check if a tweet is a financial tweet
 */
function isFinancialTweet(text: string): boolean {
  return text.startsWith('*') || 
         FINANCIAL_PATTERN.test(text) || 
         /\d+\.?\d*\s*%/i.test(text) || 
         text.toUpperCase() === text;
}

/**
 * Fetch tweets using Twitter's official embed API
 */
async function fetchFromOfficialEmbed(username: string, maxTweets: number): Promise<ScrapedTweet[]> {
  const tweets: ScrapedTweet[] = [];
  
  for (const proxy of TWITTER_PROXIES) {
    try {
      console.log(`Trying ${proxy.type} for @${username}`);
      
      const response = await fetch(proxy.url(username), {
        headers: proxy.headers || {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        console.log(`${proxy.type} failed: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (proxy.type === 'official-embed' && typeof data === 'object' && data !== null && 'timeline' in data) {
        // Parse official embed format
        const timeline = (data as any).timeline;
        if (timeline.instructions) {
          for (const instruction of timeline.instructions) {
            if (instruction.addEntries?.entries) {
              for (const entry of instruction.addEntries.entries) {
                const tweet = entry.content?.item?.content?.tweet;
                if (!tweet) continue;
                
                const tweetText = tweet.text || tweet.full_text || '';
                if (username.toLowerCase() === 'deitaone' && !isFinancialTweet(tweetText)) {
                  continue;
                }
                
                tweets.push({
                  id: tweet.id_str || `embed-${Date.now()}-${tweets.length}`,
                  text: tweetText,
                  created_at: tweet.created_at || new Date().toISOString(),
                  user: {
                    id: tweet.user?.id_str || username,
                    username: tweet.user?.screen_name || username,
                    name: tweet.user?.name || (username === 'DeItaone' ? 'Delta One' : username),
                    profile_image_url: tweet.user?.profile_image_url_https || 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
                  }
                });
                
                if (tweets.length >= maxTweets) return tweets;
              }
            }
          }
        }
      } else if ((proxy.type === 'fxtwitter' || proxy.type === 'vxtwitter') && typeof data === 'object' && data !== null && 'tweets' in data) {
        // Parse fx/vx Twitter format
        const tweetsArr = (data as any).tweets;
        if (Array.isArray(tweetsArr)) {
          for (const tweet of tweetsArr) {
            const tweetText = tweet.text || '';
            if (username.toLowerCase() === 'deitaone' && !isFinancialTweet(tweetText)) {
              continue;
            }
            
            tweets.push({
              id: tweet.id || `proxy-${Date.now()}-${tweets.length}`,
              text: tweetText,
              created_at: tweet.created_at || new Date().toISOString(),
              user: {
                id: tweet.author?.id || username,
                username: tweet.author?.screen_name || username,
                name: tweet.author?.name || (username === 'DeItaone' ? 'Delta One' : username),
                profile_image_url: tweet.author?.profile_image_url || 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
              }
            });
            
            if (tweets.length >= maxTweets) return tweets;
          }
        }
      }
    } catch (error) {
      console.log(`Error with ${proxy.type}:`, error);
    }
  }
  
  return tweets;
}

/**
 * Fetch tweets from Nitter instances
 */
async function fetchFromNitter(username: string, maxTweets: number): Promise<ScrapedTweet[]> {
  const tweets: ScrapedTweet[] = [];
  
  for (const instance of NITTER_INSTANCES) {
    try {
      console.log(`Trying Nitter instance: ${instance}`);
      
      const response = await fetch(`${instance}/${username}/rss`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        console.log(`Nitter instance ${instance} failed: ${response.status}`);
        continue;
      }
      
      const text = await response.text();
      const $ = cheerio.load(text, { xmlMode: true });
      
      $('item').each((_, item) => {
        const $item = $(item);
        const tweetText = $item.find('title').text();
        const link = $item.find('link').text();
        const tweetId = link.match(/status\/(\d+)/)?.[1] || `nitter-${Date.now()}-${tweets.length}`;
        tweets.push({
          id: tweetId,
          text: tweetText,
          created_at: $item.find('pubDate').text() || new Date().toISOString(),
          user: {
            id: username,
            username: username,
            name: username === 'DeItaone' ? 'Delta One' : username,
            profile_image_url: 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
          }
        });
        if (tweets.length >= maxTweets) return false;
      });
      
      if (tweets.length > 0) {
        console.log(`Successfully fetched ${tweets.length} tweets from ${instance}`);
        return tweets;
      }
    } catch (error) {
      console.log(`Error with Nitter instance ${instance}:`, error);
    }
  }
  
  return tweets;
}

/**
 * Main function to fetch tweets using multiple methods
 */
export async function scrapeTweetsFromProfile(username: string, maxTweets = 25): Promise<ScrapedTweet[]> {
  console.log(`Fetching tweets for @${username}`);
  
  // Try official embed API first
  const embedTweets = await fetchFromOfficialEmbed(username, maxTweets);
  if (embedTweets.length > 0) {
    console.log(`Successfully fetched ${embedTweets.length} tweets from official embed API`);
    return embedTweets;
  }
  
  // Try Nitter instances
  const nitterTweets = await fetchFromNitter(username, maxTweets);
  if (nitterTweets.length > 0) {
    console.log(`Successfully fetched ${nitterTweets.length} tweets from Nitter`);
    return nitterTweets;
  }
  
  console.log('All methods failed to fetch tweets');
  return [];
}

/**
 * Convert scraped tweets to news items
 */
export function tweetsToNewsItems(tweets: ScrapedTweet[], sourceName: string): InsertNewsItem[] {
  return tweets.map(tweet => ({
    title: tweet.text.split('\n')[0].substring(0, 100), // First line of the tweet, max 100 chars
    content: tweet.text,
    source: sourceName.startsWith("X/Twitter:") ? sourceName : `X/Twitter: ${sourceName}`,
    sourceType: 'twitter',
    externalId: tweet.id,
    publishedAt: new Date(tweet.created_at),
    metadata: {
      tweetId: [tweet.id] as [string, ...string[]],
      userId: [tweet.user.id] as [string, ...string[]],
      username: [tweet.user.username] as [string, ...string[]],
      name: [tweet.user.name] as [string, ...string[]],
      profileImageUrl: [tweet.user.profile_image_url] as [string, ...string[]],
      timestamp: [tweet.created_at] as [string, ...string[]]
    }
  }));
} 