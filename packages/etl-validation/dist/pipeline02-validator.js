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
// Zod schema for Pipeline 02 data validation
export const pipeline02Schema = z.object({
    data_ref: z.string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: "Data deve ser uma data válida"
    })
        .refine((val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return date <= today;
    }, {
        message: "Data não pode ser futura"
    }),
    turno: z.string().optional(),
    equipamento: z.string()
        .min(1, "Equipamento é obrigatório")
        .refine((val) => {
        const normalized = val.toLowerCase().trim();
        return normalized.includes('bahman') || normalized.includes('siloking');
    }, {
        message: "Equipamento deve ser BAHMAN ou SILOKING"
    }),
    curral_codigo: z.string()
        .min(1, "Código do curral é obrigatório"),
    dieta_nome: z.string().optional(),
    kg_planejado: z.union([z.string(), z.number()])
        .transform((val) => {
        if (typeof val === 'string') {
            const parsed = parseFloat(val.replace(',', '.'));
            return isNaN(parsed) ? null : parsed;
        }
        return val;
    })
        .refine((val) => val !== null && val !== undefined, {
        message: "KG planejado é obrigatório e deve ser um número válido"
    })
        .refine((val) => val > 0, {
        message: "KG planejado deve ser maior que zero"
    })
        .refine((val) => val <= 100000, {
        message: "KG planejado não pode exceder 100.000kg (valor impossível)"
    }),
    kg_real: z.union([z.string(), z.number()])
        .transform((val) => {
        if (typeof val === 'string') {
            const parsed = parseFloat(val.replace(',', '.'));
            return isNaN(parsed) ? null : parsed;
        }
        return val;
    })
        .refine((val) => val !== null && val !== undefined, {
        message: "KG real é obrigatório e deve ser um número válido"
    })
        .refine((val) => val >= 0, {
        message: "KG real não pode ser negativo"
    })
        .refine((val) => val <= 100000, {
        message: "KG real não pode exceder 100.000kg (valor impossível)"
    }),
    desvio_kg: z.union([z.string(), z.number()])
        .optional()
        .transform((val) => {
        if (val === undefined || val === null || val === '')
            return undefined;
        if (typeof val === 'string') {
            const parsed = parseFloat(val.replace(',', '.'));
            return isNaN(parsed) ? undefined : parsed;
        }
        return val;
    }),
    desvio_pct: z.union([z.string(), z.number()])
        .optional()
        .transform((val) => {
        if (val === undefined || val === null || val === '')
            return undefined;
        if (typeof val === 'string') {
            const parsed = parseFloat(val.replace(',', '.'));
            return isNaN(parsed) ? undefined : parsed;
        }
        return val;
    })
        .refine((val) => {
        if (val === undefined)
            return true;
        return val >= -100 && val <= 100;
    }, {
        message: "Desvio percentual deve estar entre -100% e 100%"
    }),
});
/**
 * Validates and processes Pipeline 02 data
 */
export class Pipeline02Validator {
    /**
     * Validates raw CSV data for Pipeline 02
     */
    static validateData(rows) {
        const errors = [];
        const warnings = [];
        const validData = [];
        let bahmanRows = 0;
        let silokingRows = 0;
        let rejectedEquipment = 0;
        rows.forEach((row, index) => {
            const rowNumber = index + 1;
            try {
                // Validate with Zod schema
                const validatedRow = pipeline02Schema.parse(row);
                // Calculate natural key for deduplication
                const naturalKey = this.generateNaturalKey(validatedRow);
                // Calculate missing deviations
                const calculatedFields = this.calculateDeviations(validatedRow);
                // Track equipment types
                const equipmentLower = validatedRow.equipamento.toLowerCase();
                if (equipmentLower.includes('bahman')) {
                    bahmanRows++;
                }
                else if (equipmentLower.includes('siloking')) {
                    silokingRows++;
                }
                // Add warning for large deviations
                const desvioPct = calculatedFields.desvio_pct_calculated || validatedRow.desvio_pct;
                if (desvioPct && Math.abs(desvioPct) > 20) {
                    warnings.push({
                        row: rowNumber,
                        field: 'desvio_pct',
                        value: desvioPct,
                        message: `Desvio percentual alto: ${desvioPct.toFixed(2)}%`
                    });
                }
                validData.push({
                    ...validatedRow,
                    rowNumber,
                    naturalKey,
                    calculatedFields
                });
            }
            catch (error) {
                if (error instanceof z.ZodError) {
                    // Handle Zod validation errors
                    error.errors.forEach(zodError => {
                        // Check if it's an equipment filter rejection
                        if (zodError.path.includes('equipamento') &&
                            zodError.message.includes('BAHMAN ou SILOKING')) {
                            rejectedEquipment++;
                        }
                        errors.push({
                            row: rowNumber,
                            field: zodError.path.join('.'),
                            value: row[zodError.path[0]],
                            message: zodError.message,
                            severity: 'error'
                        });
                    });
                }
                else {
                    // Handle other errors
                    errors.push({
                        row: rowNumber,
                        field: 'unknown',
                        value: null,
                        message: `Erro inesperado: ${error}`,
                        severity: 'error'
                    });
                }
            }
        });
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            processedRows: rows.length,
            validRows: validData.length,
            data: validData,
            metadata: {
                totalRows: rows.length,
                validRows: validData.length,
                rejectedRows: rows.length - validData.length,
                warningRows: warnings.length,
                equipmentFilter: {
                    bahmanRows,
                    silokingRows,
                    rejectedEquipment
                }
            }
        };
    }
    /**
     * Generates a natural key for deduplication
     */
    static generateNaturalKey(data) {
        const date = new Date(data.data_ref).toISOString().split('T')[0];
        const equipamento = data.equipamento.toLowerCase().trim();
        const curral = data.curral_codigo.trim();
        const turno = data.turno?.trim() || 'all';
        return `${date}_${equipamento}_${curral}_${turno}`;
    }
    /**
     * Calculates missing deviation fields
     */
    static calculateDeviations(data) {
        const result = {};
        // Calculate desvio_kg if missing
        if (!data.desvio_kg && data.kg_real !== undefined && data.kg_planejado !== undefined) {
            result.desvio_kg_calculated = data.kg_real - data.kg_planejado;
        }
        // Calculate desvio_pct if missing
        if (!data.desvio_pct && data.kg_real !== undefined && data.kg_planejado !== undefined && data.kg_planejado > 0) {
            const desvioKg = data.desvio_kg || result.desvio_kg_calculated;
            result.desvio_pct_calculated = (desvioKg / data.kg_planejado) * 100;
        }
        return result;
    }
    /**
     * Validates and cleanses a single row
     */
    static validateRow(row) {
        const result = this.validateData([row]);
        return {
            isValid: result.isValid,
            data: result.data[0],
            errors: result.errors
        };
    }
}
export default Pipeline02Validator;
