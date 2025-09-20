import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartDataPoint } from '@/hooks/useCarregamentoData';
import { CarregamentoStateWrapper } from '../states';

interface QuantitativeChartsProps {
  ingredientConsumption: ChartDataPoint[];
  consumptionShare: ChartDataPoint[];
  plannedVsActual: ChartDataPoint[];
  efficiencyByLoad: ChartDataPoint[];
  deviationByLoadAndWagon: ChartDataPoint[];
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const QuantitativeCharts = memo<QuantitativeChartsProps>(({
  ingredientConsumption,
  consumptionShare,
  plannedVsActual,
  efficiencyByLoad,
  deviationByLoadAndWagon,
  isLoading,
  error,
  onRetry
}) => {
  // Combinar todos os dados para verificar se há dados disponíveis
  const allData = [
    ...ingredientConsumption,
    ...consumptionShare,
    ...plannedVsActual,
    ...efficiencyByLoad,
    ...deviationByLoadAndWagon
  ];

  return (
    <CarregamentoStateWrapper
      isLoading={isLoading}
      error={error}
      data={allData}
      loadingType="charts"
      loadingCount={5}
      errorType="database"
      emptyType="no-results"
      onRetry={onRetry}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Análises Quantitativas</h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6">
          {/* Consumo por Ingrediente (Realizado) - Barras Horizontais */}
          <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg">Consumo por Ingrediente (Realizado)</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="horizontal"
                    data={ingredientConsumption}
                    margin={{ top: 10, right: 10, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="white" fontSize={12} />
                    <YAxis type="category" dataKey="ingrediente" stroke="white" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--text-primary))'
                      }}
                      formatter={(value, name, props) => [
                        `${Number(value).toLocaleString('pt-BR')} kg`,
                        'Consumo Realizado'
                      ]}
                      labelStyle={{ color: 'hsl(var(--text-primary))' }}
                    />
                    <Bar dataKey="consumo" fill="#0088FE" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Participação % no Consumo Total - Pizza */}
          <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg">Participação % no Consumo Total</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={consumptionShare}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {consumptionShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--text-primary))'
                      }}
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)}%`,
                        'Participação no Consumo'
                      ]}
                      labelStyle={{ color: 'hsl(var(--text-primary))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Previsto x Realizado - Barras Agrupadas */}
          <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg">Previsto x Realizado</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={plannedVsActual}
                    margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="ingrediente"
                      stroke="white"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="white" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--text-primary))'
                      }}
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString('pt-BR')} kg`,
                        name === 'previsto' ? 'Quantidade Prevista' : 'Quantidade Realizada'
                      ]}
                      labelStyle={{ color: 'hsl(var(--text-primary))' }}
                    />
                    <Bar dataKey="previsto" fill="#00C49F" name="Previsto" />
                    <Bar dataKey="realizado" fill="#0088FE" name="Realizado" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Eficiência por Carregamento - Barras */}
          <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg">Eficiência por Carregamento</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={efficiencyByLoad}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="carregamento"
                      stroke="white"
                      fontSize={10}
                    />
                    <YAxis stroke="white" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--text-primary))'
                      }}
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        'Eficiência do Carregamento'
                      ]}
                      labelStyle={{ color: 'hsl(var(--text-primary))' }}
                    />
                    <Bar
                      dataKey="eficiencia"
                      fill="#FFBB28"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Desvio por Carregamento e Vagão - Barras */}
          <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg">Desvio por Carregamento e Vagão</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deviationByLoadAndWagon}
                    margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="item"
                      stroke="white"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="white" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--text-primary))'
                      }}
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        'Desvio Médio'
                      ]}
                      labelStyle={{ color: 'hsl(var(--text-primary))' }}
                    />
                    <Bar
                      dataKey="desvio"
                      fill="#FF8042"
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