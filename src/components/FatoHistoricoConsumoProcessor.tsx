import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, TrendingUp } from 'lucide-react';
import { useCsvProcessor } from '@/hooks/useCsvProcessor';

export const FatoHistoricoConsumoProcessor: React.FC = () => {
  const { processFatoHistoricoConsumo, isProcessing } = useCsvProcessor();

  const handleProcess = async () => {
    const result = await processFatoHistoricoConsumo();
    if (result) {
      console.log('Fato histórico consumo processado com sucesso:', result);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Fato Histórico Consumo
        </CardTitle>
        <CardDescription>
          Processa dados de histórico de consumo da staging_01_historico_consumo para a tabela de fatos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><span className="font-medium">Fonte:</span> staging_01_historico_consumo</p>
            <p><span className="font-medium">Destino:</span> fato_historico_consumo</p>
            <p><span className="font-medium">Tipo:</span> Transformação 1:1 com limpeza de dados</p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Métricas Processadas
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Dados dos animais (raça, sexo, lote, curral)</li>
              <li>• Métricas de consumo (CMS, CMN, GMD)</li>
              <li>• Informações nutricionais (MS dieta, NDT)</li>
              <li>• Dados de performance e eficiência</li>
            </ul>
          </div>

          <Button
            onClick={handleProcess}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Processar Fato Histórico Consumo'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};