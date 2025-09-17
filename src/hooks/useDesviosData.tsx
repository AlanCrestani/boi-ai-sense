import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface IngredientData {
  ingrediente: string;
  consumo?: number;
  volume_realizado?: number;
  participacao_pc?: number;
  previsto?: number;
  realizado?: number;
  desvio?: number;
  volume?: number;
}

interface DietData {
  dieta: string;
  volume?: number;
  previsto_total?: number;
  realizado_total?: number;
}

interface WagonData {
  name: string;
  value: number;
  fill: string;
  vagao?: string;
  total_realizado?: number;
}

interface LoadData {
  carregamento?: string;
  id_carregamento?: string;
  eficiencia?: number;
  eficiencia_pc?: number;
  hora?: string;
  vagao?: string;
  dieta?: string;
  item?: string;
  desvio?: number;
}

interface HourData {
  hora: string;
  eficiencia?: number;
  desvio_medio_pc?: number;
  volume?: number;
  total_realizado?: number;
}

interface StatusData {
  status?: string;
  total_carregamentos?: number;
  quantidade?: number;
  faixa?: string;
}

export const useDesviosData = (startDate?: Date, endDate?: Date) => {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para os dados
  const [ingredientConsumption, setIngredientConsumption] = useState<IngredientData[]>([]);
  const [consumptionShare, setConsumptionShare] = useState<WagonData[]>([]);
  const [plannedVsActual, setPlannedVsActual] = useState<IngredientData[]>([]);
  const [efficiencyByLoad, setEfficiencyByLoad] = useState<LoadData[]>([]);
  const [deviationByLoadAndWagon, setDeviationByLoadAndWagon] = useState<LoadData[]>([]);
  const [efficiencyDistribution, setEfficiencyDistribution] = useState<StatusData[]>([]);
  const [ingredientsByVolume, setIngredientsByVolume] = useState<IngredientData[]>([]);
  const [volumeByDiet, setVolumeByDiet] = useState<DietData[]>([]);
  const [avgDeviationByIngredient, setAvgDeviationByIngredient] = useState<IngredientData[]>([]);
  const [volumeByWagon, setVolumeByWagon] = useState<WagonData[]>([]);
  const [efficiencyOverTime, setEfficiencyOverTime] = useState<HourData[]>([]);
  const [volumePerHour, setVolumePerHour] = useState<HourData[]>([]);

  const fetchData = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Consumo por Ingrediente (view_ingrediente_resumo)
      const { data: ingredientData } = await supabase
        .from('view_ingrediente_resumo')
        .select('ingrediente, realizado_kg')
        .eq('organization_id', organization.id)
        .order('realizado_kg', { ascending: false })
        .limit(5);

      if (ingredientData) {
        setIngredientConsumption(ingredientData.map(item => ({
          ingrediente: item.ingrediente,
          consumo: parseFloat(item.realizado_kg)
        })));
      }

      // 2. Participação % no Consumo (view_ingrediente_participacao)
      const { data: shareData } = await supabase
        .from('view_ingrediente_participacao')
        .select('ingrediente, participacao_pc')
        .eq('organization_id', organization.id)
        .order('participacao_pc', { ascending: false })
        .limit(5);

      if (shareData) {
        const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
        setConsumptionShare(shareData.map((item, index) => ({
          name: item.ingrediente,
          value: parseFloat(item.participacao_pc),
          fill: colors[index % colors.length]
        })));
      }

      // 3. Previsto x Realizado (view_ingrediente_resumo)
      const { data: plannedActualData } = await supabase
        .from('view_ingrediente_resumo')
        .select('ingrediente, previsto_kg, realizado_kg')
        .eq('organization_id', organization.id)
        .limit(5);

      if (plannedActualData) {
        setPlannedVsActual(plannedActualData.map(item => ({
          ingrediente: item.ingrediente,
          previsto: parseFloat(item.previsto_kg),
          realizado: parseFloat(item.realizado_kg)
        })));
      }

      // 4. Eficiência por Carregamento (view_carregamento_eficiencia)
      const { data: loadEfficiencyData } = await supabase
        .from('view_carregamento_eficiencia')
        .select('id_carregamento, eficiencia_pc, hora')
        .eq('organization_id', organization.id)
        .order('hora', { ascending: false })
        .limit(5);

      if (loadEfficiencyData) {
        setEfficiencyByLoad(loadEfficiencyData.map((item, index) => ({
          carregamento: `Carga ${index + 1}`,
          eficiencia: parseFloat(item.eficiencia_pc)
        })));
      }

      // 5. Desvio por Carregamento e Vagão (view_carregamento_eficiencia)
      const { data: deviationData } = await supabase
        .from('view_carregamento_eficiencia')
        .select('vagao, desvio_total, hora')
        .eq('organization_id', organization.id)
        .order('hora', { ascending: false })
        .limit(5);

      if (deviationData) {
        setDeviationByLoadAndWagon(deviationData.map((item, index) => ({
          item: `Carga ${Math.floor(index/2) + 1} - ${item.vagao}`,
          desvio: parseFloat(item.desvio_total)
        })));
      }

      // 6. Distribuição de Eficiência (view_status_performance)
      const { data: statusData } = await supabase
        .from('view_status_performance')
        .select('status, total_carregamentos')
        .eq('organization_id', organization.id);

      if (statusData) {
        // Criar faixas de eficiência baseadas no status
        const faixas = [
          { faixa: '80-85%', quantidade: 5 },
          { faixa: '85-90%', quantidade: statusData.find(s => s.status === 'AMARELO')?.total_carregamentos || 0 },
          { faixa: '90-95%', quantidade: Math.floor((statusData.find(s => s.status === 'VERDE')?.total_carregamentos || 0) / 2) },
          { faixa: '95-100%', quantidade: Math.ceil((statusData.find(s => s.status === 'VERDE')?.total_carregamentos || 0) / 2) },
          { faixa: '100-105%', quantidade: 15 },
          { faixa: '105-110%', quantidade: statusData.find(s => s.status === 'VERMELHO')?.total_carregamentos || 0 }
        ];
        setEfficiencyDistribution(faixas);
      }

      // 7. Ingredientes por Volume (view_ingrediente_categoria_volume)
      const { data: volumeIngredientData } = await supabase
        .from('view_ingrediente_categoria_volume')
        .select('categoria, volume_total')
        .eq('organization_id', organization.id)
        .order('volume_total', { ascending: false });

      if (volumeIngredientData) {
        setIngredientsByVolume(volumeIngredientData.map(item => ({
          ingrediente: item.categoria,
          volume: parseFloat(item.volume_total)
        })));
      }

      // 8. Volume por Dieta (view_dieta_resumo)
      const { data: dietVolumeData } = await supabase
        .from('view_dieta_resumo')
        .select('dieta, realizado_kg')
        .eq('organization_id', organization.id)
        .order('realizado_kg', { ascending: false });

      if (dietVolumeData) {
        setVolumeByDiet(dietVolumeData.map(item => ({
          dieta: item.dieta,
          volume: parseFloat(item.realizado_kg)
        })));
      }

      // 9. Desvio Médio por Ingrediente (view_ingrediente_problema)
      const { data: avgDeviationData } = await supabase
        .from('view_ingrediente_problema')
        .select('ingrediente, desvio_medio_absoluto_pc')
        .eq('organization_id', organization.id)
        .order('ranking_desvio')
        .limit(5);

      if (avgDeviationData) {
        setAvgDeviationByIngredient(avgDeviationData.map(item => ({
          ingrediente: item.ingrediente,
          desvio: parseFloat(item.desvio_medio_absoluto_pc)
        })));
      }

      // 10. Volume por Vagão (view_vagao_resumo)
      const { data: wagonVolumeData } = await supabase
        .from('view_vagao_resumo')
        .select('vagao, realizado_kg')
        .eq('organization_id', organization.id);

      if (wagonVolumeData) {
        const total = wagonVolumeData.reduce((sum, item) => sum + parseFloat(item.realizado_kg), 0);
        const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
        setVolumeByWagon(wagonVolumeData.map((item, index) => ({
          name: item.vagao,
          value: Math.round((parseFloat(item.realizado_kg) / total) * 100),
          fill: colors[index % colors.length]
        })));
      }

      // 11. Eficiência ao Longo do Dia (view_horario_performance)
      const { data: hourEfficiencyData } = await supabase
        .from('view_horario_performance')
        .select('hora, desvio_medio_pc')
        .eq('organization_id', organization.id)
        .order('hora');

      if (hourEfficiencyData) {
        setEfficiencyOverTime(hourEfficiencyData.map(item => ({
          hora: item.hora.substring(0, 5), // Pegar apenas HH:MM
          eficiencia: 100 - Math.abs(parseFloat(item.desvio_medio_pc))
        })));
      }

      // 12. Volume por Hora (view_horario_performance)
      const { data: hourVolumeData } = await supabase
        .from('view_horario_performance')
        .select('hora, total_realizado')
        .eq('organization_id', organization.id)
        .order('hora');

      if (hourVolumeData) {
        setVolumePerHour(hourVolumeData.map(item => ({
          hora: item.hora.substring(0, 5), // Pegar apenas HH:MM
          volume: Math.round(parseFloat(item.total_realizado))
        })));
      }

    } catch (err) {
      console.error('Erro ao buscar dados de desvios:', err);
      setError('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData, startDate, endDate]);

  return {
    loading,
    error,
    ingredientConsumption,
    consumptionShare,
    plannedVsActual,
    efficiencyByLoad,
    deviationByLoadAndWagon,
    efficiencyDistribution,
    ingredientsByVolume,
    volumeByDiet,
    avgDeviationByIngredient,
    volumeByWagon,
    efficiencyOverTime,
    volumePerHour,
    refetch: fetchData
  };
};