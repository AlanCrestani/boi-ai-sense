import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './schema'

// Core schemas
import {
  organizations,
  profiles,
  userRoles,
  invitations,
  userOrganizations,
} from './schema/core'

// Staging schemas
import {
  stagingCsvRaw,
  stagingCsvProcessed,
  stagingLivestockData,
  staging01HistoricoConsumo,
  staging03DesvioDistribuicao,
  staging05TratoPorCurral,
} from './schema/staging'

// Facts schemas
import {
  fatoCarregamento,
  fatoDistribuicao,
  fatoHistoricoConsumo,
} from './schema/facts'

// ETL schemas
import {
  etlFile,
  etlRun,
  etlRunLog,
  etlDeadLetterQueue,
  etlReprocessingLog,
  staging02DesvioCarregamento,
  staging04ItensTrato,
} from './schema/etl'

const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client);

// Export db instance and all schemas
export {
  db,
  users,
  // Core tables
  organizations,
  profiles,
  userRoles,
  invitations,
  userOrganizations,
  // Staging tables
  stagingCsvRaw,
  stagingCsvProcessed,
  stagingLivestockData,
  staging01HistoricoConsumo,
  staging03DesvioDistribuicao,
  staging05TratoPorCurral,
  // Facts tables
  fatoCarregamento,
  fatoDistribuicao,
  fatoHistoricoConsumo,
  // ETL tables
  etlFile,
  etlRun,
  etlRunLog,
  etlDeadLetterQueue,
  etlReprocessingLog,
  staging02DesvioCarregamento,
  staging04ItensTrato,
};

// Function to get all users
export const getAllUsers = async () => {
  return await db.select().from(users);
};