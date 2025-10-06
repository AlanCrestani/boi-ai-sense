import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface CheckagemLimpezaBebedouros {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  curral_numero: string;
  bebedouro_identificacao?: string;
  tipo_bebedouro?: 'circular' | 'linear' | 'boia' | 'nivel' | 'outro';
  outro_tipo_bebedouro?: string;

  // Water quality
  temperatura_agua?: number;
  ph_agua?: number;
  turbidez?: 'limpa' | 'levemente_turva' | 'turva' | 'muito_turva';
  odor_agua?: 'sem_odor' | 'leve_odor' | 'odor_forte' | 'putrido';
  cor_agua?: 'transparente' | 'levemente_amarelada' | 'esverdeada' | 'marrom';

  // Physical cleanliness
  presenca_lodo: boolean;
  presenca_algas: boolean;
  presenca_materia_organica: boolean;
  presenca_racao: boolean;
  presenca_insetos: boolean;
  nivel_sujidade?: 'limpo' | 'pouco_sujo' | 'sujo' | 'muito_sujo';

  // Structural condition
  vazamento: boolean;
  ferrugem: boolean;
  danos_estruturais: boolean;
  funcionamento_boia?: 'normal' | 'irregular' | 'travada' | 'nao_aplicavel';
  nivel_agua?: 'adequado' | 'baixo' | 'muito_baixo' | 'transbordando';

  // Flow and consumption
  vazao_adequada: boolean;
  tempo_reposicao_minutos?: number;
  consumo_estimado_litros?: number;

  // Scores
  score_limpeza?: number;
  score_agua?: number;
  score_estrutura?: number;

  // Actions
  necessita_limpeza: boolean;
  necessita_manutencao: boolean;
  necessita_troca_agua: boolean;
  data_ultima_limpeza?: string;
  proxima_limpeza_prevista?: string;

  // Status
  status_geral: 'aprovado' | 'aprovado_restricao' | 'reprovado' | 'pendente';
  acao_tomada?: string;
  responsavel_limpeza_id?: string;
  observacoes?: string;
  responsavel_id: string;

  // Metadata
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;

  // Relationships
  responsavel?: {
    full_name: string;
  };
  responsavel_limpeza?: {
    full_name: string;
  };
}

export interface AnaliseLimpezaBebedouros {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  curral_numero: string;
  bebedouro_identificacao?: string;
  tipo_bebedouro?: string;
  score_limpeza?: number;
  score_agua?: number;
  score_estrutura?: number;
  score_geral?: number;
  nivel_sujidade?: string;
  status_geral: string;
  status_cor: string;
  dias_desde_limpeza?: number;
  possui_problema_critico: boolean;
  responsavel_nome: string;
  responsavel_limpeza_nome?: string;
  observacoes?: string;
  created_at: string;
}

export interface CreateChecagemLimpezaData {
  data_checagem: string;
  hora_checagem: string;
  curral_numero: string;
  bebedouro_identificacao?: string;
  tipo_bebedouro?: 'circular' | 'linear' | 'boia' | 'nivel' | 'outro';
  outro_tipo_bebedouro?: string;
  temperatura_agua?: number;
  ph_agua?: number;
  turbidez?: 'limpa' | 'levemente_turva' | 'turva' | 'muito_turva';
  odor_agua?: 'sem_odor' | 'leve_odor' | 'odor_forte' | 'putrido';
  cor_agua?: 'transparente' | 'levemente_amarelada' | 'esverdeada' | 'marrom';
  presenca_lodo?: boolean;
  presenca_algas?: boolean;
  presenca_materia_organica?: boolean;
  presenca_racao?: boolean;
  presenca_insetos?: boolean;
  nivel_sujidade?: 'limpo' | 'pouco_sujo' | 'sujo' | 'muito_sujo';
  vazamento?: boolean;
  ferrugem?: boolean;
  danos_estruturais?: boolean;
  funcionamento_boia?: 'normal' | 'irregular' | 'travada' | 'nao_aplicavel';
  nivel_agua?: 'adequado' | 'baixo' | 'muito_baixo' | 'transbordando';
  vazao_adequada?: boolean;
  tempo_reposicao_minutos?: number;
  consumo_estimado_litros?: number;
  score_limpeza?: number;
  score_agua?: number;
  score_estrutura?: number;
  necessita_limpeza?: boolean;
  necessita_manutencao?: boolean;
  necessita_troca_agua?: boolean;
  data_ultima_limpeza?: string;
  proxima_limpeza_prevista?: string;
  acao_tomada?: string;
  observacoes?: string;
}

// Hook to list water trough cleanliness checks
export function useChecagemLimpezaBebedouros() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['checagem-limpeza-bebedouros', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('checagem_limpeza_bebedouros')
        .select(`
          *,
          responsavel:profiles!checagem_limpeza_bebedouros_responsavel_id_fkey(full_name),
          responsavel_limpeza:profiles!checagem_limpeza_bebedouros_responsavel_limpeza_id_fkey(full_name)
        `)
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar checagens de limpeza:', error);
        throw error;
      }

      return data as CheckagemLimpezaBebedouros[];
    },
    enabled: !!organization?.id,
  });
}

// Hook for analysis view
export function useAnaliseLimpezaBebedouros() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['analise-limpeza-bebedouros', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_analise_limpeza_bebedouros')
        .select('*')
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar análise de limpeza:', error);
        throw error;
      }

      return data as AnaliseLimpezaBebedouros[];
    },
    enabled: !!organization?.id,
  });
}

// Hook to create new check
export function useCreateChecagemLimpezaBebedouros() {
  const queryClient = useQueryClient();
  const { organization, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateChecagemLimpezaData) => {
      if (!organization?.id || !profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Determine initial status based on parameters
      let status_geral: 'aprovado' | 'aprovado_restricao' | 'reprovado' | 'pendente' = 'pendente';

      // Critical issues that lead to failure
      const criticalIssues =
        data.vazamento ||
        data.danos_estruturais ||
        data.nivel_agua === 'muito_baixo' ||
        data.nivel_agua === 'transbordando' ||
        data.odor_agua === 'putrido' ||
        data.nivel_sujidade === 'muito_sujo';

      // Moderate issues that lead to conditional approval
      const moderateIssues =
        data.odor_agua === 'odor_forte' ||
        data.nivel_sujidade === 'sujo' ||
        data.turbidez === 'muito_turva' ||
        data.funcionamento_boia === 'travada' ||
        data.nivel_agua === 'baixo';

      if (criticalIssues) {
        status_geral = 'reprovado';
      } else if (moderateIssues) {
        status_geral = 'aprovado_restricao';
      } else if (data.score_limpeza && data.score_agua && data.score_estrutura) {
        const avgScore = (data.score_limpeza + data.score_agua + data.score_estrutura) / 3;
        if (avgScore >= 4) {
          status_geral = 'aprovado';
        } else if (avgScore >= 3) {
          status_geral = 'aprovado_restricao';
        } else {
          status_geral = 'reprovado';
        }
      }

      const { data: newChecagem, error } = await supabase
        .from('checagem_limpeza_bebedouros')
        .insert({
          ...data,
          organization_id: organization.id,
          responsavel_id: profile.id,
          created_by: profile.id,
          status_geral,
          presenca_lodo: data.presenca_lodo || false,
          presenca_algas: data.presenca_algas || false,
          presenca_materia_organica: data.presenca_materia_organica || false,
          presenca_racao: data.presenca_racao || false,
          presenca_insetos: data.presenca_insetos || false,
          vazamento: data.vazamento || false,
          ferrugem: data.ferrugem || false,
          danos_estruturais: data.danos_estruturais || false,
          vazao_adequada: data.vazao_adequada !== false,
          necessita_limpeza: data.necessita_limpeza || false,
          necessita_manutencao: data.necessita_manutencao || false,
          necessita_troca_agua: data.necessita_troca_agua || false,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar checagem de limpeza:', error);
        throw error;
      }

      return newChecagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagem-limpeza-bebedouros'] });
      queryClient.invalidateQueries({ queryKey: ['analise-limpeza-bebedouros'] });
      toast({
        title: "Sucesso",
        description: "Checagem de limpeza registrada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar checagem de limpeza",
        variant: "destructive",
      });
    }
  });
}

// Hook to update check
export function useUpdateChecagemLimpezaBebedouros() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CheckagemLimpezaBebedouros> & { id: string }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: updated, error } = await supabase
        .from('checagem_limpeza_bebedouros')
        .update({
          ...data,
          updated_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar checagem de limpeza:', error);
        throw error;
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagem-limpeza-bebedouros'] });
      queryClient.invalidateQueries({ queryKey: ['analise-limpeza-bebedouros'] });
      toast({
        title: "Sucesso",
        description: "Checagem de limpeza atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar checagem de limpeza",
        variant: "destructive",
      });
    }
  });
}

// Hook to delete check
export function useDeleteChecagemLimpezaBebedouros() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checagem_limpeza_bebedouros')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar checagem de limpeza:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagem-limpeza-bebedouros'] });
      queryClient.invalidateQueries({ queryKey: ['analise-limpeza-bebedouros'] });
      toast({
        title: "Sucesso",
        description: "Checagem de limpeza removida com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover checagem de limpeza",
        variant: "destructive",
      });
    }
  });
}

// Hook to assign cleaning responsibility
export function useAssignLimpezaResponsavel() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      responsavel_limpeza_id,
      acao_tomada,
      proxima_limpeza_prevista
    }: {
      id: string;
      responsavel_limpeza_id: string;
      acao_tomada?: string;
      proxima_limpeza_prevista?: string;
    }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('checagem_limpeza_bebedouros')
        .update({
          responsavel_limpeza_id,
          acao_tomada,
          proxima_limpeza_prevista,
          updated_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atribuir responsável:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagem-limpeza-bebedouros'] });
      toast({
        title: "Sucesso",
        description: "Responsável atribuído com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atribuir responsável",
        variant: "destructive",
      });
    }
  });
}