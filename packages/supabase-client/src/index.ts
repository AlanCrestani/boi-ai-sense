import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export class SupabaseClientManager {
  private static instance: SupabaseClientManager;
  private client: ReturnType<typeof createClient<Database>> | null = null;
  private serviceClient: ReturnType<typeof createClient<Database>> | null = null;

  private constructor() {}

  static getInstance(): SupabaseClientManager {
    if (!SupabaseClientManager.instance) {
      SupabaseClientManager.instance = new SupabaseClientManager();
    }
    return SupabaseClientManager.instance;
  }

  initialize(config: SupabaseConfig) {
    this.client = createClient<Database>(config.url, config.anonKey, {
      auth: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      }
    });

    if (config.serviceRoleKey) {
      this.serviceClient = createClient<Database>(config.url, config.serviceRoleKey);
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  getServiceClient() {
    if (!this.serviceClient) {
      throw new Error('Supabase service client not initialized or service role key not provided.');
    }
    return this.serviceClient;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();
      const { data, error } = await client.storage.listBuckets();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        // Don't log actual bucket data in production
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const supabaseManager = SupabaseClientManager.getInstance();

// Re-export types
export type { Database } from './types';
export type { User, Session } from '@supabase/supabase-js';