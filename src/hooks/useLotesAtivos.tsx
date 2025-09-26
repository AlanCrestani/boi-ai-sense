import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LotesAtivosData {
  totalLotes: number;
  dataAtualizacao: string;
  variacaoOntem: number;
  percentualVariacao: number;
  totalRegistros: number;
  totalAnimais: number;
}

export const useLotesAtivos = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['lotes-ativos', organization?.id],
    queryFn: async (): Promise<LotesAtivosData> => {
      console.log('useLotesAtivos - Iniciando queryFn');

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useLotesAtivos - Usando orgId:', orgId);

      // Buscar a data mais recente disponível
      const { data: latestDateData, error: latestDateError } = await supabase
        .from('fato_historico_consumo')
        .select('data')
        .eq('organization_id', orgId)
        .order('data', { ascending: false })
        .limit(1);

      if (latestDateError) throw latestDateError;
      if (!latestDateData || latestDateData.length === 0) {
        return {
          totalLotes: 0,
          dataAtualizacao: new Date().toISOString().split('T')[0],
          variacaoOntem: 0,
          percentualVariacao: 0,
          totalRegistros: 0,
          totalAnimais: 0
        };
      }

      const latestDate = latestDateData[0].data;

      // Buscar lotes distintos da última data
      const { data: currentData, error: currentError } = await supabase
        .from('fato_historico_consumo')
        .select('lote, qtd_animais')
        .eq('organization_id', orgId)
        .eq('data', latestDate)
        .not('lote', 'is', null);

      if (currentError) throw currentError;

      // Contar lotes distintos
      const lotesUnicos = new Set(currentData.map(item => item.lote));
      const totalLotesHoje = lotesUnicos.size;
      const totalAnimaisHoje = currentData.reduce((sum, item) => sum + (item.qtd_animais || 0), 0);

      // Buscar dados do dia anterior para comparação
      const previousDate = new Date(latestDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      const { data: previousData, error: previousError } = await supabase
        .from('fato_historico_consumo')
        .select('lote')
        .eq('organization_id', orgId)
        .eq('data', previousDateStr)
        .not('lote', 'is', null);

      if (previousError || !previousData || previousData.length === 0) {
        // Se não houver dados do dia anterior, retornar sem variação
        return {
          totalLotes: totalLotesHoje,
          dataAtualizacao: latestDate,
          variacaoOntem: 0,
          percentualVariacao: 0,
          totalRegistros: currentData.length,
          totalAnimais: totalAnimaisHoje
        };
      }

      // Contar lotes distintos do dia anterior
      const lotesUnicosOntem = new Set(previousData.map(item => item.lote));
      const totalLotesOntem = lotesUnicosOntem.size;

      const variacaoOntem = totalLotesHoje - totalLotesOntem;
      const percentualVariacao = totalLotesOntem > 0
        ? ((variacaoOntem / totalLotesOntem) * 100)
        : 0;

      console.log('useLotesAtivos - Dados retornados:', {
        totalLotesHoje,
        totalLotesOntem,
        variacaoOntem,
        percentualVariacao
      });

      return {
        totalLotes: totalLotesHoje,
        dataAtualizacao: latestDate,
        variacaoOntem,
        percentualVariacao: parseFloat(percentualVariacao.toFixed(1)),
        totalRegistros: currentData.length,
        totalAnimais: totalAnimaisHoje
      };
    },
    enabled: true, // Sempre habilitado, usando o ID padrão quando necessário
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};