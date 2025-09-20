import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, TrendingUp } from 'lucide-react';
import { useCsvProcessor } from '@/hooks/useCsvProcessor';

export const FatoDistribuicaoProcessor: React.FC = () => {
  const { processFatoDistribuicao, isProcessing } = useCsvProcessor();

  const handleProcess = async () => {
    const result = await processFatoDistribuicao();
    if (result) {
      console.log('Fato distribuição processada com sucesso:', result);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Fato Distribuição
        </CardTitle>
        <CardDescription>
          Processa dados enriquecidos combinando staging_03 (desvio distribuição) com staging_05 (trato por curral)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Fonte base:</strong> staging_03_desvio_distribuicao</p>
            <p><strong>Enriquecimento:</strong> staging_05_trato_por_curral (id_carregamento)</p>
            <p><strong>Chave de JOIN:</strong> merge (data-hora-vagao-trato)</p>
            <div className="flex items-center gap-2 text-accent">
              <TrendingUp className="h-4 w-4" />
              <span>Resultado: Tabela fato consolidada para análises</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              size="sm"
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isProcessing ? 'Processando...' : 'Processar Fato Distribuição'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};