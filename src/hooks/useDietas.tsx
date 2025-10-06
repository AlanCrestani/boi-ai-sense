import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Interfaces
export type TipoDieta = 'adaptacao' | 'crescimento' | 'terminacao' | 'recria' | 'pre-mistura' | 'proteinado';

export interface Dieta {
  id: string;
  organization_id: string;
  nome: string;
  tipo: TipoDieta;
  cms_percentual_peso_vivo: number;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateDietaData {
  nome: string;
  tipo: TipoDieta;
  cms_percentual_peso_vivo: number;
  descricao?: string;
  ativo?: boolean;
}

export interface UpdateDietaData {
  nome?: string;
  tipo?: TipoDieta;
  cms_percentual_peso_vivo?: number;
  descricao?: string;
  ativo?: boolean;
}

export const useDietas = () => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar dietas
  const dietasQuery = useQuery({
    queryKey: ['dietas', organization?.id],
    queryFn: async (): Promise<Dieta[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('dim_dietas')
        .select('*')
        .eq('organization_id', orgId)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar dietas:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });

  // Criar dieta
  const createDietaMutation = useMutation({
    mutationFn: async (data: CreateDietaData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data: newDieta, error } = await supabase
        .from('dim_dietas')
        .insert({
          organization_id: orgId,
          nome: data.nome,
          tipo: data.tipo,
          cms_percentual_peso_vivo: data.cms_percentual_peso_vivo,
          descricao: data.descricao,
          ativo: data.ativo ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar dieta:', error);
        throw error;
      }

      return newDieta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietas'] });
      toast.success('Dieta cadastrada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar dieta:', error);
      toast.error('Erro ao cadastrar dieta. Tente novamente.');
    }
  });

  // Atualizar dieta
  const updateDietaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDietaData }) => {
      const { data: updatedDieta, error } = await supabase
        .from('dim_dietas')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar dieta:', error);
        throw error;
      }

      return updatedDieta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietas'] });
      toast.success('Dieta atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar dieta:', error);
      toast.error('Erro ao atualizar dieta. Tente novamente.');
    }
  });

  // Excluir dieta (soft delete)
  const deleteDietaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dim_dietas')
        .update({
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir dieta:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietas'] });
      toast.success('Dieta removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir dieta:', error);
      toast.error('Erro ao remover dieta. Tente novamente.');
    }
  });

  // Buscar dieta por ID
  const getDietaById = (id: string): Dieta | undefined => {
    return dietasQuery.data?.find(d => d.id === id);
  };

  // Buscar dietas por tipo
  const getDietasByTipo = (tipo: TipoDieta): Dieta[] => {
    return dietasQuery.data?.filter(d => d.tipo === tipo && d.ativo) || [];
  };

  return {
    dietas: dietasQuery.data || [],
    isLoading: dietasQuery.isLoading,
    error: dietasQuery.error,
    createDieta: createDietaMutation.mutate,
    updateDieta: updateDietaMutation.mutate,
    deleteDieta: deleteDietaMutation.mutate,
    isCreating: createDietaMutation.isPending,
    isUpdating: updateDietaMutation.isPending,
    isDeleting: deleteDietaMutation.isPending,
    getDietaById,
    getDietasByTipo,
  };
};