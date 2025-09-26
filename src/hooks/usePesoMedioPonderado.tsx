import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PesoMedioPonderado {
  pesoMedio: number;
  totalAnimais: number;
  variacaoOntem: number;
  percentualVariacao: string;
}

export const usePesoMedioPonderado = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['peso-medio-ponderado', organization?.id],
    queryFn: async (): Promise<PesoMedioPonderado | null> => {
      console.log('usePesoMedioPonderado - Iniciando queryFn');

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('usePesoMedioPonderado - Usando orgId:', orgId);

      // Buscar as duas datas mais recentes disponíveis
      const { data: recentDates, error: datesError } = await supabase
        .from('fato_historico_consumo')
        .select('data')
        .eq('organization_id', orgId)
        .not('peso_estimado_kg', 'is', null)
        .gt('qtd_animais', 0)
        .gt('peso_estimado_kg', 0)
        .order('data', { ascending: false })
        .limit(10); // Buscar mais datas para garantir que temos pelo menos 2 diferentes

      if (datesError) throw datesError;
      if (!recentDates || recentDates.length === 0) {
        return null;
      }

      // Obter datas únicas
      const uniqueDates = Array.from(new Set(recentDates.map(d => d.data))).slice(0, 2);
      const latestDate = uniqueDates[0];
      const previousDate = uniqueDates.length > 1 ? uniqueDates[1] : null;

      console.log('usePesoMedioPonderado - Data mais recente:', latestDate);
      console.log('usePesoMedioPonderado - Data anterior:', previousDate);

      // Função para calcular peso médio ponderado de uma data
      const calculateWeightedAverage = async (date: string) => {
        const { data, error } = await supabase
          .from('fato_historico_consumo')
          .select('peso_estimado_kg, qtd_animais')
          .eq('organization_id', orgId)
          .eq('data', date)
          .not('peso_estimado_kg', 'is', null)
          .gt('qtd_animais', 0)
          .gt('peso_estimado_kg', 0);

        if (error) throw error;
        if (!data || data.length === 0) return { weightedAverage: 0, totalAnimals: 0 };

        let totalPeso = 0;
        let totalAnimais = 0;

        data.forEach(record => {
          const peso = parseFloat(record.peso_estimado_kg) || 0;
          const animais = parseInt(record.qtd_animais) || 0;

          totalPeso += peso * animais;
          totalAnimais += animais;
        });

        const weightedAverage = totalAnimais > 0 ? totalPeso / totalAnimais : 0;

        return {
          weightedAverage: parseFloat(weightedAverage.toFixed(2)),
          totalAnimals: totalAnimais
        };
      };

      // Calcular para o dia mais recente
      const latest = await calculateWeightedAverage(latestDate);
      let previous = { weightedAverage: 0, totalAnimals: 0 };

      // Calcular para o dia anterior se existir
      if (previousDate) {
        previous = await calculateWeightedAverage(previousDate);
      }

      // Calcular variação
      const variacaoOntem = latest.weightedAverage - previous.weightedAverage;
      const percentualVariacao = previous.weightedAverage > 0
        ? ((variacaoOntem / previous.weightedAverage) * 100).toFixed(1)
        : '0.0';

      console.log('usePesoMedioPonderado - Resultado:', {
        pesoMedio: latest.weightedAverage,
        totalAnimais: latest.totalAnimals,
        variacaoOntem,
        percentualVariacao
      });

      return {
        pesoMedio: latest.weightedAverage,
        totalAnimais: latest.totalAnimals,
        variacaoOntem: parseFloat(variacaoOntem.toFixed(2)),
        percentualVariacao
      };
    },
    enabled: true,
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};