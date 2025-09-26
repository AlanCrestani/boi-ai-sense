import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EficienciaConsumoData {
  eficienciaConsumo: number;
  dataAtualizacao: string;
  variacaoOntem: number;
  percentualVariacao: number;
  totalRegistros: number;
  totalAnimais: number;
}

export const useEficienciaConsumo = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['eficiencia-consumo', organization?.id],
    queryFn: async (): Promise<EficienciaConsumoData> => {
      console.log('useEficienciaConsumo - Iniciando queryFn');

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useEficienciaConsumo - Usando orgId:', orgId);

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
          eficienciaConsumo: 0,
          dataAtualizacao: new Date().toISOString().split('T')[0],
          variacaoOntem: 0,
          percentualVariacao: 0,
          totalRegistros: 0,
          totalAnimais: 0
        };
      }

      const latestDate = latestDateData[0].data;

      // Buscar eficiência de consumo da última data
      const { data: currentData, error: currentError } = await supabase
        .from('fato_historico_consumo')
        .select('cms_realizado_kg, cms_previsto_kg, qtd_animais')
        .eq('organization_id', orgId)
        .eq('data', latestDate)
        .gt('cms_previsto_kg', 0)
        .not('cms_realizado_kg', 'is', null);

      if (currentError) throw currentError;

      // Calcular eficiência média da última data
      const eficienciasHoje = currentData.map(item =>
        (item.cms_realizado_kg / item.cms_previsto_kg) * 100
      );
      const eficienciaConsumoHoje = eficienciasHoje.length > 0
        ? eficienciasHoje.reduce((sum, eff) => sum + eff, 0) / eficienciasHoje.length
        : 0;

      const totalAnimaisHoje = currentData.reduce((sum, item) => sum + (item.qtd_animais || 0), 0);

      // Buscar eficiência do dia anterior
      const previousDate = new Date(latestDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      const { data: previousData, error: previousError } = await supabase
        .from('fato_historico_consumo')
        .select('cms_realizado_kg, cms_previsto_kg')
        .eq('organization_id', orgId)
        .eq('data', previousDateStr)
        .gt('cms_previsto_kg', 0)
        .not('cms_realizado_kg', 'is', null);

      if (previousError || !previousData || previousData.length === 0) {
        // Se não houver dados do dia anterior, retornar sem variação
        return {
          eficienciaConsumo: parseFloat(eficienciaConsumoHoje.toFixed(2)),
          dataAtualizacao: latestDate,
          variacaoOntem: 0,
          percentualVariacao: 0,
          totalRegistros: currentData.length,
          totalAnimais: totalAnimaisHoje
        };
      }

      // Calcular eficiência média do dia anterior
      const eficienciasOntem = previousData.map(item =>
        (item.cms_realizado_kg / item.cms_previsto_kg) * 100
      );
      const eficienciaConsumoOntem = eficienciasOntem.length > 0
        ? eficienciasOntem.reduce((sum, eff) => sum + eff, 0) / eficienciasOntem.length
        : 0;

      const variacaoOntem = eficienciaConsumoHoje - eficienciaConsumoOntem;
      const percentualVariacao = eficienciaConsumoOntem > 0
        ? ((variacaoOntem / eficienciaConsumoOntem) * 100)
        : 0;

      console.log('useEficienciaConsumo - Dados retornados:', {
        eficienciaConsumoHoje,
        eficienciaConsumoOntem,
        variacaoOntem,
        percentualVariacao
      });

      return {
        eficienciaConsumo: parseFloat(eficienciaConsumoHoje.toFixed(2)),
        dataAtualizacao: latestDate,
        variacaoOntem: parseFloat(variacaoOntem.toFixed(2)),
        percentualVariacao: parseFloat(percentualVariacao.toFixed(2)),
        totalRegistros: currentData.length,
        totalAnimais: totalAnimaisHoje
      };
    },
    enabled: true, // Sempre habilitado, usando o ID padrão quando necessário
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};