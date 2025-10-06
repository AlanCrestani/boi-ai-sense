import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Vagao {
  id: string;
  organization_id: string;
  codigo: string;
  nome: string;
  tipo?: string;
  capacidade_kg?: number;
  marca?: string;
  modelo?: string;
  ano_fabricacao?: number;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVagaoData {
  codigo: string;
  nome: string;
  tipo?: string;
  capacidade_kg?: number;
  marca?: string;
  modelo?: string;
  ano_fabricacao?: number;
  ativo?: boolean;
  observacoes?: string;
}

// Hook para listar vagões
export function useVagoes() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['vagoes', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('dim_vagoes')
        .select('*')
        .eq('organization_id', organization.id)
        .order('codigo', { ascending: true });

      if (error) {
        console.error('Erro ao buscar vagões:', error);
        throw error;
      }

      return data as Vagao[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para listar vagões ativos
export function useVagoesAtivos() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['vagoes-ativos', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('dim_vagoes')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('ativo', true)
        .order('codigo', { ascending: true });

      if (error) {
        console.error('Erro ao buscar vagões ativos:', error);
        throw error;
      }

      return data as Vagao[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para buscar um vagão específico
export function useVagao(id: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['vagao', id, organization?.id],
    queryFn: async () => {
      if (!organization?.id || !id) return null;

      const { data, error } = await supabase
        .from('dim_vagoes')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .single();

      if (error) {
        console.error('Erro ao buscar vagão:', error);
        throw error;
      }

      return data as Vagao;
    },
    enabled: !!organization?.id && !!id,
  });
}

// Hook para criar novo vagão
export function useCreateVagao() {
  const queryClient = useQueryClient();
  const { organization, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateVagaoData) => {
      if (!organization?.id || !profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: newVagao, error } = await supabase
        .from('dim_vagoes')
        .insert({
          ...data,
          organization_id: organization.id,
          ativo: data.ativo ?? true,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar vagão:', error);
        throw error;
      }

      return newVagao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vagoes'] });
      queryClient.invalidateQueries({ queryKey: ['vagoes-ativos'] });
      toast({
        title: "Sucesso",
        description: "Vagão cadastrado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar vagão",
        variant: "destructive",
      });
    }
  });
}

// Hook para atualizar vagão
export function useUpdateVagao() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Vagao> & { id: string }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: updated, error } = await supabase
        .from('dim_vagoes')
        .update({
          ...data,
          updated_by: profile.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar vagão:', error);
        throw error;
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vagoes'] });
      queryClient.invalidateQueries({ queryKey: ['vagoes-ativos'] });
      toast({
        title: "Sucesso",
        description: "Vagão atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar vagão",
        variant: "destructive",
      });
    }
  });
}

// Hook para deletar vagão
export function useDeleteVagao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dim_vagoes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar vagão:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vagoes'] });
      queryClient.invalidateQueries({ queryKey: ['vagoes-ativos'] });
      toast({
        title: "Sucesso",
        description: "Vagão removido com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover vagão",
        variant: "destructive",
      });
    }
  });
}