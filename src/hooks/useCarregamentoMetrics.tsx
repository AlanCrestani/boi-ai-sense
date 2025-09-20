import { useMemo } from 'react';
import { CarregamentoCharts } from './useCarregamentoData';

export interface CarregamentoMetrics {
  totalDesvios: number;
  desvioMedio: number;
  totalCarregamentos: number;
  tendencia: 'up' | 'down' | 'stable';
  periodoAnalisado: string;
  eficienciaMedia: number;
  volumeTotal: number;
}

export interface UseCarregamentoMetricsReturn {
  metrics: CarregamentoMetrics;
  isLoading: boolean;
  hasData: boolean;
}

interface UseCarregamentoMetricsProps {
  charts: CarregamentoCharts;
  isLoading: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

export const useCarregamentoMetrics = ({
  charts,
  isLoading,
  startDate,
  endDate
}: UseCarregamentoMetricsProps): UseCarregamentoMetricsReturn => {

  const metrics = useMemo(() => {
    // Se ainda está carregando ou não há dados, retorna métricas vazias
    if (isLoading || !charts) {
      return {
        totalDesvios: 0,
        desvioMedio: 0,
        totalCarregamentos: 0,
        tendencia: 'stable' as const,
        periodoAnalisado: 'Carregando...',
        eficienciaMedia: 0,
        volumeTotal: 0
      };
    }

    // 1. Total de Desvios (contagem de registros com desvio > 0)
    const totalDesvios = charts.deviationByLoadAndWagon?.filter(item =>
      item.desvio && Math.abs(Number(item.desvio)) > 0
    ).length || 0;

    // 2. Desvio Médio (média dos desvios absolutos)
    const desviosValues = charts.avgDeviationByIngredient?.map(item =>
      Math.abs(Number(item.desvio || 0))
    ).filter(value => value > 0) || [];

    const desvioMedio = desviosValues.length > 0
      ? desviosValues.reduce((sum, value) => sum + value, 0) / desviosValues.length
      : 0;

    // 3. Total de Carregamentos (contagem única de carregamentos)
    const carregamentosUnicos = new Set();
    charts.efficiencyByLoad?.forEach(item => {
      if (item.carregamento) {
        carregamentosUnicos.add(item.carregamento);
      }
    });
    const totalCarregamentos = carregamentosUnicos.size;

    // 4. Eficiência Média
    const eficienciaValues = charts.efficiencyByLoad?.map(item =>
      Number(item.eficiencia || 0)
    ).filter(value => value > 0) || [];

    const eficienciaMedia = eficienciaValues.length > 0
      ? eficienciaValues.reduce((sum, value) => sum + value, 0) / eficienciaValues.length
      : 0;

    // 5. Volume Total (soma de todos os volumes)
    const volumeTotal = charts.volumeByDiet?.reduce((sum, item) =>
      sum + Number(item.volume || 0), 0
    ) || 0;

    // 6. Tendência (baseada na eficiência ao longo do tempo)
    let tendencia: 'up' | 'down' | 'stable' = 'stable';

    if (charts.efficiencyOverTime && charts.efficiencyOverTime.length > 1) {
      const sortedData = [...charts.efficiencyOverTime].sort((a, b) =>
        (a.hora || '').localeCompare(b.hora || '')
      );

      if (sortedData.length >= 2) {
        const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
        const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));

        const firstHalfAvg = firstHalf.reduce((sum, item) =>
          sum + Number(item.eficiencia || 0), 0
        ) / firstHalf.length;

        const secondHalfAvg = secondHalf.reduce((sum, item) =>
          sum + Number(item.eficiencia || 0), 0
        ) / secondHalf.length;

        const difference = secondHalfAvg - firstHalfAvg;

        if (difference > 2) {
          tendencia = 'up';
        } else if (difference < -2) {
          tendencia = 'down';
        } else {
          tendencia = 'stable';
        }
      }
    }

    // 7. Período Analisado
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    let periodoAnalisado = 'Todos os períodos';
    if (startDate && endDate) {
      if (startDate.getTime() === endDate.getTime()) {
        periodoAnalisado = formatDate(startDate);
      } else {
        periodoAnalisado = `${formatDate(startDate)} - ${formatDate(endDate)}`;
      }
    } else if (startDate) {
      periodoAnalisado = `A partir de ${formatDate(startDate)}`;
    } else if (endDate) {
      periodoAnalisado = `Até ${formatDate(endDate)}`;
    }

    return {
      totalDesvios,
      desvioMedio: Math.round(desvioMedio * 100) / 100, // 2 casas decimais
      totalCarregamentos,
      tendencia,
      periodoAnalisado,
      eficienciaMedia: Math.round(eficienciaMedia * 100) / 100, // 2 casas decimais
      volumeTotal: Math.round(volumeTotal)
    };
  }, [charts, isLoading, startDate, endDate]);

  const hasData = useMemo(() => {
    if (isLoading || !charts) return false;

    // Verifica se há pelo menos algum dado em qualquer chart
    const hasAnyData = Object.values(charts).some(chartData =>
      Array.isArray(chartData) && chartData.length > 0
    );

    return hasAnyData;
  }, [charts, isLoading]);

  return {
    metrics,
    isLoading,
    hasData
  };
};