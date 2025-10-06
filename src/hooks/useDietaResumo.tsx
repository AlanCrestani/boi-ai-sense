import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DietaResumoData {
  organization_id: string;
  data: string;
  dieta: string;
  previsto_kg: number;
  realizado_kg: number;
  desvio_kg: number;
  desvio_percentual: number;
  total_ingredientes: number;
}

interface UseDietaResumoProps {
  date?: Date;
  organizationId?: string;
  enabled?: boolean;
}

export function useDietaResumo({ date, organizationId, enabled = true }: UseDietaResumoProps = {}) {
  const [data, setData] = useState<DietaResumoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organization } = useAuth();

  useEffect(() => {
    // Se disabled, não faz nada
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Usar organization_id fornecido ou da organização do usuário logado
      const orgId = organizationId || organization?.id;

      if (!orgId) {
        setData([]);
        setLoading(false);
        return;
      }

      if (!date) {
        setData([]);
        setLoading(false);
        return;
      }

      try {
        // Formatar a data no formato correto para comparação
        let formattedDate = null;
        if (date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }

        // Query usando fato_carregamento diretamente
        const { data: resultData, error: fetchError } = await supabase
          .from('fato_carregamento')
          .select('dieta, previsto_kg, realizado_kg, desvio_kg, data, ingrediente')
          .eq('organization_id', orgId)
          .eq('data', formattedDate)
          .not('dieta', 'is', null)
          .not('previsto_kg', 'is', null)
          .not('realizado_kg', 'is', null);

        if (fetchError) {
          throw fetchError;
        }

        // Agregar os dados por dieta
        if (resultData && resultData.length > 0) {
          const aggregated = resultData.reduce((acc: { [key: string]: any }, item: any) => {
            if (!acc[item.dieta]) {
              acc[item.dieta] = {
                organization_id: orgId,
                data: formattedDate,
                dieta: item.dieta,
                previsto_kg: 0,
                realizado_kg: 0,
                desvio_kg: 0,
                desvio_percentual: 0,
                total_ingredientes: 0,
                ingredientes: new Set()
              };
            }
            acc[item.dieta].previsto_kg += Number(item.previsto_kg) || 0;
            acc[item.dieta].realizado_kg += Number(item.realizado_kg) || 0;
            acc[item.dieta].desvio_kg += Number(item.desvio_kg) || 0;
            acc[item.dieta].ingredientes.add(item.ingrediente);
            return acc;
          }, {});

          // Converter para array e calcular percentuais
          const processedData = Object.values(aggregated).map((item: any) => {
            const desvio_percentual = item.previsto_kg > 0
              ? ((item.desvio_kg / item.previsto_kg) * 100)
              : 0;

            return {
              organization_id: item.organization_id,
              data: item.data,
              dieta: item.dieta,
              previsto_kg: Math.round(item.previsto_kg),
              realizado_kg: Math.round(item.realizado_kg),
              desvio_kg: Math.round(item.desvio_kg),
              desvio_percentual: Math.round(desvio_percentual * 100) / 100,
              total_ingredientes: item.ingredientes.size
            };
          }).sort((a, b) => a.dieta.localeCompare(b.dieta));

          setData(processedData);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error('Erro ao buscar dados da view_dieta_resumo:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date, organizationId, organization?.id, enabled]);

  return { data, loading, error };
}

export async function getLatestAvailableDateDieta(organizationId?: string): Promise<Date | null> {
  try {
    let query = supabase
      .from('fato_carregamento')
      .select('data')
      .order('data', { ascending: false })
      .limit(1);

    // Filtrar por organization_id se fornecido
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    // Adicionar timezone para evitar problemas de conversão
    // A data vem como '2025-09-01' e precisa ser interpretada corretamente
    const [year, month, day] = data[0].data.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Usar meio-dia para evitar problemas de timezone
  } catch (err) {
    console.error('Erro ao buscar última data disponível da dieta:', err);
    return null;
  }
}