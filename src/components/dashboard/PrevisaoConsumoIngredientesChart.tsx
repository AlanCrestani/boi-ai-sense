import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrevisaoConsumoIngredientes } from '@/hooks/usePrevisaoConsumoIngredientes';
import { EChartsBar } from '@/components/charts/EChartsBar';
import { Loader2 } from 'lucide-react';

export function PrevisaoConsumoIngredientesChart() {
  const { data, isLoading, error } = usePrevisaoConsumoIngredientes();

  console.log('[PrevisaoConsumoIngredientesChart] Rendering with:', { data, isLoading, error });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previsão de Consumo de Ingredientes - Hoje</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previsão de Consumo de Ingredientes - Hoje</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar dados: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previsão de Consumo de Ingredientes - Hoje</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-sm text-muted-foreground">
            Nenhum dado disponível para hoje
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    xAxisData: data.map((item: any) => item.nome),
    series: [{
      name: 'Consumo Previsto (kg)',
      data: data.map((item: any) => Number(item.consumo_previsto_kg)),
      color: '#0528F2'
    }]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsão de Consumo de Ingredientes - Hoje</CardTitle>
      </CardHeader>
      <CardContent>
        <EChartsBar
          xAxisData={chartConfig.xAxisData}
          series={chartConfig.series}
          height={400}
          yAxisLabel="Consumo Previsto (kg)"
          showLegend={false}
          formatTooltip={(params: any) => {
            const value = params[0].value;
            return `${params[0].name}<br/>Consumo Previsto: ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
          }}
        />
      </CardContent>
    </Card>
  );
}
