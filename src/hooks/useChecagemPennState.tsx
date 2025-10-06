import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface CheckagemPennState {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  id_carregamento?: number;
  dieta_nome?: string;
  vagao_id?: string;

  // Amostra Início
  inicio_19mm?: number;
  inicio_08mm?: number;
  inicio_04mm?: number;
  inicio_fundo?: number;

  // Amostra Meio
  meio_19mm?: number;
  meio_08mm?: number;
  meio_04mm?: number;
  meio_fundo?: number;

  // Amostra Fim
  fim_19mm?: number;
  fim_08mm?: number;
  fim_04mm?: number;
  fim_fundo?: number;

  // Médias (calculated)
  media_19mm?: number;
  media_08mm?: number;
  media_04mm?: number;
  media_fundo?: number;

  // Status
  status_conformidade: string;
  observacoes?: string;
  peso_amostra_inicio?: number;
  peso_amostra_meio?: number;
  peso_amostra_fim?: number;

  // Metadata
  responsavel_id: string;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;

  // Relationships
  vagao?: {
    codigo: string;
    nome: string;
  };
  responsavel?: {
    full_name: string;
  };
}

export interface PennStateResumo {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  id_carregamento?: number;
  dieta_nome?: string;
  vagao_codigo?: string;
  vagao_nome?: string;
  responsavel_nome: string;

  // Amostras
  inicio_19mm?: number;
  inicio_08mm?: number;
  inicio_04mm?: number;
  inicio_fundo?: number;
  meio_19mm?: number;
  meio_08mm?: number;
  meio_04mm?: number;
  meio_fundo?: number;
  fim_19mm?: number;
  fim_08mm?: number;
  fim_04mm?: number;
  fim_fundo?: number;

  // Estatísticas
  media_19mm?: number;
  media_08mm?: number;
  media_04mm?: number;
  media_fundo?: number;
  desvio_19mm?: number;
  desvio_08mm?: number;
  desvio_04mm?: number;
  desvio_fundo?: number;
  cv_19mm?: number;
  cv_08mm?: number;
  cv_04mm?: number;
  cv_fundo?: number;

  status_conformidade: string;
  observacoes?: string;
  created_at: string;
}

export interface CreateChecagemPennStateData {
  data_checagem: string;
  hora_checagem: string;
  vagao_id?: string;
  dieta_nome?: string;

  // Início
  inicio_19mm?: number;
  inicio_08mm?: number;
  inicio_04mm?: number;
  inicio_fundo?: number;
  peso_amostra_inicio?: number;

  // Meio
  meio_19mm?: number;
  meio_08mm?: number;
  meio_04mm?: number;
  meio_fundo?: number;
  peso_amostra_meio?: number;

  // Fim
  fim_19mm?: number;
  fim_08mm?: number;
  fim_04mm?: number;
  fim_fundo?: number;
  peso_amostra_fim?: number;

  observacoes?: string;
}

// Hook para listar checagens
export function useChecagensPennState() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['checagens-penn-state', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('checagem_penn_state')
        .select(`
          *,
          vagao:dim_vagoes(codigo, nome),
          responsavel:profiles!checagem_penn_state_responsavel_id_fkey(full_name)
        `)
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar checagens Penn State:', error);
        throw error;
      }

      return data as CheckagemPennState[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para view com estatísticas
export function usePennStateResumo() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['penn-state-resumo', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_penn_state_resumo')
        .select('*')
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar resumo Penn State:', error);
        throw error;
      }

      return data as PennStateResumo[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para criar nova checagem
export function useCreateChecagemPennState() {
  const queryClient = useQueryClient();
  const { organization, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateChecagemPennStateData) => {
      if (!organization?.id || !profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar id_carregamento se vagão foi informado
      let id_carregamento = null;
      if (data.vagao_id) {
        const { data: vagaoData } = await supabase
          .from('dim_vagoes')
          .select('codigo')
          .eq('id', data.vagao_id)
          .single();

        if (vagaoData) {
          const { data: carregamentoData, error: carregamentoError } = await supabase
            .rpc('buscar_id_carregamento_checagem', {
              p_organization_id: organization.id,
              p_data_checagem: data.data_checagem,
              p_hora_checagem: data.hora_checagem,
              p_vagao_codigo: vagaoData.codigo
            });

          if (!carregamentoError && carregamentoData && carregamentoData.length > 0) {
            id_carregamento = carregamentoData[0].id_carregamento;
          }
        }
      }

      const { data: newChecagem, error } = await supabase
        .from('checagem_penn_state')
        .insert({
          ...data,
          organization_id: organization.id,
          id_carregamento,
          responsavel_id: profile.id,
          created_by: profile.id,
          status_conformidade: 'pendente'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar checagem Penn State:', error);
        throw error;
      }

      return newChecagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-penn-state'] });
      queryClient.invalidateQueries({ queryKey: ['penn-state-resumo'] });
      toast({
        title: "Sucesso",
        description: "Checagem Penn State registrada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar checagem Penn State",
        variant: "destructive",
      });
    }
  });
}

// Hook para atualizar checagem
export function useUpdateChecagemPennState() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CheckagemPennState> & { id: string }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: updated, error } = await supabase
        .from('checagem_penn_state')
        .update({
          ...data,
          updated_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar checagem:', error);
        throw error;
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-penn-state'] });
      queryClient.invalidateQueries({ queryKey: ['penn-state-resumo'] });
      toast({
        title: "Sucesso",
        description: "Checagem atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar checagem",
        variant: "destructive",
      });
    }
  });
}

// Hook para deletar checagem
export function useDeleteChecagemPennState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checagem_penn_state')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar checagem:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-penn-state'] });
      queryClient.invalidateQueries({ queryKey: ['penn-state-resumo'] });
      toast({
        title: "Sucesso",
        description: "Checagem removida com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover checagem",
        variant: "destructive",
      });
    }
  });
}
