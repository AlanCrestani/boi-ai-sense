import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AnimalCountData {
  totalAnimais: number;
  dataAtualizacao: string;
  variacaoOntem: number;
  percentualVariacao: number;
}

export const useAnimalCount = () => {
  const { organization } = useAuth();

  console.log('useAnimalCount - organization:', organization);

  return useQuery({
    queryKey: ['animal-count', organization?.id],
    queryFn: async (): Promise<AnimalCountData> => {
      console.log('useAnimalCount - Iniciando queryFn');
      console.log('useAnimalCount - organization?.id:', organization?.id);

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useAnimalCount - Usando orgId:', orgId);

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
          totalAnimais: 0,
          dataAtualizacao: new Date().toISOString().split('T')[0],
          variacaoOntem: 0,
          percentualVariacao: 0
        };
      }

      const latestDate = latestDateData[0].data;

      // Buscar a soma de qtd_animais da última data
      const { data: currentData, error: currentError } = await supabase
        .from('fato_historico_consumo')
        .select('qtd_animais')
        .eq('organization_id', orgId)
        .eq('data', latestDate);

      if (currentError) throw currentError;

      const totalAnimaisHoje = currentData?.reduce((sum, item) => sum + (item.qtd_animais || 0), 0) || 0;

      // Buscar a soma de qtd_animais do dia anterior
      const previousDate = new Date(latestDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      const { data: previousData, error: previousError } = await supabase
        .from('fato_historico_consumo')
        .select('qtd_animais')
        .eq('organization_id', orgId)
        .eq('data', previousDateStr);

      if (previousError) {
        // Se não houver dados do dia anterior, retornar sem variação
        return {
          totalAnimais: totalAnimaisHoje,
          dataAtualizacao: latestDate,
          variacaoOntem: 0,
          percentualVariacao: 0
        };
      }

      const totalAnimaisOntem = previousData?.reduce((sum, item) => sum + (item.qtd_animais || 0), 0) || 0;
      const variacaoOntem = totalAnimaisHoje - totalAnimaisOntem;
      const percentualVariacao = totalAnimaisOntem > 0
        ? ((variacaoOntem / totalAnimaisOntem) * 100)
        : 0;

      console.log('useAnimalCount - Dados retornados:', {
        totalAnimaisHoje,
        totalAnimaisOntem,
        variacaoOntem,
        percentualVariacao
      });

      return {
        totalAnimais: totalAnimaisHoje,
        dataAtualizacao: latestDate,
        variacaoOntem,
        percentualVariacao: parseFloat(percentualVariacao.toFixed(1))
      };
    },
    enabled: true, // Sempre habilitado, usando o ID padrão quando necessário
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};