/**
 * Business Rules and Validation for Pipeline 04 - Trato por Curral ETL
 * Validates feeding treatment data per pen/corral
 */
import { z } from 'zod';
/**
 * Valid shifts for feeding treatments
 */
export declare const VALID_TURNOS: readonly ["MANHÃ", "TARDE", "NOITE"];
/**
 * Valid treatment types
 */
export declare const VALID_TIPOS_TRATO: readonly ["RAÇÃO", "VOLUMOSO", "MINERAL", "MEDICAMENTO"];
/**
 * Raw data schema for Pipeline 04 (before processing)
 */
export declare const pipeline04RawDataSchema: z.ZodObject<{
    data_ref: z.ZodEffects<z.ZodString, string, string>;
    hora: z.ZodEffects<z.ZodString, string, string>;
    turno: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    curral_codigo: z.ZodEffects<z.ZodString, string, string>;
    trateiro: z.ZodEffects<z.ZodString, string, string>;
    dieta_nome: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>;
    tipo_trato: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, string, string | undefined>, string, string | undefined>;
    quantidade_kg: z.ZodNumber;
    quantidade_cabecas: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodNumber>>, number | null | undefined, number | null | undefined>;
    observacoes: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>;
}, "strip", z.ZodTypeAny, {
    hora: string;
    turno: string;
    data_ref: string;
    curral_codigo: string;
    dieta_nome: string | null;
    trateiro: string;
    tipo_trato: string;
    quantidade_kg: number;
    observacoes: string | null;
    quantidade_cabecas?: number | null | undefined;
}, {
    hora: string;
    turno: string;
    data_ref: string;
    curral_codigo: string;
    trateiro: string;
    quantidade_kg: number;
    dieta_nome?: string | null | undefined;
    tipo_trato?: string | undefined;
    quantidade_cabecas?: number | null | undefined;
    observacoes?: string | null | undefined;
}>;
/**
 * Processed data schema (after calculations and transformations)
 */
export declare const pipeline04ProcessedSchema: z.ZodObject<{
    data_ref: z.ZodDate;
    hora: z.ZodString;
    datetime_trato: z.ZodDate;
    turno: z.ZodEnum<["MANHÃ", "TARDE", "NOITE"]>;
    curral_codigo: z.ZodString;
    trateiro: z.ZodString;
    dieta_nome: z.ZodNullable<z.ZodString>;
    tipo_trato: z.ZodEnum<["RAÇÃO", "VOLUMOSO", "MINERAL", "MEDICAMENTO"]>;
    quantidade_kg: z.ZodNumber;
    quantidade_cabecas: z.ZodNullable<z.ZodNumber>;
    observacoes: z.ZodNullable<z.ZodString>;
    natural_key: z.ZodString;
}, "strip", z.ZodTypeAny, {
    hora: string;
    turno: "MANHÃ" | "TARDE" | "NOITE";
    data_ref: Date;
    curral_codigo: string;
    dieta_nome: string | null;
    natural_key: string;
    trateiro: string;
    tipo_trato: "RAÇÃO" | "VOLUMOSO" | "MINERAL" | "MEDICAMENTO";
    quantidade_kg: number;
    quantidade_cabecas: number | null;
    observacoes: string | null;
    datetime_trato: Date;
}, {
    hora: string;
    turno: "MANHÃ" | "TARDE" | "NOITE";
    data_ref: Date;
    curral_codigo: string;
    dieta_nome: string | null;
    natural_key: string;
    trateiro: string;
    tipo_trato: "RAÇÃO" | "VOLUMOSO" | "MINERAL" | "MEDICAMENTO";
    quantidade_kg: number;
    quantidade_cabecas: number | null;
    observacoes: string | null;
    datetime_trato: Date;
}>;
export type Pipeline04RawData = z.infer<typeof pipeline04RawDataSchema>;
export type Pipeline04ProcessedData = z.infer<typeof pipeline04ProcessedSchema>;
export interface ValidationResult {
    isValid: boolean;
    data?: Pipeline04RawData;
    errors: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    value: any;
    code?: string;
}
/**
 * Business Rules Validator for Pipeline 04
 */
export declare class Pipeline04BusinessValidator {
    /**
     * Validate raw data against schema
     */
    validateRawData(data: any): ValidationResult;
    /**
     * Process and transform validated data
     */
    processData(data: Pipeline04RawData, organizationId: string): Pipeline04ProcessedData;
    /**
     * Validate business logic and rules
     */
    validateBusinessLogic(data: Pipeline04ProcessedData): ValidationResult;
    /**
     * Generate natural key for idempotent operations
     */
    private generateNaturalKey;
    /**
     * Determine expected shift based on hour
     */
    private getTurnoByHour;
}
