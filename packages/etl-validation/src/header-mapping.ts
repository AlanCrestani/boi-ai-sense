/**
 * Flexible header mapping for CSV files
 * Supports variant header names, aliases, and missing field handling
 */

export interface HeaderMapping {
  /** Canonical field name */
  canonical: string;
  /** Required field flag */
  required?: boolean;
  /** Alternative header names that map to this field */
  aliases?: string[];
  /** Data type for validation */
  type?: 'string' | 'number' | 'date' | 'boolean';
  /** Default value if field is missing */
  defaultValue?: any;
  /** Custom transformation function */
  transform?: (value: string) => any;
  /** Validation function */
  validate?: (value: any) => boolean | string;
}

export interface HeaderMappingConfig {
  /** Field mappings */
  fields: Record<string, HeaderMapping>;
  /** Case-sensitive matching */
  caseSensitive?: boolean;
  /** Strict mode - fail if unknown headers found */
  strict?: boolean;
  /** Prefix to remove from headers (e.g., "col_") */
  removePrefix?: string;
  /** Suffix to remove from headers (e.g., "_data") */
  removeSuffix?: string;
}

export interface MappedRow {
  /** Original raw data */
  raw: string[];
  /** Original headers */
  headers: string[];
  /** Mapped data with canonical field names */
  mapped: Record<string, any>;
  /** Fields that were missing from input */
  missingFields: string[];
  /** Fields that couldn't be mapped */
  unmappedFields: string[];
  /** Validation errors */
  errors: FieldError[];
  /** Row number */
  rowNumber: number;
}

export interface FieldError {
  field: string;
  message: string;
  value?: any;
}

export interface MappingAnalysis {
  /** Headers found in CSV */
  detectedHeaders: string[];
  /** Successfully mapped headers */
  mappedHeaders: string[];
  /** Headers that couldn't be mapped */
  unmappedHeaders: string[];
  /** Required fields that are missing */
  missingRequired: string[];
  /** Mapping confidence score (0-1) */
  confidence: number;
  /** Suggested header mappings */
  suggestions: Array<{
    csvHeader: string;
    suggestedCanonical: string;
    similarity: number;
  }>;
}

/**
 * Header Mapper class for flexible CSV header mapping
 */
export class HeaderMapper {
  private config: Required<HeaderMappingConfig>;
  private headerMap: Map<string, string> = new Map();
  private analysis: MappingAnalysis | null = null;

  constructor(config: HeaderMappingConfig) {
    this.config = {
      caseSensitive: false,
      strict: false,
      removePrefix: '',
      removeSuffix: '',
      ...config,
    };
  }

  /**
   * Analyze headers and create mapping
   */
  analyzeHeaders(headers: string[]): MappingAnalysis {
    const cleanHeaders = headers.map(h => this.cleanHeader(h));
    const mappedHeaders: string[] = [];
    const unmappedHeaders: string[] = [];
    const missingRequired: string[] = [];
    const suggestions: MappingAnalysis['suggestions'] = [];

    this.headerMap.clear();

    // Try to map each header
    for (let i = 0; i < headers.length; i++) {
      const originalHeader = headers[i];
      const cleanHeader = cleanHeaders[i];
      const mapped = this.findMapping(cleanHeader);

      if (mapped) {
        this.headerMap.set(originalHeader, mapped);
        mappedHeaders.push(originalHeader);
      } else {
        unmappedHeaders.push(originalHeader);
        // Find suggestions
        const suggestion = this.findBestSuggestion(cleanHeader);
        if (suggestion) {
          suggestions.push({
            csvHeader: originalHeader,
            suggestedCanonical: suggestion.canonical,
            similarity: suggestion.similarity,
          });
        }
      }
    }

    // Check for missing required fields
    for (const [canonical, mapping] of Object.entries(this.config.fields)) {
      if (mapping.required && !Array.from(this.headerMap.values()).includes(canonical)) {
        missingRequired.push(canonical);
      }
    }

    // Calculate confidence
    const mappedCount = mappedHeaders.length;
    const totalRequired = Object.values(this.config.fields).filter(f => f.required).length;
    const requiredMapped = totalRequired - missingRequired.length;
    const confidence = totalRequired > 0 ? requiredMapped / totalRequired : mappedCount / headers.length;

    this.analysis = {
      detectedHeaders: headers,
      mappedHeaders,
      unmappedHeaders,
      missingRequired,
      confidence,
      suggestions,
    };

    return this.analysis;
  }

  /**
   * Map a row using the current header mapping
   */
  mapRow(rawData: string[], headers: string[], rowNumber: number): MappedRow {
    if (!this.analysis) {
      this.analyzeHeaders(headers);
    }

    const mapped: Record<string, any> = {};
    const missingFields: string[] = [];
    const unmappedFields: string[] = [];
    const errors: FieldError[] = [];

    // Map each field
    for (const [canonical, fieldConfig] of Object.entries(this.config.fields)) {
      let value: any = undefined;
      let found = false;

      // Find value in raw data
      for (let i = 0; i < headers.length; i++) {
        const mappedCanonical = this.headerMap.get(headers[i]);
        if (mappedCanonical === canonical) {
          value = rawData[i] || '';
          found = true;
          break;
        }
      }

      if (!found) {
        if (fieldConfig.required && fieldConfig.defaultValue === undefined) {
          missingFields.push(canonical);
          errors.push({
            field: canonical,
            message: `Required field '${canonical}' is missing`,
          });
        } else if (fieldConfig.defaultValue !== undefined) {
          value = fieldConfig.defaultValue;
        }
      }

      // Transform value
      if (value !== undefined && fieldConfig.transform) {
        try {
          value = fieldConfig.transform(value);
        } catch (error) {
          errors.push({
            field: canonical,
            message: `Transformation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            value,
          });
        }
      }

      // Type conversion
      if (value !== undefined && fieldConfig.type) {
        const converted = this.convertType(value, fieldConfig.type);
        if (converted.error) {
          errors.push({
            field: canonical,
            message: converted.error,
            value,
          });
        } else {
          value = converted.value;
        }
      }

      // Validation
      if (value !== undefined && fieldConfig.validate) {
        const validation = fieldConfig.validate(value);
        if (validation !== true) {
          errors.push({
            field: canonical,
            message: typeof validation === 'string' ? validation : `Validation failed for field '${canonical}'`,
            value,
          });
        }
      }

      mapped[canonical] = value;
    }

    // Track unmapped fields
    for (let i = 0; i < headers.length; i++) {
      if (!this.headerMap.has(headers[i])) {
        unmappedFields.push(headers[i]);
      }
    }

    return {
      raw: rawData,
      headers,
      mapped,
      missingFields,
      unmappedFields,
      errors,
      rowNumber,
    };
  }

  /**
   * Get current mapping analysis
   */
  getAnalysis(): MappingAnalysis | null {
    return this.analysis;
  }

  /**
   * Clean header name
   */
  private cleanHeader(header: string): string {
    let cleaned = header.trim();

    if (this.config.removePrefix && cleaned.startsWith(this.config.removePrefix)) {
      cleaned = cleaned.substring(this.config.removePrefix.length);
    }

    if (this.config.removeSuffix && cleaned.endsWith(this.config.removeSuffix)) {
      cleaned = cleaned.substring(0, cleaned.length - this.config.removeSuffix.length);
    }

    if (!this.config.caseSensitive) {
      cleaned = cleaned.toLowerCase();
    }

    return cleaned.trim();
  }

  /**
   * Find mapping for a header
   */
  private findMapping(cleanHeader: string): string | null {
    // Direct canonical match
    for (const [canonical, mapping] of Object.entries(this.config.fields)) {
      const canonicalToMatch = this.config.caseSensitive ? canonical : canonical.toLowerCase();
      if (cleanHeader === canonicalToMatch) {
        return canonical;
      }

      // Check aliases
      if (mapping.aliases) {
        for (const alias of mapping.aliases) {
          const aliasToMatch = this.config.caseSensitive ? alias : alias.toLowerCase();
          if (cleanHeader === aliasToMatch) {
            return canonical;
          }
        }
      }
    }

    return null;
  }

  /**
   * Find best suggestion for unmapped header
   */
  private findBestSuggestion(cleanHeader: string): { canonical: string; similarity: number } | null {
    let bestMatch: { canonical: string; similarity: number } | null = null;

    for (const [canonical, mapping] of Object.entries(this.config.fields)) {
      // Check canonical name
      const canonicalSimilarity = this.calculateSimilarity(cleanHeader, canonical.toLowerCase());
      if (canonicalSimilarity > 0.6 && (!bestMatch || canonicalSimilarity > bestMatch.similarity)) {
        bestMatch = { canonical, similarity: canonicalSimilarity };
      }

      // Check aliases
      if (mapping.aliases) {
        for (const alias of mapping.aliases) {
          const aliasSimilarity = this.calculateSimilarity(cleanHeader, alias.toLowerCase());
          if (aliasSimilarity > 0.6 && (!bestMatch || aliasSimilarity > bestMatch.similarity)) {
            bestMatch = { canonical, similarity: aliasSimilarity };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array.from({ length: str1.length + 1 }, () =>
      Array.from({ length: str2.length + 1 }, () => 0)
    );

    for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    const distance = matrix[str1.length][str2.length];
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  /**
   * Convert value to specified type
   */
  private convertType(value: any, type: HeaderMapping['type']): { value: any; error?: string } {
    if (value === null || value === undefined || value === '') {
      return { value: null };
    }

    try {
      switch (type) {
        case 'string':
          return { value: String(value) };

        case 'number':
          // Handle Brazilian decimal format (comma as decimal separator)
          let numberString = String(value);
          if (typeof value === 'string') {
            // Replace comma with dot for decimal parsing
            numberString = value.replace(',', '.');
          }
          const num = Number(numberString);
          if (isNaN(num)) {
            return { value, error: `Cannot convert '${value}' to number` };
          }
          return { value: num };

        case 'boolean':
          const str = String(value).toLowerCase().trim();
          if (['true', '1', 'yes', 'sim', 'verdadeiro'].includes(str)) {
            return { value: true };
          } else if (['false', '0', 'no', 'não', 'falso'].includes(str)) {
            return { value: false };
          } else {
            return { value, error: `Cannot convert '${value}' to boolean` };
          }

        case 'date':
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return { value, error: `Cannot convert '${value}' to date` };
          }
          return { value: date };

        default:
          return { value };
      }
    } catch (error) {
      return { value, error: `Type conversion error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}