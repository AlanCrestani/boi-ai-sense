/**
 * Referential Integrity Service for Pipeline 04
 * Validates and maps codes to dimension tables with pending entry support
 */

export interface ReferentialCheckResult {
  isValid: boolean;
  mappedDimensions: MappedDimensions;
  pendingEntries: PendingEntry[];
  errors: ReferentialError[];
  warnings: ReferentialWarning[];
}

export interface MappedDimensions {
  curralId: string | null;
  dietaId: string | null;
  trateiroId: string; // Always resolved (auto-created)
  organizationId: string;
}

export interface ReferentialError {
  field: string;
  code: string;
  message: string;
  originalValue: any;
  severity: 'error' | 'warning';
}

export interface ReferentialWarning {
  field: string;
  message: string;
  recommendation: string;
}

export interface PendingEntry {
  id: string;
  type: 'curral' | 'dieta';
  code: string;
  organizationId: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolvedValue?: string;
  notes?: string;
}

export interface DimensionLookupService {
  lookupCurralId(codigo: string, organizationId: string): Promise<string | null>;
  lookupDietaId(nome: string | null, organizationId: string): Promise<string | null>;
  lookupTrateiroId(nome: string, organizationId: string): Promise<string>;
  createPendingCurral(codigo: string, organizationId: string): Promise<string>;
  createPendingDieta(nome: string, organizationId: string): Promise<string>;
  getPendingEntries(organizationId: string): Promise<PendingEntry[]>;
  resolvePendingEntry(pendingId: string, resolvedValue: string, resolvedBy: string): Promise<void>;
}

/**
 * Service for checking referential integrity with dimension tables
 */
export class ReferentialIntegrityService {
  constructor(private dimensionService: DimensionLookupService) {}

  /**
   * Check referential integrity for Pipeline 04 feeding treatment data
   */
  async checkReferentialIntegrity(
    data: {
      curral_codigo: string;
      dieta_nome: string | null;
      trateiro: string;
    },
    organizationId: string
  ): Promise<ReferentialCheckResult> {
    const errors: ReferentialError[] = [];
    const warnings: ReferentialWarning[] = [];
    const pendingEntries: PendingEntry[] = [];

    // Initialize mapped dimensions
    const mappedDimensions: MappedDimensions = {
      curralId: null,
      dietaId: null,
      trateiroId: '',
      organizationId,
    };

    // 1. Check Curral dimension
    try {
      const curralId = await this.dimensionService.lookupCurralId(data.curral_codigo, organizationId);

      if (curralId) {
        mappedDimensions.curralId = curralId;
      } else {
        // Curral not found - create pending entry
        const pendingId = await this.dimensionService.createPendingCurral(data.curral_codigo, organizationId);

        pendingEntries.push({
          id: pendingId,
          type: 'curral',
          code: data.curral_codigo,
          organizationId,
          status: 'pending',
          createdAt: new Date(),
        });

        errors.push({
          field: 'curral_codigo',
          code: 'CURRAL_NOT_FOUND',
          message: `Curral '${data.curral_codigo}' não encontrado nas dimensões`,
          originalValue: data.curral_codigo,
          severity: 'warning', // Warning because we can create pending entry
        });

        warnings.push({
          field: 'curral_codigo',
          message: `Curral '${data.curral_codigo}' será criado como entrada pendente`,
          recommendation: 'Cadastre o curral no sistema ou resolva a entrada pendente via interface',
        });
      }
    } catch (error) {
      errors.push({
        field: 'curral_codigo',
        code: 'CURRAL_LOOKUP_ERROR',
        message: `Erro ao verificar curral: ${error instanceof Error ? error.message : error}`,
        originalValue: data.curral_codigo,
        severity: 'error',
      });
    }

    // 2. Check Dieta dimension (optional)
    if (data.dieta_nome) {
      try {
        const dietaId = await this.dimensionService.lookupDietaId(data.dieta_nome, organizationId);

        if (dietaId) {
          mappedDimensions.dietaId = dietaId;
        } else {
          // Dieta not found - create pending entry
          const pendingId = await this.dimensionService.createPendingDieta(data.dieta_nome, organizationId);

          pendingEntries.push({
            id: pendingId,
            type: 'dieta',
            code: data.dieta_nome,
            organizationId,
            status: 'pending',
            createdAt: new Date(),
          });

          errors.push({
            field: 'dieta_nome',
            code: 'DIETA_NOT_FOUND',
            message: `Dieta '${data.dieta_nome}' não encontrada nas dimensões`,
            originalValue: data.dieta_nome,
            severity: 'warning',
          });

          warnings.push({
            field: 'dieta_nome',
            message: `Dieta '${data.dieta_nome}' será criada como entrada pendente`,
            recommendation: 'Cadastre a dieta no sistema ou resolva a entrada pendente via interface',
          });
        }
      } catch (error) {
        errors.push({
          field: 'dieta_nome',
          code: 'DIETA_LOOKUP_ERROR',
          message: `Erro ao verificar dieta: ${error instanceof Error ? error.message : error}`,
          originalValue: data.dieta_nome,
          severity: 'error',
        });
      }
    } else {
      // Null dieta is allowed
      mappedDimensions.dietaId = null;
    }

    // 3. Check/Create Trateiro dimension (always resolves)
    try {
      const trateiroId = await this.dimensionService.lookupTrateiroId(data.trateiro, organizationId);
      mappedDimensions.trateiroId = trateiroId;
    } catch (error) {
      errors.push({
        field: 'trateiro',
        code: 'TRATEIRO_LOOKUP_ERROR',
        message: `Erro ao verificar/criar trateiro: ${error instanceof Error ? error.message : error}`,
        originalValue: data.trateiro,
        severity: 'error',
      });
    }

    // 4. Additional referential integrity checks
    await this.performAdditionalChecks(data, organizationId, errors, warnings);

    // Determine if the overall check is valid
    const hasErrorSeverityIssues = errors.some(e => e.severity === 'error');
    const isValid = !hasErrorSeverityIssues;

    return {
      isValid,
      mappedDimensions,
      pendingEntries,
      errors,
      warnings,
    };
  }

  /**
   * Perform additional business logic checks
   */
  private async performAdditionalChecks(
    data: {
      curral_codigo: string;
      dieta_nome: string | null;
      trateiro: string;
    },
    organizationId: string,
    errors: ReferentialError[],
    warnings: ReferentialWarning[]
  ): Promise<void> {
    // Check for suspicious curral codes
    if (this.isSuspiciousCurralCode(data.curral_codigo)) {
      warnings.push({
        field: 'curral_codigo',
        message: 'Código de curral possui formato suspeito',
        recommendation: 'Verifique se o código está correto e segue o padrão organizacional',
      });
    }

    // Check for very long trateiro names
    if (data.trateiro.length > 100) {
      warnings.push({
        field: 'trateiro',
        message: 'Nome do trateiro muito longo',
        recommendation: 'Considere usar um nome mais conciso ou abreviação',
      });
    }

    // Check for potentially duplicate trateiro names
    if (this.isPotentiallyDuplicateTrateiro(data.trateiro)) {
      warnings.push({
        field: 'trateiro',
        message: 'Nome do trateiro pode ser duplicata',
        recommendation: 'Verifique se não há variações do mesmo nome cadastradas',
      });
    }
  }

  /**
   * Check if curral code looks suspicious
   */
  private isSuspiciousCurralCode(codigo: string): boolean {
    // Check for common suspicious patterns
    const suspiciousPatterns = [
      /^test/i,
      /^tmp/i,
      /^temp/i,
      /\d{10,}/, // Very long numbers
      /[^A-Za-z0-9\-]/,  // Special characters (except hyphen)
    ];

    return suspiciousPatterns.some(pattern => pattern.test(codigo));
  }

  /**
   * Check if trateiro name is potentially a duplicate
   */
  private isPotentiallyDuplicateTrateiro(nome: string): boolean {
    // Check for patterns that suggest it might be a duplicate
    const duplicatePatterns = [
      /\d+$/, // Ends with number (João Silva 2)
      /\(\d+\)/, // Contains number in parentheses
      /\s+jr\.?$/i, // Ends with Jr
      /\s+sr\.?$/i, // Ends with Sr
    ];

    return duplicatePatterns.some(pattern => pattern.test(nome));
  }

  /**
   * Get comprehensive referential integrity report
   */
  async getReferentialIntegrityReport(organizationId: string): Promise<{
    pendingEntries: PendingEntry[];
    summary: {
      totalPending: number;
      pendingCurrals: number;
      pendingDietas: number;
      oldestPending?: Date;
    };
  }> {
    const pendingEntries = await this.dimensionService.getPendingEntries(organizationId);

    const pendingCurrals = pendingEntries.filter(e => e.type === 'curral').length;
    const pendingDietas = pendingEntries.filter(e => e.type === 'dieta').length;
    const oldestPending = pendingEntries.length > 0
      ? new Date(Math.min(...pendingEntries.map(e => e.createdAt.getTime())))
      : undefined;

    return {
      pendingEntries,
      summary: {
        totalPending: pendingEntries.length,
        pendingCurrals,
        pendingDietas,
        oldestPending,
      },
    };
  }

  /**
   * Batch check referential integrity for multiple records
   */
  async batchCheckReferentialIntegrity(
    records: Array<{
      curral_codigo: string;
      dieta_nome: string | null;
      trateiro: string;
    }>,
    organizationId: string
  ): Promise<{
    results: ReferentialCheckResult[];
    summary: {
      totalRecords: number;
      validRecords: number;
      recordsWithPendingEntries: number;
      totalPendingEntries: number;
    };
  }> {
    const results: ReferentialCheckResult[] = [];

    for (const record of records) {
      const result = await this.checkReferentialIntegrity(record, organizationId);
      results.push(result);
    }

    const validRecords = results.filter(r => r.isValid).length;
    const recordsWithPendingEntries = results.filter(r => r.pendingEntries.length > 0).length;
    const totalPendingEntries = results.reduce((sum, r) => sum + r.pendingEntries.length, 0);

    return {
      results,
      summary: {
        totalRecords: records.length,
        validRecords,
        recordsWithPendingEntries,
        totalPendingEntries,
      },
    };
  }
}