import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoricoConsumoData {
  grupo_genetico: string;
  sexo: string;
  total_animais: number;
}

export const useHistoricoConsumo = () => {
  // Usar organizationId fixo conhecido
  const organizationId = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

  return useQuery({
    queryKey: ['historico-consumo', organizationId],
    queryFn: async () => {
      console.log('[useHistoricoConsumo] Starting fetch for org:', organizationId);

      try {
        // Buscar dados da última data disponível
        const { data: lastDateResult, error: dateError } = await supabase
          .from('fato_historico_consumo')
          .select('data')
          .eq('organization_id', organizationId)
          .order('data', { ascending: false })
          .limit(1);

        if (dateError) {
          console.error('[useHistoricoConsumo] Error fetching last date:', dateError);
          throw dateError;
        }

        const lastDate = lastDateResult?.[0]?.data;

        if (!lastDate) {
          console.log('[useHistoricoConsumo] No date found');
          return [];
        }

        console.log('[useHistoricoConsumo] Using date:', lastDate);

        // Buscar todos os dados da última data
        const { data, error } = await supabase
          .from('fato_historico_consumo')
          .select('grupo_genetico, sexo, qtd_animais')
          .eq('organization_id', organizationId)
          .eq('data', lastDate)
          .not('grupo_genetico', 'is', null)
          .not('sexo', 'is', null);

        if (error) {
          console.error('[useHistoricoConsumo] Error fetching data:', error);
          throw error;
        }

        console.log('[useHistoricoConsumo] Raw data:', data);

        if (!data || data.length === 0) {
          console.log('[useHistoricoConsumo] No data returned');
          return [];
        }

        // Agregar dados por grupo_genetico e sexo
        const aggregated = data.reduce((acc: Record<string, Record<string, number>>, curr) => {
          if (!acc[curr.grupo_genetico]) {
            acc[curr.grupo_genetico] = { MA: 0, FE: 0 };
          }
          acc[curr.grupo_genetico][curr.sexo] =
            (acc[curr.grupo_genetico][curr.sexo] || 0) + (curr.qtd_animais || 0);
          return acc;
        }, {});

        console.log('[useHistoricoConsumo] Aggregated:', aggregated);

        // Transformar em formato array
        const result: HistoricoConsumoData[] = [];
        Object.entries(aggregated).forEach(([grupo_genetico, sexoData]) => {
          Object.entries(sexoData).forEach(([sexo, total_animais]) => {
            if (total_animais > 0) {
              result.push({
                grupo_genetico,
                sexo,
                total_animais
              });
            }
          });
        });

        console.log('[useHistoricoConsumo] Final result:', result);
        return result;

      } catch (error) {
        console.error('[useHistoricoConsumo] Catch error:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};