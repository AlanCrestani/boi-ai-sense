import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceProfiler } from '@/utils/performance';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartDataPoint } from '@/hooks/useCarregamentoData';
import { CarregamentoStateWrapper } from '../states';

interface TemporalChartsProps {
  efficiencyOverTime: ChartDataPoint[];
  volumePerHour: ChartDataPoint[];
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const TemporalCharts = memo<TemporalChartsProps>(({
  efficiencyOverTime,
  volumePerHour,
  isLoading,
  error,
  onRetry
}) => {
  usePerformanceProfiler('TemporalCharts', [efficiencyOverTime, volumePerHour, isLoading, error]);
  // Combinar todos os dados para verificar se há dados disponíveis
  const allData = [
    ...efficiencyOverTime,
    ...volumePerHour
  ];

  return (
    <CarregamentoStateWrapper
      isLoading={isLoading}
      error={error}
      data={allData}
      loadingType="charts"
      loadingCount={2}
      errorType="database"
      emptyType="no-results"
      onRetry={onRetry}
    >
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Análise Temporal</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Eficiência ao Longo do Dia - Linha */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">Eficiência ao Longo do Dia</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64 sm:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={efficiencyOverTime}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hora"
                    stroke="white"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="white"
                    fontSize={12}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--text-primary))'
                    }}
                    formatter={(value, name, props) => [
                      `${Number(value).toFixed(1)}%`,
                      'Eficiência no Período'
                    ]}
                    labelFormatter={(label) => `Horário: ${label}`}
                    labelStyle={{ color: 'hsl(var(--text-primary))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="eficiencia"
                    stroke="#0088FE"
                    strokeWidth={3}
                    dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#0088FE', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Volume por Hora - Barras */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">Volume por Hora</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64 sm:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={volumePerHour}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hora"
                    stroke="white"
                    fontSize={12}
                  />
                  <YAxis stroke="white" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--text-primary))'
                    }}
                    formatter={(value, name, props) => [
                      `${Number(value).toLocaleString('pt-BR')} kg`,
                      'Volume no Período'
                    ]}
                    labelFormatter={(label) => `Horário: ${label}`}
                    labelStyle={{ color: 'hsl(var(--text-primary))' }}
                  />
                  <Bar
                    dataKey="volume"
                    fill="#00C49F"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </CarregamentoStateWrapper>
  );
});