import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { InsertNewsItem } from '../../shared/schema';

/**
 * Attempt to get real Twitter data using a combination of techniques
 * This is more reliable than a single method
 */
async function getRecentTweetsViaProxy(username: string, maxTweets = 10): Promise<ScrapedTweet[]> {
  try {
    console.log(`Attempting to fetch tweets for @${username} via improved proxy methods`);
    
    // New approach: Try multiple different proxy services that don't require authentication
    // These are more likely to work in restricted environments like Replit
    const proxyServices = [
      // NEW: Twitter official embed API - most reliable
      {
        url: `https://cdn.syndication.twimg.com/timeline/profile?screen_name=${username}&with_replies=false&count=20`,
        type: 'official-embed',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://cdn.syndication.twimg.com/',
        }
      },
      // Public API gateways
      {
        url: `https://api.fxtwitter.com/${username}`,
        type: 'fxtwitter'
      },
      {
        url: `https://api.vxtwitter.com/${username}`,
        type: 'vxtwitter'
      },
      // RSS-based services
      {
        url: `https://nitter.privacydev.net/${username}/rss`,
        type: 'rss'
      },
      // Twitter public consumer API proxies
      {
        url: `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`,
        type: 'syndication',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Referer': 'https://publish.twitter.com/',
          'Origin': 'https://publish.twitter.com'
        }
      }
    ];
    
    // Try each proxy service
    for (const service of proxyServices) {
      try {
        console.log(`Trying Twitter service: ${service.type} via ${service.url}`);
        
        const response = await fetch(service.url, {
          headers: service.headers || {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          // Set a reasonable timeout
          signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
          console.log(`Failed to fetch from ${service.type}: ${response.status}`);
          continue;
        }
        
        // Handle different response formats based on service type
        if (service.type === 'official-embed') {
          try {
            const data = await response.json() as any;
            
            if (data && data.timeline) {
              console.log(`Successfully fetched data from official Twitter embed API`);
              
              const tweets: ScrapedTweet[] = [];
              
              // Parse the official embed format
              if (data.timeline.instructions && Array.isArray(data.timeline.instructions)) {
                // Extract tweets from timeline entries
                for (const instruction of data.timeline.instructions) {
                  if (instruction.addEntries && instruction.addEntries.entries) {
                    for (const entry of instruction.addEntries.entries) {
                      try {
                        if (entry.content && entry.content.item && entry.content.item.content) {
                          const tweet = entry.content.item.content.tweet;
                          if (!tweet) continue;
                          
                          const user = tweet.user || {};
                          const tweetId = tweet.id_str || `embed-${Date.now()}-${tweets.length}`;
                          const tweetText = tweet.text || tweet.full_text || '';
                          
                          // For DeItaone, only include tweets that start with * or contain financial keywords
                          const isFinancialTweet = username.toLowerCase() === 'deitaone' || username.toLowerCase() === 'deltaone';
                          
                          if (isFinancialTweet) {
                            // Check for financial tweet indicators
                            const hasAsterisk = tweetText.startsWith('*');
                            const hasFinancialTerms = /\b(FED|ECB|BOJ|GDP|CPI|INFLATION|RATE|MARKETS?|STOCKS?|TRADING|ECONOMY)\b/i.test(tweetText);
                            
                            if (!hasAsterisk && !hasFinancialTerms) {
                              continue;
                            }
                          }
                          
                          const createdAt = tweet.created_at ? new Date(tweet.created_at).toISOString() : new Date().toISOString();
                          
                          tweets.push({
                            id: tweetId,
                            text: tweetText,
                            created_at: createdAt,
                            user: {
                              id: user.id_str || username,
                              username: user.screen_name || username,
                              name: user.name || (username === 'DeItaone' ? 'Delta One' : username),
                              profile_image_url: user.profile_image_url_https || 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
                            }
                          });
                          
                          if (tweets.length >= maxTweets) break;
                        }
                      } catch (entryError) {
                        console.log('Error parsing entry from embed API:', entryError);
                      }
                    }
                  }
                }
              }
              
              // Alternative parsing if above didn't work
              if (tweets.length === 0 && data.timeline.tweets) {
                for (const tweet of data.timeline.tweets) {
                  try {
                    const tweetId = tweet.id_str || `embed-alt-${Date.now()}-${tweets.length}`;
                    const tweetText = tweet.text || tweet.full_text || '';
                    
                    // For DeItaone, only include tweets that start with * or contain financial keywords
                    const isFinancialTweet = username.toLowerCase() === 'deitaone' || username.toLowerCase() === 'deltaone';
                    
                    if (isFinancialTweet) {
                      const hasAsterisk = tweetText.startsWith('*');
                      const hasFinancialTerms = /\b(FED|ECB|BOJ|GDP|CPI|INFLATION|RATE|MARKETS?|STOCKS?|TRADING|ECONOMY)\b/i.test(tweetText);
                      
                      if (!hasAsterisk && !hasFinancialTerms) {
                        continue;
                      }
                    }
                    
                    const createdAt = tweet.created_at ? new Date(tweet.created_at).toISOString() : new Date().toISOString();
                    
                    // Get user data from the users array
                    const userData = data.timeline.users && data.timeline.users[tweet.user_id_str];
                    
                    tweets.push({
                      id: tweetId,
                      text: tweetText,
                      created_at: createdAt,
                      user: {
                        id: userData?.id_str || username,
                        username: userData?.screen_name || username,
                        name: userData?.name || (username === 'DeItaone' ? 'Delta One' : username),
                        profile_image_url: userData?.profile_image_url_https || 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
                      }
                    });
                    
                    if (tweets.length >= maxTweets) break;
                  } catch (tweetError) {
                    console.log('Error parsing tweet from embed API:', tweetError);
                  }
                }
              }
              
              console.log(`Extracted ${tweets.length} tweets from official Twitter embed API`);
              
              if (tweets.length > 0) {
                return tweets;
              }
            }
          } catch (error) {
            console.log(`Error parsing JSON from official embed API:`, error);
          }
        } else if (service.type === 'fxtwitter' || service.type === 'vxtwitter') {
          try {
            const data = await response.json() as any;
            
            if (data.tweets && Array.isArray(data.tweets)) {
              console.log(`Successfully fetched ${data.tweets.length} tweets from ${service.type}`);
              
              const tweets: ScrapedTweet[] = [];
              
              // fx/vxtwitter format
              for (const tweet of data.tweets.slice(0, maxTweets)) {
                // For DeItaone, only include tweets that start with *
                if (username.toLowerCase() === 'deitaone' || username.toLowerCase() === 'deltaone') {
                  if (!tweet.text.startsWith('*')) continue;
                }
                
                tweets.push({
                  id: `${service.type}-${tweet.id || Date.now()}-${tweets.length}`,
                  text: tweet.text,
                  created_at: tweet.created_at || new Date().toISOString(),
                  user: {
                    id: tweet.author?.id || username,
                    username: tweet.author?.screen_name || username,
                    name: tweet.author?.name || (username === 'DeItaone' ? 'Delta One' : username),
                    profile_image_url: tweet.author?.avatar_url || 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
                  }
                });
              }
              
              if (tweets.length > 0) {
                return tweets;
              }
            }
          } catch (error) {
            console.log(`Error parsing JSON from ${service.type}:`, error);
          }
        } else if (service.type === 'rss') {
          try {
            const text = await response.text();
            
            // More robust RSS parsing without requiring additional dependencies
            const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
            console.log(`Found ${items.length} RSS items for @${username}`);
            
            if (items.length > 0) {
              const tweets: ScrapedTweet[] = [];
              
              // Log the first item for debugging
              if (items.length > 0) {
                console.log(`RSS Sample item content: ${items[0].substring(0, 150)}...`);
              }
              
              // Improved parsing for Nitter RSS format
              for (const item of items.slice(0, maxTweets)) {
                try {
                  // Extract title (tweet text) with better regex pattern that handles CDATA
                  const titleMatch = item.match(/<title>(.*?)<\/title>/) || item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
                  if (!titleMatch || !titleMatch[1]) {
                    console.log('No title found in RSS item');
                    continue;
                  }
                  
                  let tweetText = titleMatch[1];
                  console.log(`Found tweet text in RSS: ${tweetText.substring(0, 50)}...`);
                  
                  // Clean up any HTML entities and CDATA sections
                  tweetText = tweetText
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
                    .trim();
                  
                  // For DeItaone, only include tweets that start with * or contain financial keywords
                  const isFinancialTweet = username.toLowerCase() === 'deitaone' || username.toLowerCase() === 'deltaone';
                  
                  if (isFinancialTweet) {
                    // Check for financial tweet indicators (starts with * or has financial terms)
                    const hasAsterisk = tweetText.startsWith('*');
                    const hasFinancialTerms = /\b(FED|ECB|BOJ|GDP|CPI|INFLATION|RATE|MARKETS?|STOCKS?|TRADING|ECONOMY)\b/i.test(tweetText);
                    
                    if (!hasAsterisk && !hasFinancialTerms) {
                      console.log(`Skipping non-financial tweet: ${tweetText.substring(0, 30)}...`);
                      continue;
                    }
                  }
                  
                  // Extract publication date with better regex
                  const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/) || item.match(/<published>(.*?)<\/published>/);
                  const pubDate = dateMatch && dateMatch[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
                  
                  // Extract link to get tweet ID with more flexible pattern
                  const linkMatch = item.match(/<link>(.*?)<\/link>/) || item.match(/<guid.*?>(.*?)<\/guid>/);
                  const link = linkMatch && linkMatch[1] ? linkMatch[1].trim() : '';
                  
                  // Try different patterns to extract the tweet ID
                  let tweetId = `rss-${Date.now()}-${tweets.length}`;
                  if (link) {
                    const idMatchPatterns = [
                      /status\/(\d+)/, // Twitter style
                      /statuses\/(\d+)/, // Alternative Twitter format
                      /(\d{10,})/ // Just find a long number that could be an ID
                    ];
                    
                    for (const pattern of idMatchPatterns) {
                      const match = link.match(pattern);
                      if (match && match[1]) {
                        tweetId = match[1];
                        break;
                      }
                    }
                  }
                  
                  console.log(`Successfully parsed RSS tweet: ID=${tweetId}, Text=${tweetText.substring(0, 30)}...`);
                  
                  tweets.push({
                    id: tweetId,
                    text: tweetText,
                    created_at: pubDate,
                    user: {
                      id: username,
                      username: username,
                      name: username === 'DeItaone' ? 'Delta One' : username,
                      profile_image_url: 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
                    }
                  });
                } catch (itemError) {
                  console.log('Error parsing RSS item:', itemError);
                }
              }
              
              if (tweets.length > 0) {
                console.log(`Successfully extracted ${tweets.length} tweets from RSS feed`);
                return tweets;
              } else {
                console.log('No valid tweets extracted from RSS items');
              }
            }
          } catch (error) {
            console.log(`Error parsing RSS feed from ${service.url}:`, error);
          }
        } else if (service.type === 'syndication') {
          try {
            const text = await response.text();
            
            // The syndication API returns a JavaScript-like object wrapped in a function call
            // We need to extract the JSON part
            const jsonMatch = text.match(/\(\s*({[\s\S]*})\s*\)/);
            if (!jsonMatch || !jsonMatch[1]) {
              console.log('Could not extract JSON from syndication API');
              continue;
            }
            
            try {
              const data = JSON.parse(jsonMatch[1]);
              if (data.body) {
                const tweets: ScrapedTweet[] = [];
                
                // Find tweet elements
                const $ = cheerio.load(data.body);
                $('.timeline-Tweet').each((i, element) => {
                  if (tweets.length >= maxTweets) return;
                  
                  try {
                    const tweetText = $(element).find('.timeline-Tweet-text').text().trim();
                    if (!tweetText) return;
                    
                    // For DeItaone, only include tweets that start with *
                    if (username.toLowerCase() === 'deitaone' || username.toLowerCase() === 'deltaone') {
                      if (!tweetText.startsWith('*')) return;
                    }
                    
                    const tweetId = $(element).attr('data-tweet-id') || `syndication-${Date.now()}-${i}`;
                    const timestamp = $(element).find('.timeline-Tweet-timestamp').attr('datetime') || new Date().toISOString();
                    
                    // Extract user info
                    const userName = $(element).find('.timeline-Tweet-author .TweetAuthor-name').text().trim();
                    const userScreenName = $(element).find('.timeline-Tweet-author .TweetAuthor-screenName').text().trim().replace('@', '');
                    const profileImage = $(element).find('.timeline-Tweet-author .Avatar').attr('src') || '';
                    
                    tweets.push({
                      id: tweetId,
                      text: tweetText,
                      created_at: timestamp,
                      user: {
                        id: userScreenName || username,
                        username: userScreenName || username,
                        name: userName || (username === 'DeItaone' ? 'Delta One' : username),
                        profile_image_url: profileImage || 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
                      }
                    });
                  } catch (tweetError) {
                    console.log('Error parsing tweet from syndication API:', tweetError);
                  }
                });
                
                if (tweets.length > 0) {
                  return tweets;
                }
              }
            } catch (jsonError) {
              console.log('Error parsing JSON from syndication API:', jsonError);
            }
          } catch (error) {
            console.log(`Error processing syndication API response:`, error);
          }
        }
      } catch (error) {
        console.log(`Error fetching from ${service.type}:`, error);
      }
    }
    
    console.log('All proxy methods failed');
    return [];
  } catch (error) {
    console.error('Error in improved Twitter proxy approach:', error);
    return [];
  }
}

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

/**
 * Scrapes tweets from a Twitter/X user profile page using direct HTTP request
 * This is a simpler approach that doesn't require Puppeteer and works better in restricted environments
 * 
 * @param username The Twitter/X username to scrape (without @)
 * @param maxTweets Maximum number of tweets to scrape
 * @returns An array of scraped tweets
 */
export async function scrapeTweetsFromProfile(username: string, maxTweets = 10): Promise<ScrapedTweet[]> {
  try {
    console.log(`Starting to scrape tweets from @${username} using direct HTTP method`);

    // First, let's try using Twitter API via public proxy
    const tweets = await getRecentTweetsViaProxy(username, maxTweets);
    
    if (tweets.length > 0) {
      console.log(`Successfully retrieved ${tweets.length} tweets via API proxy for @${username}`);
      return tweets;
    }
    
    // If API proxy fails, try the Nitter approach
    console.log(`API proxy failed, trying Nitter for @${username}`);
    const nitterTweets = await scrapeFromNitter(username, maxTweets);
    
    if (nitterTweets.length > 0) {
      console.log(`Successfully scraped ${nitterTweets.length} tweets from Nitter for @${username}`);
      return nitterTweets;
    }
    
    // If Nitter fails, try a direct X.com approach
    console.log(`Nitter scraping failed, trying direct X.com request for @${username}`);
    return await scrapeDirectFromX(username, maxTweets);
    
  } catch (error) {
    console.error('Error scraping tweets:', error);
    console.log('All scraping methods failed - no fallback data will be used as per requirements');
    
    // Create meaningful error that can be propagated up with detailed information
    const err = new Error('Failed to retrieve Twitter data');
    
    // Provide specific details about the issue
    (err as any).details = [
      'Unable to retrieve real Twitter data through any of our scraping methods',
      'Twitter has anti-scraping measures that block automated access',
      'Replit environment may have network limitations for certain external services',
      'This is a common issue with web scraping and not a problem with your setup'
    ];
    
    // Give actionable tips that might help resolve the issue
    (err as any).tips = [
      'Try again in a few minutes - Twitter rate limits may resolve',
      'Our system is specifically designed to work with @DeItaone financial tweets',
      'We continue to improve our scraping methods for better reliability',
      'Per requirements, we never use mock/fake data - only display real tweets or errors'
    ];
    
    // Include technical details that might help debugging
    (err as any).technical = {
      methodsAttempted: [
        'Twitter API Gateway proxies (fxtwitter, vxtwitter)',
        'RSS feed scraping (nitter.privacydev.net/rss)',
        'Twitter Syndication API (syndication.twitter.com)',
        'Nitter instances',
        'Direct X.com scraping'
      ],
      timestamp: new Date().toISOString(),
      username: username
    };
    
    // Per requirements, we don't use mock/fallback data
    throw err;
  }
}

/**
 * Tries to scrape tweets from Nitter, an alternative Twitter frontend
 */
async function scrapeFromNitter(username: string, maxTweets = 10): Promise<ScrapedTweet[]> {
  try {
    // Try different Nitter instances as they might have different availability
    const nitterInstances = [
      'https://nitter.net',
      'https://nitter.unixfox.eu',
      'https://nitter.42l.fr',
      'https://nitter.pussthecat.org'
    ];
    
    // Try each instance until we get a successful response
    for (const instance of nitterInstances) {
      try {
        const url = `${instance}/${username}`;
        console.log(`Trying Nitter instance: ${url}`);
        
        // Set up AbortController with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          // Attempt fetch with timeout via AbortController
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId); // Clear the timeout if the fetch is successful
          
          if (!response.ok) {
            console.log(`Failed to fetch from ${url}: ${response.status} ${response.statusText}`);
            continue;
          }
          
          const html = await response.text();
          console.log(`Successfully fetched from Nitter instance: ${instance}`);
          
          // Parse the Nitter HTML
          const $ = cheerio.load(html);
          const tweets: ScrapedTweet[] = [];
          
          // Nitter uses a different structure than Twitter/X
          $('.timeline-item').each((index, element) => {
            if (tweets.length >= maxTweets) return;
            
            try {
              // Extract tweet ID
              const tweetLink = $(element).find('.tweet-link').attr('href');
              if (!tweetLink) return;
              
              const tweetIdMatch = tweetLink.match(/\/status\/(\d+)/);
              if (!tweetIdMatch || !tweetIdMatch[1]) return;
              
              const tweetId = tweetIdMatch[1];
              
              // Extract tweet text
              const tweetTextElement = $(element).find('.tweet-content');
              if (!tweetTextElement.length) return;
              
              const tweetText = tweetTextElement.text().trim();
              if (!tweetText) return;
              
              // For financial tweets like DeItaone, the text is often in uppercase
              // This is especially useful for ensuring we capture the right content
              const isFinancialTweet = username.toLowerCase() === 'deltaone' || 
                                      username.toLowerCase() === 'deitaone';
              
              // Only include tweets that start with * for DeItaone as those are the financial alerts
              if (isFinancialTweet && !tweetText.startsWith('*')) {
                return;
              }
              
              // Extract timestamp (Nitter shows relative time, so we approximate)
              const timestampText = $(element).find('.tweet-date a').attr('title') || '';
              const timestamp = timestampText ? new Date(timestampText).toISOString() : new Date().toISOString();
              
              // Extract user info
              const userName = $(element).find('.fullname').text().trim() || 'Unknown';
              
              // Extract profile image URL
              let profileImageUrl = $(element).find('.tweet-avatar img').attr('src') || '';
              if (profileImageUrl && !profileImageUrl.startsWith('http')) {
                profileImageUrl = `${instance}${profileImageUrl}`;
              }
              
              // Create the tweet object
              tweets.push({
                id: tweetId,
                text: tweetText,
                created_at: timestamp,
                user: {
                  id: username,
                  username: username,
                  name: userName || (username === 'DeItaone' ? 'Delta One' : username),
                  profile_image_url: profileImageUrl || 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
                }
              });
            } catch (err: any) {
              console.error('Error parsing Nitter tweet:', err);
            }
          });
          
          if (tweets.length > 0) {
            return tweets;
          }
          
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log(`Request to ${url} timed out after 5 seconds`);
          } else {
            console.log(`Error fetching from ${url}:`, error.message);
          }
        }
      } catch (err: any) {
        console.log(`Failed to fetch from Nitter instance: ${instance}`, err.message);
      }
    }
    
    console.log('All Nitter instances failed');
    return [];
  } catch (error: any) {
    console.error('Error in Nitter scraping:', error.message);
    return [];
  }
}

/**
 * Direct scraping from X.com using a simple fetch request
 * This is less reliable than Puppeteer but works in more restricted environments
 */
async function scrapeDirectFromX(username: string, maxTweets = 10): Promise<ScrapedTweet[]> {
  try {
    const url = `https://x.com/${username}`;
    console.log(`Fetching directly from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`Failed to fetch from X.com: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const tweets: ScrapedTweet[] = [];
    
    // X.com/Twitter has a complex structure, especially with React/JS rendering
    // This approach has limitations but might catch some content
    $('article').each((index, element) => {
      if (tweets.length >= maxTweets) return;
      
      try {
        // Try to extract the tweet ID from the article
        const tweetLink = $(element).find('a[href*="/status/"]').attr('href');
        if (!tweetLink) return;
        
        const tweetId = tweetLink.split('/status/')[1];
        if (!tweetId) return;
        
        // Extract tweet text - different selectors to try
        let tweetText = '';
        $(element).find('[data-testid="tweetText"]').each((i, el) => {
          tweetText += $(el).text();
        });
        
        // If no text with the testid, try other common elements
        if (!tweetText) {
          // Look for paragraphs that might contain the tweet text
          $(element).find('p').each((i, el) => {
            const potentialText = $(el).text().trim();
            if (potentialText && potentialText.length > 5) {
              tweetText = potentialText;
            }
          });
        }
        
        // If still no text, skip this tweet
        if (!tweetText) return;
        
        // Create unique ID based on the tweet ID
        const uniqueId = `x-${tweetId}-${Date.now().toString().slice(-4)}`;
        
        // Add to our collection
        tweets.push({
          id: uniqueId,
          text: tweetText,
          created_at: new Date().toISOString(), // Use current time since exact time is hard to parse
          user: {
            id: username,
            username: username,
            name: username === 'DeItaone' ? 'Delta One' : username,
            profile_image_url: 'https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg'
          }
        });
      } catch (err) {
        console.error('Error parsing X.com tweet:', err);
      }
    });
    
    console.log(`Extracted ${tweets.length} tweets directly from X.com for @${username}`);
    return tweets;
  } catch (error) {
    console.error('Error in direct X.com scraping:', error);
    return [];
  }
}

/**
 * Converts scraped tweets to news items
 * @param tweets The scraped tweets
 * @param sourceName Name of the source
 * @returns An array of news items ready to insert into the database
 */
export function tweetsToNewsItems(tweets: ScrapedTweet[], sourceName: string): InsertNewsItem[] {
  return tweets.map(tweet => {
    // Format metadata
    const metadata: Record<string, any> = {
      tweetId: tweet.id,
      userId: tweet.user.id,
      username: tweet.user.username,
      timestamp: tweet.created_at,
      profileImageUrl: tweet.user.profile_image_url
    };
    
    return {
      title: tweet.text,
      content: tweet.text,
      source: sourceName.startsWith("X/Twitter:") ? sourceName : `X/Twitter: ${sourceName}`,
      sourceType: "twitter",
      externalId: tweet.id,
      metadata,
    };
  });
}

/**
 * Returns dynamic fallback tweets that change based on current time
 * @param username The username to generate fallback tweets for
 * @returns An array of simulated tweets with unique IDs based on timestamp
 */
function getDynamicFallbackTweets(username: string): ScrapedTweet[] {
  // Only return fallback data for DeItaone
  if (username.toLowerCase() !== 'deltaone' && username.toLowerCase() !== 'deitaone') {
    return [];
  }
  
  // Current time for creating unique IDs and realistic timestamps
  const now = Date.now();
  
  // List of potential market headlines to rotate through
  const headlines = [
    "*BREAKING: FED SIGNALS POSSIBLE RATE CUT IN COMING MONTHS",
    "*US CONSUMER CONFIDENCE RISES TO 110.7 IN MARCH; EST. 108.5",
    "*ECB HOLDS INTEREST RATES STEADY AT MARCH MEETING",
    "*TREASURY YIELDS DROP AFTER WEAKER-THAN-EXPECTED JOBS DATA",
    "*CHINA'S CENTRAL BANK ANNOUNCES $113B STIMULUS PACKAGE",
    "*S&P 500 APPROACHES NEW ALL-TIME HIGH AMID TECH RALLY",
    "*POWELL SAYS FED WILL BE 'PATIENT' ON RATE CUTS",
    "*OIL PRICES JUMP 3% AS MIDDLE EAST TENSIONS ESCALATE",
    "*US HOUSING STARTS FALL 10.9% IN FEBRUARY; WORST SINCE 2020",
    "*TESLA ANNOUNCES 12% WORKFORCE REDUCTION; SHARES DROP",
    "*NVIDIA STOCK SURGES 8% AFTER AI CHIP DEMAND FORECAST RAISED",
    "*AMAZON EXPANDS BUY NOW PAY LATER OPTIONS GLOBALLY",
    "*MICROSOFT AND OPENAI ANNOUNCE $10B EXPANDED PARTNERSHIP",
    "*GOLD HITS RECORD HIGH AMID GROWING INFLATION CONCERNS",
    "*APPLE SUPPLIERS REPORT STRONG IPHONE 16 PRODUCTION TARGETS"
  ];
  
  // Create tweets with timestamps that are a few minutes to hours apart
  const tweets: ScrapedTweet[] = [];
  
  for (let i = 0; i < 7; i++) {
    // Create a unique ID based on current timestamp and index
    const uniqueId = `tweet-${now}-${i}`;
    
    // Use modulo to cycle through headlines based on current time + index
    const headlineIndex = (Math.floor(now / 1000) + i) % headlines.length;
    
    // Create a timestamp that's progressively further in the past
    const timestamp = new Date(now - (i * 35 * 60 * 1000)).toISOString(); // Each 35 minutes earlier
    
    tweets.push({
      id: uniqueId,
      text: headlines[headlineIndex],
      created_at: timestamp,
      user: {
        id: "1156910898",
        username: "DeItaone",
        name: "Delta One",
        profile_image_url: "https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg"
      }
    });
  }
  
  return tweets;
}

/**
 * Returns static fallback tweets for compatibility
 * @param username The username to generate fallback tweets for
 * @returns An array of simulated tweets
 */
function getFallbackTweets(username: string): ScrapedTweet[] {
  // Only return fallback data for DeItaone
  if (username.toLowerCase() !== 'deltaone' && username.toLowerCase() !== 'deitaone') {
    return [];
  }
  
  // Simulated DeItaone tweets as fallback
  return [
    {
      id: "1768265371583541248",
      text: "*GOLDMAN RAISES S&P 500 TARGET TO 5,200 FROM 5,100",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "1156910898",
        username: "DeItaone",
        name: "Delta One",
        profile_image_url: "https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg"
      }
    },
    {
      id: "1768254838435152143",
      text: "*FED SURVEY: HOUSEHOLD FINANCES IMPROVED BROADLY IN LATE 2023",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "1156910898",
        username: "DeItaone",
        name: "Delta One",
        profile_image_url: "https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg"
      }
    },
    {
      id: "1768253123485958345",
      text: "*JPMORGAN'S KOLANOVIC SAYS 'MAXIMUM GREED' HAS TAKEN OVER MARKETS",
      created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "1156910898",
        username: "DeItaone",
        name: "Delta One",
        profile_image_url: "https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg"
      }
    },
    {
      id: "1768243923468488923",
      text: "*US MARCH MICHIGAN SENTIMENT INDEX FALLS TO 76.5; EST. 77.0",
      created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "1156910898",
        username: "DeItaone",
        name: "Delta One", 
        profile_image_url: "https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg"
      }
    },
    {
      id: "1768083465324146123",
      text: "*JPMORGAN STRATEGISTS SAY STOCKS FACE 10% DROP IN A CORRECTION",
      created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "1156910898", 
        username: "DeItaone",
        name: "Delta One",
        profile_image_url: "https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg"
      }
    },
    {
      id: "1768032284953178542",
      text: "*CORE US CPI RISES 0.4% M/M; EST. 0.3%; MOST SINCE SEPT. 2023",
      created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "1156910898",
        username: "DeItaone", 
        name: "Delta One",
        profile_image_url: "https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg"
      }
    },
    {
      id: "1768028457812431879",
      text: "*NASDAQ 100 EXTENDS DROP, DOWN 1.5% IN WORST SLIDE SINCE FEB. 21",
      created_at: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "1156910898",
        username: "DeItaone", 
        name: "Delta One",
        profile_image_url: "https://pbs.twimg.com/profile_images/1578454393750843392/BaDx7NAZ_400x400.jpg"
      }
    }
  ];
}