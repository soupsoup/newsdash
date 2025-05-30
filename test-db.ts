import { checkDatabaseConnection } from './server/db';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    // Log the connection string (with password masked)
    const connectionString = process.env.SUPABASE_DATABASE_URL;
    if (connectionString) {
      const maskedString = connectionString.replace(/:[^:@]+@/, ':****@');
      console.log('Attempting to connect to:', maskedString);
    } else {
      console.log('No SUPABASE_DATABASE_URL found in .env file');
    }

    const result = await checkDatabaseConnection();
    console.log('Connection test result:', result);
  } catch (error) {
    console.error('Error testing connection:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
  }
}

testConnection(); 