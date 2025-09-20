import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Interfaces padronizadas para dados de carregamento
export interface CarregamentoFilters {
  startDate: Date | null;
  endDate: Date | null;
  preset: 'custom' | 'today' | '7days' | '30days' | 'lastMonth';
}

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface CarregamentoCharts {
  // Seção Análises Quantitativas
  ingredientConsumption: ChartDataPoint[];
  consumptionShare: ChartDataPoint[];
  plannedVsActual: ChartDataPoint[];
  efficiencyByLoad: ChartDataPoint[];
  deviationByLoadAndWagon: ChartDataPoint[];

  // Seção Análises Qualitativas
  efficiencyDistribution: ChartDataPoint[];
  ingredientsByVolume: ChartDataPoint[];
  volumeByDiet: ChartDataPoint[];
  avgDeviationByIngredient: ChartDataPoint[];
  volumeByWagon: ChartDataPoint[];

  // Seção Análise Temporal
  efficiencyOverTime: ChartDataPoint[];
  volumePerHour: ChartDataPoint[];
}

export interface CarregamentoData {
  charts: CarregamentoCharts;
  loading: {
    quantitative: boolean;
    qualitative: boolean;
    temporal: boolean;
  };
  errors: {
    quantitative: string | null;
    qualitative: string | null;
    temporal: string | null;
  };
}

export const useCarregamentoData = (filters?: CarregamentoFilters) => {
  const { organization } = useAuth();
  const [data, setData] = useState<CarregamentoData>({
    charts: {
      ingredientConsumption: [],
      consumptionShare: [],
      plannedVsActual: [],
      efficiencyByLoad: [],
      deviationByLoadAndWagon: [],
      efficiencyDistribution: [],
      ingredientsByVolume: [],
      volumeByDiet: [],
      avgDeviationByIngredient: [],
      volumeByWagon: [],
      efficiencyOverTime: [],
      volumePerHour: [],
    },
    loading: {
      quantitative: false,
      qualitative: false,
      temporal: false,
    },
    errors: {
      quantitative: null,
      qualitative: null,
      temporal: null,
    },
  });

  // Função auxiliar para construir filtros WHERE de data
  const buildDateFilter = useCallback((query: any) => {
    if (filters?.startDate) {
      query = query.gte('data', filters.startDate.toISOString().split('T')[0]);
    }
    if (filters?.endDate) {
      query = query.lte('data', filters.endDate.toISOString().split('T')[0]);
    }
    return query;
  }, [filters]);

  // Buscar dados quantitativos
  const fetchQuantitativeData = useCallback(async () => {
    if (!organization?.id) return;

    setData(prev => ({
      ...prev,
      loading: { ...prev.loading, quantitative: true },
      errors: { ...prev.errors, quantitative: null }
    }));

    try {
      // 1. Consumo por Ingrediente (tabela staging02_desvio_carregamento)
      let ingredientQuery = supabase
        .from('staging02_desvio_carregamento')
        .select('ingrediente, realizado_kg')
        .eq('organization_id', organization.id)
        .not('ingrediente', 'is', null)
        .not('realizado_kg', 'is', null)
        .order('realizado_kg', { ascending: false })
        .limit(100); // Buscar mais dados para agregação

      ingredientQuery = buildDateFilter(ingredientQuery);
      const { data: rawIngredientData, error: ingredientError } = await ingredientQuery;

      if (ingredientError) throw ingredientError;

      // Agregar dados por ingrediente
      const ingredientMap = new Map();
      rawIngredientData?.forEach(item => {
        const key = item.ingrediente;
        if (ingredientMap.has(key)) {
          ingredientMap.set(key, ingredientMap.get(key) + parseFloat(item.realizado_kg || 0));
        } else {
          ingredientMap.set(key, parseFloat(item.realizado_kg || 0));
        }
      });

      const ingredientConsumption = Array.from(ingredientMap.entries())
        .map(([ingrediente, consumo]) => ({
          ingrediente,
          consumo
        }))
        .sort((a, b) => b.consumo - a.consumo)
        .slice(0, 5);

      // 2. Participação % no Consumo (calcular a partir dos dados)
      const totalConsumo = Array.from(ingredientMap.values()).reduce((sum, value) => sum + value, 0);

      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
      const consumptionShare = ingredientConsumption.map((item, index) => ({
        name: item.ingrediente,
        value: totalConsumo > 0 ? (item.consumo / totalConsumo) * 100 : 0,
        fill: colors[index % colors.length]
      }));

      // 3. Previsto x Realizado (tabela staging02_desvio_carregamento)
      let plannedQuery = supabase
        .from('staging02_desvio_carregamento')
        .select('ingrediente, previsto_kg, realizado_kg')
        .eq('organization_id', organization.id)
        .not('ingrediente', 'is', null)
        .not('previsto_kg', 'is', null)
        .not('realizado_kg', 'is', null)
        .limit(100);

      plannedQuery = buildDateFilter(plannedQuery);
      const { data: rawPlannedData, error: plannedError } = await plannedQuery;

      if (plannedError) throw plannedError;

      // Agregar previsto x realizado por ingrediente
      const plannedMap = new Map();
      rawPlannedData?.forEach(item => {
        const key = item.ingrediente;
        if (plannedMap.has(key)) {
          const existing = plannedMap.get(key);
          plannedMap.set(key, {
            previsto: existing.previsto + parseFloat(item.previsto_kg || 0),
            realizado: existing.realizado + parseFloat(item.realizado_kg || 0)
          });
        } else {
          plannedMap.set(key, {
            previsto: parseFloat(item.previsto_kg || 0),
            realizado: parseFloat(item.realizado_kg || 0)
          });
        }
      });

      const plannedActualData = Array.from(plannedMap.entries())
        .map(([ingrediente, data]) => ({
          ingrediente,
          previsto_kg: data.previsto,
          realizado_kg: data.realizado
        }))
        .slice(0, 5);

      const plannedVsActual = plannedActualData?.map(item => ({
        ingrediente: item.ingrediente,
        previsto: parseFloat(item.previsto_kg),
        realizado: parseFloat(item.realizado_kg)
      })) || [];

      // 4. Eficiência por Carregamento (view_carregamento_eficiencia)
      let efficiencyQuery = supabase
        .from('view_carregamento_eficiencia')
        .select('id_carregamento, eficiencia_pc, hora')
        .eq('organization_id', organization.id)
        .order('hora', { ascending: false })
        .limit(5);

      efficiencyQuery = buildDateFilter(efficiencyQuery);
      const { data: loadEfficiencyData, error: efficiencyError } = await efficiencyQuery;

      if (efficiencyError) throw efficiencyError;

      const efficiencyByLoad = loadEfficiencyData?.map((item, index) => ({
        carregamento: `Carga ${index + 1}`,
        eficiencia: parseFloat(item.eficiencia_pc)
      })) || [];

      // 5. Desvio por Carregamento e Vagão (view_carregamento_eficiencia)
      let deviationQuery = supabase
        .from('view_carregamento_eficiencia')
        .select('vagao, desvio_total, hora')
        .eq('organization_id', organization.id)
        .order('hora', { ascending: false })
        .limit(5);

      deviationQuery = buildDateFilter(deviationQuery);
      const { data: deviationData, error: deviationError } = await deviationQuery;

      if (deviationError) throw deviationError;

      const deviationByLoadAndWagon = deviationData?.map((item, index) => ({
        item: `Carga ${Math.floor(index/2) + 1} - ${item.vagao}`,
        desvio: parseFloat(item.desvio_total)
      })) || [];

      // Atualizar estado com dados quantitativos
      setData(prev => ({
        ...prev,
        charts: {
          ...prev.charts,
          ingredientConsumption,
          consumptionShare,
          plannedVsActual,
          efficiencyByLoad,
          deviationByLoadAndWagon,
        },
        loading: { ...prev.loading, quantitative: false }
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar dados quantitativos:', error);
      setData(prev => ({
        ...prev,
        loading: { ...prev.loading, quantitative: false },
        errors: { ...prev.errors, quantitative: 'Erro ao carregar dados quantitativos' }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Buscar dados qualitativos
  const fetchQualitativeData = useCallback(async () => {
    if (!organization?.id) return;

    setData(prev => ({
      ...prev,
      loading: { ...prev.loading, qualitative: true },
      errors: { ...prev.errors, qualitative: null }
    }));

    try {
      // 6. Distribuição de Eficiência (view_status_performance)
      let statusQuery = supabase
        .from('view_status_performance')
        .select('status, total_carregamentos')
        .eq('organization_id', organization.id);

      statusQuery = buildDateFilter(statusQuery);
      const { data: statusData, error: statusError } = await statusQuery;

      if (statusError) throw statusError;

      const efficiencyDistribution = [
        { faixa: '80-85%', quantidade: 5 },
        { faixa: '85-90%', quantidade: statusData?.find(s => s.status === 'AMARELO')?.total_carregamentos || 0 },
        { faixa: '90-95%', quantidade: Math.floor((statusData?.find(s => s.status === 'VERDE')?.total_carregamentos || 0) / 2) },
        { faixa: '95-100%', quantidade: Math.ceil((statusData?.find(s => s.status === 'VERDE')?.total_carregamentos || 0) / 2) },
        { faixa: '100-105%', quantidade: 15 },
        { faixa: '105-110%', quantidade: statusData?.find(s => s.status === 'VERMELHO')?.total_carregamentos || 0 }
      ];

      // 7. Ingredientes por Volume (view_ingrediente_categoria_volume)
      let volumeIngredientQuery = supabase
        .from('view_ingrediente_categoria_volume')
        .select('categoria, volume_total')
        .eq('organization_id', organization.id)
        .order('volume_total', { ascending: false });

      volumeIngredientQuery = buildDateFilter(volumeIngredientQuery);
      const { data: volumeIngredientData, error: volumeIngredientError } = await volumeIngredientQuery;

      if (volumeIngredientError) throw volumeIngredientError;

      const ingredientsByVolume = volumeIngredientData?.map(item => ({
        ingrediente: item.categoria,
        volume: parseFloat(item.volume_total)
      })) || [];

      // 8. Volume por Dieta (view_dieta_resumo)
      let dietQuery = supabase
        .from('view_dieta_resumo')
        .select('dieta, realizado_kg')
        .eq('organization_id', organization.id)
        .order('realizado_kg', { ascending: false });

      dietQuery = buildDateFilter(dietQuery);
      const { data: dietVolumeData, error: dietError } = await dietQuery;

      if (dietError) throw dietError;

      const volumeByDiet = dietVolumeData?.map(item => ({
        dieta: item.dieta,
        volume: parseFloat(item.realizado_kg)
      })) || [];

      // 9. Desvio Médio por Ingrediente (view_ingrediente_problema)
      let avgDeviationQuery = supabase
        .from('view_ingrediente_problema')
        .select('ingrediente, desvio_medio_absoluto_pc')
        .eq('organization_id', organization.id)
        .order('ranking_desvio')
        .limit(5);

      avgDeviationQuery = buildDateFilter(avgDeviationQuery);
      const { data: avgDeviationData, error: avgDeviationError } = await avgDeviationQuery;

      if (avgDeviationError) throw avgDeviationError;

      const avgDeviationByIngredient = avgDeviationData?.map(item => ({
        ingrediente: item.ingrediente,
        desvio: parseFloat(item.desvio_medio_absoluto_pc)
      })) || [];

      // 10. Volume por Vagão (view_vagao_resumo)
      let wagonQuery = supabase
        .from('view_vagao_resumo')
        .select('vagao, realizado_kg')
        .eq('organization_id', organization.id);

      wagonQuery = buildDateFilter(wagonQuery);
      const { data: wagonVolumeData, error: wagonError } = await wagonQuery;

      if (wagonError) throw wagonError;

      const total = wagonVolumeData?.reduce((sum, item) => sum + parseFloat(item.realizado_kg), 0) || 1;
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
      const volumeByWagon = wagonVolumeData?.map((item, index) => ({
        name: item.vagao,
        value: Math.round((parseFloat(item.realizado_kg) / total) * 100),
        fill: colors[index % colors.length]
      })) || [];

      // Atualizar estado com dados qualitativos
      setData(prev => ({
        ...prev,
        charts: {
          ...prev.charts,
          efficiencyDistribution,
          ingredientsByVolume,
          volumeByDiet,
          avgDeviationByIngredient,
          volumeByWagon,
        },
        loading: { ...prev.loading, qualitative: false }
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar dados qualitativos:', error);
      setData(prev => ({
        ...prev,
        loading: { ...prev.loading, qualitative: false },
        errors: { ...prev.errors, qualitative: 'Erro ao carregar dados qualitativos' }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Buscar dados temporais
  const fetchTemporalData = useCallback(async () => {
    if (!organization?.id) return;

    setData(prev => ({
      ...prev,
      loading: { ...prev.loading, temporal: true },
      errors: { ...prev.errors, temporal: null }
    }));

    try {
      // 11. Eficiência ao Longo do Dia (view_horario_performance)
      let hourEfficiencyQuery = supabase
        .from('view_horario_performance')
        .select('hora, desvio_medio_pc')
        .eq('organization_id', organization.id)
        .order('hora');

      hourEfficiencyQuery = buildDateFilter(hourEfficiencyQuery);
      const { data: hourEfficiencyData, error: hourEfficiencyError } = await hourEfficiencyQuery;

      if (hourEfficiencyError) throw hourEfficiencyError;

      const efficiencyOverTime = hourEfficiencyData?.map(item => ({
        hora: item.hora.substring(0, 5), // Pegar apenas HH:MM
        eficiencia: 100 - Math.abs(parseFloat(item.desvio_medio_pc))
      })) || [];

      // 12. Volume por Hora (view_horario_performance)
      let hourVolumeQuery = supabase
        .from('view_horario_performance')
        .select('hora, total_realizado')
        .eq('organization_id', organization.id)
        .order('hora');

      hourVolumeQuery = buildDateFilter(hourVolumeQuery);
      const { data: hourVolumeData, error: hourVolumeError } = await hourVolumeQuery;

      if (hourVolumeError) throw hourVolumeError;

      const volumePerHour = hourVolumeData?.map(item => ({
        hora: item.hora.substring(0, 5), // Pegar apenas HH:MM
        volume: Math.round(parseFloat(item.total_realizado))
      })) || [];

      // Atualizar estado com dados temporais
      setData(prev => ({
        ...prev,
        charts: {
          ...prev.charts,
          efficiencyOverTime,
          volumePerHour,
        },
        loading: { ...prev.loading, temporal: false }
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar dados temporais:', error);
      setData(prev => ({
        ...prev,
        loading: { ...prev.loading, temporal: false },
        errors: { ...prev.errors, temporal: 'Erro ao carregar dados temporais' }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Função para refetch de todos os dados
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchQuantitativeData(),
      fetchQualitativeData(),
      fetchTemporalData()
    ]);
  }, [fetchQuantitativeData, fetchQualitativeData, fetchTemporalData]);

  // Effect para carregar dados quando filtros mudarem
  useEffect(() => {
    if (organization?.id) {
      refetch();
    }
  }, [organization?.id, filters, refetch]);

  return {
    data,
    refetch,
    isLoading: Object.values(data.loading).some(loading => loading),
    hasErrors: Object.values(data.errors).some(error => error !== null)
  };
};