import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart3, CalendarIcon, TrendingUp, Target, Gauge } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIngredienteResumo, getLatestAvailableDate } from '@/hooks/useIngredienteResumo';
import { useAuth } from '@/hooks/useAuth';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { cn } from '@/lib/utils';
import { useMediaQuery } from 'react-responsive';

export default function Analytics() {
  // Iniciar com null e buscar a data mais recente disponível
  const [date, setDate] = useState<Date | null>(null);
  const [isLoadingDate, setIsLoadingDate] = useState(true);
  const { organization } = useAuth();

  // Hook para detectar mobile
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // 1. Definir margens padrão do gráfico (reserva espaço para a legenda na direita)
  const CHART_MARGIN = isMobile
    ? { top: 20, right: 20, left: 40, bottom: 100 } // Mobile: legenda embaixo
    : { top: 50, right: 0, left: 70, bottom: 50 }; // Desktop: margens balanceadas para centralizar legenda

  // Buscar a data mais recente ao carregar o componente
  useEffect(() => {
    const loadLatestDate = async () => {
      if (!organization?.id) {
        console.log('Aguardando organization_id...');
        return;
      }

      setIsLoadingDate(true);
      const latestDate = await getLatestAvailableDate(organization.id);
      if (latestDate) {
        setDate(latestDate);
      } else {
        // Se não houver data disponível, usar a data atual como fallback
        setDate(new Date());
      }
      setIsLoadingDate(false);
    };

    loadLatestDate();
  }, [organization?.id]);

  // Buscar dados da view_ingrediente_resumo apenas quando tivermos uma data
  const { data, loading, error } = useIngredienteResumo({
    date: date || undefined,
    organizationId: organization?.id,
  });

  // Formatar dados para o gráfico
  const chartData = data.map(item => ({
    name: item.ingrediente,
    previsto: Math.round(item.previsto_kg),
    realizado: Math.round(item.realizado_kg),
    diferenca: Math.round(item.realizado_kg - item.previsto_kg),
  }));

  // Calcular métricas para os cards
  const totalPrevisto = chartData.reduce((sum, item) => sum + item.previsto, 0);
  const totalRealizado = chartData.reduce((sum, item) => sum + item.realizado, 0);
  const eficienciaGeral = totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : 0;
  const totalDiferenca = totalRealizado - totalPrevisto;
  const percentualDiferenca = totalPrevisto > 0 ? (totalDiferenca / totalPrevisto) * 100 : 0;

  // Custom tooltip para o gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const diferenca = payload[0]?.payload?.diferenca || 0;
      const percentual =
        payload[0]?.payload?.previsto > 0
          ? ((payload[0]?.payload?.realizado / payload[0]?.payload?.previsto - 1) * 100).toFixed(1)
          : 0;

      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-text-primary">{label}</p>
          <p className="text-blue-500">Previsto: {payload[0]?.value} kg</p>
          <p className="text-green-500">Realizado: {payload[1]?.value} kg</p>
          <p className={cn('font-semibold', diferenca >= 0 ? 'text-yellow-500' : 'text-red-500')}>
            Diferença: {diferenca > 0 ? '+' : ''}
            {diferenca} kg ({percentual}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Analytics</h1>
            <p className="text-text-secondary">Análise de dados de carregamento e distribuição</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="carregamento" className="space-y-8">
          <TabsList className="bg-card-secondary border border-border-subtle">
            <TabsTrigger
              value="carregamento"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Carregamento
            </TabsTrigger>
            <TabsTrigger value="distribuicao" disabled className="opacity-50">
              Distribuição (Em breve)
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - Carregamento */}
          <TabsContent value="carregamento" className="space-y-8">
            {/* Filtro de Data */}
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-text-primary">Filtros</CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-[240px] justify-start text-left font-normal border-border-subtle',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date
                          ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : 'Selecione uma data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date || undefined}
                        onSelect={newDate => newDate && setDate(newDate)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
            </Card>

            {/* Métricas em Tempo Real */}
            {chartData.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-6">
                  Métricas do Carregamento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Previsto"
                    value={`${totalPrevisto.toLocaleString('pt-BR')} kg`}
                    subtitle={date ? format(date, 'dd/MM/yyyy') : ''}
                    icon={<Target className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="Total Realizado"
                    value={`${totalRealizado.toLocaleString('pt-BR')} kg`}
                    subtitle={
                      totalDiferenca >= 0
                        ? `+${Math.abs(totalDiferenca)} kg`
                        : `-${Math.abs(totalDiferenca)} kg`
                    }
                    trend={totalDiferenca >= 0 ? 'up' : 'down'}
                    icon={<BarChart3 className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="Eficiência Geral"
                    value={`${eficienciaGeral.toFixed(1)}%`}
                    subtitle={`${percentualDiferenca >= 0 ? '+' : ''}${percentualDiferenca.toFixed(1)}% vs previsto`}
                    trend={eficienciaGeral >= 95 ? 'up' : eficienciaGeral >= 90 ? 'stable' : 'down'}
                    icon={<Gauge className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="Ingredientes"
                    value={chartData.length.toString()}
                    subtitle="tipos diferentes"
                    icon={<TrendingUp className="h-6 w-6" />}
                  />
                </div>
              </div>
            )}

            {/* Gráfico de Barras - Previsto vs Realizado */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Análises Quantitativas</h2>

              <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
                    <BarChart3 className="h-5 w-5" />
                    Comparativo: Previsto vs Realizado por Ingrediente
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Quantidade em kg de cada ingrediente - planejado versus executado
                  </p>
                </CardHeader>
                <CardContent>
                  {isLoadingDate || loading ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Carregando dados...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="text-center text-destructive">
                        <p>Erro ao carregar dados</p>
                        <p className="text-sm">{error.message}</p>
                      </div>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum dado disponível para a data selecionada</p>
                        <p className="text-sm mt-1">Tente selecionar outra data</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {/* 2. Aplicar margens no BarChart para controlar espaçamento */}
                        <BarChart data={chartData} margin={CHART_MARGIN}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="name"
                            interval={0}
                            angle={isMobile ? 0 : -45}
                            textAnchor={isMobile ? 'middle' : 'end'}
                            height={isMobile ? 80 : 60}
                            tick={{
                              fontSize: isMobile ? 10 : 12,
                              fill: '#ffffff',
                            }}
                          />
                          <YAxis
                            label={{
                              value: 'Quantidade (kg)',
                              angle: -90,
                              position: 'insideLeft',
                              offset: -40,
                              dy: 0,
                              style: { fill: '#ffffff', textAnchor: 'middle' },
                            }}
                            tick={{ fill: '#ffffff' }}
                            tickFormatter={value => value.toLocaleString('pt-BR')}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          {/* 3. Legenda customizada posicionada no meio da área de plotagem (lado direito) */}
                          {isMobile ? (
                            <Legend
                              layout="horizontal"
                              align="center"
                              verticalAlign="top"
                              wrapperStyle={{
                                color: '#ffffff',
                                paddingBottom: 20,
                                fontSize: 14,
                              }}
                            />
                          ) : (
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              wrapperStyle={{
                                color: '#ffffff',
                                paddingLeft: 30,
                                fontSize: 14,
                              }}
                            />
                          )}
                          <Bar
                            dataKey="previsto"
                            fill="#3b82f6"
                            name="Previsto (kg)"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="realizado"
                            fill="#10b981"
                            name="Realizado (kg)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Content - Distribuição (Desabilitada por enquanto) */}
          <TabsContent value="distribuicao">
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">Em desenvolvimento</p>
                  <p className="text-sm mt-2">Esta funcionalidade estará disponível em breve</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
