/**
 * Business Rules and Validation for Pipeline 04 - Trato por Curral ETL
 * Validates feeding treatment data per pen/corral
 */

import { z } from 'zod';

/**
 * Valid shifts for feeding treatments
 */
export const VALID_TURNOS = ['MANHÃ', 'TARDE', 'NOITE'] as const;

/**
 * Valid treatment types
 */
export const VALID_TIPOS_TRATO = ['RAÇÃO', 'VOLUMOSO', 'MINERAL', 'MEDICAMENTO'] as const;

/**
 * Raw data schema for Pipeline 04 (before processing)
 */
export const pipeline04RawDataSchema = z.object({
  data_ref: z.string()
    .nonempty('Data de referência é obrigatória')
    .refine((dateStr) => {
      try {
        const date = new Date(dateStr);
        const now = new Date();
        return date <= now && !isNaN(date.getTime());
      } catch {
        return false;
      }
    }, 'Data de referência inválida ou futura'),

  hora: z.string()
    .nonempty('Hora é obrigatória')
    .refine((timeStr) => {
      const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timePattern.test(timeStr);
    }, 'Formato de hora inválido (HH:MM)'),

  turno: z.string()
    .nonempty('Turno é obrigatório')
    .transform((val) => val?.trim().toUpperCase())
    .refine((val) => VALID_TURNOS.includes(val as any),
      `Turno deve ser um dos seguintes: ${VALID_TURNOS.join(', ')}`),

  curral_codigo: z.string()
    .nonempty('Código do curral é obrigatório')
    .transform((val) => val?.trim().toUpperCase()),

  trateiro: z.string()
    .nonempty('Nome do trateiro é obrigatório')
    .transform((val) => val?.trim()),

  dieta_nome: z.string()
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  tipo_trato: z.string()
    .optional()
    .transform((val) => val?.trim().toUpperCase() || 'RAÇÃO')
    .refine((val) => VALID_TIPOS_TRATO.includes(val as any),
      `Tipo de trato deve ser um dos seguintes: ${VALID_TIPOS_TRATO.join(', ')}`),

  quantidade_kg: z.number()
    .positive('Quantidade deve ser positiva')
    .max(10000, 'Quantidade muito alta (máximo 10.000kg)'),

  quantidade_cabecas: z.number()
    .optional()
    .nullable()
    .refine((val) => val === null || val === undefined || val > 0,
      'Quantidade de cabeças deve ser positiva'),

  observacoes: z.string()
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

/**
 * Processed data schema (after calculations and transformations)
 */
export const pipeline04ProcessedSchema = z.object({
  data_ref: z.date(),
  hora: z.string(),
  datetime_trato: z.date(),
  turno: z.enum(VALID_TURNOS),
  curral_codigo: z.string(),
  trateiro: z.string(),
  dieta_nome: z.string().nullable(),
  tipo_trato: z.enum(VALID_TIPOS_TRATO),
  quantidade_kg: z.number(),
  quantidade_cabecas: z.number().nullable(),
  observacoes: z.string().nullable(),
  natural_key: z.string(),
});

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
export class Pipeline04BusinessValidator {
  /**
   * Validate raw data against schema
   */
  validateRawData(data: any): ValidationResult {
    try {
      const validatedData = pipeline04RawDataSchema.parse(data);
      return {
        isValid: true,
        data: validatedData,
        errors: [],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          value: 'input' in err ? err.input : undefined,
          code: err.code,
        }));
        return {
          isValid: false,
          errors,
        };
      }
      return {
        isValid: false,
        errors: [{ field: 'unknown', message: 'Erro desconhecido de validação', value: data }],
      };
    }
  }

  /**
   * Process and transform validated data
   */
  processData(data: Pipeline04RawData, organizationId: string): Pipeline04ProcessedData {
    // Parse date and time
    const dataRef = new Date(data.data_ref);

    // Create datetime combining date and time
    const [hours, minutes] = data.hora.split(':').map(Number);
    const datetimeTrato = new Date(dataRef);
    datetimeTrato.setHours(hours, minutes, 0, 0);

    // Generate natural key for idempotency
    const naturalKey = this.generateNaturalKey(
      organizationId,
      dataRef,
      data.hora,
      data.curral_codigo,
      data.trateiro,
      data.tipo_trato
    );

    return {
      data_ref: dataRef,
      hora: data.hora,
      datetime_trato: datetimeTrato,
      turno: data.turno as (typeof VALID_TURNOS)[number],
      curral_codigo: data.curral_codigo,
      trateiro: data.trateiro,
      dieta_nome: data.dieta_nome,
      tipo_trato: data.tipo_trato as (typeof VALID_TIPOS_TRATO)[number],
      quantidade_kg: data.quantidade_kg,
      quantidade_cabecas: data.quantidade_cabecas ?? null,
      observacoes: data.observacoes,
      natural_key: naturalKey,
    };
  }

  /**
   * Validate business logic and rules
   */
  validateBusinessLogic(data: Pipeline04ProcessedData): ValidationResult {
    const errors: ValidationError[] = [];

    // Check for reasonable feeding times
    const hour = data.datetime_trato.getHours();
    if (hour < 5 || hour > 22) {
      errors.push({
        field: 'hora',
        message: 'Horário de trato suspeito (fora do horário normal: 05:00-22:00)',
        value: data.hora,
        code: 'SUSPICIOUS_TIME',
      });
    }

    // Check turno consistency with time
    const turnoExpected = this.getTurnoByHour(hour);
    if (data.turno !== turnoExpected) {
      errors.push({
        field: 'turno',
        message: `Turno inconsistente com horário. Esperado: ${turnoExpected}, Informado: ${data.turno}`,
        value: data.turno,
        code: 'INCONSISTENT_SHIFT',
      });
    }

    // Check for excessive quantities
    if (data.quantidade_kg > 5000) {
      errors.push({
        field: 'quantidade_kg',
        message: 'Quantidade muito alta para um único trato',
        value: data.quantidade_kg,
        code: 'EXCESSIVE_QUANTITY',
      });
    }

    // Check for very low quantities
    if (data.quantidade_kg < 10) {
      errors.push({
        field: 'quantidade_kg',
        message: 'Quantidade muito baixa (possivelmente erro de digitação)',
        value: data.quantidade_kg,
        code: 'LOW_QUANTITY',
      });
    }

    // Check future date (should have been caught earlier, but double-check)
    const now = new Date();
    if (data.datetime_trato > now) {
      errors.push({
        field: 'datetime_trato',
        message: 'Data/hora do trato não pode ser futura',
        value: data.datetime_trato,
        code: 'FUTURE_DATETIME',
      });
    }

    // Check very old dates (more than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (data.data_ref < oneYearAgo) {
      errors.push({
        field: 'data_ref',
        message: 'Data de referência muito antiga (>1 ano)',
        value: data.data_ref,
        code: 'OLD_DATE',
      });
    }

    return {
      isValid: errors.filter(e => e.code !== 'SUSPICIOUS_TIME' && e.code !== 'LOW_QUANTITY').length === 0,
      errors,
    };
  }

  /**
   * Generate natural key for idempotent operations
   */
  private generateNaturalKey(
    organizationId: string,
    dataRef: Date,
    hora: string,
    curralCodigo: string,
    trateiro: string,
    tipoTrato: string
  ): string {
    const dateStr = dataRef.toISOString().split('T')[0];
    const orgPrefix = organizationId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const curralKey = curralCodigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const trateiroKey = trateiro.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const tipoKey = tipoTrato.toUpperCase();

    return `${orgPrefix}_${dateStr}_${hora}_${curralKey}_${trateiroKey}_${tipoKey}`;
  }

  /**
   * Determine expected shift based on hour
   */
  private getTurnoByHour(hour: number): string {
    if (hour >= 5 && hour < 12) return 'MANHÃ';
    if (hour >= 12 && hour < 18) return 'TARDE';
    return 'NOITE';
  }
}