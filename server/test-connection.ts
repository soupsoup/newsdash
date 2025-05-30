import { Pool } from 'pg';

async function testConnection() {
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

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current time:', result.rows[0].now);
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Connection error:', error);
    process.exit(1);
  }
}

testConnection(); 