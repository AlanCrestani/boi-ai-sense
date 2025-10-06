import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PrevisaoConsumoIngrediente {
  nome: string;
  consumo_previsto_kg: number;
}

export function usePrevisaoConsumoIngredientes() {
  const { organization } = useAuth();

  console.log('[usePrevisaoConsumoIngredientes] Starting with organization:', organization);

  return useQuery({
    queryKey: ['previsao-consumo-ingredientes', organization?.id],
    queryFn: async () => {
      console.log('[usePrevisaoConsumoIngredientes] queryFn executing...');

      if (!organization?.id) {
        console.error('[usePrevisaoConsumoIngredientes] No organization ID!');
        throw new Error('Organization ID not found');
      }

      console.log('[usePrevisaoConsumoIngredientes] Calling RPC with orgId:', organization.id);

      const { data, error } = await supabase.rpc('get_previsao_consumo_ingredientes', {
        p_organization_id: organization.id
      });

      if (error) {
        console.error('[usePrevisaoConsumoIngredientes] RPC error:', error);
        throw error;
      }

      console.log('[usePrevisaoConsumoIngredientes] RPC success, data:', data);

      return (data || []) as PrevisaoConsumoIngrediente[];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
