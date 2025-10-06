import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Ingrediente {
  id: string;
  organization_id: string;
  nome: string;
  codigo?: string;
  unidade_medida: string;
  tipo?: string;
  ativo: boolean;
  requer_atualizacao_ms?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIngredienteData {
  nome: string;
  codigo?: string;
  unidade_medida?: string;
  tipo?: string;
  ativo?: boolean;
  requer_atualizacao_ms?: boolean;
}

export interface UpdateIngredienteData {
  nome?: string;
  codigo?: string;
  unidade_medida?: string;
  tipo?: string;
  ativo?: boolean;
  requer_atualizacao_ms?: boolean;
}

export function useIngredientes() {
  const { organization } = useAuth();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch ingredientes
  const fetchIngredientes = async () => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('dim_ingredientes')
        .select('*')
        .eq('organization_id', orgId)
        .order('nome');

      if (error) throw error;
      setIngredientes(data || []);
    } catch (error: any) {
      console.error('Error fetching ingredientes:', error);
      toast.error('Erro ao carregar ingredientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredientes();
  }, [organization?.id]);

  // Create ingrediente
  const createIngrediente = async (data: CreateIngredienteData) => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      setIsCreating(true);
      const { error } = await supabase
        .from('dim_ingredientes')
        .insert({
          organization_id: orgId,
          ...data,
        });

      if (error) throw error;

      toast.success('Ingrediente cadastrado com sucesso');
      fetchIngredientes();
    } catch (error: any) {
      console.error('Error creating ingrediente:', error);
      toast.error('Erro ao cadastrar ingrediente');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Update ingrediente
  const updateIngrediente = async (id: string, data: UpdateIngredienteData) => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('dim_ingredientes')
        .update(data)
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;

      toast.success('Ingrediente atualizado com sucesso');
      fetchIngredientes();
    } catch (error: any) {
      console.error('Error updating ingrediente:', error);
      toast.error('Erro ao atualizar ingrediente');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete ingrediente
  const deleteIngrediente = async (id: string) => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      const { error } = await supabase
        .from('dim_ingredientes')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;

      toast.success('Ingrediente removido com sucesso');
      fetchIngredientes();
    } catch (error: any) {
      console.error('Error deleting ingrediente:', error);
      toast.error('Erro ao remover ingrediente');
      throw error;
    }
  };

  return {
    ingredientes,
    isLoading,
    isCreating,
    isUpdating,
    createIngrediente,
    updateIngrediente,
    deleteIngrediente,
    refetch: fetchIngredientes,
  };
}