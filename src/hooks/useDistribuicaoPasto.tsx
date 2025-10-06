import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { LotePasto } from '@/hooks/useLotesPasto';

// Interfaces
export interface DistribuicaoPasto {
  id: string;
  organization_id: string;
  lote_id: string;
  dieta_id?: string;
  data_registro: string;
  hora_registro?: string;
  dias_fornecimento?: number[];
  quantidade_dias_selecionados: number;
  peso_medio_atual_kg: number;
  quantidade_animais: number;
  cms_percentual: number;
  consumo_previsto_kg: number;
  consumo_realizado_kg?: number;
  desvio_kg?: number;
  desvio_percentual?: number;
  cocho_vazio?: boolean;
  cocho_com_sobra?: boolean;
  observacoes_cocho?: string;
  qr_code_escaneado?: string;
  coordenadas_gps_lat?: number;
  coordenadas_gps_lng?: number;
  timestamp_qr_scan?: string;
  rota_id?: string;
  status: 'previsto' | 'em_andamento' | 'concluido' | 'cancelado';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateDistribuicaoData {
  lote_id: string;
  dieta_id?: string;
  dias_fornecimento?: number[];
  quantidade_dias_selecionados: number;
  peso_medio_atual_kg: number;
  quantidade_animais: number;
  cms_percentual: number;
  consumo_previsto_kg: number;
  consumo_realizado_kg?: number | null;
  desvio_kg?: number | null;
  desvio_percentual?: number | null;
  rota_id?: string;
  data_registro?: string; // Data customizada para lançamentos retroativos
}

export interface UpdateDistribuicaoData {
  consumo_realizado_kg?: number;
  cocho_vazio?: boolean;
  cocho_com_sobra?: boolean;
  observacoes_cocho?: string;
  qr_code_escaneado?: string;
  coordenadas_gps_lat?: number;
  coordenadas_gps_lng?: number;
  timestamp_qr_scan?: string;
  status?: 'previsto' | 'em_andamento' | 'concluido' | 'cancelado';
}

export const useDistribuicaoPasto = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar distribuições
  const distribuicoesQuery = useQuery({
    queryKey: ['distribuicoes-pasto', organization?.id],
    queryFn: async (): Promise<DistribuicaoPasto[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('fato_distribuicao_pasto')
        .select('*')
        .eq('organization_id', orgId)
        .order('data_registro', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar distribuições:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });

  // Criar distribuição
  const createDistribuicaoMutation = useMutation({
    mutationFn: async (data: CreateDistribuicaoData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const profileId = profile?.id; // Usar profile.id em vez de user.id

      // Usar data fornecida ou data atual
      const hoje = new Date();
      const dataRegistro = data.data_registro || hoje.toISOString().split('T')[0];
      const horaRegistro = hoje.toTimeString().split(' ')[0];

      // Determinar status baseado em se o realizado foi informado
      const status = data.consumo_realizado_kg !== null && data.consumo_realizado_kg !== undefined
        ? 'concluido'
        : 'previsto';

      // Montar objeto de inserção apenas com campos válidos
      const insertData: any = {
        organization_id: orgId,
        lote_id: data.lote_id,
        dieta_id: data.dieta_id,
        data_registro: dataRegistro,
        hora_registro: horaRegistro,
        dias_fornecimento: data.dias_fornecimento,
        quantidade_dias_selecionados: data.quantidade_dias_selecionados,
        peso_medio_atual_kg: data.peso_medio_atual_kg,
        quantidade_animais: data.quantidade_animais,
        cms_percentual: data.cms_percentual,
        consumo_previsto_kg: data.consumo_previsto_kg,
        consumo_realizado_kg: data.consumo_realizado_kg,
        desvio_kg: data.desvio_kg,
        desvio_percentual: data.desvio_percentual,
        rota_id: data.rota_id,
        status: status,
      };

      // Adicionar created_by e updated_by apenas se profileId existir
      if (profileId) {
        insertData.created_by = profileId;
        insertData.updated_by = profileId;
      }

      const { data: newDistribuicao, error } = await supabase
        .from('fato_distribuicao_pasto')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar distribuição:', error);
        console.error('Dados enviados:', insertData);
        throw error;
      }

      return newDistribuicao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribuicoes-pasto'] });
      toast.success('Distribuição cadastrada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar distribuição:', error);
      const errorMsg = error?.message || error?.hint || 'Erro ao cadastrar distribuição. Tente novamente.';
      toast.error(errorMsg);
    }
  });

  // Atualizar distribuição
  const updateDistribuicaoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDistribuicaoData }) => {
      const profileId = profile?.id; // Usar profile.id em vez de user.id

      const updateData: any = {
        ...data,
        updated_by: profileId,
        updated_at: new Date().toISOString()
      };

      const { data: updatedDistribuicao, error } = await supabase
        .from('fato_distribuicao_pasto')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar distribuição:', error);
        throw error;
      }

      return updatedDistribuicao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribuicoes-pasto'] });
      queryClient.invalidateQueries({ queryKey: ['estoque-insumos-pasto'] });
      queryClient.invalidateQueries({ queryKey: ['saldo-estoque-pasto'] });
      toast.success('Distribuição atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar distribuição:', error);
      toast.error(error.message || 'Erro ao atualizar distribuição. Tente novamente.');
    }
  });

  // Calcular peso atual do lote
  const calcularPesoAtual = (lote: LotePasto): number => {
    if (!lote.peso_medio_entrada || !lote.data_entrada || !lote.gmd_informado) {
      return lote.peso_medio_entrada || 0;
    }

    const dataEntrada = new Date(lote.data_entrada);
    const hoje = new Date();

    // Calcular dias desde a entrada
    const diffTime = Math.abs(hoje.getTime() - dataEntrada.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Peso Atual = Peso Entrada + ((Data atual - data entrada + 1) * GMD informado)
    const pesoAtual = lote.peso_medio_entrada + ((diffDays + 1) * lote.gmd_informado);

    return Math.round(pesoAtual * 100) / 100; // Arredondar para 2 casas decimais
  };

  // Calcular consumo previsto
  const calcularConsumoPrevisto = (
    pesoAtualKg: number,
    cmsPercentual: number,
    quantidadeAnimais: number,
    diasSelecionados: number
  ): number => {
    // Consumo Previsto = peso_medio_atual_kg * cms_percentual * quantidade_animais * quantidade_dias_selecionados
    const consumoPrevisto = pesoAtualKg * cmsPercentual * quantidadeAnimais * diasSelecionados;

    return Math.round(consumoPrevisto * 100) / 100; // Arredondar para 2 casas decimais
  };

  return {
    distribuicoes: distribuicoesQuery.data || [],
    isLoading: distribuicoesQuery.isLoading,
    error: distribuicoesQuery.error,
    createDistribuicao: createDistribuicaoMutation.mutate,
    updateDistribuicao: updateDistribuicaoMutation.mutate,
    isCreating: createDistribuicaoMutation.isPending,
    isUpdating: updateDistribuicaoMutation.isPending,
    calcularPesoAtual,
    calcularConsumoPrevisto,
  };
};