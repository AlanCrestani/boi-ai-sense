import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Interfaces para os dados das tabelas fato
export interface FatoDistribuicaoData {
  organization_id: string;
  data: string;
  hora: string;
  vagao: string;
  curral: string;
  trato: string;
  tratador: string;
  dieta: string;
  realizado_kg: number;
  previsto_kg: number;
  desvio_kg: number;
  desvio_pc: number;
  status: string;
  merge: string;
  id_carregamento: string;
}

export interface FatoCarregamentoData {
  organization_id: string;
  data: string;
  hora: string;
  pazeiro: string;
  vagao: string;
  dieta: string;
  nro_carregamento: string;
  ingrediente: string;
  tipo_ingrediente: string;
  realizado_kg: number;
  previsto_kg: number;
  desvio_kg: number;
  desvio_pc: number;
  status: string;
  merge: string;
  id_carregamento: string;
}

// Interface para filtros
export interface FatoFilters {
  startDate: Date | null;
  endDate: Date | null;
}

// Interface para dados consolidados
export interface FatoData {
  distribuicao: FatoDistribuicaoData[];
  carregamento: FatoCarregamentoData[];
}

export interface FatoDataState {
  data: FatoData;
  loading: {
    global: boolean;
    distribuicao: boolean;
    carregamento: boolean;
  };
  errors: {
    global: string | null;
    distribuicao: string | null;
    carregamento: string | null;
  };
  lastUpdated: Date | null;
}

export const useFatoData = (filters?: FatoFilters) => {
  const { organization } = useAuth();

  const [state, setState] = useState<FatoDataState>({
    data: {
      distribuicao: [],
      carregamento: [],
    },
    loading: {
      global: false,
      distribuicao: false,
      carregamento: false,
    },
    errors: {
      global: null,
      distribuicao: null,
      carregamento: null,
    },
    lastUpdated: null,
  });

  // Helper para construir filtros de data
  const startDateString = filters?.startDate?.toISOString().split('T')[0];
  const endDateString = filters?.endDate?.toISOString().split('T')[0];

  const buildDateFilter = useCallback(() => {
    if (!startDateString || !endDateString) {
      return {};
    }

    return {
      data: {
        gte: startDateString,
        lte: endDateString
      }
    };
  }, [startDateString, endDateString]);

  // Fetch fato_distribuicao
  const fetchFatoDistribuicao = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, distribuicao: true },
      errors: { ...prev.errors, distribuicao: null }
    }));

    try {
      const dateFilter = buildDateFilter();
      const { data, error } = await supabase
        .from('fato_distribuicao')
        .select('*')
        .eq('organization_id', organization.id)
        .match(dateFilter)
        .order('data', { ascending: false })
        .order('hora', { ascending: true })
        .limit(1000); // Limitar para performance

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: { ...prev.data, distribuicao: data || [] },
        loading: { ...prev.loading, distribuicao: false }
      }));
    } catch (error) {
      console.error('Erro ao buscar fato_distribuicao:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, distribuicao: false },
        errors: { ...prev.errors, distribuicao: (error as Error).message }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Fetch fato_carregamento
  const fetchFatoCarregamento = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, carregamento: true },
      errors: { ...prev.errors, carregamento: null }
    }));

    try {
      const dateFilter = buildDateFilter();
      const { data, error } = await supabase
        .from('fato_carregamento')
        .select('*')
        .eq('organization_id', organization.id)
        .match(dateFilter)
        .order('data', { ascending: false })
        .order('hora', { ascending: true })
        .limit(1000); // Limitar para performance

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: { ...prev.data, carregamento: data || [] },
        loading: { ...prev.loading, carregamento: false }
      }));
    } catch (error) {
      console.error('Erro ao buscar fato_carregamento:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, carregamento: false },
        errors: { ...prev.errors, carregamento: (error as Error).message }
      }));
    }
  }, [organization?.id, buildDateFilter]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!organization?.id) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, global: true },
      errors: {
        global: null,
        distribuicao: null,
        carregamento: null,
      }
    }));

    try {
      await Promise.all([
        fetchFatoDistribuicao(),
        fetchFatoCarregamento(),
      ]);

      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, global: false },
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Erro ao buscar dados das tabelas fato:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, global: false },
        errors: { ...prev.errors, global: (error as Error).message }
      }));
    }
  }, [
    organization?.id,
    fetchFatoDistribuicao,
    fetchFatoCarregamento,
  ]);

  // Effect para carregar dados quando organização ou filtros mudam
  useEffect(() => {
    if (organization?.id) {
      fetchAllData();
    }
  }, [organization?.id, fetchAllData]);

  // Computed values
  const isLoading = Object.values(state.loading).some(loading => loading);
  const hasErrors = Object.values(state.errors).some(error => error !== null);
  const hasData = Object.values(state.data).some(dataArray => dataArray.length > 0);

  return {
    ...state.data,
    loading: state.loading,
    errors: state.errors,
    isLoading,
    hasErrors,
    hasData,
    lastUpdated: state.lastUpdated,
    refetch: fetchAllData,
    fetchFatoDistribuicao,
    fetchFatoCarregamento,
  };
};