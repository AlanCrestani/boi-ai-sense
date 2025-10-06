import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EntradaMensalData {
  mes: string;
  total_animais: number;
  media_alojados: number;
  mes_formatado: string;
}

export const useEntradaMensalAnimais = () => {
  const organizationId = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

  return useQuery({
    queryKey: ['entrada-mensal-animais', organizationId],
    queryFn: async () => {
      console.log('[useEntradaMensalAnimais] Starting fetch for org:', organizationId);

      try {
        // Usar SQL para agrupar corretamente por mês da data_entrada
        // Contando animais únicos por data de entrada, não por múltiplas aparições
        const { data, error } = await supabase.rpc('get_monthly_entries_with_avg', {
          org_id: organizationId
        });

        if (error) {
          // Se a função RPC não existir, vamos fazer a query manual
          console.log('[useEntradaMensalAnimais] RPC not available, using manual query');

          // Buscar dados de entrada usando coluna data_entrada (únicos por data_entrada + curral + lote)
          const { data: entradaData, error: entradaError } = await supabase
            .from('fato_historico_consumo')
            .select('data_entrada, qtd_animais, curral, lote')
            .eq('organization_id', organizationId)
            .not('data_entrada', 'is', null)
            .not('qtd_animais', 'is', null);

          // Buscar dados de alojados usando coluna data (para calcular média diária por mês)
          const { data: alojadosData, error: alojadosError } = await supabase
            .from('fato_historico_consumo')
            .select('data, qtd_animais')
            .eq('organization_id', organizationId)
            .not('data', 'is', null)
            .not('qtd_animais', 'is', null);

          if (entradaError || alojadosError) {
            console.error('[useEntradaMensalAnimais] Error fetching data:', entradaError || alojadosError);
            throw entradaError || alojadosError;
          }

          if (!entradaData || entradaData.length === 0) {
            console.log('[useEntradaMensalAnimais] No entrada data returned');
            return [];
          }

          // Processar dados de entrada - agrupar por data_entrada e curral/lote para evitar duplicatas
          const uniqueEntries = entradaData.reduce((acc: Record<string, any>, curr) => {
            if (!curr.data_entrada || !curr.qtd_animais) return acc;

            // Chave única: data_entrada + curral + lote
            const entryKey = `${curr.data_entrada}-${curr.curral}-${curr.lote}`;

            if (!acc[entryKey]) {
              acc[entryKey] = {
                data_entrada: curr.data_entrada,
                qtd_animais: curr.qtd_animais
              };
            }
            return acc;
          }, {});

          console.log('[useEntradaMensalAnimais] Unique entries found:', Object.keys(uniqueEntries).length);

          // Agrupar entradas por mês
          const monthlyEntradas = Object.values(uniqueEntries).reduce((acc: Record<string, number>, curr: any) => {
            const date = new Date(curr.data_entrada);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            acc[monthKey] = (acc[monthKey] || 0) + curr.qtd_animais;
            return acc;
          }, {});

          // Processar dados de alojados - somar por dia e depois calcular média mensal
          const dailyTotals = alojadosData?.reduce((acc: Record<string, number>, curr) => {
            if (!curr.data || !curr.qtd_animais) return acc;

            const dayKey = curr.data; // YYYY-MM-DD
            acc[dayKey] = (acc[dayKey] || 0) + curr.qtd_animais;
            return acc;
          }, {}) || {};

          // Agrupar totais diários por mês e calcular média
          const monthlyAlojados: Record<string, { total: number, days: number }> = {};
          Object.entries(dailyTotals).forEach(([dayKey, totalDay]) => {
            const date = new Date(dayKey);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyAlojados[monthKey]) {
              monthlyAlojados[monthKey] = { total: 0, days: 0 };
            }
            monthlyAlojados[monthKey].total += totalDay;
            monthlyAlojados[monthKey].days += 1;
          });

          // Calcular médias diárias por mês
          const mediaAlojados: Record<string, number> = {};
          Object.entries(monthlyAlojados).forEach(([month, data]) => {
            mediaAlojados[month] = Math.round(data.total / data.days);
          });

          console.log('[useEntradaMensalAnimais] Monthly entradas:', monthlyEntradas);
          console.log('[useEntradaMensalAnimais] Media alojados:', mediaAlojados);

          // Combinar dados de entrada e média de alojados
          const allMonths = new Set([...Object.keys(monthlyEntradas), ...Object.keys(mediaAlojados)]);
          const result: EntradaMensalData[] = Array.from(allMonths)
            .map(monthKey => {
              const [year, month] = monthKey.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1);

              return {
                mes: monthKey,
                total_animais: monthlyEntradas[monthKey] || 0,
                media_alojados: mediaAlojados[monthKey] || 0,
                mes_formatado: date.toLocaleDateString('pt-BR', {
                  month: 'short',
                  year: 'numeric'
                }).replace('.', '')
              };
            })
            .sort((a, b) => a.mes.localeCompare(b.mes)) // Ordenar cronologicamente
            .slice(-12); // Últimos 12 meses

          console.log('[useEntradaMensalAnimais] Final result:', result);
          return result;
        } else {
          console.log('[useEntradaMensalAnimais] RPC data:', data);
          return data || [];
        }

      } catch (error) {
        console.error('[useEntradaMensalAnimais] Catch error:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};