import cheerio from 'cheerio';
import fetch from 'node-fetch';
import { InsertNewsItem } from '../../shared/schema';

interface ScrapedTweet {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  name: string;
  profileImageUrl: string;
}

/**
 * Scrapes tweets from a Nitter profile
 * @param username The Twitter/X username to scrape (without @)
 * @param maxTweets Maximum number of tweets to scrape
 * @returns An array of scraped tweets
 */
export async function scrapeNitterProfile(username: string, maxTweets = 25): Promise<ScrapedTweet[]> {
  try {
    // Try multiple Nitter instances since they can be unstable
    const nitterInstances = [
      'https://nitter.net',
      'https://nitter.poast.org',
      'https://nitter.1d4.us',
      'https://nitter.kavin.rocks'
    ];
    
    let html = '';
    let instanceIndex = 0;
    
    // Try each instance until one works
    while (instanceIndex < nitterInstances.length) {
      try {
        const nitterUrl = `${nitterInstances[instanceIndex]}/${username}`;
        console.log(`Attempting to scrape ${nitterUrl}`);
        
        const response = await fetch(nitterUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000 // 10 second timeout
        });
        
        if (response.ok) {
          html = await response.text();
          break;
        }
      } catch (error) {
        console.error(`Error with Nitter instance ${nitterInstances[instanceIndex]}:`, error);
      }
      
      instanceIndex++;
    }
    
    if (!html) {
      throw new Error('All Nitter instances failed to respond');
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
    
    tweetElements.each((_, element) => {
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
      source: sourceName,
      sourceType: 'twitter',
      externalId: tweet.id,
      publishedAt,
      metadata: {
        username: tweet.username,
        name: tweet.name,
        profileImageUrl: tweet.profileImageUrl,
        timestamp: tweet.timestamp
      }
    };
  });
}