import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Create the connection
console.log('Attempting to connect to database...');

const pool = new Pool({
  host: 'gondola.proxy.rlwy.net',
  port: 34773,
  database: 'railway',
  user: 'postgres',
  password: 'UMpKhseolcQxKUWKikPjjZdXYPWDqwuh',
  ssl: {
    rejectUnauthorized: false
  }
});

// Add error handler to the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export a function to check the database connection
export async function checkDatabaseConnection() {
  let client;
  try {
    console.log('Testing database connection...');
    client = await pool.connect();
    console.log('Got client from pool, executing test query...');
    const result = await client.query('SELECT NOW()');
    console.log('Query result:', result.rows[0].now);
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return error instanceof Error ? error.message : String(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Export the pool for direct use
export { pool }; 