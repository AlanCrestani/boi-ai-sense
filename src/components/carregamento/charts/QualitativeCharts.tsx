import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartDataPoint } from '@/hooks/useCarregamentoData';
import { CarregamentoStateWrapper } from '../states';

interface QualitativeChartsProps {
  efficiencyDistribution: ChartDataPoint[];
  ingredientsByVolume: ChartDataPoint[];
  volumeByDiet: ChartDataPoint[];
  avgDeviationByIngredient: ChartDataPoint[];
  volumeByWagon: ChartDataPoint[];
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const QualitativeCharts = memo<QualitativeChartsProps>(({
  efficiencyDistribution,
  ingredientsByVolume,
  volumeByDiet,
  avgDeviationByIngredient,
  volumeByWagon,
  isLoading,
  error,
  onRetry
}) => {
  // Combinar todos os dados para verificar se há dados disponíveis
  const allData = [
    ...efficiencyDistribution,
    ...ingredientsByVolume,
    ...volumeByDiet,
    ...avgDeviationByIngredient,
    ...volumeByWagon
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
      <h2 className="text-2xl font-bold text-text-primary mb-6">Análises Qualitativas</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6">
        {/* Distribuição de Eficiência - Histograma */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">Distribuição de Eficiência</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64 sm:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={efficiencyDistribution}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="faixa"
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
                      `${Number(value).toLocaleString('pt-BR')} carregamentos`,
                      'Quantidade'
                    ]}
                    labelStyle={{ color: 'hsl(var(--text-primary))' }}
                  />
                  <Bar
                    dataKey="quantidade"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ingredientes por Volume - Barras Horizontais */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">Ingredientes por Volume</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64 sm:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="horizontal"
                  data={ingredientsByVolume}
                  margin={{ top: 10, right: 10, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="white" fontSize={12} />
                  <YAxis type="category" dataKey="ingrediente" stroke="white" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--text-primary))'
                    }}
                    formatter={(value, name, props) => [
                      `${Number(value).toLocaleString('pt-BR')} kg`,
                      'Volume por Ingrediente'
                    ]}
                    labelStyle={{ color: 'hsl(var(--text-primary))' }}
                  />
                  <Bar dataKey="volume" fill="#00C49F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Volume por Dieta - Barras */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">Volume por Dieta</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64 sm:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={volumeByDiet}
                  margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="dieta"
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
                    formatter={(value, name, props) => [
                      `${Number(value).toLocaleString('pt-BR')} kg`,
                      'Volume da Dieta'
                    ]}
                    labelStyle={{ color: 'hsl(var(--text-primary))' }}
                  />
                  <Bar
                    dataKey="volume"
                    fill="#FFBB28"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Desvio Médio por Ingrediente - Barras */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">Desvio Médio por Ingrediente</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64 sm:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={avgDeviationByIngredient}
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
                    formatter={(value, name, props) => [
                      `${Number(value).toFixed(2)}%`,
                      'Desvio Médio do Ingrediente'
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

        {/* Volume por Vagão - Pizza */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">Volume por Vagão</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64 sm:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={volumeByWagon}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${Number(value).toLocaleString('pt-BR')} kg`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {volumeByWagon.map((entry, index) => (
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
                    formatter={(value, name, props) => [
                      `${Number(value).toLocaleString('pt-BR')} kg`,
                      'Volume do Vagão'
                    ]}
                    labelStyle={{ color: 'hsl(var(--text-primary))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </CarregamentoStateWrapper>
  );
});