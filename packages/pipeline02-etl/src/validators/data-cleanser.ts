/**
 * Data Cleansing for Pipeline 02 - Desvio de Carregamento
 * Cleans and normalizes raw CSV data before validation
 */

// import { MappedRow } from '@conecta-boi/etl-validation/src/index.js';

// Mock temporário para compilação
interface MappedRow {
  raw: string[];
  rowNumber: number;
  mapped: Record<string, any>;
  errors: any[];
}

export interface CleansingResult {
  cleaned: Record<string, any>;
  warnings: CleansingWarning[];
}

export interface CleansingWarning {
  field: string;
  message: string;
  originalValue: any;
  cleanedValue: any;
}

/**
 * Data Cleanser for Pipeline 02
 */
export class Pipeline02DataCleanser {
  /**
   * Clean and normalize raw CSV row data
   */
  cleanRow(mappedRow: MappedRow): CleansingResult {
    const warnings: CleansingWarning[] = [];
    const cleaned: Record<string, any> = {};

    // Clean data_ref
    const cleanedDataRef = this.cleanDateField(
      mappedRow.mapped.data_ref,
      'data_ref',
      warnings
    );
    if (cleanedDataRef !== null) {
      cleaned.data_ref = cleanedDataRef;
    }

    // Clean turno
    const cleanedTurno = this.cleanTextField(
      mappedRow.mapped.turno,
      'turno',
      warnings,
      { toUpperCase: true, maxLength: 50 }
    );
    cleaned.turno = cleanedTurno;

    // Clean equipamento (critical field)
    const cleanedEquipamento = this.cleanEquipamentoField(
      mappedRow.mapped.equipamento,
      warnings
    );
    if (cleanedEquipamento !== null) {
      cleaned.equipamento = cleanedEquipamento;
    }

    // Clean curral_codigo
    const cleanedCurralCodigo = this.cleanTextField(
      mappedRow.mapped.curral_codigo,
      'curral_codigo',
      warnings,
      { toUpperCase: true, maxLength: 100 }
    );
    if (cleanedCurralCodigo !== null) {
      cleaned.curral_codigo = cleanedCurralCodigo;
    }

    // Clean dieta_nome
    const cleanedDietaNome = this.cleanTextField(
      mappedRow.mapped.dieta_nome,
      'dieta_nome',
      warnings,
      { maxLength: 200 }
    );
    cleaned.dieta_nome = cleanedDietaNome;

    // Clean numeric fields
    const cleanedKgPlanejado = this.cleanNumericField(
      mappedRow.mapped.kg_planejado,
      'kg_planejado',
      warnings
    );
    if (cleanedKgPlanejado !== null) {
      cleaned.kg_planejado = cleanedKgPlanejado;
    }

    const cleanedKgReal = this.cleanNumericField(
      mappedRow.mapped.kg_real,
      'kg_real',
      warnings
    );
    if (cleanedKgReal !== null) {
      cleaned.kg_real = cleanedKgReal;
    }

    const cleanedDesvioKg = this.cleanNumericField(
      mappedRow.mapped.desvio_kg,
      'desvio_kg',
      warnings,
      { allowNegative: true }
    );
    cleaned.desvio_kg = cleanedDesvioKg;

    const cleanedDesvioPct = this.cleanNumericField(
      mappedRow.mapped.desvio_pct,
      'desvio_pct',
      warnings,
      { allowNegative: true }
    );
    cleaned.desvio_pct = cleanedDesvioPct;

    return { cleaned, warnings };
  }

  /**
   * Clean date field with various format support
   */
  private cleanDateField(
    value: any,
    fieldName: string,
    warnings: CleansingWarning[]
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const stringValue = String(value).trim();

    // Try different date formats
    const dateFormats = [
      // ISO format
      /^\d{4}-\d{2}-\d{2}$/,
      // Brazilian format DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // Brazilian format DD-MM-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      // US format MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    ];

    // Check if it's already ISO format
    if (dateFormats[0].test(stringValue)) {
      const date = new Date(stringValue);
      if (!isNaN(date.getTime())) {
        return stringValue;
      }
    }

    // Try Brazilian DD/MM/YYYY or DD-MM-YYYY
    const brazilianMatch = stringValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (brazilianMatch) {
      const [, day, month, year] = brazilianMatch;
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const date = new Date(isoDate);

      if (!isNaN(date.getTime())) {
        warnings.push({
          field: fieldName,
          message: 'Data convertida do formato brasileiro para ISO',
          originalValue: value,
          cleanedValue: isoDate,
        });
        return isoDate;
      }
    }

    // Try to parse as Date and convert to ISO
    const parsedDate = new Date(stringValue);
    if (!isNaN(parsedDate.getTime())) {
      const isoDate = parsedDate.toISOString().split('T')[0];
      warnings.push({
        field: fieldName,
        message: 'Data normalizada para formato ISO',
        originalValue: value,
        cleanedValue: isoDate,
      });
      return isoDate;
    }

    return null;
  }

  /**
   * Clean text field with normalization options
   */
  private cleanTextField(
    value: any,
    fieldName: string,
    warnings: CleansingWarning[],
    options: {
      toUpperCase?: boolean;
      toLowerCase?: boolean;
      maxLength?: number;
      removeSpecialChars?: boolean;
    } = {}
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    let cleaned = String(value).trim();
    const original = cleaned;

    // Apply transformations
    if (options.toUpperCase) {
      cleaned = cleaned.toUpperCase();
    } else if (options.toLowerCase) {
      cleaned = cleaned.toLowerCase();
    }

    // Remove special characters if requested
    if (options.removeSpecialChars) {
      cleaned = cleaned.replace(/[^\w\s\-]/g, '');
    }

    // Truncate if too long
    if (options.maxLength && cleaned.length > options.maxLength) {
      cleaned = cleaned.substring(0, options.maxLength);
      warnings.push({
        field: fieldName,
        message: `Texto truncado para ${options.maxLength} caracteres`,
        originalValue: value,
        cleanedValue: cleaned,
      });
    }

    // Add warning if value was modified
    if (cleaned !== original) {
      warnings.push({
        field: fieldName,
        message: 'Texto normalizado',
        originalValue: value,
        cleanedValue: cleaned,
      });
    }

    return cleaned || null;
  }

  /**
   * Clean equipamento field with specific business logic
   */
  private cleanEquipamentoField(
    value: any,
    warnings: CleansingWarning[]
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    let cleaned = String(value).trim().toUpperCase();
    const original = cleaned;

    // Normalize common variations
    const equipamentoMappings: Record<string, string> = {
      'BAHMAN': 'BAHMAN',
      'BAHMANN': 'BAHMAN',
      'BAMAN': 'BAHMAN',
      'BAHMAM': 'BAHMAN',
      'SILOKING': 'SILOKING',
      'SILO KING': 'SILOKING',
      'SILO-KING': 'SILOKING',
      'SILOK ING': 'SILOKING',
    };

    // Check for direct match or mapping
    if (equipamentoMappings[cleaned]) {
      const normalized = equipamentoMappings[cleaned];

      if (normalized !== original) {
        warnings.push({
          field: 'equipamento',
          message: `Equipamento normalizado de "${original}" para "${normalized}"`,
          originalValue: value,
          cleanedValue: normalized,
        });
      }

      return normalized;
    }

    // Check for partial matches
    for (const [pattern, normalized] of Object.entries(equipamentoMappings)) {
      if (cleaned.includes(pattern) || pattern.includes(cleaned)) {
        warnings.push({
          field: 'equipamento',
          message: `Equipamento corrigido de "${original}" para "${normalized}" (correspondência parcial)`,
          originalValue: value,
          cleanedValue: normalized,
        });
        return normalized;
      }
    }

    return cleaned;
  }

  /**
   * Clean numeric field with Brazilian format support
   */
  private cleanNumericField(
    value: any,
    fieldName: string,
    warnings: CleansingWarning[],
    options: {
      allowNegative?: boolean;
      maxValue?: number;
      minValue?: number;
    } = {}
  ): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // If already a number
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        return null;
      }
      return value;
    }

    // Convert string to number
    let stringValue = String(value).trim();
    const originalValue = stringValue;

    // Remove currency symbols and thousand separators
    stringValue = stringValue.replace(/[R$\s]/g, '');

    // Handle Brazilian decimal format (comma as decimal separator)
    const lastCommaIndex = stringValue.lastIndexOf(',');
    const lastDotIndex = stringValue.lastIndexOf('.');

    if (lastCommaIndex > lastDotIndex) {
      // Brazilian format: 1.234,56 or 1234,56
      // Remove all dots (thousand separators) and replace last comma with dot
      const beforeComma = stringValue.substring(0, lastCommaIndex).replace(/\./g, '');
      const afterComma = stringValue.substring(lastCommaIndex + 1);
      stringValue = beforeComma + '.' + afterComma;
    } else if (lastCommaIndex !== -1 && lastDotIndex === -1) {
      // Only comma exists: 1234,56
      stringValue = stringValue.replace(',', '.');
    }

    const numericValue = parseFloat(stringValue);

    if (isNaN(numericValue) || !isFinite(numericValue)) {
      return null;
    }

    // Apply constraints
    if (!options.allowNegative && numericValue < 0) {
      warnings.push({
        field: fieldName,
        message: 'Valor negativo convertido para 0',
        originalValue: value,
        cleanedValue: 0,
      });
      return 0;
    }

    if (options.maxValue && numericValue > options.maxValue) {
      warnings.push({
        field: fieldName,
        message: `Valor truncado para máximo permitido (${options.maxValue})`,
        originalValue: value,
        cleanedValue: options.maxValue,
      });
      return options.maxValue;
    }

    if (options.minValue && numericValue < options.minValue) {
      warnings.push({
        field: fieldName,
        message: `Valor ajustado para mínimo permitido (${options.minValue})`,
        originalValue: value,
        cleanedValue: options.minValue,
      });
      return options.minValue;
    }

    // Add warning if value was modified during cleaning
    if (originalValue !== stringValue || originalValue !== numericValue.toString()) {
      warnings.push({
        field: fieldName,
        message: 'Formato numérico normalizado',
        originalValue: value,
        cleanedValue: numericValue,
      });
    }

    return numericValue;
  }
}