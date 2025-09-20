import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCarregamentoData, CarregamentoFilters } from './useCarregamentoData';

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

  // Converter os parâmetros para o formato de filtros do novo hook
  const filters: CarregamentoFilters = useMemo(() => ({
    startDate: startDate || null,
    endDate: endDate || null,
    preset: 'custom'
  }), [startDate?.getTime?.(), endDate?.getTime?.()]);

  // Usar o novo hook de carregamento
  const { data: carregamentoData, isLoading, hasErrors, refetch } = useCarregamentoData(filters);

  // Estados para manter compatibilidade com a interface antiga
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar estados de loading e error com o novo hook
  useEffect(() => {
    setLoading(isLoading);
    setError(hasErrors ? 'Erro ao carregar dados. Por favor, tente novamente.' : null);
  }, [isLoading, hasErrors]);

  return {
    loading,
    error,
    ingredientConsumption: carregamentoData.charts.ingredientConsumption as IngredientData[],
    consumptionShare: carregamentoData.charts.consumptionShare as WagonData[],
    plannedVsActual: carregamentoData.charts.plannedVsActual as IngredientData[],
    efficiencyByLoad: carregamentoData.charts.efficiencyByLoad as LoadData[],
    deviationByLoadAndWagon: carregamentoData.charts.deviationByLoadAndWagon as LoadData[],
    efficiencyDistribution: carregamentoData.charts.efficiencyDistribution as StatusData[],
    ingredientsByVolume: carregamentoData.charts.ingredientsByVolume as IngredientData[],
    volumeByDiet: carregamentoData.charts.volumeByDiet as DietData[],
    avgDeviationByIngredient: carregamentoData.charts.avgDeviationByIngredient as IngredientData[],
    volumeByWagon: carregamentoData.charts.volumeByWagon as WagonData[],
    efficiencyOverTime: carregamentoData.charts.efficiencyOverTime as HourData[],
    volumePerHour: carregamentoData.charts.volumePerHour as HourData[],
    refetch
  };
};
