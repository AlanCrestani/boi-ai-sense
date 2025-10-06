import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Interfaces
export interface EstoqueInsumo {
  id: string;
  organization_id: string;
  ingrediente: string;
  tipo_movimentacao: 'entrada' | 'saida' | 'ajuste';
  quantidade_kg: number;
  data_movimentacao: string;
  hora_movimentacao?: string;
  origem_tipo?: 'fabricacao' | 'distribuicao' | 'ajuste_manual';
  origem_id_carregamento?: number;
  origem_id_distribuicao?: string;
  saldo_anterior_kg?: number;
  saldo_atual_kg: number;
  observacoes?: string;
  created_at: string;
  created_by?: string;
}

export interface SaldoEstoque {
  organization_id: string;
  ingrediente: string;
  saldo_atual_kg: number;
  data_movimentacao: string;
  hora_movimentacao?: string;
  created_at: string;
}

export interface AjusteEstoqueData {
  ingrediente: string;
  tipo_movimentacao: 'entrada' | 'saida' | 'ajuste';
  quantidade_kg: number;
  observacoes?: string;
}

export const useEstoqueInsumosPasto = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar histórico de movimentações
  const estoqueQuery = useQuery({
    queryKey: ['estoque-insumos-pasto', organization?.id],
    queryFn: async (): Promise<EstoqueInsumo[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('estoque_insumos_pasto')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar estoque:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });

  // Buscar saldo atual de todos os ingredientes
  const saldoQuery = useQuery({
    queryKey: ['saldo-estoque-pasto', organization?.id],
    queryFn: async (): Promise<SaldoEstoque[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('view_saldo_estoque_pasto')
        .select('*')
        .eq('organization_id', orgId);

      if (error) {
        console.error('Erro ao buscar saldo:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });

  // Registrar ajuste manual de estoque
  const registrarAjusteMutation = useMutation({
    mutationFn: async (data: AjusteEstoqueData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const profileId = profile?.id;

      // Buscar saldo anterior
      const { data: saldoAtualData } = await supabase
        .from('view_saldo_estoque_pasto')
        .select('saldo_atual_kg')
        .eq('organization_id', orgId)
        .eq('ingrediente', data.ingrediente)
        .single();

      const saldoAnterior = saldoAtualData?.saldo_atual_kg || 0;

      // Calcular novo saldo
      let novoSaldo = saldoAnterior;
      if (data.tipo_movimentacao === 'entrada') {
        novoSaldo = saldoAnterior + data.quantidade_kg;
      } else if (data.tipo_movimentacao === 'saida') {
        novoSaldo = saldoAnterior - data.quantidade_kg;
        if (novoSaldo < 0) {
          throw new Error('Saldo insuficiente para esta operação');
        }
      } else if (data.tipo_movimentacao === 'ajuste') {
        novoSaldo = data.quantidade_kg; // Ajuste define o saldo exato
      }

      const hoje = new Date();
      const dataMovimentacao = hoje.toISOString().split('T')[0];
      const horaMovimentacao = hoje.toTimeString().split(' ')[0];

      const { data: novoRegistro, error } = await supabase
        .from('estoque_insumos_pasto')
        .insert({
          organization_id: orgId,
          ingrediente: data.ingrediente,
          tipo_movimentacao: data.tipo_movimentacao,
          quantidade_kg: data.quantidade_kg,
          data_movimentacao: dataMovimentacao,
          hora_movimentacao: horaMovimentacao,
          origem_tipo: 'ajuste_manual',
          saldo_anterior_kg: saldoAnterior,
          saldo_atual_kg: novoSaldo,
          observacoes: data.observacoes,
          created_by: profileId,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao registrar ajuste:', error);
        throw error;
      }

      return novoRegistro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque-insumos-pasto'] });
      queryClient.invalidateQueries({ queryKey: ['saldo-estoque-pasto'] });
      toast.success('Ajuste registrado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao registrar ajuste:', error);
      toast.error(error.message || 'Erro ao registrar ajuste. Tente novamente.');
    }
  });

  // Buscar saldo atual de um ingrediente específico
  const getSaldoAtual = (ingrediente: string): number => {
    const saldo = saldoQuery.data?.find(s => s.ingrediente === ingrediente);
    return saldo?.saldo_atual_kg || 0;
  };

  // Buscar histórico de um ingrediente específico
  const getHistoricoMovimentacoes = (ingrediente: string): EstoqueInsumo[] => {
    return estoqueQuery.data?.filter(e => e.ingrediente === ingrediente) || [];
  };

  return {
    estoque: estoqueQuery.data || [],
    saldos: saldoQuery.data || [],
    isLoading: estoqueQuery.isLoading || saldoQuery.isLoading,
    error: estoqueQuery.error || saldoQuery.error,
    registrarAjuste: registrarAjusteMutation.mutate,
    isRegistrandoAjuste: registrarAjusteMutation.isPending,
    getSaldoAtual,
    getHistoricoMovimentacoes,
  };
};