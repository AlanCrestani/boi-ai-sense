import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Fornecedor {
  id: string;
  organization_id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFornecedorData {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
}

export interface UpdateFornecedorData {
  nome?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
}

export function useFornecedores() {
  const { organization } = useAuth();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch fornecedores
  const fetchFornecedores = async () => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('dim_fornecedores')
        .select('*')
        .eq('organization_id', orgId)
        .order('nome');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error: any) {
      console.error('Error fetching fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, [organization?.id]);

  // Create fornecedor
  const createFornecedor = async (data: CreateFornecedorData) => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    // Debug: verificar sessão do usuário
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔍 DEBUG CREATE FORNECEDOR:', {
      orgId,
      hasSession: !!session,
      userId: session?.user?.id,
      data
    });

    try {
      setIsCreating(true);
      const { error } = await supabase
        .from('dim_fornecedores')
        .insert({
          organization_id: orgId,
          ...data,
        });

      if (error) throw error;

      toast.success('Fornecedor cadastrado com sucesso');
      fetchFornecedores();
    } catch (error: any) {
      console.error('Error creating fornecedor:', error);
      toast.error('Erro ao cadastrar fornecedor');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Update fornecedor
  const updateFornecedor = async (id: string, data: UpdateFornecedorData) => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('dim_fornecedores')
        .update(data)
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;

      toast.success('Fornecedor atualizado com sucesso');
      fetchFornecedores();
    } catch (error: any) {
      console.error('Error updating fornecedor:', error);
      toast.error('Erro ao atualizar fornecedor');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete fornecedor
  const deleteFornecedor = async (id: string) => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      const { error } = await supabase
        .from('dim_fornecedores')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;

      toast.success('Fornecedor removido com sucesso');
      fetchFornecedores();
    } catch (error: any) {
      console.error('Error deleting fornecedor:', error);
      toast.error('Erro ao remover fornecedor');
      throw error;
    }
  };

  return {
    fornecedores,
    isLoading,
    isCreating,
    isUpdating,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
    refetch: fetchFornecedores,
  };
}