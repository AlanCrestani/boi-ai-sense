import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DietaComposicao {
  id: string;
  organization_id: string;
  dieta_id: string;
  ingrediente_id: string;
  cons_ms_kg: number;
  percentual_ms: number;
  custo_mo_ton?: number;
  local_mistura: 'vagao' | 'pre-mistura';
  cons_mo_kg?: number;
  prop_ms_percentual?: number;
  prop_mo_percentual?: number;
  custo_ms_ton?: number;
  ordem_mistura: number;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  ingrediente?: {
    id: string;
    nome: string;
    codigo?: string;
    unidade_medida: string;
  };
}

export interface CreateDietaComposicaoData {
  dieta_id: string;
  ingrediente_id: string;
  cons_ms_kg: number;
  percentual_ms: number;
  custo_mo_ton?: number;
  local_mistura: 'vagao' | 'pre-mistura';
  ordem_mistura?: number;
  observacoes?: string;
}

export interface UpdateDietaComposicaoData {
  cons_ms_kg?: number;
  percentual_ms?: number;
  custo_mo_ton?: number;
  local_mistura?: 'vagao' | 'pre-mistura';
  ordem_mistura?: number;
  observacoes?: string;
  ativo?: boolean;
}

export const useDietaComposicao = (dietaId?: string) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Buscar composição de uma dieta específica
  const composicaoQuery = useQuery({
    queryKey: ['dieta-composicao', dietaId, organization?.id],
    queryFn: async (): Promise<DietaComposicao[]> => {
      if (!dietaId) return [];

      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('dieta_composicao')
        .select(`
          *,
          ingrediente:dim_ingredientes(id, nome, codigo, unidade_medida)
        `)
        .eq('organization_id', orgId)
        .eq('dieta_id', dietaId)
        .eq('ativo', true)
        .order('ordem_mistura', { ascending: true });

      if (error) {
        console.error('Erro ao buscar composição da dieta:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!dietaId,
  });

  // Criar ingrediente na composição
  const createComposicaoMutation = useMutation({
    mutationFn: async (data: CreateDietaComposicaoData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data: newComposicao, error } = await supabase
        .from('dieta_composicao')
        .insert({
          organization_id: orgId,
          dieta_id: data.dieta_id,
          ingrediente_id: data.ingrediente_id,
          cons_ms_kg: data.cons_ms_kg,
          percentual_ms: data.percentual_ms,
          custo_mo_ton: data.custo_mo_ton,
          local_mistura: data.local_mistura,
          ordem_mistura: data.ordem_mistura || 1,
          observacoes: data.observacoes,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar ingrediente:', error);
        throw error;
      }

      return newComposicao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dieta-composicao'] });
      toast.success('Ingrediente adicionado à dieta com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar ingrediente:', error);
      if (error.code === '23505') {
        toast.error('Este ingrediente já está na dieta.');
      } else {
        toast.error('Erro ao adicionar ingrediente. Tente novamente.');
      }
    }
  });

  // Atualizar ingrediente na composição
  const updateComposicaoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDietaComposicaoData }) => {
      const { data: updatedComposicao, error } = await supabase
        .from('dieta_composicao')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar ingrediente:', error);
        throw error;
      }

      return updatedComposicao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dieta-composicao'] });
      toast.success('Ingrediente atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar ingrediente:', error);
      toast.error('Erro ao atualizar ingrediente. Tente novamente.');
    }
  });

  // Remover ingrediente da composição (soft delete)
  const deleteComposicaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dieta_composicao')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover ingrediente:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dieta-composicao'] });
      toast.success('Ingrediente removido da dieta!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover ingrediente:', error);
      toast.error('Erro ao remover ingrediente. Tente novamente.');
    }
  });

  // Reordenar ingredientes
  const reorderComposicaoMutation = useMutation({
    mutationFn: async (items: { id: string; ordem_mistura: number }[]) => {
      const updates = items.map(item =>
        supabase
          .from('dieta_composicao')
          .update({ ordem_mistura: item.ordem_mistura })
          .eq('id', item.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dieta-composicao'] });
      toast.success('Ordem atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao reordenar ingredientes:', error);
      toast.error('Erro ao reordenar ingredientes. Tente novamente.');
    }
  });

  // Calcular totais da dieta
  const calcularTotais = () => {
    const composicao = composicaoQuery.data || [];

    const totalConsMS = composicao.reduce((sum, item) => sum + (item.cons_ms_kg || 0), 0);
    const totalConsMO = composicao.reduce((sum, item) => sum + (item.cons_mo_kg || 0), 0);
    const totalCustoMS = composicao.reduce((sum, item) =>
      sum + ((item.custo_ms_ton || 0) * (item.cons_ms_kg || 0) / 1000), 0
    );
    const totalCustoMO = composicao.reduce((sum, item) =>
      sum + ((item.custo_mo_ton || 0) * (item.cons_mo_kg || 0) / 1000), 0
    );

    return {
      totalConsMS,
      totalConsMO,
      totalCustoMS,
      totalCustoMO,
      custoMSPorKg: totalConsMS > 0 ? totalCustoMS / totalConsMS : 0,
      custoMOPorKg: totalConsMO > 0 ? totalCustoMO / totalConsMO : 0,
    };
  };

  return {
    composicao: composicaoQuery.data || [],
    isLoading: composicaoQuery.isLoading,
    error: composicaoQuery.error,
    createComposicao: createComposicaoMutation.mutate,
    updateComposicao: updateComposicaoMutation.mutate,
    deleteComposicao: deleteComposicaoMutation.mutate,
    reorderComposicao: reorderComposicaoMutation.mutate,
    isCreating: createComposicaoMutation.isPending,
    isUpdating: updateComposicaoMutation.isPending,
    isDeleting: deleteComposicaoMutation.isPending,
    calcularTotais,
  };
};
