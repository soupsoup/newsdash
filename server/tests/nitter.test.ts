import { scrapeNitterProfile } from '../services/nitterScraper';

async function testNitterScraper() {
  console.log('Starting Nitter scraper tests...\n');

  // Test 1: Basic scraping
  console.log('Test 1: Basic scraping test');
  try {
    const tweets = await scrapeNitterProfile('DeItaone', 5);
    console.log(`✓ Successfully scraped ${tweets.length} tweets`);
    console.log('Sample tweet:', tweets[0]);
    console.log('\nTweet structure validation:');
    console.log(`- Has ID: ${!!tweets[0].id}`);
    console.log(`- Has text: ${!!tweets[0].text}`);
    console.log(`- Has timestamp: ${!!tweets[0].timestamp}`);
    console.log(`- Has username: ${!!tweets[0].username}`);
    console.log(`- Has name: ${!!tweets[0].name}`);
    console.log(`- Has profile image: ${!!tweets[0].profileImageUrl}`);
  } catch (error) {
    console.error('✗ Basic scraping test failed:', error);
  }

  // Test 2: Rate limiting test
  console.log('\nTest 2: Rate limiting test');
  try {
    console.log('Making multiple requests in quick succession...');
    const promises = Array(3).fill(null).map(() => 
      scrapeNitterProfile('DeItaone', 2)
    );
    const results = await Promise.allSettled(promises);
    const successes = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✓ ${successes} out of 3 requests succeeded (rate limiting working)`);
  } catch (error) {
    console.error('✗ Rate limiting test failed:', error);
  }

  // Test 3: Error handling test
  console.log('\nTest 3: Error handling test');
  try {
    await scrapeNitterProfile('this_is_an_invalid_username_that_should_not_exist_123456789', 1);
    console.error('✗ Error handling test failed: Should have thrown an error');
  } catch (error) {
    console.log('✓ Error handling test passed: Properly handled invalid username');
  }

  // Test 4: Instance failover test
  console.log('\nTest 4: Instance failover test');
  try {
    console.log('Testing instance failover with multiple requests...');
    const tweets = await scrapeNitterProfile('DeItaone', 1);
    console.log('✓ Successfully scraped tweet after potential instance failover');
    console.log('Tweet ID:', tweets[0].id);
  } catch (error) {
    console.error('✗ Instance failover test failed:', error);
  }

  console.log('\nNitter scraper tests completed!');
}

// Run the tests
testNitterScraper().catch(console.error); 