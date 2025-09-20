/**
 * Business Rules Validator for Pipeline 02 - Desvio de Carregamento
 * Implements business logic validation according to task requirements
 */
import { z } from 'zod';
/**
 * Equipamentos válidos para Pipeline 02
 * Filtro: apenas BAHMAN e SILOKING são aceitos
 */
export const VALID_EQUIPAMENTOS = ['BAHMAN', 'SILOKING'];
/**
 * Pipeline 02 Raw Data Schema with Business Rules
 * Validação de entrada bruta antes de cleansing
 */
export const pipeline02RawDataSchema = z.object({
    data_ref: z
        .string()
        .nonempty('Data de referência é obrigatória')
        .refine((dateStr) => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    }, 'Data de referência deve ser válida')
        .refine((dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        return date <= now;
    }, 'Data de referência não pode ser futura'),
    turno: z
        .string()
        .nullable()
        .optional()
        .transform((val) => val?.trim() || null),
    equipamento: z
        .string()
        .nonempty('Equipamento é obrigatório')
        .transform((val) => val?.trim().toUpperCase())
        .refine((val) => VALID_EQUIPAMENTOS.includes(val), `Equipamento deve ser um dos seguintes: ${VALID_EQUIPAMENTOS.join(', ')}`),
    curral_codigo: z
        .string()
        .nonempty('Código do curral é obrigatório')
        .transform((val) => val?.trim()),
    dieta_nome: z
        .string()
        .nullable()
        .optional()
        .transform((val) => val?.trim() || null),
    kg_planejado: z
        .union([z.string(), z.number()])
        .transform((val) => {
        if (typeof val === 'string') {
            // Handle Brazilian decimal format (comma as decimal separator)
            let normalized = val.trim().replace(/[R$\s]/g, '');
            const lastCommaIndex = normalized.lastIndexOf(',');
            const lastDotIndex = normalized.lastIndexOf('.');
            if (lastCommaIndex > lastDotIndex) {
                // Brazilian format: 1.234,56 - remove dots (thousand separators) and replace comma with dot
                const beforeComma = normalized.substring(0, lastCommaIndex).replace(/\./g, '');
                const afterComma = normalized.substring(lastCommaIndex + 1);
                normalized = beforeComma + '.' + afterComma;
            }
            else if (lastCommaIndex !== -1 && lastDotIndex === -1) {
                // Only comma exists: 1234,56
                normalized = normalized.replace(',', '.');
            }
            return parseFloat(normalized);
        }
        return val;
    })
        .refine((val) => !isNaN(val), 'Kg planejado deve ser um número válido')
        .refine((val) => val > 0, 'Kg planejado deve ser positivo'),
    kg_real: z
        .union([z.string(), z.number()])
        .transform((val) => {
        if (typeof val === 'string') {
            // Handle Brazilian decimal format (comma as decimal separator)
            let normalized = val.trim().replace(/[R$\s]/g, '');
            const lastCommaIndex = normalized.lastIndexOf(',');
            const lastDotIndex = normalized.lastIndexOf('.');
            if (lastCommaIndex > lastDotIndex) {
                // Brazilian format: 1.234,56 - remove dots (thousand separators) and replace comma with dot
                const beforeComma = normalized.substring(0, lastCommaIndex).replace(/\./g, '');
                const afterComma = normalized.substring(lastCommaIndex + 1);
                normalized = beforeComma + '.' + afterComma;
            }
            else if (lastCommaIndex !== -1 && lastDotIndex === -1) {
                // Only comma exists: 1234,56
                normalized = normalized.replace(',', '.');
            }
            return parseFloat(normalized);
        }
        return val;
    })
        .refine((val) => !isNaN(val), 'Kg real deve ser um número válido')
        .refine((val) => val >= 0, 'Kg real não pode ser negativo'),
    desvio_kg: z
        .union([z.string(), z.number()])
        .optional()
        .transform((val) => {
        if (val === undefined || val === null || val === '')
            return null;
        if (typeof val === 'string') {
            const normalized = val.replace(',', '.');
            return parseFloat(normalized);
        }
        return val;
    }),
    desvio_pct: z
        .union([z.string(), z.number()])
        .optional()
        .transform((val) => {
        if (val === undefined || val === null || val === '')
            return null;
        if (typeof val === 'string') {
            const normalized = val.replace(',', '.');
            return parseFloat(normalized);
        }
        return val;
    }),
});
/**
 * Pipeline 02 Processed Data Schema
 * Dados após validação e cálculo de desvios
 */
export const pipeline02ProcessedSchema = z.object({
    data_ref: z.date(),
    turno: z.string().nullable(),
    equipamento: z.enum(VALID_EQUIPAMENTOS),
    curral_codigo: z.string(),
    dieta_nome: z.string().nullable(),
    kg_planejado: z.number().positive(),
    kg_real: z.number().nonnegative(),
    desvio_kg: z.number(),
    desvio_pct: z.number(),
    natural_key: z.string(),
});
/**
 * Business Rules Validator Class
 */
export class Pipeline02BusinessValidator {
    /**
     * Validate raw data against business rules
     */
    validateRawData(rawData) {
        try {
            const validatedData = pipeline02RawDataSchema.parse(rawData);
            return {
                isValid: true,
                data: validatedData,
                errors: [],
            };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const validationErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    value: rawData[err.path[0]],
                    code: err.code,
                }));
                return {
                    isValid: false,
                    errors: validationErrors,
                };
            }
            throw error;
        }
    }
    /**
     * Calculate deviations and prepare processed data
     */
    processData(rawData, organizationId) {
        // Calculate deviations
        const desvio_kg = Number(rawData.kg_real) - Number(rawData.kg_planejado);
        const kgPlanejado = Number(rawData.kg_planejado);
        const desvio_pct = kgPlanejado > 0 ? (desvio_kg / kgPlanejado) * 100 : 0;
        // Generate natural key
        const natural_key = this.generateNaturalKey(rawData, organizationId);
        return {
            data_ref: new Date(rawData.data_ref),
            turno: rawData.turno || null,
            equipamento: rawData.equipamento,
            curral_codigo: rawData.curral_codigo,
            dieta_nome: rawData.dieta_nome || null,
            kg_planejado: Number(rawData.kg_planejado),
            kg_real: Number(rawData.kg_real),
            desvio_kg,
            desvio_pct,
            natural_key,
        };
    }
    /**
     * Generate natural key for idempotent operations
     */
    generateNaturalKey(data, organizationId) {
        const parts = [
            organizationId.substring(0, 8),
            new Date(data.data_ref).toISOString().split('T')[0],
            data.turno || '',
            data.equipamento || '',
            data.curral_codigo || '',
            data.dieta_nome || '',
        ];
        return parts.filter(Boolean).join('_').toUpperCase();
    }
    /**
     * Advanced business rule validation
     */
    validateBusinessLogic(data) {
        const errors = [];
        // Validate impossible values
        if (data.kg_real > data.kg_planejado * 3) {
            errors.push({
                field: 'kg_real',
                message: 'Kg real é suspeito: mais de 3x o planejado',
                value: data.kg_real,
                code: 'SUSPICIOUS_VALUE',
            });
        }
        // Validate extreme deviations
        if (Math.abs(data.desvio_pct) > 200) {
            errors.push({
                field: 'desvio_pct',
                message: 'Desvio percentual extremo (>200%)',
                value: data.desvio_pct,
                code: 'EXTREME_DEVIATION',
            });
        }
        // Validate date constraints
        const today = new Date();
        const dataRef = new Date(data.data_ref);
        const diffDays = Math.abs((today.getTime() - dataRef.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 365) {
            errors.push({
                field: 'data_ref',
                message: 'Data de referência muito antiga (>1 ano)',
                value: data.data_ref,
                code: 'OLD_DATE',
            });
        }
        return {
            isValid: errors.length === 0,
            data: errors.length === 0 ? data : undefined,
            errors,
        };
    }
}
//# sourceMappingURL=business-rules.js.map