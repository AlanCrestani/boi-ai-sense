import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Interfaces

export interface LotePasto {
  id: string;
  organization_id: string;
  nome: string; // Renomeado de 'codigo' para 'nome'
  pasto_id?: string;
  quantidade_animais?: number;
  data_entrada?: string;
  peso_medio_entrada?: number;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;

  // Campos mantidos
  status_pesagem: 'coletivo' | 'individual';
  sigla_status: 'RCP' | 'PCD';
  gmd_informado?: number;
  proteinado?: string;
  sexo?: string;

  // Relations
  pasto?: {
    id: string;
    nome: string;
    nome_abrv?: string;
    setor?: {
      id: string;
      nome: string;
      nome_abrv?: string;
    };
  };
}

export interface CreateLotePastoData {
  pasto_id?: string;
  quantidade_animais: number;
  data_entrada?: string;
  peso_liquido_total: number; // Será armazenado em peso_medio_entrada
  gmd_informado?: number;
  proteinado?: string;
  sexo?: string;
  observacoes?: string;
  status_pesagem?: 'coletivo' | 'individual';
  ativo?: boolean;
}

export interface UpdateLotePastoData {
  pasto_id?: string;
  quantidade_animais?: number;
  data_entrada?: string;
  peso_liquido_total?: number;
  gmd_informado?: number;
  proteinado?: string;
  sexo?: string;
  observacoes?: string;
  status_pesagem?: 'coletivo' | 'individual';
  ativo?: boolean;
}


export const useLotesPasto = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar lotes
  const lotesQuery = useQuery({
    queryKey: ['lotes-pasto', organization?.id],
    queryFn: async (): Promise<LotePasto[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('dim_lotes_pasto')
        .select(`
          *,
          pasto:dim_pastos(
            id,
            nome,
            nome_abrv,
            setor:dim_setores(id, nome, nome_abrv)
          )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar lotes:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });


  // Não precisamos mais de funções auxiliares - o trigger do banco fará tudo

  // Criar lote
  const createLoteMutation = useMutation({
    mutationFn: async (data: CreateLotePastoData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const profileId = profile?.id;

      // Garantir que a data seja tratada no formato local (YYYY-MM-DD)
      let dataEntrada = data.data_entrada;
      if (!dataEntrada) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        dataEntrada = `${ano}-${mes}-${dia}`;
      }

      // Buscar nome do pasto para modulo_pasto
      let moduloPasto = null;
      if (data.pasto_id) {
        const { data: pastoData } = await supabase
          .from('dim_pastos')
          .select('nome')
          .eq('id', data.pasto_id)
          .single();

        moduloPasto = pastoData?.nome || null;
      }

      const { data: newLote, error } = await supabase
        .from('dim_lotes_pasto')
        .insert({
          organization_id: orgId,
          pasto_id: data.pasto_id,
          quantidade_animais: data.quantidade_animais,
          data_entrada: dataEntrada,
          peso_medio_entrada: data.peso_liquido_total, // Recebe diretamente o valor informado
          modulo_pasto: moduloPasto, // Nome do pasto
          observacoes: data.observacoes,
          ativo: data.ativo ?? true,
          created_by: profileId,
          updated_by: profileId,
          status_pesagem: data.status_pesagem || 'coletivo',
          sigla_status: (data.status_pesagem === 'individual') ? 'PCD' : 'RCP',
          gmd_informado: data.gmd_informado,
          proteinado: data.proteinado,
          sexo: data.sexo
        })
        .select(`
          *,
          pasto:dim_pastos(
            id,
            nome,
            nome_abrv,
            setor:dim_setores(id, nome, nome_abrv)
          )
        `)
        .single();

      if (error) {
        console.error('Erro ao criar lote:', error);
        throw error;
      }

      return newLote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-pasto'] });
      toast.success('Lote cadastrado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar lote:', error);
      toast.error('Erro ao cadastrar lote. Tente novamente.');
    }
  });

  // Transição para pesagem individual - removida por não ser mais necessária

  // Editar lote
  const updateLoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLotePastoData }) => {
      const profileId = profile?.id;

      // Buscar nome do pasto se foi alterado
      let moduloPasto = undefined;
      if (data.pasto_id) {
        const { data: pastoData } = await supabase
          .from('dim_pastos')
          .select('nome')
          .eq('id', data.pasto_id)
          .single();

        moduloPasto = pastoData?.nome || null;
      }

      const updateData: any = {
        pasto_id: data.pasto_id,
        quantidade_animais: data.quantidade_animais,
        data_entrada: data.data_entrada,
        peso_medio_entrada: data.peso_liquido_total, // Recebe diretamente o valor informado
        modulo_pasto: moduloPasto, // Nome do pasto
        observacoes: data.observacoes,
        status_pesagem: data.status_pesagem,
        sigla_status: (data.status_pesagem === 'individual') ? 'PCD' : 'RCP',
        gmd_informado: data.gmd_informado,
        proteinado: data.proteinado,
        sexo: data.sexo,
        ativo: data.ativo !== undefined ? data.ativo : undefined,
        updated_by: profileId,
        updated_at: new Date().toISOString()
      };

      const { data: updatedLote, error } = await supabase
        .from('dim_lotes_pasto')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          pasto:dim_pastos(
            id,
            nome,
            nome_abrv,
            setor:dim_setores(id, nome, nome_abrv)
          )
        `)
        .single();

      if (error) {
        console.error('Erro ao atualizar lote:', error);
        throw error;
      }

      return updatedLote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-pasto'] });
      toast.success('Lote atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar lote:', error);
      toast.error('Erro ao atualizar lote. Tente novamente.');
    }
  });

  // Excluir lote (soft delete)
  const deleteLoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const profileId = profile?.id;

      const { error } = await supabase
        .from('dim_lotes_pasto')
        .update({
          ativo: false,
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir lote:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-pasto'] });
      toast.success('Lote removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir lote:', error);
      toast.error('Erro ao remover lote. Tente novamente.');
    }
  });

  return {
    lotes: lotesQuery.data || [],
    isLoading: lotesQuery.isLoading,
    error: lotesQuery.error,
    createLote: createLoteMutation.mutate,
    updateLote: updateLoteMutation.mutate,
    deleteLote: deleteLoteMutation.mutate,
    isCreating: createLoteMutation.isPending,
    isUpdating: updateLoteMutation.isPending,
    isDeleting: deleteLoteMutation.isPending,
  };
};