import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart3, CalendarIcon, TrendingUp, Target, Gauge, PieChart } from 'lucide-react';
import { EChartsBar } from '@/components/charts/EChartsBar';
import { EChartsPie } from '@/components/charts/EChartsPie';
import { DietaChart } from '@/components/charts/DietaChart';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIngredienteResumo, getLatestAvailableDate } from '@/hooks/useIngredienteResumo';
import { useDietaResumo, getLatestAvailableDateDieta } from '@/hooks/useDietaResumo';
import { useAuth } from '@/hooks/useAuth';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { cn } from '@/lib/utils';

export default function Analytics() {
  // Iniciar com null e buscar a data mais recente disponível
  const [date, setDate] = useState<Date | null>(null);
  const [isLoadingDate, setIsLoadingDate] = useState(true);
  const { organization, loading: authLoading } = useAuth();

  // Buscar a data mais recente ao carregar o componente
  useEffect(() => {
    const loadLatestDate = async () => {
      // Aguarda auth carregar completamente
      if (authLoading) {
        return;
      }

      if (!organization?.id) {
        setIsLoadingDate(false);
        return;
      }

      setIsLoadingDate(true);

      // Buscar a data mais recente de ambas as views
      const [latestIngrediente, latestDieta] = await Promise.all([
        getLatestAvailableDate(organization.id),
        getLatestAvailableDateDieta(organization.id)
      ]);

      // Usar a data mais recente disponível
      let selectedDate = latestIngrediente;
      if (latestDieta && (!latestIngrediente || latestDieta > latestIngrediente)) {
        selectedDate = latestDieta;
      }

      if (selectedDate) {
        setDate(selectedDate);
      } else {
        // Se não houver data disponível, usar a data atual como fallback
        setDate(new Date());
      }
      setIsLoadingDate(false);
    };

    loadLatestDate();
  }, [organization?.id, authLoading]);

  // Buscar dados da view_ingrediente_resumo apenas quando tivermos uma data e organização
  const { data, loading, error } = useIngredienteResumo({
    date: date || undefined,
    organizationId: organization?.id,
    // Desabilitar busca se ainda estiver carregando auth ou não tiver organização
    enabled: !authLoading && !!organization?.id,
  });

  // Buscar dados da view_dieta_resumo
  const { data: dietaData, loading: dietaLoading, error: dietaError } = useDietaResumo({
    date: date || undefined,
    organizationId: organization?.id,
    enabled: !authLoading && !!organization?.id,
  });

  // Formatar dados para o gráfico de ingredientes
  const chartData = data.map(item => ({
    name: item.ingrediente,
    previsto: Math.round(item.previsto_kg),
    realizado: Math.round(item.realizado_kg),
    diferenca: Math.round(item.realizado_kg - item.previsto_kg),
  }));

  // Formatar dados para o gráfico de dietas
  const dietaChartData = dietaData.map(item => ({
    name: item.dieta.length > 30 ? item.dieta.substring(0, 30) + '...' : item.dieta,
    previsto: Math.round(item.previsto_kg),
    realizado: Math.round(item.realizado_kg),
    diferenca: Math.round(item.desvio_kg),
    desvio_percentual: item.desvio_percentual,
  }));


  // Calcular métricas para os cards
  const totalPrevisto = chartData.reduce((sum, item) => sum + item.previsto, 0);
  const totalRealizado = chartData.reduce((sum, item) => sum + item.realizado, 0);
  const eficienciaGeral = totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : 0;
  const totalDiferenca = totalRealizado - totalPrevisto;
  const percentualDiferenca = totalPrevisto > 0 ? (totalDiferenca / totalPrevisto) * 100 : 0;


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
            {/* Métricas em Tempo Real */}
            {!authLoading && organization?.id && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-6">
                  Métricas do Carregamento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Previsto"
                    value={chartData.length > 0 ? `${totalPrevisto.toLocaleString('pt-BR')} kg` : '0 kg'}
                    subtitle={date ? format(date, 'dd/MM/yyyy') : ''}
                    icon={<Target className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="Total Realizado"
                    value={chartData.length > 0 ? `${totalRealizado.toLocaleString('pt-BR')} kg` : '0 kg'}
                    subtitle={
                      chartData.length > 0
                        ? (totalDiferenca >= 0
                          ? `+${Math.abs(totalDiferenca)} kg`
                          : `-${Math.abs(totalDiferenca)} kg`)
                        : 'Sem dados'
                    }
                    trend={chartData.length > 0 ? (totalDiferenca >= 0 ? 'up' : 'down') : undefined}
                    icon={<BarChart3 className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="Eficiência Geral"
                    value={chartData.length > 0 ? `${eficienciaGeral.toFixed(1)}%` : '0%'}
                    subtitle={chartData.length > 0 ? `${percentualDiferenca >= 0 ? '+' : ''}${percentualDiferenca.toFixed(1)}% vs previsto` : 'Sem dados'}
                    trend={chartData.length > 0 ? (eficienciaGeral >= 95 ? 'up' : eficienciaGeral >= 90 ? 'stable' : 'down') : undefined}
                    icon={<Gauge className="h-6 w-6" />}
                  />
                  <MetricCard
                    title="Ingredientes"
                    value={chartData.length.toString()}
                    subtitle="tipos diferentes"
                    icon={<TrendingUp className="h-6 w-6" />}
                  />
                </div>

                {/* Filtro de Data abaixo dos cards */}
                <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm mt-6">
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
              </div>
            )}

            {/* Gráfico de Barras - Previsto vs Realizado */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Comparativo Quantitativo</h2>

              <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
                    <BarChart3 className="h-5 w-5" />
                    Previsto vs Realizado por Ingrediente
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Quantidade em kg de cada ingrediente - planejado versus executado
                  </p>
                </CardHeader>
                <CardContent>
                  {authLoading || isLoadingDate || loading ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">
                          {authLoading ? 'Carregando autenticação...' : 'Carregando dados...'}
                        </p>
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
                    <EChartsBar data={chartData} height={400} date={date} />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Pizza - Distribuição */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Distribuição por Ingrediente</h2>

              <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
                    <PieChart className="h-5 w-5" />
                    Participação no Total Realizado
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Percentual de cada ingrediente no total de peso realizado
                  </p>
                </CardHeader>
                <CardContent>
                  {authLoading || isLoadingDate || loading ? (
                    <div className="h-[450px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">
                          {authLoading ? 'Carregando autenticação...' : 'Carregando dados...'}
                        </p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="h-[450px] flex items-center justify-center">
                      <div className="text-center text-destructive">
                        <p>Erro ao carregar dados</p>
                        <p className="text-sm">{error.message}</p>
                      </div>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-[450px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum dado disponível para a data selecionada</p>
                        <p className="text-sm mt-1">Tente selecionar outra data</p>
                      </div>
                    </div>
                  ) : (
                    <EChartsPie data={chartData} height={450} date={date} showType="realizado" />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Barras - Dietas */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Resumo por Dieta</h2>

              <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
                    <BarChart3 className="h-5 w-5" />
                    Previsto vs Realizado por Dieta
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Comparativo de peso planejado versus executado por tipo de dieta
                  </p>
                </CardHeader>
                <CardContent>
                  {authLoading || isLoadingDate || dietaLoading ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">
                          {authLoading ? 'Carregando autenticação...' : 'Carregando dados das dietas...'}
                        </p>
                      </div>
                    </div>
                  ) : dietaError ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="text-center text-destructive">
                        <p>Erro ao carregar dados das dietas</p>
                        <p className="text-sm">{dietaError.message}</p>
                      </div>
                    </div>
                  ) : dietaChartData.length === 0 ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum dado de dieta disponível para a data selecionada</p>
                        <p className="text-sm mt-1">Tente selecionar outra data</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {dietaChartData.length} dietas encontradas para {date ? format(date, 'dd/MM/yyyy') : 'data não selecionada'}
                      </p>
                      <DietaChart data={dietaChartData} height={450} date={date} />
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
