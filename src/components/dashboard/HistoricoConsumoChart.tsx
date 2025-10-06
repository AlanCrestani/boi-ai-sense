import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EChartsBar } from '@/components/charts/EChartsBar';
import { useHistoricoConsumo } from '@/hooks/useHistoricoConsumo';
import { Loader2, Users, Filter } from 'lucide-react';

export const HistoricoConsumoChart: React.FC = () => {
  const { data: historicoData, isLoading, error } = useHistoricoConsumo();
  const [sexoFilter, setSexoFilter] = useState<string>('TODOS');

  console.log('[HistoricoConsumoChart] Data received:', historicoData);
  console.log('[HistoricoConsumoChart] Loading:', isLoading);
  console.log('[HistoricoConsumoChart] Error:', error);

  const chartData = useMemo(() => {
    if (!historicoData || historicoData.length === 0) return null;

    // Filtrar dados com base no sexo selecionado
    const filteredData = sexoFilter === 'TODOS'
      ? historicoData
      : historicoData.filter(item => item.sexo === sexoFilter);

    // Agrupar por grupo_genetico e somar
    const grouped = filteredData.reduce((acc: Record<string, number>, curr) => {
      acc[curr.grupo_genetico] = (acc[curr.grupo_genetico] || 0) + curr.total_animais;
      return acc;
    }, {});

    // Transformar em array e ordenar do maior para o menor
    const sortedData = Object.entries(grouped)
      .sort(([, a], [, b]) => b - a) // Ordenar por quantidade (maior para menor)
      .reduce((acc, [key, value]) => {
        acc.categories.push(key);
        acc.values.push(value);
        return acc;
      }, { categories: [] as string[], values: [] as number[] });

    if (sortedData.categories.length === 0) return null;

    return {
      xAxisData: sortedData.categories,
      series: [{
        name: sexoFilter === 'MA' ? 'Machos' : sexoFilter === 'FE' ? 'Fêmeas' : 'Total de Animais',
        data: sortedData.values,
        color: sexoFilter === 'MA' ? '#3b82f6' : sexoFilter === 'FE' ? '#ec4899' : '#8b5cf6'
      }]
    };
  }, [historicoData, sexoFilter]);

  const totalAnimais = useMemo(() => {
    if (!historicoData) return 0;
    const filtered = sexoFilter === 'TODOS'
      ? historicoData
      : historicoData.filter(item => item.sexo === sexoFilter);
    return filtered.reduce((sum, item) => sum + item.total_animais, 0);
  }, [historicoData, sexoFilter]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Erro ao carregar dados do histórico de consumo
        </div>
      </Card>
    );
  }

  if (!chartData) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Nenhum dado disponível para exibição
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Animais por Grupo Genético
            </h3>
            <p className="text-sm text-muted-foreground">
              Total: {totalAnimais.toLocaleString('pt-BR')} animais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sexoFilter} onValueChange={setSexoFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filtrar por sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="MA">Machos</SelectItem>
              <SelectItem value="FE">Fêmeas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[300px]">
        <EChartsBar
          title=""
          xAxisData={chartData.xAxisData}
          series={chartData.series}
          height={300}
          showLegend={false}
          yAxisLabel="Quantidade de Animais"
          formatTooltip={(params: any) => {
            const value = params[0]?.value || 0;
            return `
              <div class="p-2">
                <div class="font-semibold">${params[0]?.name || ''}</div>
                <div class="flex items-center justify-between gap-4 mt-1">
                  <span class="text-muted-foreground">Animais:</span>
                  <span class="font-medium">${value.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            `;
          }}
        />
      </div>
    </Card>
  );
};