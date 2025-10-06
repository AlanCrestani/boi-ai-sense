import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface CheckagemPesoVagao {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  vagao_id: string;
  peso_vazio_balancao: number;
  peso_carregado_balancao: number;
  peso_liquido_balancao: number;
  peso_visor_balanca_vagao: number;
  id_carregamento?: number;
  peso_id_carregamento?: number;
  peso_total_distribuido?: number;
  diferenca_balancao_visor?: number;
  diferenca_visor_carregamento?: number;
  diferenca_carregamento_distribuicao?: number;
  status_tolerancia: 'verde' | 'amarelo' | 'vermelho' | 'vermelho_escuro';
  observacoes?: string;
  responsavel_id: string;
  created_at: string;
  updated_at: string;
  vagao?: {
    codigo: string;
    nome: string;
  };
  responsavel?: {
    full_name: string;
  };
}

export interface AnaliseBalancaoVisor {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  vagao_codigo: string;
  vagao_nome: string;
  peso_liquido_balancao: number;
  peso_visor_balanca_vagao: number;
  diferenca_kg: number;
  diferenca_percentual: number;
  status_tolerancia: string;
  status_descricao: string;
  responsavel_nome: string;
  observacoes?: string;
  created_at: string;
}

export interface AnaliseVisorSistema {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  vagao_codigo: string;
  vagao_nome: string;
  id_carregamento: number;
  peso_visor_balanca_vagao: number;
  peso_sistema: number;
  diferenca_kg: number;
  diferenca_percentual: number;
  status_tolerancia: string;
  status_descricao: string;
  responsavel_nome: string;
  observacoes?: string;
  created_at: string;
}

export interface AnaliseCarregamentoDistribuicao {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;
  vagao_codigo: string;
  vagao_nome: string;
  id_carregamento: number;
  peso_carregado: number;
  peso_total_distribuido: number;
  diferenca_kg: number;
  diferenca_percentual: number;
  status_tolerancia: string;
  status_descricao: string;
  responsavel_nome: string;
  observacoes?: string;
  created_at: string;
}

export interface CreateChecagemData {
  data_checagem: string;
  hora_checagem: string;
  vagao_id: string;
  peso_vazio_balancao: number;
  peso_carregado_balancao: number;
  peso_visor_balanca_vagao: number;
  observacoes?: string;
}

// Hook para listar checagens
export function useChecagensPesoVagao() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['checagens-peso-vagao', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('checagem_peso_vagao')
        .select(`
          *,
          vagao:dim_vagoes(codigo, nome),
          responsavel:profiles!checagem_peso_vagao_responsavel_id_fkey(full_name)
        `)
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar checagens:', error);
        throw error;
      }

      return data as CheckagemPesoVagao[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para view Análise Balancão x Visor
export function useAnaliseBalancaoVisor() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['analise-balancao-visor', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_analise_balancao_visor')
        .select('*')
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar análise balancão x visor:', error);
        throw error;
      }

      return data as AnaliseBalancaoVisor[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para view Análise Visor x Sistema
export function useAnaliseVisorSistema() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['analise-visor-sistema', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_analise_visor_sistema')
        .select('*')
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar análise visor x sistema:', error);
        throw error;
      }

      return data as AnaliseVisorSistema[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para view Análise Carregamento x Distribuição
export function useAnaliseCarregamentoDistribuicao() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['analise-carregamento-distribuicao', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_analise_carregamento_distribuicao')
        .select('*')
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar análise carregamento x distribuição:', error);
        throw error;
      }

      return data as AnaliseCarregamentoDistribuicao[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para criar nova checagem
export function useCreateChecagemPesoVagao() {
  const queryClient = useQueryClient();
  const { organization, user, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateChecagemData) => {
      if (!organization?.id || !user?.id || !profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar vagão para obter o código
      const { data: vagaoData } = await supabase
        .from('dim_vagoes')
        .select('codigo')
        .eq('id', data.vagao_id)
        .single();

      // Buscar id_carregamento automaticamente
      const { data: carregamentoData, error: carregamentoError } = await supabase
        .rpc('buscar_id_carregamento_checagem', {
          p_organization_id: organization.id,
          p_data_checagem: data.data_checagem,
          p_hora_checagem: data.hora_checagem,
          p_vagao_codigo: vagaoData?.codigo || ''
        });

      let id_carregamento = null;
      let peso_id_carregamento = null;
      let peso_total_distribuido = null;

      if (!carregamentoError && carregamentoData && carregamentoData.length > 0) {
        const carregamento = carregamentoData[0];
        id_carregamento = carregamento.id_carregamento;
        peso_id_carregamento = carregamento.peso_total;

        // Buscar peso distribuído
        const { data: pesoDistribuido } = await supabase
          .rpc('buscar_peso_distribuido_carregamento', {
            p_organization_id: organization.id,
            p_id_carregamento: id_carregamento
          });

        if (pesoDistribuido !== null) {
          peso_total_distribuido = pesoDistribuido;
        }
      }

      // Criar registro de checagem
      const { data: newChecagem, error } = await supabase
        .from('checagem_peso_vagao')
        .insert({
          organization_id: organization.id,
          data_checagem: data.data_checagem,
          hora_checagem: data.hora_checagem,
          vagao_id: data.vagao_id,
          peso_vazio_balancao: data.peso_vazio_balancao,
          peso_carregado_balancao: data.peso_carregado_balancao,
          peso_visor_balanca_vagao: data.peso_visor_balanca_vagao,
          id_carregamento,
          peso_id_carregamento,
          peso_total_distribuido,
          observacoes: data.observacoes,
          responsavel_id: profile.id,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar checagem:', error);
        throw error;
      }

      return newChecagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-peso-vagao'] });
      queryClient.invalidateQueries({ queryKey: ['analise-balancao-visor'] });
      queryClient.invalidateQueries({ queryKey: ['analise-visor-sistema'] });
      queryClient.invalidateQueries({ queryKey: ['analise-carregamento-distribuicao'] });
      toast({
        title: "Sucesso",
        description: "Checagem registrada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar checagem",
        variant: "destructive",
      });
    }
  });
}

// Hook para atualizar checagem
export function useUpdateChecagemPesoVagao() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CheckagemPesoVagao> & { id: string }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: updated, error } = await supabase
        .from('checagem_peso_vagao')
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
      queryClient.invalidateQueries({ queryKey: ['checagens-peso-vagao'] });
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
export function useDeleteChecagemPesoVagao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checagem_peso_vagao')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar checagem:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagens-peso-vagao'] });
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