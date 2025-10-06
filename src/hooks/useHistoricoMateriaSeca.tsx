import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface HistoricoMS {
  id: string;
  organization_id: string;
  ingrediente_id: string;
  valor_ms: number;
  data_registro: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHistoricoMSData {
  ingrediente_id: string;
  valor_ms: number;
  data_registro?: string;
}

export function useHistoricoMateriaSeca(ingredienteId?: string) {
  const { organization } = useAuth();
  const [historico, setHistorico] = useState<HistoricoMS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch historico
  const fetchHistorico = async () => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      setIsLoading(true);
      let query = supabase
        .from('historico_materia_seca')
        .select('*')
        .eq('organization_id', orgId)
        .order('data_registro', { ascending: false });

      if (ingredienteId) {
        query = query.eq('ingrediente_id', ingredienteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistorico(data || []);
    } catch (error: any) {
      console.error('Error fetching historico MS:', error);
      toast.error('Erro ao carregar histórico de MS');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [organization?.id, ingredienteId]);

  // Create historico entry (UPSERT: atualiza se existe, insere se não existe)
  const createHistoricoMS = async (data: CreateHistoricoMSData) => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      setIsCreating(true);

      // UPSERT: se já existe um registro para esta org+ingrediente+data, atualiza
      // caso contrário, insere novo registro
      const { error } = await supabase
        .from('historico_materia_seca')
        .upsert({
          organization_id: orgId,
          ingrediente_id: data.ingrediente_id,
          valor_ms: data.valor_ms,
          data_registro: data.data_registro || new Date().toISOString(),
        }, {
          onConflict: 'organization_id,ingrediente_id,data_registro',
          ignoreDuplicates: false // Atualiza se já existe
        });

      if (error) throw error;

      toast.success('Matéria Seca registrada com sucesso');
      fetchHistorico();
    } catch (error: any) {
      console.error('Error creating historico MS:', error);
      toast.error('Erro ao registrar Matéria Seca');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Delete historico entry
  const deleteHistoricoMS = async (id: string) => {
    const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

    try {
      const { error } = await supabase
        .from('historico_materia_seca')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;

      toast.success('Registro removido com sucesso');
      fetchHistorico();
    } catch (error: any) {
      console.error('Error deleting historico MS:', error);
      toast.error('Erro ao remover registro');
      throw error;
    }
  };

  return {
    historico,
    isLoading,
    isCreating,
    createHistoricoMS,
    deleteHistoricoMS,
    refetch: fetchHistorico,
  };
}
