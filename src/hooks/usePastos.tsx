import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Pasto {
  id: string;
  organization_id: string;
  codigo: string;
  nome: string;
  area_hectares?: number;
  setor_id?: string;
  localizacao?: string;
  quantidade_cocho_metros?: number;
  tipo_cocho?: string;
  tipo_solo?: string;
  tipo_pasto?: string;
  especie_forrageira?: string;
  capacidade_animais?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Relations
  setor?: {
    id: string;
    nome: string;
    codigo: string;
    tipo: string;
  };
}

export interface CreatePastoData {
  nome: string;
  area_hectares?: number;
  setor_id?: string;
  localizacao?: string;
  quantidade_cocho_metros?: number;
  tipo_cocho?: string;
  tipo_solo?: string;
  tipo_pasto?: string;
  especie_forrageira?: string;
  capacidade_animais?: number;
  ativo?: boolean;
}

export const usePastos = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar pastos
  const pastosQuery = useQuery({
    queryKey: ['pastos', organization?.id],
    queryFn: async (): Promise<Pasto[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

      const { data, error } = await supabase
        .from('dim_pastos')
        .select(`
          *,
          setor:dim_setores(id, nome, codigo, tipo)
        `)
        .eq('organization_id', orgId)
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar pastos:', error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });

  // Gerar próximo código de pasto
  const generatePastoCode = async (): Promise<string> => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    // Buscar o último código usado
    const { data } = await supabase
      .from('dim_pastos')
      .select('codigo')
      .eq('organization_id', orgId)
      .order('codigo', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const lastCode = data[0].codigo;
      const match = lastCode.match(/PST-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `PST-${String(nextNumber).padStart(3, '0')}`;
      }
    }

    return 'PST-001';
  };

  // Criar pasto
  const createPastoMutation = useMutation({
    mutationFn: async (data: CreatePastoData) => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const profileId = profile?.id;

      // Gerar código automaticamente
      const codigo = await generatePastoCode();

      const { data: newPasto, error } = await supabase
        .from('dim_pastos')
        .insert({
          organization_id: orgId,
          codigo,
          nome: data.nome,
          area_hectares: data.area_hectares,
          setor_id: data.setor_id,
          localizacao: data.localizacao,
          quantidade_cocho_metros: data.quantidade_cocho_metros,
          tipo_cocho: data.tipo_cocho,
          tipo_solo: data.tipo_solo,
          tipo_pasto: data.tipo_pasto,
          especie_forrageira: data.especie_forrageira,
          capacidade_animais: data.capacidade_animais,
          ativo: data.ativo ?? true,
          created_by: profileId,
          updated_by: profileId
        })
        .select(`
          *,
          setor:dim_setores(id, nome, codigo, tipo)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar pasto:', error);
        throw error;
      }

      return newPasto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastos'] });
      toast.success('Pasto cadastrado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar pasto:', error);
      toast.error('Erro ao cadastrar pasto. Tente novamente.');
    }
  });

  // Atualizar pasto
  const updatePastoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePastoData> }) => {
      const profileId = profile?.id;

      const { data: updatedPasto, error } = await supabase
        .from('dim_pastos')
        .update({
          ...data,
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          setor:dim_setores(id, nome, codigo, tipo)
        `)
        .single();

      if (error) {
        console.error('Erro ao atualizar pasto:', error);
        throw error;
      }

      return updatedPasto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastos'] });
      toast.success('Pasto atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar pasto:', error);
      toast.error('Erro ao atualizar pasto. Tente novamente.');
    }
  });

  // Excluir pasto (soft delete)
  const deletePastoMutation = useMutation({
    mutationFn: async (id: string) => {
      const profileId = profile?.id;

      const { error } = await supabase
        .from('dim_pastos')
        .update({
          ativo: false,
          updated_by: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir pasto:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastos'] });
      toast.success('Pasto excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir pasto:', error);
      toast.error('Erro ao excluir pasto. Tente novamente.');
    }
  });

  return {
    pastos: pastosQuery.data || [],
    isLoading: pastosQuery.isLoading,
    error: pastosQuery.error,
    createPasto: createPastoMutation.mutate,
    updatePasto: updatePastoMutation.mutate,
    deletePasto: deletePastoMutation.mutate,
    isCreating: createPastoMutation.isPending,
    isUpdating: updatePastoMutation.isPending,
    isDeleting: deletePastoMutation.isPending,
  };
};