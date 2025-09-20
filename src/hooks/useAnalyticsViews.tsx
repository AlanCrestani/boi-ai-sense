import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Interfaces para os dados das views
export interface IngredienteResumoData {
  organization_id: string;
  ingrediente: string;
  realizado_kg: number;
  previsto_kg: number;
  desvio_kg: number;
  desvio_pc: number;
  data: string;
}

export interface IngredienteParticipacaoData {
  organization_id: string;
  ingrediente: string;
  data: string;
  realizado_kg_ingrediente: number;
  total_realizado: number;
  participacao_pc: number;
}

export interface CarregamentoEficienciaData {
  organization_id: string;
  carregamento: string;
  id_carregamento: string;
  vagao: string;
  dieta: string;
  data: string;
  hora: string;
  eficiencia: number;
  total_realizado: number;
  total_previsto: number;
  desvio_medio_pc: number;
}

export interface EficienciaDistribuicaoData {
  organization_id: string;
  faixa: string;
  quantidade: number;
  data: string;
}

export interface VolumePorDietaData {
  organization_id: string;
  dieta: string;
  data: string;
  volume: number;
  previsto_total: number;
  realizado_total: number;
  total_carregamentos: number;
}

export interface VolumePorVagaoData {
  organization_id: string;
  vagao: string;
  data: string;
  total_realizado: number;
  total_carregamentos: number;
  desvio_medio: number;
}

export interface EficienciaTemporalData {
  organization_id: string;
  data: string;
  hora: string;
  eficiencia: number;
  desvio_medio_pc: number;
  volume_total: number;
}

// Interface para filtros
export interface AnalyticsFilters {
  startDate: Date | null;
  endDate: Date | null;
}

// Interface para dados consolidados
export interface AnalyticsViewsData {
  ingredienteResumo: IngredienteResumoData[];
  ingredienteParticipacao: IngredienteParticipacaoData[];
  carregamentoEficiencia: CarregamentoEficienciaData[];
  eficienciaDistribuicao: EficienciaDistribuicaoData[];
  volumePorDieta: VolumePorDietaData[];
  volumePorVagao: VolumePorVagaoData[];
  eficienciaTemporalData: EficienciaTemporalData[];
}

export interface AnalyticsViewsState {
  data: AnalyticsViewsData;
  loading: {
    global: boolean;
    ingredienteResumo: boolean;
    ingredienteParticipacao: boolean;
    carregamentoEficiencia: boolean;
    eficienciaDistribuicao: boolean;
    volumePorDieta: boolean;
    volumePorVagao: boolean;
    eficienciaTemporalData: boolean;
  };
  errors: {
    global: string | null;
    ingredienteResumo: string | null;
    ingredienteParticipacao: string | null;
    carregamentoEficiencia: string | null;
    eficienciaDistribuicao: string | null;
    volumePorDieta: string | null;
    volumePorVagao: string | null;
    eficienciaTemporalData: string | null;
  };
  lastUpdated: Date | null;
}

export const useAnalyticsViews = (filters?: AnalyticsFilters) => {
  const { organization } = useAuth();

  const [state, setState] = useState<AnalyticsViewsState>({
    data: {
      ingredienteResumo: [],
      ingredienteParticipacao: [],
      carregamentoEficiencia: [],
      eficienciaDistribuicao: [],
      volumePorDieta: [],
      volumePorVagao: [],
      eficienciaTemporalData: [],
    },
    loading: {
      global: false,
      ingredienteResumo: false,
      ingredienteParticipacao: false,
      carregamentoEficiencia: false,
      eficienciaDistribuicao: false,
      volumePorDieta: false,
      volumePorVagao: false,
      eficienciaTemporalData: false,
    },
    errors: {
      global: null,
      ingredienteResumo: null,
      ingredienteParticipacao: null,
      carregamentoEficiencia: null,
      eficienciaDistribuicao: null,
      volumePorDieta: null,
      volumePorVagao: null,
      eficienciaTemporalData: null,
    },
    lastUpdated: null,
  });

  // Helper para construir filtros de data
  const startDateString = filters?.startDate?.toISOString().split('T')[0];
  const endDateString = filters?.endDate?.toISOString().split('T')[0];

  const buildDateFilter = useCallback(() => {
    if (!startDateString || !endDateString) {
      return {};
    }

    return {
      data: {
        gte: startDateString,
        lte: endDateString
      }
    };
  }, [startDateString, endDateString]);

  // Fetch individual para view_ingrediente_resumo
  const fetchIngredienteResumo = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, ingredienteResumo: true },
      errors: { ...prev.errors, ingredienteResumo: null }
    }));

    try {
      const dateFilter = buildDateFilter();
      const { data, error } = await supabase
        .from('view_ingrediente_resumo')
        .select('*')
        .eq('organization_id', organization.id)
        .match(dateFilter)
        .order('data', { ascending: false })
        .order('ingrediente', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: { ...prev.data, ingredienteResumo: data || [] },
        loading: { ...prev.loading, ingredienteResumo: false }
      }));
    } catch (error) {
      console.error('Erro ao buscar ingrediente resumo:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, ingredienteResumo: false },
        errors: { ...prev.errors, ingredienteResumo: (error as Error).message }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Fetch individual para view_ingrediente_participacao
  const fetchIngredienteParticipacao = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, ingredienteParticipacao: true },
      errors: { ...prev.errors, ingredienteParticipacao: null }
    }));

    try {
      const dateFilter = buildDateFilter();
      const { data, error } = await supabase
        .from('view_ingrediente_participacao')
        .select('*')
        .eq('organization_id', organization.id)
        .match(dateFilter)
        .order('participacao_pc', { ascending: false });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: { ...prev.data, ingredienteParticipacao: data || [] },
        loading: { ...prev.loading, ingredienteParticipacao: false }
      }));
    } catch (error) {
      console.error('Erro ao buscar ingrediente participacao:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, ingredienteParticipacao: false },
        errors: { ...prev.errors, ingredienteParticipacao: (error as Error).message }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Fetch individual para view_carregamento_eficiencia
  const fetchCarregamentoEficiencia = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, carregamentoEficiencia: true },
      errors: { ...prev.errors, carregamentoEficiencia: null }
    }));

    try {
      const dateFilter = buildDateFilter();
      const { data, error } = await supabase
        .from('view_carregamento_eficiencia')
        .select('*')
        .eq('organization_id', organization.id)
        .match(dateFilter)
        .order('data', { ascending: false })
        .order('hora', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: { ...prev.data, carregamentoEficiencia: data || [] },
        loading: { ...prev.loading, carregamentoEficiencia: false }
      }));
    } catch (error) {
      console.error('Erro ao buscar carregamento eficiencia:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, carregamentoEficiencia: false },
        errors: { ...prev.errors, carregamentoEficiencia: (error as Error).message }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Fetch individual para view_eficiencia_distribuicao
  const fetchEficienciaDistribuicao = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, eficienciaDistribuicao: true },
      errors: { ...prev.errors, eficienciaDistribuicao: null }
    }));

    try {
      const dateFilter = buildDateFilter();
      const { data, error } = await supabase
        .from('view_eficiencia_diaria')
        .select('*')
        .eq('organization_id', organization.id)
        .match(dateFilter)
        .order('faixa', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: { ...prev.data, eficienciaDistribuicao: data || [] },
        loading: { ...prev.loading, eficienciaDistribuicao: false }
      }));
    } catch (error) {
      console.error('Erro ao buscar eficiencia distribuicao:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, eficienciaDistribuicao: false },
        errors: { ...prev.errors, eficienciaDistribuicao: (error as Error).message }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Fetch individual para view_volume_por_dieta
  const fetchVolumePorDieta = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, volumePorDieta: true },
      errors: { ...prev.errors, volumePorDieta: null }
    }));

    try {
      const dateFilter = buildDateFilter();
      const { data, error } = await supabase
        .from('view_carregamento_dieta')
        .select('*')
        .eq('organization_id', organization.id)
        .match(dateFilter)
        .order('volume', { ascending: false });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: { ...prev.data, volumePorDieta: data || [] },
        loading: { ...prev.loading, volumePorDieta: false }
      }));
    } catch (error) {
      console.error('Erro ao buscar volume por dieta:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, volumePorDieta: false },
        errors: { ...prev.errors, volumePorDieta: (error as Error).message }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Fetch individual para view_volume_por_vagao
  const fetchVolumePorVagao = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, volumePorVagao: true },
      errors: { ...prev.errors, volumePorVagao: null }
    }));

    try {
      const dateFilter = buildDateFilter();
      const { data, error } = await supabase
        .from('view_vagao_resumo')
        .select('*')
        .eq('organization_id', organization.id)
        .match(dateFilter)
        .order('total_realizado', { ascending: false });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: { ...prev.data, volumePorVagao: data || [] },
        loading: { ...prev.loading, volumePorVagao: false }
      }));
    } catch (error) {
      console.error('Erro ao buscar volume por vagao:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, volumePorVagao: false },
        errors: { ...prev.errors, volumePorVagao: (error as Error).message }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Fetch individual para view_eficiencia_temporal
  const fetchEficienciaTemporalData = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, eficienciaTemporalData: true },
      errors: { ...prev.errors, eficienciaTemporalData: null }
    }));

    try {
      const dateFilter = buildDateFilter();
      const { data, error } = await supabase
        .from('view_eficiencia_diaria')
        .select('*')
        .eq('organization_id', organization.id)
        .match(dateFilter)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: { ...prev.data, eficienciaTemporalData: data || [] },
        loading: { ...prev.loading, eficienciaTemporalData: false }
      }));
    } catch (error) {
      console.error('Erro ao buscar eficiencia temporal:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, eficienciaTemporalData: false },
        errors: { ...prev.errors, eficienciaTemporalData: (error as Error).message }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, global: true },
      errors: {
        global: null,
        ingredienteResumo: null,
        ingredienteParticipacao: null,
        carregamentoEficiencia: null,
        eficienciaDistribuicao: null,
        volumePorDieta: null,
        volumePorVagao: null,
        eficienciaTemporalData: null,
      }
    }));

    try {
      await Promise.all([
        fetchIngredienteResumo(),
        fetchIngredienteParticipacao(),
        fetchCarregamentoEficiencia(),
        fetchEficienciaDistribuicao(),
        fetchVolumePorDieta(),
        fetchVolumePorVagao(),
        fetchEficienciaTemporalData(),
      ]);

      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, global: false },
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Erro ao buscar dados das views:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, global: false },
        errors: { ...prev.errors, global: (error as Error).message }
      }));
    }
  }, [
    organization?.id,
    fetchIngredienteResumo,
    fetchIngredienteParticipacao,
    fetchCarregamentoEficiencia,
    fetchEficienciaDistribuicao,
    fetchVolumePorDieta,
    fetchVolumePorVagao,
    fetchEficienciaTemporalData,
  ]);

  // Refetch específico para cada view
  const refetchView = useCallback((viewName: keyof AnalyticsViewsData) => {
    switch (viewName) {
      case 'ingredienteResumo':
        return fetchIngredienteResumo();
      case 'ingredienteParticipacao':
        return fetchIngredienteParticipacao();
      case 'carregamentoEficiencia':
        return fetchCarregamentoEficiencia();
      case 'eficienciaDistribuicao':
        return fetchEficienciaDistribuicao();
      case 'volumePorDieta':
        return fetchVolumePorDieta();
      case 'volumePorVagao':
        return fetchVolumePorVagao();
      case 'eficienciaTemporalData':
        return fetchEficienciaTemporalData();
      default:
        return Promise.resolve();
    }
  }, [
    fetchIngredienteResumo,
    fetchIngredienteParticipacao,
    fetchCarregamentoEficiencia,
    fetchEficienciaDistribuicao,
    fetchVolumePorDieta,
    fetchVolumePorVagao,
    fetchEficienciaTemporalData,
  ]);

  // Effect para carregar dados quando organização ou filtros mudam
  useEffect(() => {
    if (organization?.id) {
      fetchAllData();
    }
  }, [organization?.id, fetchAllData]);

  // Computed values
  const isLoading = Object.values(state.loading).some(loading => loading);
  const hasErrors = Object.values(state.errors).some(error => error !== null);
  const hasData = Object.values(state.data).some(dataArray => dataArray.length > 0);

  return {
    ...state.data,
    loading: state.loading,
    errors: state.errors,
    isLoading,
    hasErrors,
    hasData,
    lastUpdated: state.lastUpdated,
    refetch: fetchAllData,
    refetchView,
  };
};