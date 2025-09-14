import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play } from 'lucide-react';
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
  const { processCsv, isProcessing } = useCsvProcessor();

  const handleProcess = async () => {
    if (!filename) {
      console.warn(`Nenhum arquivo encontrado para o pipeline ${pipeline}`);
      return;
    }

    await processCsv({ pipeline, filename });
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filename ? (
              <>Arquivo: <code className="bg-muted px-2 py-1 rounded">{filename}</code></>
            ) : (
              <span className="text-destructive">Nenhum arquivo encontrado</span>
            )}
          </div>
          <Button
            onClick={handleProcess}
            disabled={!filename || isProcessing}
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
      </CardContent>
    </Card>
  );
};