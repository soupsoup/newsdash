import { Handler } from '@netlify/functions';
import postgres from 'postgres';

const connectionString = process.env.SUPABASE_DATABASE_URL!;

export const handler: Handler = async () => {
  try {
    const client = postgres(connectionString, { ssl: { rejectUnauthorized: false } });
    await client`SELECT 1`;
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      message = (error as any).message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: message }),
    };
  }
};