import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Cargo {
  id: string;
  organization_id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  nivel_hierarquico: number;
  salario_base?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCargoData {
  codigo: string;
  nome: string;
  descricao?: string;
  nivel_hierarquico?: number;
  salario_base?: number;
  ativo?: boolean;
}

export const useCargos = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar cargos
  const cargosQuery = useQuery({
    queryKey: ['cargos', organization?.id],
    queryFn: async (): Promise<Cargo[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('dim_cargos')
        .select('*')
        .eq('organization_id', orgId)
        .eq('ativo', true)
        .order('nivel_hierarquico', { ascending: false })
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar cargos:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });

  // Criar cargo
  const createCargoMutation = useMutation({
    mutationFn: async (data: CreateCargoData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const profileId = profile?.id;

      const { data: newCargo, error } = await supabase
        .from('dim_cargos')
        .insert({
          organization_id: orgId,
          codigo: data.codigo,
          nome: data.nome,
          descricao: data.descricao,
          nivel_hierarquico: data.nivel_hierarquico || 1,
          salario_base: data.salario_base,
          ativo: data.ativo ?? true,
          created_by: profileId,
          updated_by: profileId
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cargo:', error);
        throw error;
      }

      return newCargo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      toast.success('Cargo cadastrado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar cargo:', error);
      toast.error('Erro ao cadastrar cargo. Tente novamente.');
    }
  });

  // Atualizar cargo
  const updateCargoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCargoData> }) => {
      const profileId = profile?.id;

      const { data: updatedCargo, error } = await supabase
        .from('dim_cargos')
        .update({
          ...data,
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cargo:', error);
        throw error;
      }

      return updatedCargo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      toast.success('Cargo atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar cargo:', error);
      toast.error('Erro ao atualizar cargo. Tente novamente.');
    }
  });

  // Excluir cargo (soft delete)
  const deleteCargoMutation = useMutation({
    mutationFn: async (id: string) => {
      const profileId = profile?.id;

      const { error } = await supabase
        .from('dim_cargos')
        .update({
          ativo: false,
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir cargo:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      toast.success('Cargo excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir cargo:', error);
      toast.error('Erro ao excluir cargo. Tente novamente.');
    }
  });

  return {
    cargos: cargosQuery.data || [],
    isLoading: cargosQuery.isLoading,
    error: cargosQuery.error,
    createCargo: createCargoMutation.mutate,
    updateCargo: updateCargoMutation.mutate,
    deleteCargo: deleteCargoMutation.mutate,
    isCreating: createCargoMutation.isPending,
    isUpdating: updateCargoMutation.isPending,
    isDeleting: deleteCargoMutation.isPending,
  };
};