/**
 * Business Rules Validator for Pipeline 02 - Desvio de Carregamento
 * Implements business logic validation according to task requirements
 */
import { z } from 'zod';
/**
 * Equipamentos válidos para Pipeline 02
 * Filtro: apenas BAHMAN e SILOKING são aceitos
 */
export declare const VALID_EQUIPAMENTOS: readonly ["BAHMAN", "SILOKING"];
/**
 * Pipeline 02 Raw Data Schema with Business Rules
 * Validação de entrada bruta antes de cleansing
 */
export declare const pipeline02RawDataSchema: z.ZodObject<{
    data_ref: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    turno: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null, string | null | undefined>;
    equipamento: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    curral_codigo: z.ZodEffects<z.ZodString, string, string>;
    dieta_nome: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null, string | null | undefined>;
    kg_planejado: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>, number, string | number>, number, string | number>;
    kg_real: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>, number, string | number>, number, string | number>;
    desvio_kg: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>, number | null, string | number | undefined>;
    desvio_pct: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>, number | null, string | number | undefined>;
}, "strip", z.ZodTypeAny, {
    data_ref: string;
    turno: string | null;
    equipamento: string;
    curral_codigo: string;
    dieta_nome: string | null;
    kg_planejado: number;
    kg_real: number;
    desvio_kg: number | null;
    desvio_pct: number | null;
}, {
    data_ref: string;
    equipamento: string;
    curral_codigo: string;
    kg_planejado: string | number;
    kg_real: string | number;
    turno?: string | null | undefined;
    dieta_nome?: string | null | undefined;
    desvio_kg?: string | number | undefined;
    desvio_pct?: string | number | undefined;
}>;
/**
 * Pipeline 02 Processed Data Schema
 * Dados após validação e cálculo de desvios
 */
export declare const pipeline02ProcessedSchema: z.ZodObject<{
    data_ref: z.ZodDate;
    turno: z.ZodNullable<z.ZodString>;
    equipamento: z.ZodEnum<["BAHMAN", "SILOKING"]>;
    curral_codigo: z.ZodString;
    dieta_nome: z.ZodNullable<z.ZodString>;
    kg_planejado: z.ZodNumber;
    kg_real: z.ZodNumber;
    desvio_kg: z.ZodNumber;
    desvio_pct: z.ZodNumber;
    natural_key: z.ZodString;
}, "strip", z.ZodTypeAny, {
    data_ref: Date;
    turno: string | null;
    equipamento: "BAHMAN" | "SILOKING";
    curral_codigo: string;
    dieta_nome: string | null;
    kg_planejado: number;
    kg_real: number;
    desvio_kg: number;
    desvio_pct: number;
    natural_key: string;
}, {
    data_ref: Date;
    turno: string | null;
    equipamento: "BAHMAN" | "SILOKING";
    curral_codigo: string;
    dieta_nome: string | null;
    kg_planejado: number;
    kg_real: number;
    desvio_kg: number;
    desvio_pct: number;
    natural_key: string;
}>;
export type Pipeline02RawData = z.input<typeof pipeline02RawDataSchema>;
export type Pipeline02ProcessedData = z.output<typeof pipeline02ProcessedSchema>;
/**
 * Validation Error Types
 */
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
    code: string;
}
export interface ValidationResult<T> {
    isValid: boolean;
    data?: T;
    errors: ValidationError[];
}
/**
 * Business Rules Validator Class
 */
export declare class Pipeline02BusinessValidator {
    /**
     * Validate raw data against business rules
     */
    validateRawData(rawData: Record<string, any>): ValidationResult<Pipeline02RawData>;
    /**
     * Calculate deviations and prepare processed data
     */
    processData(rawData: Pipeline02RawData, organizationId: string): Pipeline02ProcessedData;
    /**
     * Generate natural key for idempotent operations
     */
    private generateNaturalKey;
    /**
     * Advanced business rule validation
     */
    validateBusinessLogic(data: Pipeline02ProcessedData): ValidationResult<Pipeline02ProcessedData>;
}
//# sourceMappingURL=business-rules.d.ts.map