import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ProcessCsvParams {
  pipeline: string;
  filename: string;
  fileId?: string;
  forceOverwrite?: boolean;
}

interface ProcessCsvResponse {
  success: boolean;
  filename: string;
  fileId: string;
  rowsProcessed?: number;
  rowsInserted?: number;
  errors?: any[];
  message: string;
  summary?: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    errors?: any[];
  };
}

export const useCsvProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const { toast } = useToast();
  const { user, organization } = useAuth();

  const processCsv = async ({ pipeline, filename, fileId, forceOverwrite = false }: ProcessCsvParams): Promise<ProcessCsvResponse | null> => {
    setIsProcessing(true);

    try {
      console.log(`🔄 Iniciando processamento - Pipeline: ${pipeline}, Arquivo: ${filename}`);

      // Validate required data
      if (!user || !organization) {
        throw new Error('Usuário ou organização não encontrados');
      }

      // Generate fileId if not provided
      const actualFileId = fileId || crypto.randomUUID();
      const organizationId = organization.id;

      console.log(`📋 IDs: File=${actualFileId}, Organization=${organizationId}`);

      // Choose the appropriate edge function based on pipeline
      const edgeFunctionName = `process-csv-${pipeline.padStart(2, '0')}`;
      console.log(`🎯 Chamando edge function: ${edgeFunctionName}`);

      const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: {
          filename,
          fileId: actualFileId,
          organizationId,
          forceOverwrite
        }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        // Check if it's a duplicate data error (409 conflict)
        if (data.error && data.error.includes('já existem na base')) {
          toast({
            title: "Dados já processados",
            description: `${data.error} Use "Forçar sobrescrita" se quiser reprocessar.`,
            variant: "destructive",
          });
          return data; // Return the error data with details
        }
        throw new Error(data.error || 'Erro desconhecido no processamento');
      }

      console.log(`✅ Processamento concluído:`, data);

      // Use summary format (pipeline 01) or legacy format (other pipelines)
      const totalRows = data.summary?.totalRows || data.rowsProcessed || 0;
      const successfulRows = data.summary?.successfulRows || data.rowsInserted || 0;

      toast({
        title: "Processamento concluído",
        description: `${totalRows} linhas processadas, ${successfulRows} linhas inseridas no banco`,
      });

      return data;
    } catch (error) {
      console.error('Erro no processamento:', error);
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanDuplicates = async (pipeline: string) => {
    setIsCleaningDuplicates(true);

    try {
      console.log(`🧹 Iniciando limpeza de duplicados - Pipeline: ${pipeline}`);

      // Validate required data
      if (!user || !organization) {
        throw new Error('Usuário ou organização não encontrados');
      }

      const organizationId = organization.id;
      console.log(`📋 Organization ID: ${organizationId}`);

      // Call the cleanup edge function
      const edgeFunctionName = `clean-duplicates-${pipeline.padStart(2, '0')}`;
      console.log(`🎯 Chamando edge function: ${edgeFunctionName}`);

      const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: {
          organizationId
        }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na limpeza');
      }

      console.log(`✅ Limpeza concluída:`, data);

      toast({
        title: "Limpeza de duplicados concluída",
        description: `${data.duplicatesRemoved} registros duplicados removidos. Total final: ${data.finalCount} registros`,
      });

      return data;
    } catch (error) {
      console.error('Erro na limpeza:', error);
      toast({
        title: "Erro na limpeza de duplicados",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const processFatoDistribuicao = async () => {
    setIsProcessing(true);

    try {
      console.log('🔄 Iniciando processamento da fato_distribuicao...');

      // Validate required data
      if (!user || !organization) {
        throw new Error('Usuário ou organização não encontrados');
      }

      const organizationId = organization.id;
      console.log(`📋 Organization ID: ${organizationId}`);

      // Call the fato_distribuicao edge function
      const { data, error } = await supabase.functions.invoke('process-fato-distribuicao', {
        body: {
          organizationId
        }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido no processamento da fato_distribuicao');
      }

      console.log(`✅ Fato distribuição processada:`, data);

      toast({
        title: "Fato Distribuição Processada",
        description: `${data.stats.totalProcessed} registros processados. Taxa de enriquecimento: ${data.stats.enrichmentRate}`,
      });

      return data;
    } catch (error) {
      console.error('Erro no processamento da fato_distribuicao:', error);
      toast({
        title: "Erro no processamento da fato_distribuicao",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const processFatoCarregamento = async () => {
    setIsProcessing(true);

    try {
      console.log('🔄 Iniciando processamento da fato_carregamento...');

      // Validate required data
      if (!user || !organization) {
        throw new Error('Usuário ou organização não encontrados');
      }

      const organizationId = organization.id;
      console.log(`📋 Organization ID: ${organizationId}`);

      // Call the fato_carregamento edge function
      const { data, error } = await supabase.functions.invoke('process-fato-carregamento', {
        body: {
          organizationId,
          forceOverwrite: true
        }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido no processamento da fato_carregamento');
      }

      console.log(`✅ Fato carregamento processada:`, data);

      toast({
        title: "Fato Carregamento Processada",
        description: `${data.stats.totalProcessed} registros processados. Taxa de enriquecimento: ${data.stats.enrichmentRate}`,
      });

      return data;
    } catch (error) {
      console.error('Erro no processamento da fato_carregamento:', error);
      toast({
        title: "Erro no processamento da fato_carregamento",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processCsv,
    cleanDuplicates,
    processFatoDistribuicao,
    processFatoCarregamento,
    isProcessing,
    isCleaningDuplicates
  };
};