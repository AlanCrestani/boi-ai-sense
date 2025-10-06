import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ChecagemGranulometria {
  id: string;
  organization_id: string;
  data_checagem: string;
  hora_checagem: string;

  // Grain information
  tipo_grao: 'milho' | 'sorgo' | 'soja' | 'caroco_algodao' | 'outro';
  outro_grao?: string;
  lote_grao?: string;
  fornecedor?: string;

  // Equipment
  equipamento_moagem?: string;
  peneira_utilizada?: number;

  // Results (percentages)
  particulas_finas?: number;
  particulas_pequenas?: number;
  particulas_medias?: number;
  particulas_grandes?: number;
  particulas_muito_grandes?: number;

  // Calculated
  dgm?: number;
  desvio_padrao_geometrico?: number;

  // Quality
  uniformidade?: 'excelente' | 'boa' | 'regular' | 'ruim';
  dentro_especificacao?: boolean;
  especificacao_min?: number;
  especificacao_max?: number;

  // Visual
  presenca_pos?: boolean;
  presenca_graos_inteiros?: boolean;
  umidade_aparente?: 'seca' | 'adequada' | 'umida' | 'muito_umida';

  // Test method
  metodo_analise?: string;
  numero_amostras?: number;
  peso_amostra?: number;

  // Approval
  aprovado?: boolean;
  aprovado_por?: string;
  data_aprovacao?: string;
  motivo_reprovacao?: string;

  // Action
  acao_corretiva?: string;
  responsavel_acao?: string;
  prazo_acao?: string;
  status_acao?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';

  observacoes?: string;

  // Metadata
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;

  // From view
  created_by_name?: string;
  aprovado_por_name?: string;
  responsavel_acao_name?: string;
  score_qualidade?: number;
  status_color?: string;
}

export interface CreateChecagemGranulometriaData {
  data_checagem: string;
  hora_checagem: string;
  tipo_grao: 'milho' | 'sorgo' | 'soja' | 'caroco_algodao' | 'outro';
  outro_grao?: string;
  lote_grao?: string;
  fornecedor?: string;
  equipamento_moagem?: string;
  peneira_utilizada?: number;
  particulas_finas?: number;
  particulas_pequenas?: number;
  particulas_medias?: number;
  particulas_grandes?: number;
  particulas_muito_grandes?: number;
  dgm?: number;
  desvio_padrao_geometrico?: number;
  uniformidade?: 'excelente' | 'boa' | 'regular' | 'ruim';
  dentro_especificacao?: boolean;
  especificacao_min?: number;
  especificacao_max?: number;
  presenca_pos?: boolean;
  presenca_graos_inteiros?: boolean;
  umidade_aparente?: 'seca' | 'adequada' | 'umida' | 'muito_umida';
  metodo_analise?: string;
  numero_amostras?: number;
  peso_amostra?: number;
  observacoes?: string;
}

// Hook to list grain granulometry checks
export function useChecagemGranulometria() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['checagem-granulometria', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('view_checagem_granulometria_resumo')
        .select('*')
        .eq('organization_id', organization.id)
        .order('data_checagem', { ascending: false })
        .order('hora_checagem', { ascending: false });

      if (error) {
        console.error('Erro ao buscar checagens de granulometria:', error);
        throw error;
      }

      return data as ChecagemGranulometria[];
    },
    enabled: !!organization?.id,
  });
}

// Hook to get a specific check
export function useChecagemGranulometriaById(id: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['checagem-granulometria', id, organization?.id],
    queryFn: async () => {
      if (!organization?.id || !id) return null;

      const { data, error } = await supabase
        .from('view_checagem_granulometria_resumo')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .single();

      if (error) {
        console.error('Erro ao buscar checagem de granulometria:', error);
        throw error;
      }

      return data as ChecagemGranulometria;
    },
    enabled: !!organization?.id && !!id,
  });
}

// Hook to create a new check
export function useCreateChecagemGranulometria() {
  const queryClient = useQueryClient();
  const { organization, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateChecagemGranulometriaData) => {
      if (!organization?.id || !profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Calculate DGM if percentages are provided
      let calculatedDgm = data.dgm;
      let calculatedDesvio = data.desvio_padrao_geometrico;

      if (data.particulas_finas && data.particulas_pequenas && data.particulas_medias &&
          data.particulas_grandes && data.particulas_muito_grandes) {

        // Simplified DGM calculation
        const sizes = [0.25, 0.75, 1.5, 3.0, 5.0]; // Midpoints of each size class
        const percentages = [
          data.particulas_finas,
          data.particulas_pequenas,
          data.particulas_medias,
          data.particulas_grandes,
          data.particulas_muito_grandes
        ];

        // Calculate geometric mean
        let sumLogSize = 0;
        let sumPercentage = 0;

        for (let i = 0; i < sizes.length; i++) {
          sumLogSize += (percentages[i] / 100) * Math.log(sizes[i]);
          sumPercentage += percentages[i] / 100;
        }

        calculatedDgm = Math.exp(sumLogSize / sumPercentage);

        // Calculate geometric standard deviation (simplified)
        let sumLogDeviation = 0;
        for (let i = 0; i < sizes.length; i++) {
          sumLogDeviation += (percentages[i] / 100) * Math.pow(Math.log(sizes[i]) - Math.log(calculatedDgm), 2);
        }
        calculatedDesvio = Math.exp(Math.sqrt(sumLogDeviation / sumPercentage));
      }

      const { data: newChecagem, error } = await supabase
        .from('checagem_granulometria_graos')
        .insert({
          ...data,
          dgm: calculatedDgm,
          desvio_padrao_geometrico: calculatedDesvio,
          organization_id: organization.id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar checagem de granulometria:', error);
        throw error;
      }

      return newChecagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagem-granulometria'] });
      toast({
        title: "Sucesso",
        description: "Checagem de granulometria registrada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar checagem de granulometria",
        variant: "destructive",
      });
    }
  });
}

// Hook to update a check
export function useUpdateChecagemGranulometria() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChecagemGranulometria> & { id: string }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: updated, error } = await supabase
        .from('checagem_granulometria_graos')
        .update({
          ...data,
          updated_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar checagem de granulometria:', error);
        throw error;
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagem-granulometria'] });
      toast({
        title: "Sucesso",
        description: "Checagem de granulometria atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar checagem de granulometria",
        variant: "destructive",
      });
    }
  });
}

// Hook to approve a check
export function useApproveChecagemGranulometria() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, aprovado, motivo_reprovacao }: {
      id: string;
      aprovado: boolean;
      motivo_reprovacao?: string;
    }) => {
      if (!profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const updateData: any = {
        aprovado,
        aprovado_por: profile.id,
        data_aprovacao: new Date().toISOString(),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      };

      if (!aprovado && motivo_reprovacao) {
        updateData.motivo_reprovacao = motivo_reprovacao;
      }

      const { data: updated, error } = await supabase
        .from('checagem_granulometria_graos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao aprovar/reprovar checagem:', error);
        throw error;
      }

      return updated;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checagem-granulometria'] });
      toast({
        title: variables.aprovado ? "Aprovado" : "Reprovado",
        description: variables.aprovado
          ? "Checagem de granulometria aprovada com sucesso!"
          : "Checagem de granulometria reprovada.",
        variant: variables.aprovado ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar aprovação",
        variant: "destructive",
      });
    }
  });
}

// Hook to delete a check
export function useDeleteChecagemGranulometria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checagem_granulometria_graos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar checagem de granulometria:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checagem-granulometria'] });
      toast({
        title: "Sucesso",
        description: "Checagem de granulometria removida com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover checagem de granulometria",
        variant: "destructive",
      });
    }
  });
}