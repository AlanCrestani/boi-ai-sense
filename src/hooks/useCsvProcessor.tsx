import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ProcessCsvParams {
  pipeline: string;
  filename: string;
}

interface ProcessCsvResponse {
  success: boolean;
  pipeline: string;
  filename: string;
  processedFilename: string;
  rowsProcessed: number;
  message: string;
}

export const useCsvProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processCsv = async ({ pipeline, filename }: ProcessCsvParams): Promise<ProcessCsvResponse | null> => {
    setIsProcessing(true);
    
    try {
      console.log(`🔄 Iniciando processamento - Pipeline: ${pipeline}, Arquivo: ${filename}`);
      
      const { data, error } = await supabase.functions.invoke('process-csv', {
        body: { pipeline, filename }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido no processamento');
      }

      console.log(`✅ Processamento concluído:`, data);
      
      toast({
        title: "Processamento concluído",
        description: `Pipeline ${pipeline}: ${data.rowsProcessed} linhas processadas`,
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

  return {
    processCsv,
    isProcessing
  };
};