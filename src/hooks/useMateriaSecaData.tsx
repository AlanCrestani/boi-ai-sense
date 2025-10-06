import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export interface CurralData {
  curral: string; // Agora representa o lote
  dados: {
    data: string;
    dia: string;
    curral?: string; // Curral onde o lote estava nesta data
    previsto: number;
    realizado: number;
    variacao: number;
    variacaoPercentual: number;
    escore: number;
  }[];
}

export const useMateriaSecaData = () => {
  const { organization } = useAuth();
  const [currentCurralIndex, setCurrentCurralIndex] = useState(0);

  const query = useQuery({
    queryKey: ['materia-seca-currais', organization?.id],
    queryFn: async () => {
      console.log('useMateriaSecaData - Iniciando queryFn');

      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useMateriaSecaData - Usando orgId:', orgId);

      // Buscar a data mais recente disponível
      const { data: latestDateData, error: latestDateError } = await supabase
        .from('fato_historico_consumo')
        .select('data')
        .eq('organization_id', orgId)
        .order('data', { ascending: false })
        .limit(1);

      if (latestDateError) throw latestDateError;
      if (!latestDateData || latestDateData.length === 0) {
        return [];
      }

      const latestDate = new Date(latestDateData[0].data);
      console.log('useMateriaSecaData - Data mais recente:', latestDate.toISOString().split('T')[0]);

      // Calcular a data de 13 dias atrás (para ter 14 dias no total)
      const startDate = new Date(latestDate);
      startDate.setDate(startDate.getDate() - 13);

      // Para filtrar currais, vamos buscar apenas currais que tenham dados recentes (últimos 5 dias)
      const recentDate = new Date(latestDate);
      recentDate.setDate(recentDate.getDate() - 4); // 5 dias incluindo hoje
      const recentDateStr = recentDate.toISOString().split('T')[0];
      console.log('useMateriaSecaData - Filtro de currais ativos (últimos 5 dias):', recentDateStr, 'até', latestDate.toISOString().split('T')[0]);

      // Formatar as datas para o filtro
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = latestDate.toISOString().split('T')[0];

      // Primeiro: buscar currais que tenham dados recentes (últimos 5 dias)
      const { data: recentCurraisData, error: recentError } = await supabase
        .from('fato_historico_consumo')
        .select('curral')
        .order('curral')
        .eq('organization_id', orgId)
        .gte('data', recentDateStr)
        .lte('data', endDateStr)
        .not('curral', 'is', null)
        .not('cms_previsto_kg', 'is', null)
        .not('cms_realizado_kg', 'is', null);

      if (recentError) throw recentError;

      console.log('useMateriaSecaData - Currais com dados recentes encontrados:', recentCurraisData?.length || 0);

      if (!recentCurraisData || recentCurraisData.length === 0) {
        console.log('useMateriaSecaData - Nenhum curral com dados recentes encontrado, retornando array vazio');
        return [];
      }

      // Extrair lista de currais únicos com dados recentes
      const uniqueCurrais = [...new Set(recentCurraisData.map(item => item.curral))];
      console.log('useMateriaSecaData - Lista de currais únicos ativos:', uniqueCurrais);
      const recentCurraisList = uniqueCurrais;

      // Segundo: buscar 14 dias de histórico apenas para currais com dados recentes
      const { data: rawData, error: rawError } = await supabase
        .from('fato_historico_consumo')
        .select('data, curral, lote, cms_previsto_kg, cms_realizado_kg, escore')
        .eq('organization_id', orgId)
        .gte('data', startDateStr)
        .lte('data', endDateStr)
        .in('curral', recentCurraisList)
        .not('curral', 'is', null)
        .not('lote', 'is', null)
        .not('cms_previsto_kg', 'is', null)
        .not('cms_realizado_kg', 'is', null)
        .order('lote', { ascending: true })
        .order('data', { ascending: true });

      if (rawError) throw rawError;

      if (!rawData || rawData.length === 0) {
        return [];
      }

      // Agrupar dados por lote (que inclui a informação do curral por data)
      const loteMap: Record<string, any[]> = {};

      rawData.forEach(item => {
        const lote = item.lote;
        if (!loteMap[lote]) {
          loteMap[lote] = [];
        }

        const dateObj = new Date(item.data + 'T00:00:00');
        const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dia = dias[dateObj.getDay()];

        const previsto = item.cms_previsto_kg || 0;
        const realizado = item.cms_realizado_kg || 0;
        const escore = item.escore || 0;
        const variacao = realizado - previsto;
        const variacaoPercentual = previsto > 0 ? (variacao / previsto) * 100 : 0;

        loteMap[lote].push({
          data: item.data,
          dia,
          curral: item.curral, // Mantém informação do curral para cada data
          previsto: parseFloat(previsto.toFixed(2)),
          realizado: parseFloat(realizado.toFixed(2)),
          variacao: parseFloat(variacao.toFixed(2)),
          variacaoPercentual: parseFloat(variacaoPercentual.toFixed(2)),
          escore: parseFloat(escore.toFixed(1))
        });
      });

      // Converter para array de lotes (mas mantendo interface de currais para compatibilidade)
      const lotesData: CurralData[] = Object.entries(loteMap)
        .map(([lote, dados]) => ({
          curral: lote, // Usa lote como identificador principal
          dados: dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
        }))
        .sort((a, b) => {
          // Ordenar por lote alfabeticamente
          return a.curral.localeCompare(b.curral);
        });

      console.log('useMateriaSecaData - Lotes encontrados:', lotesData.length);
      console.log('useMateriaSecaData - Primeiro lote:', lotesData[0]?.curral);

      return lotesData;
    },
    enabled: true,
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });

  const nextCurral = () => {
    if (query.data && query.data.length > 0) {
      setCurrentCurralIndex((prev) => (prev + 1) % query.data.length);
    }
  };

  const prevCurral = () => {
    if (query.data && query.data.length > 0) {
      setCurrentCurralIndex((prev) => (prev - 1 + query.data.length) % query.data.length);
    }
  };

  const currentCurralData = query.data && query.data.length > 0
    ? query.data[currentCurralIndex]
    : null;


  return {
    ...query,
    currentCurralData,
    currentCurralIndex,
    totalCurrais: query.data?.length || 0,
    nextCurral,
    prevCurral,
    setCurrentCurralIndex
  };
};