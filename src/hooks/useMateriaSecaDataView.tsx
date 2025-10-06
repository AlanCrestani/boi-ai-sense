import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export interface MateriaSecaViewData {
  curral_lote: string;
  dados: {
    data: string;
    dia: string;
    previsto: number;
    realizado: number;
    desvio_kg_abs: number;
    desvio_abs_pc: number;
    escore: number;
    status: string;
    media_movel_4_dias: number;
    qtd_animais?: number;
    cms_realizado_pcpv?: number;
    peso_estimado_kg?: number;
    dias_confinados?: number;
  }[];
}

export interface MateriaSecaMetrics {
  qtd_animais: number;
  peso_estimado_kg: number;
  cms_realizado_pcpv: number;
  dias_confinados: number;
}

export const useMateriaSecaDataView = () => {
  const { organization } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  const query = useQuery({
    queryKey: ['materia-seca-view', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('Organization ID not found');
      }

      // Buscar a data mais recente disponível
      const { data: latestDateData, error: latestDateError } = await supabase
        .from('view_consumo_materia_seca')
        .select('data')
        .eq('organization_id', organization.id)
        .order('data', { ascending: false })
        .limit(1);

      if (latestDateError) throw latestDateError;
      if (!latestDateData || latestDateData.length === 0) {
        return [];
      }

      const latestDate = new Date(latestDateData[0].data);

      // Calcular a data de 13 dias atrás (para ter 14 dias no total)
      const startDate = new Date(latestDate);
      startDate.setDate(startDate.getDate() - 13);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = latestDate.toISOString().split('T')[0];

      // Buscar dados da view
      const { data: viewData, error: viewError } = await supabase
        .from('view_consumo_materia_seca')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('data', startDateStr)
        .lte('data', endDateStr)
        .order('curral_lote', { ascending: true })
        .order('data', { ascending: true });

      if (viewError) throw viewError;

      if (!viewData || viewData.length === 0) {
        return [];
      }

      // Primeiro, identificar a posição atual (curral) de cada lote na data mais recente
      const lotesPosicaoAtual: Record<string, string> = {}; // lote -> curral_lote atual

      viewData.forEach(item => {
        if (item.data === endDateStr) {
          lotesPosicaoAtual[item.lote] = item.curral_lote;
        }
      });

      // Agrupar dados por LOTE (não por curral_lote), mas usar o curral_lote atual como chave
      const loteDataMap: Record<string, any[]> = {};

      viewData.forEach(item => {
        const lote = item.lote;
        const curralLoteAtual = lotesPosicaoAtual[lote];

        // Só processar lotes que têm posição atual conhecida
        if (!curralLoteAtual) {
          return;
        }

        if (!loteDataMap[curralLoteAtual]) {
          loteDataMap[curralLoteAtual] = [];
        }

        const dateObj = new Date(item.data + 'T00:00:00');
        const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dia = dias[dateObj.getDay()];

        loteDataMap[curralLoteAtual].push({
          data: item.data,
          dia,
          previsto: parseFloat((item.cms_previsto_kg || 0).toFixed(2)),
          realizado: parseFloat((item.cms_realizado_kg || 0).toFixed(2)),
          desvio_kg_abs: parseFloat((item.desvio_kg_abs || 0).toFixed(2)),
          desvio_abs_pc: parseFloat((item.desvio_abs_pc || 0).toFixed(2)),
          escore: parseFloat((item.escore || 0).toFixed(1)),
          status: item.status,
          media_movel_4_dias: parseFloat((item.media_movel_4_dias || 0).toFixed(2)),
          qtd_animais: item.qtd_animais || 0,
          cms_realizado_pcpv: parseFloat((item.cms_realizado_pcpv || 0).toFixed(2)),
          peso_estimado_kg: parseFloat((item.peso_estimado_kg || 0).toFixed(2)),
          dias_confinados: item.dias_confinados || 0,
          curral_origem: item.curral // Guardar o curral onde estava naquele dia
        });
      });

      // Converter para array
      const result: MateriaSecaViewData[] = Object.entries(loteDataMap)
        .map(([curralLote, dados]) => ({
          curral_lote: curralLote,
          dados: dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
        }))
        .sort((a, b) => a.curral_lote.localeCompare(b.curral_lote));

      return result;
    },
    enabled: !!organization?.id,
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });

  const next = () => {
    if (query.data && query.data.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % query.data.length);
    }
  };

  const prev = () => {
    if (query.data && query.data.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + query.data.length) % query.data.length);
    }
  };

  const currentData = query.data && query.data.length > 0
    ? query.data[currentIndex]
    : null;

  // Calcular métricas agregadas do lote atual (última data com dados válidos)
  const currentMetrics: MateriaSecaMetrics | null = currentData && currentData.dados.length > 0
    ? (() => {
        // Buscar o último dia que tem cms_realizado_pcpv > 0 (dados válidos)
        const lastDayWithData = [...currentData.dados]
          .reverse()
          .find(d => d.cms_realizado_pcpv && d.cms_realizado_pcpv > 0);

        // Se não encontrar, usar o último dia mesmo
        const lastDayData = lastDayWithData || currentData.dados[currentData.dados.length - 1];

        return {
          qtd_animais: lastDayData.qtd_animais || 0,
          peso_estimado_kg: lastDayData.peso_estimado_kg || 0,
          cms_realizado_pcpv: lastDayData.cms_realizado_pcpv || 0,
          dias_confinados: lastDayData.dias_confinados || 0,
        };
      })()
    : null;

  return {
    ...query,
    currentData,
    currentIndex,
    total: query.data?.length || 0,
    next,
    prev,
    setCurrentIndex,
    currentMetrics
  };
};