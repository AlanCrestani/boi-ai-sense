import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface EscoreCocho {
  id: string;
  organization_id: string;
  escore: number;
  ajuste_kg: number;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEscoreCochoData {
  escore: number;
  ajuste_kg: number;
  descricao?: string;
  ativo?: boolean;
  ordem?: number;
}

export function useEscoresCocho() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar escores
  const { data: escores = [], isLoading, error } = useQuery({
    queryKey: ['escores-cocho', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('Organization ID not found');
      }

      const { data, error } = await supabase
        .from('config_escores_leitura_cocho')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) {
        throw error;
      }

      return data as EscoreCocho[];
    },
    enabled: !!organization?.id,
  });

  // Mutation para criar escore
  const createEscore = useMutation({
    mutationFn: async (data: CreateEscoreCochoData) => {
      if (!organization?.id) {
        throw new Error('Organization ID not found');
      }

      const { data: result, error } = await supabase
        .from('config_escores_leitura_cocho')
        .insert({
          organization_id: organization.id,
          escore: data.escore,
          ajuste_kg: data.ajuste_kg,
          descricao: data.descricao || null,
          ativo: data.ativo ?? true,
          ordem: data.ordem ?? 999,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escores-cocho'] });
      toast.success('Escore cadastrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao cadastrar escore');
    },
  });

  // Mutation para atualizar escore
  const updateEscore = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateEscoreCochoData> }) => {
      const { error } = await supabase
        .from('config_escores_leitura_cocho')
        .update({
          escore: data.escore,
          ajuste_kg: data.ajuste_kg,
          descricao: data.descricao,
          ativo: data.ativo,
          ordem: data.ordem,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escores-cocho'] });
      toast.success('Escore atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar escore');
    },
  });

  // Mutation para deletar escore
  const deleteEscore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('config_escores_leitura_cocho')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escores-cocho'] });
      toast.success('Escore removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover escore');
    },
  });

  return {
    escores,
    isLoading,
    error,
    createEscore: createEscore.mutate,
    updateEscore: updateEscore.mutate,
    deleteEscore: deleteEscore.mutate,
    isCreating: createEscore.isPending,
    isUpdating: updateEscore.isPending,
    isDeleting: deleteEscore.isPending,
  };
}
