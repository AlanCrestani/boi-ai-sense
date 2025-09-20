import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, Package } from 'lucide-react';
import { useCsvProcessor } from '@/hooks/useCsvProcessor';

export const FatoCarregamentoProcessor: React.FC = () => {
  const { processFatoCarregamento, isProcessing } = useCsvProcessor();

  const handleProcess = async () => {
    const result = await processFatoCarregamento();
    if (result) {
      console.log('Fato carregamento processada com sucesso:', result);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Fato Carregamento
        </CardTitle>
        <CardDescription>
          Processa dados enriquecidos combinando staging_02 (desvio carregamento) com staging_04 (itens trato)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Fonte base:</strong> staging_02_desvio_carregamento</p>
            <p><strong>Enriquecimento:</strong> staging_04_itens_trato (id_carregamento)</p>
            <p><strong>Chave de JOIN:</strong> merge (data-hora-vagao)</p>
            <p><strong>Tratamento:</strong> Remove prefixo "Carregamento" do nro_carregamento</p>
            <div className="flex items-center gap-2 text-accent">
              <Database className="h-4 w-4" />
              <span>Resultado: Tabela fato para análises de carregamento</span>
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
              {isProcessing ? 'Processando...' : 'Processar Fato Carregamento'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};