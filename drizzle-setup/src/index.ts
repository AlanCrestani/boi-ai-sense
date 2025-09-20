import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { authUsers, profiles } from './schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

// Function to get auth users (from Supabase auth.users)
export const getAuthUsers = async () => {
  return await db.select().from(authUsers).limit(10);
};

// Function to get profiles (custom table)
export const getProfiles = async () => {
  return await db.select().from(profiles).limit(10);
};

// Function to test connection
export const testConnection = async () => {
  try {
    const result = await db.select().from(authUsers).limit(1);
    console.log('✅ Database connection successful!');
    console.log('📊 Sample auth user:', result[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Export db instance and schema for external use
export { db, authUsers, profiles };

// Test connection if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnection().then(() => {
    process.exit(0);
  });
}