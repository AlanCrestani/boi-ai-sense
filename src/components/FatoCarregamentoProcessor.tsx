import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package, Clock } from 'lucide-react';
import { useCsvProcessor } from '@/hooks/useCsvProcessor';
import { useLastUpdate } from '@/hooks/useLastUpdate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const FatoCarregamentoProcessor: React.FC = () => {
  const { processFatoCarregamento, isProcessing } = useCsvProcessor();
  const { lastUpdate, isLoading: isLoadingUpdate } = useLastUpdate('fato_carregamento');

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
          Processa dados de carregamento enriquecidos
        </CardDescription>
        {!isLoadingUpdate && lastUpdate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3" />
            <span>Última atualização: {format(new Date(lastUpdate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
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
              <Package className="h-4 w-4" />
            )}
            {isProcessing ? 'Processando...' : 'Processar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};