/**
 * Pipeline 02 Configuration and Integration Settings
 * Centralizes configuration for the ETL pipeline
 */

export interface Pipeline02Config {
  database: {
    connectionString: string;
    poolSize?: number;
    timeout?: number;
  };
  processing: {
    batchSize: number;
    maxRetries: number;
    skipValidation: boolean;
    enableLogging: boolean;
  };
  validation: {
    strictMode: boolean;
    allowFutureDates: boolean;
    maxDeviationPercent?: number;
  };
  performance: {
    enableParallelProcessing: boolean;
    maxConcurrentBatches: number;
    memoryLimitMB: number;
  };
}

/**
 * Default configuration for Pipeline 02
 */
export const DEFAULT_PIPELINE02_CONFIG: Pipeline02Config = {
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/conectaboi',
    poolSize: 10,
    timeout: 30000, // 30 seconds
  },
  processing: {
    batchSize: 1000,
    maxRetries: 3,
    skipValidation: false,
    enableLogging: true,
  },
  validation: {
    strictMode: true,
    allowFutureDates: false,
    maxDeviationPercent: 50, // Warn if deviation > 50%
  },
  performance: {
    enableParallelProcessing: false, // Keep simple for now
    maxConcurrentBatches: 3,
    memoryLimitMB: 512,
  },
};

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT_CONFIGS: Record<string, Partial<Pipeline02Config>> = {
  development: {
    processing: {
      batchSize: 100,
      maxRetries: 2,
      enableLogging: true,
      skipValidation: false,
    },
    validation: {
      strictMode: false,
      allowFutureDates: true, // Allow for testing
    },
  },
  testing: {
    processing: {
      batchSize: 10,
      maxRetries: 1,
      enableLogging: false,
      skipValidation: true, // Faster testing
    },
    validation: {
      strictMode: false,
      allowFutureDates: true,
    },
  },
  staging: {
    processing: {
      batchSize: 500,
      maxRetries: 3,
      enableLogging: true,
      skipValidation: false,
    },
    validation: {
      strictMode: true,
      allowFutureDates: false,
    },
  },
  production: {
    processing: {
      batchSize: 2000,
      maxRetries: 5,
      enableLogging: true,
      skipValidation: false,
    },
    validation: {
      strictMode: true,
      allowFutureDates: false,
    },
    performance: {
      enableParallelProcessing: true,
      maxConcurrentBatches: 5,
      memoryLimitMB: 1024,
    },
  },
};

/**
 * Merge configuration with environment overrides
 */
export function createPipeline02Config(
  environment: string = process.env.NODE_ENV || 'development',
  overrides: Partial<Pipeline02Config> = {}
): Pipeline02Config {
  const envConfig = ENVIRONMENT_CONFIGS[environment] || {};

  return {
    ...DEFAULT_PIPELINE02_CONFIG,
    ...envConfig,
    ...overrides,
    // Deep merge nested objects
    database: {
      ...DEFAULT_PIPELINE02_CONFIG.database,
      ...envConfig.database,
      ...overrides.database,
    },
    processing: {
      ...DEFAULT_PIPELINE02_CONFIG.processing,
      ...envConfig.processing,
      ...overrides.processing,
    },
    validation: {
      ...DEFAULT_PIPELINE02_CONFIG.validation,
      ...envConfig.validation,
      ...overrides.validation,
    },
    performance: {
      ...DEFAULT_PIPELINE02_CONFIG.performance,
      ...envConfig.performance,
      ...overrides.performance,
    },
  };
}

/**
 * Validation for pipeline configuration
 */
export function validatePipeline02Config(config: Pipeline02Config): void {
  if (!config.database.connectionString) {
    throw new Error('Database connection string is required');
  }

  if (config.processing.batchSize <= 0) {
    throw new Error('Batch size must be greater than 0');
  }

  if (config.processing.maxRetries < 0) {
    throw new Error('Max retries cannot be negative');
  }

  if (config.performance.maxConcurrentBatches <= 0) {
    throw new Error('Max concurrent batches must be greater than 0');
  }

  if (config.performance.memoryLimitMB <= 0) {
    throw new Error('Memory limit must be greater than 0');
  }
}

/**
 * Configuration presets for common scenarios
 */
export const PIPELINE02_PRESETS = {
  /**
   * High throughput configuration for large files
   */
  HIGH_THROUGHPUT: createPipeline02Config('production', {
    processing: {
      batchSize: 5000,
      maxRetries: 2,
      skipValidation: false,
      enableLogging: false, // Reduce I/O overhead
    },
    performance: {
      enableParallelProcessing: true,
      maxConcurrentBatches: 8,
      memoryLimitMB: 1024,
    },
  }),

  /**
   * Safe configuration with extensive validation
   */
  SAFE_MODE: createPipeline02Config('production', {
    processing: {
      batchSize: 100,
      maxRetries: 5,
      skipValidation: false,
      enableLogging: true,
    },
    validation: {
      strictMode: true,
      allowFutureDates: false,
      maxDeviationPercent: 25, // More strict deviation checking
    },
    performance: {
      enableParallelProcessing: false,
      maxConcurrentBatches: 1,
      memoryLimitMB: 256,
    },
  }),

  /**
   * Development and testing configuration
   */
  DEV_MODE: createPipeline02Config('development', {
    processing: {
      batchSize: 50,
      maxRetries: 1,
      skipValidation: false,
      enableLogging: true,
    },
    validation: {
      strictMode: false,
      allowFutureDates: true,
    },
  }),
};