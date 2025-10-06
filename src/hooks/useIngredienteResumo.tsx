import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface IngredienteResumo {
  ingrediente: string;
  previsto_kg: number;
  realizado_kg: number;
}

interface UseIngredienteResumoProps {
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  organizationId?: string;
  enabled?: boolean;
}

// Função auxiliar para buscar a data mais recente disponível
export const getLatestAvailableDate = async (organizationId?: string): Promise<Date | null> => {
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
    console.error('Erro ao buscar última data disponível:', err);
    return null;
  }
};

export const useIngredienteResumo = ({ date, startDate, endDate, organizationId, enabled = true }: UseIngredienteResumoProps = {}) => {
  const [data, setData] = useState<IngredienteResumo[]>([]);
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

      try {
        // Usar fato_carregamento diretamente e agregar os dados
        let query = (supabase as any)
          .from('fato_carregamento')
          .select('ingrediente, previsto_kg, realizado_kg, data')
          .eq('organization_id', orgId)
          .not('ingrediente', 'is', null)
          .not('previsto_kg', 'is', null)
          .not('realizado_kg', 'is', null);

        // Se uma data específica foi fornecida
        if (date) {
          // Formatar a data no formato correto para comparação
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          query = query.eq('data', formattedDate);
        }
        // Se um intervalo de datas foi fornecido
        else if (startDate && endDate) {
          const formattedStartDate = format(startDate, 'yyyy-MM-dd');
          const formattedEndDate = format(endDate, 'yyyy-MM-dd');
          query = query
            .gte('data', formattedStartDate)
            .lte('data', formattedEndDate);
        }

        const { data: resultData, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        // Agregar os dados por ingrediente (somando todas as ocorrências)
        if (resultData && resultData.length > 0) {
          const aggregated = resultData.reduce((acc: { [key: string]: IngredienteResumo }, item: any) => {
            if (!acc[item.ingrediente]) {
              acc[item.ingrediente] = {
                ingrediente: item.ingrediente,
                previsto_kg: 0,
                realizado_kg: 0
              };
            }
            acc[item.ingrediente].previsto_kg += Number(item.previsto_kg) || 0;
            acc[item.ingrediente].realizado_kg += Number(item.realizado_kg) || 0;
            return acc;
          }, {});

          const finalData = Object.values(aggregated).sort((a, b) => a.ingrediente.localeCompare(b.ingrediente));
          setData(finalData);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error('Erro ao buscar dados de ingrediente_resumo:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date, startDate, endDate, organizationId, organization?.id, enabled]);

  return { data, loading, error };
};