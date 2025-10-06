import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Setor {
  id: string;
  organization_id: string;
  codigo: string;
  nome: string;
  tipo: 'confinamento' | 'semiconfinamento' | 'pasto' | 'enfermaria' | 'maternidade';
  descricao?: string;
  responsavel?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateSetorData {
  codigo: string;
  nome: string;
  tipo: 'confinamento' | 'semiconfinamento' | 'pasto' | 'enfermaria' | 'maternidade';
  descricao?: string;
  responsavel?: string;
  ativo?: boolean;
}

export const useSetores = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar setores
  const setoresQuery = useQuery({
    queryKey: ['setores', organization?.id],
    queryFn: async (): Promise<Setor[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('dim_setores')
        .select('*')
        .eq('organization_id', orgId)
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar setores:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });

  // Criar setor
  const createSetorMutation = useMutation({
    mutationFn: async (data: CreateSetorData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const profileId = profile?.id;

      const { data: newSetor, error } = await supabase
        .from('dim_setores')
        .insert({
          organization_id: orgId,
          codigo: data.codigo,
          nome: data.nome,
          tipo: data.tipo,
          descricao: data.descricao,
          responsavel: data.responsavel,
          ativo: data.ativo ?? true,
          created_by: profileId,
          updated_by: profileId
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar setor:', error);
        throw error;
      }

      return newSetor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast.success('Setor cadastrado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar setor:', error);
      toast.error('Erro ao cadastrar setor. Tente novamente.');
    }
  });

  // Atualizar setor
  const updateSetorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSetorData> }) => {
      const profileId = profile?.id;

      const { data: updatedSetor, error } = await supabase
        .from('dim_setores')
        .update({
          ...data,
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar setor:', error);
        throw error;
      }

      return updatedSetor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast.success('Setor atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar setor:', error);
      toast.error('Erro ao atualizar setor. Tente novamente.');
    }
  });

  // Excluir setor (soft delete)
  const deleteSetorMutation = useMutation({
    mutationFn: async (id: string) => {
      const profileId = profile?.id;

      const { error } = await supabase
        .from('dim_setores')
        .update({
          ativo: false,
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir setor:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast.success('Setor excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir setor:', error);
      toast.error('Erro ao excluir setor. Tente novamente.');
    }
  });

  return {
    setores: setoresQuery.data || [],
    isLoading: setoresQuery.isLoading,
    error: setoresQuery.error,
    createSetor: createSetorMutation.mutate,
    updateSetor: updateSetorMutation.mutate,
    deleteSetor: deleteSetorMutation.mutate,
    isCreating: createSetorMutation.isPending,
    isUpdating: updateSetorMutation.isPending,
    isDeleting: deleteSetorMutation.isPending,
  };
};