import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DiasConfinamentoData {
  mediaDias: number;
  dataAtualizacao: string;
  variacaoOntem: number;
  percentualVariacao: number;
  totalRegistros: number;
  totalAnimais: number;
  minDias: number;
  maxDias: number;
}

export const useDiasConfinamento = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['dias-confinamento', organization?.id],
    queryFn: async (): Promise<DiasConfinamentoData> => {
      console.log('useDiasConfinamento - Iniciando queryFn');

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useDiasConfinamento - Usando orgId:', orgId);

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
          mediaDias: 0,
          dataAtualizacao: new Date().toISOString().split('T')[0],
          variacaoOntem: 0,
          percentualVariacao: 0,
          totalRegistros: 0,
          totalAnimais: 0,
          minDias: 0,
          maxDias: 0
        };
      }

      const latestDate = latestDateData[0].data;

      // Buscar dados de dias de confinamento da última data
      const { data: currentData, error: currentError } = await supabase
        .from('fato_historico_consumo')
        .select('dias_confinados, qtd_animais')
        .eq('organization_id', orgId)
        .eq('data', latestDate)
        .not('dias_confinados', 'is', null)
        .gt('qtd_animais', 0);

      if (currentError) throw currentError;

      // Calcular média ponderada dos dias de confinamento da última data
      const totalPonderado = currentData.reduce((sum, item) =>
        sum + (item.dias_confinados * item.qtd_animais), 0);
      const totalAnimais = currentData.reduce((sum, item) =>
        sum + item.qtd_animais, 0);
      const mediaDiasHoje = totalAnimais > 0 ? totalPonderado / totalAnimais : 0;

      const minDias = Math.min(...currentData.map(item => item.dias_confinados));
      const maxDias = Math.max(...currentData.map(item => item.dias_confinados));

      // Buscar dados do dia anterior para comparação
      const previousDate = new Date(latestDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      const { data: previousData, error: previousError } = await supabase
        .from('fato_historico_consumo')
        .select('dias_confinados, qtd_animais')
        .eq('organization_id', orgId)
        .eq('data', previousDateStr)
        .not('dias_confinados', 'is', null)
        .gt('qtd_animais', 0);

      if (previousError || !previousData || previousData.length === 0) {
        // Se não houver dados do dia anterior, retornar sem variação
        return {
          mediaDias: parseFloat(mediaDiasHoje.toFixed(1)),
          dataAtualizacao: latestDate,
          variacaoOntem: 0,
          percentualVariacao: 0,
          totalRegistros: currentData.length,
          totalAnimais,
          minDias,
          maxDias
        };
      }

      // Calcular média ponderada do dia anterior
      const totalPonderadoOntem = previousData.reduce((sum, item) =>
        sum + (item.dias_confinados * item.qtd_animais), 0);
      const totalAnimaisOntem = previousData.reduce((sum, item) =>
        sum + item.qtd_animais, 0);
      const mediaDiasOntem = totalAnimaisOntem > 0 ? totalPonderadoOntem / totalAnimaisOntem : 0;

      const variacaoOntem = mediaDiasHoje - mediaDiasOntem;
      const percentualVariacao = mediaDiasOntem > 0
        ? ((variacaoOntem / mediaDiasOntem) * 100)
        : 0;

      console.log('useDiasConfinamento - Dados retornados:', {
        mediaDiasHoje,
        mediaDiasOntem,
        variacaoOntem,
        percentualVariacao,
        minDias,
        maxDias
      });

      return {
        mediaDias: parseFloat(mediaDiasHoje.toFixed(1)),
        dataAtualizacao: latestDate,
        variacaoOntem: parseFloat(variacaoOntem.toFixed(1)),
        percentualVariacao: parseFloat(percentualVariacao.toFixed(2)),
        totalRegistros: currentData.length,
        totalAnimais,
        minDias,
        maxDias
      };
    },
    enabled: true, // Sempre habilitado, usando o ID padrão quando necessário
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};