import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Play, Trash2, Clock } from 'lucide-react';
import { useCsvProcessor } from '@/hooks/useCsvProcessor';
import { useLastUpdate } from '@/hooks/useLastUpdate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CsvProcessorProps {
  pipeline: string;
  title: string;
  description: string;
  filename?: string;
}

export const CsvProcessor: React.FC<CsvProcessorProps> = ({
  pipeline,
  title,
  description,
  filename
}) => {
  const { processCsv, cleanDuplicates, isProcessing, isCleaningDuplicates } = useCsvProcessor();
  const [forceOverwrite, setForceOverwrite] = useState(false);
  const tableName = `staging_${pipeline.padStart(2, '0')}_${
    pipeline === '01' ? 'historico_consumo' :
    pipeline === '02' ? 'desvio_carregamento' :
    pipeline === '03' ? 'desvio_distribuicao' :
    pipeline === '04' ? 'itens_trato' :
    'trato_por_curral'
  }`;
  const { lastUpdate, isLoading: isLoadingUpdate } = useLastUpdate(tableName);

  const handleProcess = async () => {
    if (!filename) {
      console.warn(`Nenhum arquivo encontrado para o pipeline ${pipeline}`);
      return;
    }

    await processCsv({ pipeline, filename, forceOverwrite });
  };

  const handleCleanDuplicates = async () => {
    await cleanDuplicates(pipeline);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pipeline {pipeline} - {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        {!isLoadingUpdate && lastUpdate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3" />
            <span>Última atualização: {format(new Date(lastUpdate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md border border-border/50">
            <Checkbox
              id={`force-overwrite-${pipeline}`}
              checked={forceOverwrite}
              onCheckedChange={(checked) => setForceOverwrite(checked as boolean)}
            />
            <label
              htmlFor={`force-overwrite-${pipeline}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Forçar sobrescrita de dados existentes
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={handleCleanDuplicates}
              disabled={isProcessing || isCleaningDuplicates}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              {isCleaningDuplicates ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isCleaningDuplicates ? 'Limpando...' : 'Limpar Duplicados'}
            </Button>

            <Button
              onClick={handleProcess}
              disabled={!filename || isProcessing || isCleaningDuplicates}
              size="sm"
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isProcessing ? 'Processando...' : 'Processar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};