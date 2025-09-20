import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Play, Trash2 } from 'lucide-react';
import { useCsvProcessor } from '@/hooks/useCsvProcessor';

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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {filename ? (
              <>Arquivo: <code className="bg-muted px-2 py-1 rounded">{filename}</code></>
            ) : (
              <span className="text-destructive">Nenhum arquivo encontrado</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`force-${pipeline}`}
              checked={forceOverwrite}
              onCheckedChange={setForceOverwrite}
            />
            <label
              htmlFor={`force-${pipeline}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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