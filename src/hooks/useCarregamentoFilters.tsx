import { useState, useCallback, useMemo } from 'react';
import { CarregamentoFilters } from './useCarregamentoData';

export interface FilterPreset {
  label: string;
  value: CarregamentoFilters['preset'];
  getDateRange: () => { startDate: Date; endDate: Date };
}

export interface UseCarregamentoFiltersReturn {
  filters: CarregamentoFilters;
  setFilters: (filters: CarregamentoFilters) => void;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  setPreset: (preset: CarregamentoFilters['preset']) => void;
  applyPreset: (preset: CarregamentoFilters['preset']) => void;
  resetFilters: () => void;
  isCustomDateRange: boolean;
  isValidDateRange: boolean;
  validationError: string | null;
  presets: FilterPreset[];
}

const getPresetDateRange = (preset: CarregamentoFilters['preset']) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: today
      };

    case '7days':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      return {
        startDate: sevenDaysAgo,
        endDate: today
      };

    case '30days':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      return {
        startDate: thirtyDaysAgo,
        endDate: today
      };

    case 'lastMonth':
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: firstDayLastMonth,
        endDate: lastDayLastMonth
      };

    default:
      return {
        startDate: thirtyDaysAgo,
        endDate: today
      };
  }
};

export const useCarregamentoFilters = (
  initialFilters?: Partial<CarregamentoFilters>
): UseCarregamentoFiltersReturn => {
  // Filtros padrão: últimos 30 dias
  const defaultPreset: CarregamentoFilters['preset'] = '30days';
  const defaultDateRange = getPresetDateRange(defaultPreset);

  const [filters, setFiltersState] = useState<CarregamentoFilters>(() => ({
    startDate: initialFilters?.startDate || defaultDateRange.startDate,
    endDate: initialFilters?.endDate || defaultDateRange.endDate,
    preset: initialFilters?.preset || defaultPreset
  }));

  // Presets disponíveis
  const presets: FilterPreset[] = useMemo(() => [
    {
      label: 'Hoje',
      value: 'today',
      getDateRange: () => getPresetDateRange('today')
    },
    {
      label: 'Últimos 7 dias',
      value: '7days',
      getDateRange: () => getPresetDateRange('7days')
    },
    {
      label: 'Últimos 30 dias',
      value: '30days',
      getDateRange: () => getPresetDateRange('30days')
    },
    {
      label: 'Mês passado',
      value: 'lastMonth',
      getDateRange: () => getPresetDateRange('lastMonth')
    },
    {
      label: 'Personalizado',
      value: 'custom',
      getDateRange: () => ({ startDate: new Date(), endDate: new Date() })
    }
  ], []);

  // Verificar se é um range customizado
  const isCustomDateRange = useMemo(() => {
    return filters.preset === 'custom';
  }, [filters.preset]);

  // Validar range de datas
  const { isValidDateRange, validationError } = useMemo(() => {
    if (!filters.startDate || !filters.endDate) {
      return {
        isValidDateRange: false,
        validationError: 'Data de início e fim são obrigatórias'
      };
    }

    if (filters.startDate > filters.endDate) {
      return {
        isValidDateRange: false,
        validationError: 'Data de início deve ser anterior à data de fim'
      };
    }

    const now = new Date();
    if (filters.endDate > now) {
      return {
        isValidDateRange: false,
        validationError: 'Data de fim não pode ser no futuro'
      };
    }

    // Verificar se o range não é muito grande (máximo 1 ano)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    if (filters.startDate < oneYearAgo) {
      return {
        isValidDateRange: false,
        validationError: 'Range máximo de 1 ano permitido'
      };
    }

    return {
      isValidDateRange: true,
      validationError: null
    };
  }, [filters.startDate, filters.endDate]);

  // Setter para filtros completos
  const setFilters = useCallback((newFilters: CarregamentoFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Setter para data de início
  const setStartDate = useCallback((date: Date | null) => {
    setFiltersState(prev => ({
      ...prev,
      startDate: date,
      preset: 'custom'
    }));
  }, []);

  // Setter para data de fim
  const setEndDate = useCallback((date: Date | null) => {
    setFiltersState(prev => ({
      ...prev,
      endDate: date,
      preset: 'custom'
    }));
  }, []);

  // Setter para preset (sem aplicar automaticamente)
  const setPreset = useCallback((preset: CarregamentoFilters['preset']) => {
    setFiltersState(prev => ({
      ...prev,
      preset
    }));
  }, []);

  // Aplicar preset (atualiza as datas)
  const applyPreset = useCallback((preset: CarregamentoFilters['preset']) => {
    if (preset === 'custom') {
      setFiltersState(prev => ({
        ...prev,
        preset: 'custom'
      }));
    } else {
      const dateRange = getPresetDateRange(preset);
      setFiltersState({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        preset
      });
    }
  }, []);

  // Reset para valores padrão
  const resetFilters = useCallback(() => {
    const defaultDateRange = getPresetDateRange(defaultPreset);
    setFiltersState({
      startDate: defaultDateRange.startDate,
      endDate: defaultDateRange.endDate,
      preset: defaultPreset
    });
  }, []);

  return {
    filters,
    setFilters,
    setStartDate,
    setEndDate,
    setPreset,
    applyPreset,
    resetFilters,
    isCustomDateRange,
    isValidDateRange,
    validationError,
    presets
  };
};