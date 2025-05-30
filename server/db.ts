import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_DATABASE_URL) {
  throw new Error('SUPABASE_DATABASE_URL is required');
}

// Create the connection
const connectionString = process.env.SUPABASE_DATABASE_URL;
const client = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false
});

export const db = drizzle(client, { schema });

// Export a function to check the database connection
export async function checkDatabaseConnection() {
  try {
    await client`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
} 