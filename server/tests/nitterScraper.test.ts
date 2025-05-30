import { scrapeNitterProfile, tweetsToNewsItems } from '../services/nitterScraper';

async function testNitterScraper() {
  try {
    console.log('Testing Nitter scraper...');
    
    // Test with a known active Twitter account
    const username = 'elonmusk';
    console.log(`\nScraping tweets from @${username}...`);
    
    const tweets = await scrapeNitterProfile(username, 5);
    console.log(`\nSuccessfully scraped ${tweets.length} tweets`);
    
    // Display the scraped tweets
    tweets.forEach((tweet, index) => {
      console.log(`\nTweet ${index + 1}:`);
      console.log(`ID: ${tweet.id}`);
      console.log(`Text: ${tweet.text}`);
      console.log(`Timestamp: ${tweet.timestamp}`);
      console.log(`Username: ${tweet.username}`);
      console.log(`Name: ${tweet.name}`);
    });
    
    // Test conversion to news items
    console.log('\nConverting tweets to news items...');
    const newsItems = tweetsToNewsItems(tweets, 'Test Source');
    console.log(`\nConverted ${newsItems.length} tweets to news items`);
    
    // Display the first news item
    if (newsItems.length > 0) {
      console.log('\nFirst news item:');
      console.log(JSON.stringify(newsItems[0], null, 2));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testNitterScraper(); 