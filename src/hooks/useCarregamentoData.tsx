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

  // Buscar dados das views otimizadas
  const fetchAllData = useCallback(async () => {
    if (!organization?.id) {
      return;
    }

    setData(prev => ({
      ...prev,
      loading: { quantitative: true, qualitative: true, temporal: true },
      errors: { quantitative: null, qualitative: null, temporal: null }
    }));

    try {
      // Buscar dados de diferentes views em paralelo
      const [
        ingredienteResumoResult,
        ingredienteParticipacaoResult,
        carregamentoEficienciaResult,
        volumePorDietaResult,
        eficienciaDistribuicaoResult,
        volumePorVagaoResult,
        eficienciaTemporalResult
      ] = await Promise.all([
        // 1. View de resumo de ingredientes
        supabase
          .from('view_ingrediente_resumo')
          .select('*')
          .eq('organization_id', organization.id)
          .gte('data', filters?.startDate?.toISOString().split('T')[0] || '2024-01-01')
          .lte('data', filters?.endDate?.toISOString().split('T')[0] || '2024-12-31'),

        // 2. View de participação dos ingredientes
        supabase
          .from('view_ingrediente_participacao')
          .select('*')
          .eq('organization_id', organization.id)
          .gte('data', filters?.startDate?.toISOString().split('T')[0] || '2024-01-01')
          .lte('data', filters?.endDate?.toISOString().split('T')[0] || '2024-12-31'),

        // 3. View de eficiência dos carregamentos
        supabase
          .from('view_carregamento_eficiencia')
          .select('*')
          .eq('organization_id', organization.id)
          .gte('data', filters?.startDate?.toISOString().split('T')[0] || '2024-01-01')
          .lte('data', filters?.endDate?.toISOString().split('T')[0] || '2024-12-31'),

        // 4. View de volume por dieta
        supabase
          .from('view_volume_por_dieta')
          .select('*')
          .eq('organization_id', organization.id)
          .gte('data', filters?.startDate?.toISOString().split('T')[0] || '2024-01-01')
          .lte('data', filters?.endDate?.toISOString().split('T')[0] || '2024-12-31'),

        // 5. View de distribuição de eficiência
        supabase
          .from('view_eficiencia_distribuicao')
          .select('*')
          .eq('organization_id', organization.id)
          .gte('data', filters?.startDate?.toISOString().split('T')[0] || '2024-01-01')
          .lte('data', filters?.endDate?.toISOString().split('T')[0] || '2024-12-31'),

        // 6. View de volume por vagão
        supabase
          .from('view_volume_por_vagao')
          .select('*')
          .eq('organization_id', organization.id)
          .gte('data', filters?.startDate?.toISOString().split('T')[0] || '2024-01-01')
          .lte('data', filters?.endDate?.toISOString().split('T')[0] || '2024-12-31'),

        // 7. View de eficiência temporal
        supabase
          .from('view_eficiencia_temporal')
          .select('*')
          .eq('organization_id', organization.id)
          .gte('data', filters?.startDate?.toISOString().split('T')[0] || '2024-01-01')
          .lte('data', filters?.endDate?.toISOString().split('T')[0] || '2024-12-31')
      ]);

      // Verificar erros
      if (ingredienteResumoResult.error) throw ingredienteResumoResult.error;
      if (ingredienteParticipacaoResult.error) throw ingredienteParticipacaoResult.error;
      if (carregamentoEficienciaResult.error) throw carregamentoEficienciaResult.error;
      if (volumePorDietaResult.error) throw volumePorDietaResult.error;
      if (eficienciaDistribuicaoResult.error) throw eficienciaDistribuicaoResult.error;
      if (volumePorVagaoResult.error) throw volumePorVagaoResult.error;
      if (eficienciaTemporalResult.error) throw eficienciaTemporalResult.error;

      const ingredienteResumo = ingredienteResumoResult.data || [];
      const ingredienteParticipacao = ingredienteParticipacaoResult.data || [];
      const carregamentoEficiencia = carregamentoEficienciaResult.data || [];
      const volumePorDieta = volumePorDietaResult.data || [];
      const eficienciaDistribuicao = eficienciaDistribuicaoResult.data || [];
      const volumePorVagao = volumePorVagaoResult.data || [];
      const eficienciaTemporal = eficienciaTemporalResult.data || [];

      // Verificar se há dados
      if (ingredienteResumo.length === 0 && carregamentoEficiencia.length === 0) {
        setData(prev => ({
          ...prev,
          loading: { quantitative: false, qualitative: false, temporal: false }
        }));
        return;
      }

      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

      // 1. Consumo por Ingrediente (da view_ingrediente_resumo)
      const ingredientConsumption = ingredienteResumo
        .reduce((acc, item) => {
          const existing = acc.find(x => x.ingrediente === item.ingrediente);
          if (existing) {
            existing.consumo += parseFloat(item.realizado_kg || 0);
          } else {
            acc.push({
              ingrediente: item.ingrediente,
              consumo: parseFloat(item.realizado_kg || 0)
            });
          }
          return acc;
        }, [] as any[])
        .sort((a, b) => b.consumo - a.consumo)
        .slice(0, 5);

      // 2. Participação % no Consumo (da view_ingrediente_participacao)
      const consumptionShare = ingredienteParticipacao
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.ingrediente);
          if (existing) {
            existing.value = Math.max(existing.value, parseFloat(item.participacao_pc || 0));
          } else {
            acc.push({
              name: item.ingrediente,
              value: parseFloat(item.participacao_pc || 0)
            });
          }
          return acc;
        }, [] as any[])
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map((item, index) => ({
          ...item,
          fill: colors[index % colors.length]
        }));

      // 3. Previsto x Realizado (da view_ingrediente_resumo)
      const plannedVsActual = ingredienteResumo
        .reduce((acc, item) => {
          const existing = acc.find(x => x.ingrediente === item.ingrediente);
          if (existing) {
            existing.previsto += parseFloat(item.previsto_kg || 0);
            existing.realizado += parseFloat(item.realizado_kg || 0);
          } else {
            acc.push({
              ingrediente: item.ingrediente,
              previsto: parseFloat(item.previsto_kg || 0),
              realizado: parseFloat(item.realizado_kg || 0)
            });
          }
          return acc;
        }, [] as any[])
        .sort((a, b) => b.realizado - a.realizado)
        .slice(0, 5);

      // 4. Eficiência por Carregamento (da view_carregamento_eficiencia)
      const efficiencyByLoad = carregamentoEficiencia
        .filter(item => item.eficiencia && item.eficiencia > 0)
        .map(item => ({
          carregamento: item.carregamento || item.id_carregamento,
          eficiencia: parseFloat(item.eficiencia || 0)
        }))
        .sort((a, b) => b.eficiencia - a.eficiencia)
        .slice(0, 5);

      // 5. Desvio por Carregamento e Vagão (da view_carregamento_eficiencia)
      const deviationByLoadAndWagon = carregamentoEficiencia
        .filter(item => item.desvio_medio_pc && Math.abs(parseFloat(item.desvio_medio_pc)) > 0)
        .map(item => ({
          item: `${item.carregamento || item.id_carregamento} - ${item.vagao}`,
          desvio: Math.abs(parseFloat(item.desvio_medio_pc || 0))
        }))
        .sort((a, b) => b.desvio - a.desvio)
        .slice(0, 5);

      // 6. Distribuição de Eficiência (usando view_eficiencia_distribuicao)
      const efficiencyDistribution = eficienciaDistribuicao.map(item => ({
        faixa: item.faixa,
        quantidade: item.quantidade
      }));

      // 7. Volume por Dieta (usando view_volume_por_dieta)
      const volumeByDiet = volumePorDieta
        .map(item => ({
          dieta: item.dieta,
          volume: parseFloat(item.volume || 0)
        }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);

      // 8. Volume por Vagão (usando view_volume_por_vagao)
      const volumeByWagon = volumePorVagao
        .map((item, index) => ({
          name: item.vagao,
          value: parseFloat(item.total_realizado || 0),
          fill: colors[index % colors.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // 9. Desvio médio por ingrediente (da view_ingrediente_resumo)
      const avgDeviationByIngredient = ingredienteResumo
        .reduce((acc, item) => {
          const existing = acc.find(x => x.ingrediente === item.ingrediente);
          const desvio = Math.abs(parseFloat(item.desvio_pc || 0));
          if (existing) {
            existing.desvio = (existing.desvio + desvio) / 2;
          } else {
            acc.push({
              ingrediente: item.ingrediente,
              desvio
            });
          }
          return acc;
        }, [] as any[])
        .sort((a, b) => b.desvio - a.desvio)
        .slice(0, 5);

      // 10. Eficiência ao longo do tempo (usando view_eficiencia_temporal)
      const efficiencyOverTime = eficienciaTemporal
        .reduce((acc, item) => {
          const hora = item.hora.substring(0, 2) + ':00';
          const existing = acc.find(x => x.hora === hora);
          const eficiencia = parseFloat(item.eficiencia || 0);

          if (existing) {
            existing.eficiencia = (existing.eficiencia + eficiencia) / 2;
          } else {
            acc.push({ hora, eficiencia });
          }
          return acc;
        }, [] as any[])
        .sort((a, b) => a.hora.localeCompare(b.hora));

      // 11. Volume por hora (usando view_eficiencia_temporal)
      const volumePerHour = eficienciaTemporal
        .reduce((acc, item) => {
          const hora = item.hora.substring(0, 2) + ':00';
          const existing = acc.find(x => x.hora === hora);
          const volume = parseFloat(item.volume_total || 0);

          if (existing) {
            existing.volume += volume;
          } else {
            acc.push({ hora, volume });
          }
          return acc;
        }, [] as any[])
        .sort((a, b) => a.hora.localeCompare(b.hora));

      // Atualizar estado com todos os dados
      setData({
        charts: {
          ingredientConsumption,
          consumptionShare,
          plannedVsActual,
          efficiencyByLoad,
          deviationByLoadAndWagon,
          efficiencyDistribution,
          ingredientsByVolume: ingredientConsumption, // Reutilizar dados
          volumeByDiet,
          avgDeviationByIngredient,
          volumeByWagon,
          efficiencyOverTime,
          volumePerHour
        },
        loading: { quantitative: false, qualitative: false, temporal: false },
        errors: { quantitative: null, qualitative: null, temporal: null }
      });

    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: { quantitative: false, qualitative: false, temporal: false },
        errors: {
          quantitative: 'Erro ao carregar dados',
          qualitative: 'Erro ao carregar dados',
          temporal: 'Erro ao carregar dados'
        }
      }));
    }
  }, [
    organization?.id,
    // Dependências estáveis com base no tempo para evitar recriação desnecessária
    filters?.startDate ? filters.startDate.getTime() : null,
    filters?.endDate ? filters.endDate.getTime() : null,
  ]);

  // Carregar dados quando os filtros mudarem
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Computed properties
  const isLoading = data.loading.quantitative || data.loading.qualitative || data.loading.temporal;
  const hasErrors = !!(data.errors.quantitative || data.errors.qualitative || data.errors.temporal);

  return {
    data,
    isLoading,
    hasErrors,
    refetch: fetchAllData
  };
};
