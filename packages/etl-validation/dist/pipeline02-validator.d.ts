/**
 * Pipeline 02 - Desvio de Carregamento Data Validation
 *
 * Validates and cleanses data for the feeding deviation pipeline according to business rules:
 * - Filter equipment types (BAHMAN/SILOKING)
 * - Check required fields (data_ref, equipamento, curral_codigo, kg_planejado, kg_real)
 * - Reject negative or impossible values
 * - Detect and handle future dates
 * - Calculate deviations if not provided
 */
import { z } from 'zod';
import type { ValidationResult, ValidationError } from './core/types.js';
export declare const pipeline02Schema: z.ZodObject<{
    data_ref: z.ZodString;
    turno: z.ZodOptional<z.ZodString>;
    equipamento: z.ZodString;
    curral_codigo: z.ZodString;
    dieta_nome: z.ZodOptional<z.ZodString>;
    kg_planejado: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>, z.ZodTransform<number | null, string | number>>;
    kg_real: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>, z.ZodTransform<number | null, string | number>>;
    desvio_kg: z.ZodPipe<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>, z.ZodTransform<number | undefined, string | number | undefined>>;
    desvio_pct: z.ZodPipe<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>, z.ZodTransform<number | undefined, string | number | undefined>>;
}, z.core.$strip>;
export type Pipeline02Data = z.infer<typeof pipeline02Schema>;
/**
 * Enhanced validation result for Pipeline 02
 */
export interface Pipeline02ValidationResult extends ValidationResult {
    data: Pipeline02ProcessedData[];
    metadata: {
        totalRows: number;
        validRows: number;
        rejectedRows: number;
        warningRows: number;
        equipmentFilter: {
            bahmanRows: number;
            silokingRows: number;
            rejectedEquipment: number;
        };
    };
}
export interface Pipeline02ProcessedData extends Pipeline02Data {
    rowNumber: number;
    naturalKey: string;
    calculatedFields: {
        desvio_kg_calculated?: number;
        desvio_pct_calculated?: number;
    };
}
/**
 * Validates and processes Pipeline 02 data
 */
export declare class Pipeline02Validator {
    /**
     * Validates raw CSV data for Pipeline 02
     */
    static validateData(rows: Record<string, any>[]): Pipeline02ValidationResult;
    /**
     * Generates a natural key for deduplication
     */
    private static generateNaturalKey;
    /**
     * Calculates missing deviation fields
     */
    private static calculateDeviations;
    /**
     * Validates and cleanses a single row
     */
    static validateRow(row: Record<string, any>): {
        isValid: boolean;
        data?: Pipeline02ProcessedData;
        errors: ValidationError[];
    };
}
export default Pipeline02Validator;
