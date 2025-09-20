import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './schema';
import { stagingCsvRaw, stagingCsvProcessed, stagingLivestockData, staging03DesvioDistribuicao, insertStaging03DesvioDistribuicaoSchema, selectStaging03DesvioDistribuicaoSchema } from './schema/staging';
const connectionString = process.env.DATABASE_URL;
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);
// Export db instance and schema for external use
export { db, users, stagingCsvRaw, stagingCsvProcessed, stagingLivestockData, staging03DesvioDistribuicao, insertStaging03DesvioDistribuicaoSchema, selectStaging03DesvioDistribuicaoSchema };
// Function to get all users
export const getAllUsers = async () => {
    return await db.select().from(users);
};
//# sourceMappingURL=index.js.map