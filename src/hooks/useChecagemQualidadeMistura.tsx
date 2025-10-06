import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface CheckagemQualidadeMistura {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  vagao_id?: string;
  dieta_nome?: string;
  lote_producao?: string;
  quantidade_produzida?: number;

  // Parâmetros de qualidade
  homogeneidade_visual?: 'excelente' | 'boa' | 'regular' | 'ruim';
  presenca_grumos: boolean;
  segregacao_ingredientes: boolean;
  umidade_aparente?: 'seca' | 'adequada' | 'umida' | 'muito_umida';
  cor_consistencia?: 'normal' | 'alterada' | 'suspeita';
  odor?: 'normal' | 'alterado' | 'azedo' | 'mofo';

  // Teste de homogeneidade
  teste_marcador_realizado: boolean;
  coeficiente_variacao?: number;
  numero_amostras?: number;

  // Análise granulométrica
  particulas_grossas?: number;
  particulas_medias?: number;
  particulas_finas?: number;

  // Temperatura
  temperatura_mistura?: number;

  // Status
  status_geral: 'aprovado' | 'aprovado_restricao' | 'reprovado' | 'pendente';
  requer_acao_corretiva: boolean;
  acao_corretiva_descricao?: string;
  remisturar: boolean;
  ajustar_tempo_mistura: boolean;
  ajustar_sequencia_ingredientes: boolean;

  observacoes?: string;
  responsavel_id: string;
  aprovado_por?: string;
  data_aprovacao?: string;
  created_at: string;
  updated_at: string;

  // Relacionamentos
  vagao?: {
    codigo: string;
    nome: string;
  };
  responsavel?: {
    full_name: string;
  };
  aprovador?: {
    full_name: string;
  };
}

export interface ConformidadeMistura {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  vagao_codigo?: string;
  vagao_nome?: string;
  dieta_nome?: string;
  lote_producao?: string;
  quantidade_produzida?: number;
  homogeneidade_visual?: string;
  qualidade_estrelas: string;
  presenca_grumos: boolean;
  segregacao_ingredientes: boolean;
  umidade_aparente?: string;
  odor?: string;
  coeficiente_variacao?: number;
  classificacao_cv: string;
  status_geral: string;
  status_descricao: string;
  requer_acao_corretiva: boolean;
  responsavel_nome: string;
  aprovador_nome?: string;
  data_aprovacao?: string;
  observacoes?: string;
  created_at: string;
}

export interface CreateChecagemQualidadeData {
  data_checagem: string;
  hora_checagem: string;
  vagao_id?: string;
  dieta_nome?: string;
  lote_producao?: string;
  quantidade_produzida?: number;
  homogeneidade_visual?: 'excelente' | 'boa' | 'regular' | 'ruim';
  presenca_grumos?: boolean;
  segregacao_ingredientes?: boolean;
  umidade_aparente?: 'seca' | 'adequada' | 'umida' | 'muito_umida';
  cor_consistencia?: 'normal' | 'alterada' | 'suspeita';
  odor?: 'normal' | 'alterado' | 'azedo' | 'mofo';
  teste_marcador_realizado?: boolean;
  coeficiente_variacao?: number;
  numero_amostras?: number;
  particulas_grossas?: number;
  particulas_medias?: number;
  particulas_finas?: number;
  temperatura_mistura?: number;
  observacoes?: string;
}

// Hook para listar checagens
export function useChecagensQualidadeMistura() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['checagens-qualidade-mistura', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('checagem_qualidade_mistura')
        .select(`
          *,
          vagao:dim_vagoes(codigo, nome),
          responsavel:profiles!checagem_qualidade_mistura_responsavel_id_fkey(full_name),
          aprovador:profiles!checagem_qualidade_mistura_aprovado_por_fkey(full_name)
        `)
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar checagens de qualidade:', error);
        throw error;
      }

      return data as CheckagemQualidadeMistura[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para view de conformidade
export function useConformidadeMistura() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['conformidade-mistura', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_conformidade_mistura')
        .select('*')
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar conformidade de mistura:', error);
        throw error;
      }

      return data as ConformidadeMistura[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para estatísticas
export function useEstatisticasQualidadeMistura() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['estatisticas-qualidade-mistura', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_estatisticas_qualidade_mistura')
        .select('*')
        .eq('organization_id', organization.id)
        .order('semana', { ascending: false })
        .limit(12); // Últimas 12 semanas

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        throw error;
      }

      return data;
    },
    enabled: !!organization?.id,
  });
}

// Hook para checagens pendentes
export function useChecagensPendentesAprovacao() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['checagens-pendentes-aprovacao', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_checagens_pendentes_aprovacao')
        .select('*')
        .eq('organization_id', organization.id);

      if (error) {
        console.error('Erro ao buscar checagens pendentes:', error);
        throw error;
      }

      return data;
    },
    enabled: !!organization?.id,
  });
}

// Hook para criar nova checagem
export function useCreateChecagemQualidade() {
  const queryClient = useQueryClient();
  const { organization, user, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateChecagemQualidadeData) => {
      if (!organization?.id || !user?.id || !profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Determinar status inicial baseado nos parâmetros
      let status_geral: 'aprovado' | 'aprovado_restricao' | 'reprovado' | 'pendente' = 'pendente';
      let requer_acao_corretiva = false;

      // Lógica de determinação de status
      if (data.presenca_grumos || data.segregacao_ingredientes) {
        requer_acao_corretiva = true;
        status_geral = 'reprovado';
      } else if (data.odor && data.odor !== 'normal') {
        requer_acao_corretiva = true;
        status_geral = 'reprovado';
      } else if (data.coeficiente_variacao && data.coeficiente_variacao > 20) {
        requer_acao_corretiva = true;
        status_geral = 'reprovado';
      } else if (data.coeficiente_variacao && data.coeficiente_variacao > 15) {
        status_geral = 'aprovado_restricao';
      } else if (data.homogeneidade_visual === 'ruim') {
        requer_acao_corretiva = true;
        status_geral = 'reprovado';
      } else if (data.homogeneidade_visual === 'regular') {
        status_geral = 'aprovado_restricao';
      }

      const { data: newChecagem, error } = await supabase
        .from('checagem_qualidade_mistura')
        .insert({
          ...data,
          organization_id: organization.id,
          responsavel_id: profile.id,
          created_by: profile.id,
          status_geral,
          requer_acao_corretiva,
          presenca_grumos: data.presenca_grumos || false,
          segregacao_ingredientes: data.segregacao_ingredientes || false,
          teste_marcador_realizado: data.teste_marcador_realizado || false,
          remisturar: false,
          ajustar_tempo_mistura: false,
          ajustar_sequencia_ingredientes: false
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar checagem de qualidade:', error);
        throw error;
      }

      return newChecagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-qualidade-mistura'] });
      queryClient.invalidateQueries({ queryKey: ['conformidade-mistura'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-qualidade-mistura'] });
      queryClient.invalidateQueries({ queryKey: ['checagens-pendentes-aprovacao'] });
      toast({
        title: "Sucesso",
        description: "Checagem de qualidade registrada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar checagem de qualidade",
        variant: "destructive",
      });
    }
  });
}

// Hook para aprovar checagem
export function useAprovarChecagem() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      status_geral,
      observacoes_aprovacao
    }: {
      id: string;
      status_geral: 'aprovado' | 'aprovado_restricao' | 'reprovado';
      observacoes_aprovacao?: string;
    }) => {
      if (!user?.id || !profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const updateData: any = {
        status_geral,
        aprovado_por: profile.id,
        data_aprovacao: new Date().toISOString(),
        updated_by: profile.id
      };

      if (observacoes_aprovacao) {
        // Adiciona às observações existentes
        const { data: current } = await supabase
          .from('checagem_qualidade_mistura')
          .select('observacoes')
          .eq('id', id)
          .single();

        updateData.observacoes = current?.observacoes
          ? `${current.observacoes}\n\n[Aprovação] ${observacoes_aprovacao}`
          : `[Aprovação] ${observacoes_aprovacao}`;
      }

      const { data, error } = await supabase
        .from('checagem_qualidade_mistura')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao aprovar checagem:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-qualidade-mistura'] });
      queryClient.invalidateQueries({ queryKey: ['conformidade-mistura'] });
      queryClient.invalidateQueries({ queryKey: ['checagens-pendentes-aprovacao'] });
      toast({
        title: "Sucesso",
        description: "Checagem aprovada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar checagem",
        variant: "destructive",
      });
    }
  });
}

// Hook para atualizar checagem
export function useUpdateChecagemQualidade() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CheckagemQualidadeMistura> & { id: string }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: updated, error } = await supabase
        .from('checagem_qualidade_mistura')
        .update({
          ...data,
          updated_by: profile.id
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
      queryClient.invalidateQueries({ queryKey: ['checagens-qualidade-mistura'] });
      queryClient.invalidateQueries({ queryKey: ['conformidade-mistura'] });
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
export function useDeleteChecagemQualidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checagem_qualidade_mistura')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar checagem:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-qualidade-mistura'] });
      queryClient.invalidateQueries({ queryKey: ['conformidade-mistura'] });
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