/**
 * Data Validation and Cleansing Service for Pipeline 02 - Desvio de Carregamento
 * Implements comprehensive validation rules for livestock feeding deviation data
 */
import { z } from 'zod';
export const DEFAULT_VALIDATION_CONFIG = {
    allowFutureDates: false,
    maxDaysInFuture: 1,
    minReasonableWeight: 0.1, // 100g minimum
    maxReasonableWeight: 50000, // 50 tons maximum
    allowedEquipmentTypes: ['BAHMAN', 'SILOKING'],
    strictMode: true,
};
// Zod schemas for validation
const equipmentSchema = z.string()
    .min(1, 'Equipamento é obrigatório')
    .transform((val) => val.toUpperCase().trim())
    .refine((val) => DEFAULT_VALIDATION_CONFIG.allowedEquipmentTypes.includes(val), {
    message: `Equipamento deve ser: ${DEFAULT_VALIDATION_CONFIG.allowedEquipmentTypes.join(', ')}`,
});
const dateSchema = z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/YYYY'),
    z.date(),
])
    .transform((val) => {
    if (val instanceof Date)
        return val;
    // Handle DD/MM/YYYY format
    if (typeof val === 'string' && val.includes('/')) {
        const [day, month, year] = val.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Handle YYYY-MM-DD format
    return new Date(val);
})
    .refine((date) => !isNaN(date.getTime()), {
    message: 'Data inválida',
});
const weightSchema = z.union([
    z.string().regex(/^\d+(\.\d+)?$/, 'Peso deve ser numérico'),
    z.number(),
])
    .transform((val) => typeof val === 'string' ? parseFloat(val) : val)
    .refine((val) => val >= DEFAULT_VALIDATION_CONFIG.minReasonableWeight, {
    message: `Peso deve ser no mínimo ${DEFAULT_VALIDATION_CONFIG.minReasonableWeight}kg`,
})
    .refine((val) => val <= DEFAULT_VALIDATION_CONFIG.maxReasonableWeight, {
    message: `Peso deve ser no máximo ${DEFAULT_VALIDATION_CONFIG.maxReasonableWeight}kg`,
});
const curralSchema = z.union([
    z.string().min(1, 'Código do curral é obrigatório'),
    z.number().int().positive('Código do curral deve ser positivo'),
])
    .transform((val) => String(val).trim());
const vagaoSchema = z.union([
    z.string().min(1, 'Código do vagão é obrigatório'),
    z.number().int().positive('Código do vagão deve ser positivo'),
])
    .transform((val) => String(val).trim());
const turnoSchema = z.string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => ['MANHA', 'MANHÃ', 'TARDE', 'NOITE', 'MADRUGADA', ''].includes(val) || val === '', {
    message: 'Turno deve ser: MANHÃ, TARDE, NOITE ou MADRUGADA',
})
    .optional()
    .nullable();
const dietaSchema = z.string()
    .trim()
    .min(1, 'Nome da dieta é obrigatório')
    .optional()
    .nullable();
export class DataValidationService {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
    }
    /**
     * Validate and cleanse raw desvio carregamento data
     */
    async validateDesvioData(rawData, context) {
        const errors = [];
        const warnings = [];
        try {
            // Step 1: Validate required fields presence
            const requiredFieldsResult = this.validateRequiredFields(rawData);
            errors.push(...requiredFieldsResult.errors);
            warnings.push(...requiredFieldsResult.warnings);
            if (errors.some(e => e.severity === 'critical')) {
                return {
                    isValid: false,
                    errors,
                    warnings,
                    severity: 'critical',
                };
            }
            // Step 2: Validate and transform individual fields
            const fieldValidationResult = await this.validateFields(rawData, context);
            errors.push(...fieldValidationResult.errors);
            warnings.push(...fieldValidationResult.warnings);
            if (errors.length > 0) {
                return {
                    isValid: false,
                    errors,
                    warnings,
                    severity: errors.some(e => e.severity === 'critical') ? 'critical' : 'errors',
                };
            }
            // Step 3: Create cleaned data object
            const cleanedData = await this.createCleanedData(rawData, fieldValidationResult.cleanedFields);
            // Step 4: Business rule validation
            const businessRulesResult = this.validateBusinessRules(cleanedData, context);
            errors.push(...businessRulesResult.errors);
            warnings.push(...businessRulesResult.warnings);
            const severity = errors.length > 0 ? 'errors' :
                warnings.length > 0 ? 'warnings' : 'clean';
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                cleanedData: errors.length === 0 ? cleanedData : undefined,
                severity,
            };
        }
        catch (error) {
            return {
                isValid: false,
                errors: [{
                        field: 'general',
                        code: 'VALIDATION_ERROR',
                        message: `Erro inesperado na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                        severity: 'critical',
                    }],
                warnings: [],
                severity: 'critical',
            };
        }
    }
    /**
     * Validate presence of required fields
     */
    validateRequiredFields(rawData) {
        const errors = [];
        const warnings = [];
        const requiredFields = [
            { field: 'data', value: rawData.data, name: 'Data' },
            { field: 'equipamento', value: rawData.equipamento, name: 'Equipamento' },
            { field: 'kg_planejado', value: rawData.kg_planejado, name: 'Peso Planejado' },
            { field: 'kg_real', value: rawData.kg_real, name: 'Peso Real' },
        ];
        // Check for curral or vagao (at least one required)
        if (!rawData.curral && !rawData.vagao) {
            errors.push({
                field: 'curral_vagao',
                code: 'MISSING_REQUIRED',
                message: 'Código do curral ou vagão é obrigatório',
                severity: 'critical',
            });
        }
        for (const { field, value, name } of requiredFields) {
            if (value === undefined || value === null || value === '') {
                errors.push({
                    field,
                    code: 'MISSING_REQUIRED',
                    message: `${name} é obrigatório`,
                    severity: 'critical',
                    originalValue: value,
                });
            }
        }
        return { errors, warnings };
    }
    /**
     * Validate and transform individual fields using Zod schemas
     */
    async validateFields(rawData, context) {
        const errors = [];
        const warnings = [];
        const cleanedFields = {};
        // Validate date
        try {
            const validatedDate = dateSchema.parse(rawData.data);
            // Check for future dates
            if (!this.config.allowFutureDates && validatedDate > context.processingDate) {
                const daysDiff = Math.ceil((validatedDate.getTime() - context.processingDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff > this.config.maxDaysInFuture) {
                    errors.push({
                        field: 'data',
                        code: 'FUTURE_DATE',
                        message: `Data não pode ser ${daysDiff} dias no futuro`,
                        severity: 'error',
                        originalValue: rawData.data,
                    });
                }
                else {
                    warnings.push({
                        field: 'data',
                        code: 'FUTURE_DATE_WARNING',
                        message: `Data está no futuro (${daysDiff} dias)`,
                        originalValue: rawData.data,
                    });
                }
            }
            cleanedFields.data_ref = validatedDate;
        }
        catch (zodError) {
            errors.push({
                field: 'data',
                code: 'INVALID_DATE',
                message: zodError instanceof z.ZodError ? zodError.errors[0].message : 'Data inválida',
                severity: 'error',
                originalValue: rawData.data,
            });
        }
        // Validate equipment
        try {
            const validatedEquipment = equipmentSchema.parse(rawData.equipamento);
            cleanedFields.equipamento = validatedEquipment;
        }
        catch (zodError) {
            errors.push({
                field: 'equipamento',
                code: 'INVALID_EQUIPMENT',
                message: zodError instanceof z.ZodError ? zodError.errors[0].message : 'Equipamento inválido',
                severity: 'error',
                originalValue: rawData.equipamento,
            });
        }
        // Validate weights
        try {
            const validatedKgPlanejado = weightSchema.parse(rawData.kg_planejado);
            cleanedFields.kg_planejado = validatedKgPlanejado;
        }
        catch (zodError) {
            errors.push({
                field: 'kg_planejado',
                code: 'INVALID_WEIGHT',
                message: zodError instanceof z.ZodError ? zodError.errors[0].message : 'Peso planejado inválido',
                severity: 'error',
                originalValue: rawData.kg_planejado,
            });
        }
        try {
            const validatedKgReal = weightSchema.parse(rawData.kg_real);
            cleanedFields.kg_real = validatedKgReal;
        }
        catch (zodError) {
            errors.push({
                field: 'kg_real',
                code: 'INVALID_WEIGHT',
                message: zodError instanceof z.ZodError ? zodError.errors[0].message : 'Peso real inválido',
                severity: 'error',
                originalValue: rawData.kg_real,
            });
        }
        // Validate curral (prefer curral over vagao)
        try {
            if (rawData.curral) {
                const validatedCurral = curralSchema.parse(rawData.curral);
                cleanedFields.curral_codigo = validatedCurral;
            }
            else if (rawData.vagao) {
                const validatedVagao = vagaoSchema.parse(rawData.vagao);
                cleanedFields.curral_codigo = validatedVagao;
                warnings.push({
                    field: 'curral_codigo',
                    code: 'USING_VAGAO_AS_CURRAL',
                    message: 'Usando código do vagão como código do curral',
                    originalValue: rawData.vagao,
                    cleanedValue: validatedVagao,
                });
            }
        }
        catch (zodError) {
            errors.push({
                field: 'curral_codigo',
                code: 'INVALID_CURRAL',
                message: zodError instanceof z.ZodError ? zodError.errors[0].message : 'Código do curral/vagão inválido',
                severity: 'error',
                originalValue: rawData.curral || rawData.vagao,
            });
        }
        // Validate optional fields
        try {
            if (rawData.turno) {
                const validatedTurno = turnoSchema.parse(rawData.turno);
                cleanedFields.turno = validatedTurno;
            }
            else {
                cleanedFields.turno = null;
            }
        }
        catch (zodError) {
            warnings.push({
                field: 'turno',
                code: 'INVALID_TURNO',
                message: zodError instanceof z.ZodError ? zodError.errors[0].message : 'Turno inválido',
                originalValue: rawData.turno,
            });
            cleanedFields.turno = null;
        }
        try {
            if (rawData.dieta) {
                const validatedDieta = dietaSchema.parse(rawData.dieta);
                cleanedFields.dieta_nome = validatedDieta;
            }
            else {
                cleanedFields.dieta_nome = null;
            }
        }
        catch (zodError) {
            warnings.push({
                field: 'dieta_nome',
                code: 'INVALID_DIETA',
                message: zodError instanceof z.ZodError ? zodError.errors[0].message : 'Nome da dieta inválido',
                originalValue: rawData.dieta,
            });
            cleanedFields.dieta_nome = null;
        }
        return { errors, warnings, cleanedFields };
    }
    /**
     * Create cleaned data object with calculated fields
     */
    async createCleanedData(rawData, cleanedFields) {
        const kg_planejado = cleanedFields.kg_planejado;
        const kg_real = cleanedFields.kg_real;
        // Calculate deviations
        const desvio_kg = kg_real - kg_planejado;
        const desvio_pct = kg_planejado > 0 ? (desvio_kg / kg_planejado) * 100 : 0;
        // Generate natural key for uniqueness
        const naturalKey = this.generateNaturalKey(cleanedFields);
        return {
            data_ref: cleanedFields.data_ref,
            turno: cleanedFields.turno,
            equipamento: cleanedFields.equipamento,
            curral_codigo: cleanedFields.curral_codigo,
            dieta_nome: cleanedFields.dieta_nome,
            kg_planejado,
            kg_real,
            desvio_kg: Math.round(desvio_kg * 100) / 100, // Round to 2 decimal places
            desvio_pct: Math.round(desvio_pct * 100) / 100, // Round to 2 decimal places
            natural_key: naturalKey,
        };
    }
    /**
     * Validate business rules
     */
    validateBusinessRules(data, context) {
        const errors = [];
        const warnings = [];
        // Check for extreme deviations
        const extremeDeviationThreshold = 50; // 50%
        if (Math.abs(data.desvio_pct) > extremeDeviationThreshold) {
            warnings.push({
                field: 'desvio_pct',
                code: 'EXTREME_DEVIATION',
                message: `Desvio muito alto: ${data.desvio_pct.toFixed(1)}%`,
                originalValue: data.desvio_pct,
            });
        }
        // Check for zero planned weight
        if (data.kg_planejado === 0) {
            warnings.push({
                field: 'kg_planejado',
                code: 'ZERO_PLANNED_WEIGHT',
                message: 'Peso planejado é zero',
                originalValue: data.kg_planejado,
            });
        }
        // Check for very small weights
        const minReasonableWeight = 1; // 1kg
        if (data.kg_planejado < minReasonableWeight || data.kg_real < minReasonableWeight) {
            warnings.push({
                field: 'weights',
                code: 'VERY_SMALL_WEIGHT',
                message: `Peso muito pequeno: planejado=${data.kg_planejado}kg, real=${data.kg_real}kg`,
                originalValue: { kg_planejado: data.kg_planejado, kg_real: data.kg_real },
            });
        }
        return { errors, warnings };
    }
    /**
     * Generate a natural key for the record
     */
    generateNaturalKey(cleanedFields) {
        const date = cleanedFields.data_ref instanceof Date
            ? cleanedFields.data_ref.toISOString().split('T')[0]
            : cleanedFields.data_ref;
        const parts = [
            date,
            cleanedFields.equipamento,
            cleanedFields.curral_codigo,
            cleanedFields.turno || 'NULL',
        ];
        return parts.join('|');
    }
    /**
     * Update validation configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Get current validation configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Batch validate multiple records
     */
    async validateBatch(rawDataList, context) {
        const results = [];
        const summary = { total: 0, valid: 0, withWarnings: 0, withErrors: 0, critical: 0 };
        for (const rawData of rawDataList) {
            const result = await this.validateDesvioData(rawData, context);
            results.push(result);
            summary.total++;
            switch (result.severity) {
                case 'clean':
                    summary.valid++;
                    break;
                case 'warnings':
                    summary.withWarnings++;
                    break;
                case 'errors':
                    summary.withErrors++;
                    break;
                case 'critical':
                    summary.critical++;
                    break;
            }
        }
        return { results, summary };
    }
}
