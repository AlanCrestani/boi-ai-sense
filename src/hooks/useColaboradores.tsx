import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Colaborador {
  id: string;
  organization_id: string;
  user_id?: string;
  codigo: string;
  nome_completo: string;
  email?: string;
  telefone?: string;
  cargo_id?: string;
  setor_id?: string;
  data_admissao: string;
  data_demissao?: string;
  status: 'ativo' | 'afastado' | 'demitido' | 'ferias';
  cpf?: string;
  endereco?: string;
  observacoes?: string;
  salario?: number;
  ativo: boolean;
  tem_acesso_sistema: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Relations
  cargo?: {
    id: string;
    nome: string;
    codigo: string;
  };
  setor?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export interface CreateColaboradorData {
  nome_completo: string;
  email?: string;
  telefone?: string;
  cargo_id?: string;
  setor_id?: string;
  data_admissao?: string;
  status?: 'ativo' | 'afastado' | 'demitido' | 'ferias';
  cpf?: string;
  endereco?: string;
  observacoes?: string;
  salario?: number;
  ativo?: boolean;
  tem_acesso_sistema?: boolean;
}

export const useColaboradores = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar colaboradores
  const colaboradoresQuery = useQuery({
    queryKey: ['colaboradores', organization?.id],
    queryFn: async (): Promise<Colaborador[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('dim_colaboradores')
        .select(`
          *,
          cargo:dim_cargos(id, nome, codigo),
          setor:dim_setores(id, nome, codigo)
        `)
        .eq('organization_id', orgId)
        .eq('ativo', true)
        .order('nome_completo', { ascending: true });

      if (error) {
        console.error('Erro ao buscar colaboradores:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });

  // Gerar próximo código de colaborador
  const generateColaboradorCode = async (): Promise<string> => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    const { data } = await supabase.rpc('generate_colaborador_codigo', {
      org_id: orgId
    });

    return data || 'COL-001';
  };

  // Criar colaborador
  const createColaboradorMutation = useMutation({
    mutationFn: async (data: CreateColaboradorData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const profileId = profile?.id;

      // Gerar código automaticamente
      const codigo = await generateColaboradorCode();

      const { data: newColaborador, error } = await supabase
        .from('dim_colaboradores')
        .insert({
          organization_id: orgId,
          codigo,
          nome_completo: data.nome_completo,
          email: data.email,
          telefone: data.telefone,
          cargo_id: data.cargo_id,
          setor_id: data.setor_id,
          data_admissao: data.data_admissao || new Date().toISOString().split('T')[0],
          status: data.status || 'ativo',
          cpf: data.cpf,
          endereco: data.endereco,
          observacoes: data.observacoes,
          salario: data.salario,
          ativo: data.ativo ?? true,
          tem_acesso_sistema: data.tem_acesso_sistema ?? false,
          created_by: profileId,
          updated_by: profileId
        })
        .select(`
          *,
          cargo:dim_cargos(id, nome, codigo),
          setor:dim_setores(id, nome, codigo)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar colaborador:', error);
        throw error;
      }

      return newColaborador;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador cadastrado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar colaborador:', error);
      toast.error('Erro ao cadastrar colaborador. Tente novamente.');
    }
  });

  // Atualizar colaborador
  const updateColaboradorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateColaboradorData> }) => {
      const profileId = profile?.id;

      const { data: updatedColaborador, error } = await supabase
        .from('dim_colaboradores')
        .update({
          ...data,
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          cargo:dim_cargos(id, nome, codigo),
          setor:dim_setores(id, nome, codigo)
        `)
        .single();

      if (error) {
        console.error('Erro ao atualizar colaborador:', error);
        throw error;
      }

      return updatedColaborador;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar colaborador:', error);
      toast.error('Erro ao atualizar colaborador. Tente novamente.');
    }
  });

  // Excluir colaborador (soft delete)
  const deleteColaboradorMutation = useMutation({
    mutationFn: async (id: string) => {
      const profileId = profile?.id;

      const { error } = await supabase
        .from('dim_colaboradores')
        .update({
          ativo: false,
          status: 'demitido',
          data_demissao: new Date().toISOString().split('T')[0],
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir colaborador:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover colaborador:', error);
      toast.error('Erro ao remover colaborador. Tente novamente.');
    }
  });

  return {
    colaboradores: colaboradoresQuery.data || [],
    isLoading: colaboradoresQuery.isLoading,
    error: colaboradoresQuery.error,
    createColaborador: createColaboradorMutation.mutate,
    updateColaborador: updateColaboradorMutation.mutate,
    deleteColaborador: deleteColaboradorMutation.mutate,
    isCreating: createColaboradorMutation.isPending,
    isUpdating: updateColaboradorMutation.isPending,
    isDeleting: deleteColaboradorMutation.isPending,
  };
};