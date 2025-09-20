import postgres from 'postgres';
import { users } from './schema';
import { stagingCsvRaw, stagingCsvProcessed, stagingLivestockData, staging03DesvioDistribuicao, insertStaging03DesvioDistribuicaoSchema, selectStaging03DesvioDistribuicaoSchema } from './schema/staging';
declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<Record<string, never>> & {
    $client: postgres.Sql<{}>;
};
export { db, users, stagingCsvRaw, stagingCsvProcessed, stagingLivestockData, staging03DesvioDistribuicao, insertStaging03DesvioDistribuicaoSchema, selectStaging03DesvioDistribuicaoSchema };
export declare const getAllUsers: () => Promise<{
    id: number;
    fullName: string | null;
    phone: string | null;
}[]>;
//# sourceMappingURL=index.d.ts.map