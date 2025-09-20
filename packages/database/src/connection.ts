import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as etlSchema from './schema/etl';
import * as dimensionsSchema from './schema/dimensions';
import * as factsSchema from './schema/facts';

// Combine all schemas
const schema = {
  ...etlSchema,
  ...dimensionsSchema,
  ...factsSchema,
};

export type DatabaseSchema = typeof schema;

// Connection configuration
export interface DatabaseConfig {
  connectionString: string;
  max?: number;
  ssl?: boolean;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: postgres.Sql | null = null;
  private db: ReturnType<typeof drizzle> | null = null;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  connect(config: DatabaseConfig) {
    if (this.client) {
      console.warn('Database already connected. Closing existing connection.');
      this.disconnect();
    }

    this.client = postgres(config.connectionString, {
      max: config.max || 20,
      ssl: config.ssl !== false,
    });

    this.db = drizzle(this.client, { schema });
    return this.db;
  }

  getDatabase() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      this.client = null;
      this.db = null;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDatabase();
      await db.execute(sql`SELECT 1`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

// Export database instance getter
export const getDb = () => dbConnection.getDatabase();

// Re-export SQL helper
export { sql } from 'drizzle-orm';