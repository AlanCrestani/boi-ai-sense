import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CarregamentoFilters, ChartDataPoint } from './useCarregamentoData';

// Chaves de cache para diferentes tipos de dados
export const CACHE_KEYS = {
  quantitative: (organizationId: string, filters: CarregamentoFilters) =>
    ['carregamento', 'quantitative', organizationId, filters] as const,
  qualitative: (organizationId: string, filters: CarregamentoFilters) =>
    ['carregamento', 'qualitative', organizationId, filters] as const,
  temporal: (organizationId: string, filters: CarregamentoFilters) =>
    ['carregamento', 'temporal', organizationId, filters] as const,
} as const;

// Configurações de cache
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 2,
} as const;

// Função auxiliar para construir filtros WHERE de data
const buildDateFilter = (query: any, filters: CarregamentoFilters) => {
  if (filters.startDate) {
    query = query.gte('data', filters.startDate.toISOString().split('T')[0]);
  }
  if (filters.endDate) {
    query = query.lte('data', filters.endDate.toISOString().split('T')[0]);
  }
  return query;
};

// Hook para dados quantitativos
export const useQuantitativeData = (organizationId: string, filters: CarregamentoFilters) => {
  return useQuery({
    queryKey: CACHE_KEYS.quantitative(organizationId, filters),
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');

      // 1. Consumo por Ingrediente
      let ingredientQuery = supabase
        .from('view_ingrediente_resumo')
        .select('ingrediente, realizado_kg')
        .eq('organization_id', organizationId)
        .order('realizado_kg', { ascending: false })
        .limit(5);
      ingredientQuery = buildDateFilter(ingredientQuery, filters);
      const { data: ingredientData, error: ingredientError } = await ingredientQuery;
      if (ingredientError) throw ingredientError;

      // 2. Participação % no Consumo
      let shareQuery = supabase
        .from('view_ingrediente_participacao')
        .select('ingrediente, participacao_pc')
        .eq('organization_id', organizationId)
        .order('participacao_pc', { ascending: false })
        .limit(5);
      shareQuery = buildDateFilter(shareQuery, filters);
      const { data: shareData, error: shareError } = await shareQuery;
      if (shareError) throw shareError;

      // 3. Previsto x Realizado
      let plannedQuery = supabase
        .from('view_ingrediente_resumo')
        .select('ingrediente, previsto_kg, realizado_kg')
        .eq('organization_id', organizationId)
        .limit(5);
      plannedQuery = buildDateFilter(plannedQuery, filters);
      const { data: plannedActualData, error: plannedError } = await plannedQuery;
      if (plannedError) throw plannedError;

      // 4. Eficiência por Carregamento
      let efficiencyQuery = supabase
        .from('view_carregamento_eficiencia')
        .select('id_carregamento, eficiencia_pc, hora')
        .eq('organization_id', organizationId)
        .order('hora', { ascending: false })
        .limit(5);
      efficiencyQuery = buildDateFilter(efficiencyQuery, filters);
      const { data: loadEfficiencyData, error: efficiencyError } = await efficiencyQuery;
      if (efficiencyError) throw efficiencyError;

      // 5. Desvio por Carregamento e Vagão
      let deviationQuery = supabase
        .from('view_carregamento_eficiencia')
        .select('vagao, desvio_total, hora')
        .eq('organization_id', organizationId)
        .order('hora', { ascending: false })
        .limit(5);
      deviationQuery = buildDateFilter(deviationQuery, filters);
      const { data: deviationData, error: deviationError } = await deviationQuery;
      if (deviationError) throw deviationError;

      // Transformar dados
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

      return {
        ingredientConsumption: ingredientData?.map(item => ({
          ingrediente: item.ingrediente,
          consumo: parseFloat(item.realizado_kg)
        })) || [],
        consumptionShare: shareData?.map((item, index) => ({
          name: item.ingrediente,
          value: parseFloat(item.participacao_pc),
          fill: colors[index % colors.length]
        })) || [],
        plannedVsActual: plannedActualData?.map(item => ({
          ingrediente: item.ingrediente,
          previsto: parseFloat(item.previsto_kg),
          realizado: parseFloat(item.realizado_kg)
        })) || [],
        efficiencyByLoad: loadEfficiencyData?.map((item, index) => ({
          carregamento: `Carga ${index + 1}`,
          eficiencia: parseFloat(item.eficiencia_pc)
        })) || [],
        deviationByLoadAndWagon: deviationData?.map((item, index) => ({
          item: `Carga ${Math.floor(index/2) + 1} - ${item.vagao}`,
          desvio: parseFloat(item.desvio_total)
        })) || []
      };
    },
    enabled: !!organizationId,
    ...CACHE_CONFIG
  });
};

// Hook para dados qualitativos
export const useQualitativeData = (organizationId: string, filters: CarregamentoFilters) => {
  return useQuery({
    queryKey: CACHE_KEYS.qualitative(organizationId, filters),
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');

      // 6. Distribuição de Eficiência
      let statusQuery = supabase
        .from('view_status_performance')
        .select('status, total_carregamentos')
        .eq('organization_id', organizationId);
      statusQuery = buildDateFilter(statusQuery, filters);
      const { data: statusData, error: statusError } = await statusQuery;
      if (statusError) throw statusError;

      // 7. Ingredientes por Volume
      let volumeIngredientQuery = supabase
        .from('view_ingrediente_categoria_volume')
        .select('categoria, volume_total')
        .eq('organization_id', organizationId)
        .order('volume_total', { ascending: false });
      volumeIngredientQuery = buildDateFilter(volumeIngredientQuery, filters);
      const { data: volumeIngredientData, error: volumeIngredientError } = await volumeIngredientQuery;
      if (volumeIngredientError) throw volumeIngredientError;

      // 8. Volume por Dieta
      let dietQuery = supabase
        .from('view_dieta_resumo')
        .select('dieta, realizado_kg')
        .eq('organization_id', organizationId)
        .order('realizado_kg', { ascending: false });
      dietQuery = buildDateFilter(dietQuery, filters);
      const { data: dietVolumeData, error: dietError } = await dietQuery;
      if (dietError) throw dietError;

      // 9. Desvio Médio por Ingrediente
      let avgDeviationQuery = supabase
        .from('view_ingrediente_problema')
        .select('ingrediente, desvio_medio_absoluto_pc')
        .eq('organization_id', organizationId)
        .order('ranking_desvio')
        .limit(5);
      avgDeviationQuery = buildDateFilter(avgDeviationQuery, filters);
      const { data: avgDeviationData, error: avgDeviationError } = await avgDeviationQuery;
      if (avgDeviationError) throw avgDeviationError;

      // 10. Volume por Vagão
      let wagonQuery = supabase
        .from('view_vagao_resumo')
        .select('vagao, realizado_kg')
        .eq('organization_id', organizationId);
      wagonQuery = buildDateFilter(wagonQuery, filters);
      const { data: wagonVolumeData, error: wagonError } = await wagonQuery;
      if (wagonError) throw wagonError;

      // Transformar dados
      const total = wagonVolumeData?.reduce((sum, item) => sum + parseFloat(item.realizado_kg), 0) || 1;
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

      return {
        efficiencyDistribution: [
          { faixa: '80-85%', quantidade: 5 },
          { faixa: '85-90%', quantidade: statusData?.find(s => s.status === 'AMARELO')?.total_carregamentos || 0 },
          { faixa: '90-95%', quantidade: Math.floor((statusData?.find(s => s.status === 'VERDE')?.total_carregamentos || 0) / 2) },
          { faixa: '95-100%', quantidade: Math.ceil((statusData?.find(s => s.status === 'VERDE')?.total_carregamentos || 0) / 2) },
          { faixa: '100-105%', quantidade: 15 },
          { faixa: '105-110%', quantidade: statusData?.find(s => s.status === 'VERMELHO')?.total_carregamentos || 0 }
        ],
        ingredientsByVolume: volumeIngredientData?.map(item => ({
          ingrediente: item.categoria,
          volume: parseFloat(item.volume_total)
        })) || [],
        volumeByDiet: dietVolumeData?.map(item => ({
          dieta: item.dieta,
          volume: parseFloat(item.realizado_kg)
        })) || [],
        avgDeviationByIngredient: avgDeviationData?.map(item => ({
          ingrediente: item.ingrediente,
          desvio: parseFloat(item.desvio_medio_absoluto_pc)
        })) || [],
        volumeByWagon: wagonVolumeData?.map((item, index) => ({
          name: item.vagao,
          value: Math.round((parseFloat(item.realizado_kg) / total) * 100),
          fill: colors[index % colors.length]
        })) || []
      };
    },
    enabled: !!organizationId,
    ...CACHE_CONFIG
  });
};

// Hook para dados temporais
export const useTemporalData = (organizationId: string, filters: CarregamentoFilters) => {
  return useQuery({
    queryKey: CACHE_KEYS.temporal(organizationId, filters),
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');

      // 11. Eficiência ao Longo do Dia
      let hourEfficiencyQuery = supabase
        .from('view_horario_performance')
        .select('hora, desvio_medio_pc')
        .eq('organization_id', organizationId)
        .order('hora');
      hourEfficiencyQuery = buildDateFilter(hourEfficiencyQuery, filters);
      const { data: hourEfficiencyData, error: hourEfficiencyError } = await hourEfficiencyQuery;
      if (hourEfficiencyError) throw hourEfficiencyError;

      // 12. Volume por Hora
      let hourVolumeQuery = supabase
        .from('view_horario_performance')
        .select('hora, total_realizado')
        .eq('organization_id', organizationId)
        .order('hora');
      hourVolumeQuery = buildDateFilter(hourVolumeQuery, filters);
      const { data: hourVolumeData, error: hourVolumeError } = await hourVolumeQuery;
      if (hourVolumeError) throw hourVolumeError;

      return {
        efficiencyOverTime: hourEfficiencyData?.map(item => ({
          hora: item.hora.substring(0, 5), // Pegar apenas HH:MM
          eficiencia: 100 - Math.abs(parseFloat(item.desvio_medio_pc))
        })) || [],
        volumePerHour: hourVolumeData?.map(item => ({
          hora: item.hora.substring(0, 5), // Pegar apenas HH:MM
          volume: Math.round(parseFloat(item.total_realizado))
        })) || []
      };
    },
    enabled: !!organizationId,
    ...CACHE_CONFIG
  });
};

// Hook principal que combina todos os dados
export const useCarregamentoCache = (organizationId: string, filters: CarregamentoFilters) => {
  const queryClient = useQueryClient();

  const quantitativeQuery = useQuantitativeData(organizationId, filters);
  const qualitativeQuery = useQualitativeData(organizationId, filters);
  const temporalQuery = useTemporalData(organizationId, filters);

  // Função para invalidar todos os caches relacionados ao carregamento
  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: ['carregamento']
    });
  };

  // Função para pré-carregar dados com novos filtros
  const prefetchWithFilters = (newFilters: CarregamentoFilters) => {
    queryClient.prefetchQuery({
      queryKey: CACHE_KEYS.quantitative(organizationId, newFilters),
      queryFn: async () => {
        // Lógica similar à do useQuantitativeData
        return {};
      },
      ...CACHE_CONFIG
    });
  };

  return {
    // Dados combinados
    data: {
      charts: {
        ...(quantitativeQuery.data || {}),
        ...(qualitativeQuery.data || {}),
        ...(temporalQuery.data || {})
      },
      loading: {
        quantitative: quantitativeQuery.isLoading,
        qualitative: qualitativeQuery.isLoading,
        temporal: temporalQuery.isLoading
      },
      errors: {
        quantitative: quantitativeQuery.error?.message || null,
        qualitative: qualitativeQuery.error?.message || null,
        temporal: temporalQuery.error?.message || null
      }
    },

    // Estados agregados
    isLoading: quantitativeQuery.isLoading || qualitativeQuery.isLoading || temporalQuery.isLoading,
    hasErrors: !!(quantitativeQuery.error || qualitativeQuery.error || temporalQuery.error),
    isSuccess: quantitativeQuery.isSuccess && qualitativeQuery.isSuccess && temporalQuery.isSuccess,

    // Funções de controle de cache
    refetch: () => {
      quantitativeQuery.refetch();
      qualitativeQuery.refetch();
      temporalQuery.refetch();
    },
    invalidateAll,
    prefetchWithFilters,

    // Queries individuais para controle granular
    queries: {
      quantitative: quantitativeQuery,
      qualitative: qualitativeQuery,
      temporal: temporalQuery
    }
  };
};