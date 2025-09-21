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

        // Query principal
        const { data: resultData, error: fetchError } = await supabase
          .from('view_dieta_resumo')
          .select('*')
          .eq('organization_id', orgId)
          .eq('data', formattedDate)
          .order('dieta');

        if (fetchError) {
          throw fetchError;
        }

        // Converter strings numéricas para números
        const processedData = (resultData || []).map((item: any) => ({
          ...item,
          previsto_kg: Number(item.previsto_kg) || 0,
          realizado_kg: Number(item.realizado_kg) || 0,
          desvio_kg: Number(item.desvio_kg) || 0,
          desvio_percentual: Number(item.desvio_percentual) || 0,
          total_ingredientes: Number(item.total_ingredientes) || 0,
        }));

        setData(processedData);
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
      .from('view_dieta_resumo')
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