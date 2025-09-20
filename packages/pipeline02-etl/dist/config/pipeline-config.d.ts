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
export declare const DEFAULT_PIPELINE02_CONFIG: Pipeline02Config;
/**
 * Environment-specific configurations
 */
export declare const ENVIRONMENT_CONFIGS: Record<string, Partial<Pipeline02Config>>;
/**
 * Merge configuration with environment overrides
 */
export declare function createPipeline02Config(environment?: string, overrides?: Partial<Pipeline02Config>): Pipeline02Config;
/**
 * Validation for pipeline configuration
 */
export declare function validatePipeline02Config(config: Pipeline02Config): void;
/**
 * Configuration presets for common scenarios
 */
export declare const PIPELINE02_PRESETS: {
    /**
     * High throughput configuration for large files
     */
    HIGH_THROUGHPUT: Pipeline02Config;
    /**
     * Safe configuration with extensive validation
     */
    SAFE_MODE: Pipeline02Config;
    /**
     * Development and testing configuration
     */
    DEV_MODE: Pipeline02Config;
};
//# sourceMappingURL=pipeline-config.d.ts.map