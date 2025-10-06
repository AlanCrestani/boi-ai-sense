import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface CheckagemProcessoEnsilagem {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;

  // Identificação
  tipo_forragem?: string;
  local_silo?: string;
  numero_silo?: string;

  // Parâmetros de qualidade
  ph?: number;
  materia_seca_percentual?: number;
  temperatura_celsius?: number;

  // Características físicas
  cor?: string;
  odor?: string;
  presenca_mofo?: boolean;
  presenca_micotoxinas?: boolean;

  // Compactação e vedação
  densidade_kg_m3?: number;
  qualidade_vedacao?: string;
  presenca_ar?: boolean;

  // Análise nutricional
  proteina_bruta?: number;
  fibra_fdn?: number;
  energia_ndt?: number;

  // Avaliação
  score_qualidade?: number;
  status_conformidade: string;

  // Ações
  acoes_corretivas?: string;
  observacoes?: string;
  proxima_analise_prevista?: string;

  // Metadata
  responsavel_id: string;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;

  // Relationships
  responsavel?: {
    full_name: string;
  };
}

export interface EnsilagemResumo {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  tipo_forragem?: string;
  local_silo?: string;
  numero_silo?: string;
  ph?: number;
  materia_seca_percentual?: number;
  temperatura_celsius?: number;
  cor?: string;
  odor?: string;
  presenca_mofo?: boolean;
  presenca_micotoxinas?: boolean;
  densidade_kg_m3?: number;
  qualidade_vedacao?: string;
  proteina_bruta?: number;
  fibra_fdn?: number;
  energia_ndt?: number;
  score_qualidade?: number;
  status_conformidade: string;
  acoes_corretivas?: string;
  observacoes?: string;
  proxima_analise_prevista?: string;
  responsavel_nome: string;
  created_at: string;
  classificacao_ph?: string;
  classificacao_ms?: string;
}

export interface CreateChecagemEnsilagemData {
  data_checagem: string;
  hora_checagem: string;
  tipo_forragem?: string;
  local_silo?: string;
  numero_silo?: string;
  ph?: number;
  materia_seca_percentual?: number;
  temperatura_celsius?: number;
  cor?: string;
  odor?: string;
  presenca_mofo?: boolean;
  presenca_micotoxinas?: boolean;
  densidade_kg_m3?: number;
  qualidade_vedacao?: string;
  presenca_ar?: boolean;
  proteina_bruta?: number;
  fibra_fdn?: number;
  energia_ndt?: number;
  score_qualidade?: number;
  acoes_corretivas?: string;
  observacoes?: string;
  proxima_analise_prevista?: string;
}

// Hook para listar checagens
export function useChecagensProcessoEnsilagem() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['checagens-processo-ensilagem', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('checagem_processo_ensilagem')
        .select(`
          *,
          responsavel:profiles!checagem_processo_ensilagem_responsavel_id_fkey(full_name)
        `)
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar checagens de ensilagem:', error);
        throw error;
      }

      return data as CheckagemProcessoEnsilagem[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para view com resumo estatístico
export function useEnsilagemResumo() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['ensilagem-resumo', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_ensilagem_resumo')
        .select('*')
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar resumo de ensilagem:', error);
        throw error;
      }

      return data as EnsilagemResumo[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para criar nova checagem
export function useCreateChecagemEnsilagem() {
  const queryClient = useQueryClient();
  const { organization, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateChecagemEnsilagemData) => {
      if (!organization?.id || !profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: newChecagem, error } = await supabase
        .from('checagem_processo_ensilagem')
        .insert({
          ...data,
          organization_id: organization.id,
          responsavel_id: profile.id,
          created_by: profile.id,
          status_conformidade: 'pendente'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar checagem de ensilagem:', error);
        throw error;
      }

      return newChecagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-processo-ensilagem'] });
      queryClient.invalidateQueries({ queryKey: ['ensilagem-resumo'] });
      toast({
        title: "Sucesso",
        description: "Checagem de ensilagem registrada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar checagem de ensilagem",
        variant: "destructive",
      });
    }
  });
}

// Hook para atualizar checagem
export function useUpdateChecagemEnsilagem() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CheckagemProcessoEnsilagem> & { id: string }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: updated, error } = await supabase
        .from('checagem_processo_ensilagem')
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
      queryClient.invalidateQueries({ queryKey: ['checagens-processo-ensilagem'] });
      queryClient.invalidateQueries({ queryKey: ['ensilagem-resumo'] });
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
export function useDeleteChecagemEnsilagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checagem_processo_ensilagem')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar checagem:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-processo-ensilagem'] });
      queryClient.invalidateQueries({ queryKey: ['ensilagem-resumo'] });
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
