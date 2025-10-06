import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Interfaces
export interface RotaDistribuicao {
  id: string;
  organization_id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  itens?: RotaItem[];
}

export interface RotaItem {
  id: string;
  rota_id: string;
  lote_id: string;
  sequencia: number;
  created_at: string;
  lote?: {
    id: string;
    nome: string;
    ativo: boolean;
    pasto?: {
      nome: string;
      setor?: {
        nome: string;
      };
    };
  };
}

export interface CreateRotaData {
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export interface UpdateRotaData {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}

export const useRotasDistribuicao = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar rotas
  const rotasQuery = useQuery({
    queryKey: ['rotas-distribuicao', organization?.id],
    queryFn: async (): Promise<RotaDistribuicao[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('dim_rotas_distribuicao')
        .select(`
          *,
          itens:dim_rotas_distribuicao_itens(
            id,
            rota_id,
            lote_id,
            sequencia,
            created_at,
            lote:dim_lotes_pasto(
              id,
              nome,
              ativo,
              pasto:dim_pastos(
                nome,
                setor:dim_setores(nome)
              )
            )
          )
        `)
        .eq('organization_id', orgId)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar rotas:', error);
        throw error;
      }

      // Ordenar itens por sequência
      const rotasComItensOrdenados = (data || []).map(rota => ({
        ...rota,
        itens: (rota.itens || []).sort((a, b) => a.sequencia - b.sequencia)
      }));

      return rotasComItensOrdenados;
    },
    enabled: true,
  });

  // Criar rota
  const createRotaMutation = useMutation({
    mutationFn: async (data: CreateRotaData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const profileId = profile?.id;

      const { data: newRota, error } = await supabase
        .from('dim_rotas_distribuicao')
        .insert({
          organization_id: orgId,
          nome: data.nome,
          descricao: data.descricao,
          ativo: data.ativo ?? true,
          created_by: profileId,
          updated_by: profileId,
        })
        .select()
        .single();

      if (error) throw error;

      return newRota;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-distribuicao'] });
      toast.success('Rota cadastrada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar rota:', error);

      // Tratar erro de nome duplicado
      if (error.code === '23505') {
        toast.error('Já existe uma rota com este nome. Escolha outro nome.');
      } else {
        toast.error('Erro ao cadastrar rota. Tente novamente.');
      }
    }
  });

  // Atualizar rota
  const updateRotaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRotaData }) => {
      const profileId = profile?.id;

      const updateData: any = {
        ...data,
        updated_by: profileId,
        updated_at: new Date().toISOString()
      };

      const { data: updatedRota, error } = await supabase
        .from('dim_rotas_distribuicao')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar rota:', error);
        throw error;
      }

      return updatedRota;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-distribuicao'] });
      toast.success('Rota atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar rota:', error);
      toast.error('Erro ao atualizar rota. Tente novamente.');
    }
  });

  // Excluir rota (soft delete)
  const deleteRotaMutation = useMutation({
    mutationFn: async (id: string) => {
      const profileId = profile?.id;

      const { error } = await supabase
        .from('dim_rotas_distribuicao')
        .update({
          ativo: false,
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir rota:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-distribuicao'] });
      toast.success('Rota removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir rota:', error);
      toast.error('Erro ao remover rota. Tente novamente.');
    }
  });

  // Atualizar sequência de lotes na rota
  const updateSequenciaLotesMutation = useMutation({
    mutationFn: async ({ rotaId, loteIds }: { rotaId: string; loteIds: string[] }) => {
      // Primeiro, remover todos os itens da rota
      const { error: deleteError } = await supabase
        .from('dim_rotas_distribuicao_itens')
        .delete()
        .eq('rota_id', rotaId);

      if (deleteError) {
        console.error('Erro ao remover itens da rota:', deleteError);
        throw deleteError;
      }

      // Inserir novos itens com sequência
      const novosItens = loteIds.map((loteId, index) => ({
        rota_id: rotaId,
        lote_id: loteId,
        sequencia: index + 1,
      }));

      const { error: insertError } = await supabase
        .from('dim_rotas_distribuicao_itens')
        .insert(novosItens);

      if (insertError) {
        console.error('Erro ao inserir itens da rota:', insertError);
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-distribuicao'] });
      toast.success('Sequência atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar sequência:', error);
      toast.error('Erro ao atualizar sequência. Tente novamente.');
    }
  });

  // Buscar rota por ID
  const getRotaById = (id: string): RotaDistribuicao | undefined => {
    return rotasQuery.data?.find(r => r.id === id);
  };

  return {
    rotas: rotasQuery.data || [],
    isLoading: rotasQuery.isLoading,
    error: rotasQuery.error,
    createRota: createRotaMutation.mutate,
    updateRota: updateRotaMutation.mutate,
    deleteRota: deleteRotaMutation.mutate,
    updateSequenciaLotes: updateSequenciaLotesMutation.mutate,
    isCreating: createRotaMutation.isPending,
    isUpdating: updateRotaMutation.isPending,
    isDeleting: deleteRotaMutation.isPending,
    isUpdatingSequencia: updateSequenciaLotesMutation.isPending,
    getRotaById,
  };
};