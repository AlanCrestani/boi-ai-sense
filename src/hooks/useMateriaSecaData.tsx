import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MateriaSecaData {
  data: string;
  dia: string;
  previsto: number;
  realizado: number;
  totalAnimais: number;
  variacao: number;
  variacaoPercentual: number;
}

export const useMateriaSecaData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['materia-seca', organization?.id],
    queryFn: async () => {
      console.log('useMateriaSecaData - Iniciando queryFn');

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useMateriaSecaData - Usando orgId:', orgId);

      // Primeiro, buscar a data mais recente disponível
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

      // Calcular a data de 6 dias atrás (para ter 7 dias no total)
      const startDate = new Date(latestDate);
      startDate.setDate(startDate.getDate() - 6);

      // Formatar as datas para o filtro
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = latestDate.toISOString().split('T')[0];

      // Buscar os dados agregados dos últimos 7 dias
      const { data, error } = await supabase.rpc('get_materia_seca_summary', {
        p_organization_id: orgId,
        p_start_date: startDateStr,
        p_end_date: endDateStr
      });

      if (error) {
        // Se a função RPC não existir, fazer a query diretamente
        const { data: rawData, error: rawError } = await supabase
          .from('fato_historico_consumo')
          .select('data, cms_previsto_kg, cms_realizado_kg, qtd_animais')
          .eq('organization_id', orgId)
          .gte('data', startDateStr)
          .lte('data', endDateStr)
          .not('cms_previsto_kg', 'is', null)
          .not('cms_realizado_kg', 'is', null)
          .gt('qtd_animais', 0);

        if (rawError) throw rawError;

        // Agrupar e calcular médias ponderadas + variações individuais
        const groupedData = rawData.reduce((acc: any, curr) => {
          const date = curr.data;
          if (!acc[date]) {
            acc[date] = {
              totalPrevisto: 0,
              totalRealizado: 0,
              totalAnimais: 0,
              variacoesPercentuais: []
            };
          }
          acc[date].totalPrevisto += curr.cms_previsto_kg * curr.qtd_animais;
          acc[date].totalRealizado += curr.cms_realizado_kg * curr.qtd_animais;
          acc[date].totalAnimais += curr.qtd_animais;

          // Calcular variação percentual individual para cada curral
          const variacaoIndividual = curr.cms_previsto_kg > 0
            ? ((curr.cms_realizado_kg - curr.cms_previsto_kg) / curr.cms_previsto_kg) * 100
            : 0;
          acc[date].variacoesPercentuais.push(variacaoIndividual);

          return acc;
        }, {});

        // Converter para o formato final
        const processedData = Object.entries(groupedData)
          .map(([date, values]: [string, any]) => {
            const previsto = values.totalPrevisto / values.totalAnimais;
            const realizado = values.totalRealizado / values.totalAnimais;

            // Usar a média das variações percentuais individuais (mais representativa)
            const variacaoPercentual = values.variacoesPercentuais.length > 0
              ? values.variacoesPercentuais.reduce((sum: number, val: number) => sum + val, 0) / values.variacoesPercentuais.length
              : 0;

            // Calcular variação em kg baseada na variação percentual para manter consistência
            const variacao = previsto > 0 ? (previsto * variacaoPercentual) / 100 : 0;

            // Obter o dia da semana em português
            const dateObj = new Date(date + 'T00:00:00');
            const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const dia = dias[dateObj.getDay()];

            return {
              data: date,
              dia,
              previsto: parseFloat(previsto.toFixed(2)),
              realizado: parseFloat(realizado.toFixed(2)),
              totalAnimais: values.totalAnimais,
              variacao: parseFloat(variacao.toFixed(2)),
              variacaoPercentual: parseFloat(variacaoPercentual.toFixed(2))
            } as MateriaSecaData;
          })
          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        console.log('useMateriaSecaData - Dados processados:', processedData);
        return processedData;
      }

      // Se a função RPC existir, processar os dados retornados
      console.log('useMateriaSecaData - Dados da RPC:', data);
      return data || [];
    },
    enabled: true, // Sempre habilitado, usando o ID padrão quando necessário
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};