import { Pool } from 'pg';

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

async function testConnection() {
  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current time:', result.rows[0].now);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testConnection(); 