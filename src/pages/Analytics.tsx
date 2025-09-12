import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { BarChart3, ArrowLeft, TruckIcon, MapPin, AlertTriangle, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { MetricCard } from "@/components/dashboard/MetricCard";

export default function Analytics() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // Gerar dados mock para os últimos 14 dias
  const generateMockData = () => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const consumoPrevisto = Math.round(450 + Math.random() * 100); // 450-550 kg
      const consumoRealizado = Math.round(consumoPrevisto * (0.7 + Math.random() * 0.5)); // 70-120% do previsto
      
      // Calcular eficiência
      const eficiencia = (consumoRealizado / consumoPrevisto) * 100;
      let corRealizado = '#ef4444'; // vermelho por padrão
      
      if (eficiencia >= 90 && eficiencia <= 110) {
        corRealizado = '#22c55e'; // verde - boa eficiência
      } else if (eficiencia >= 80 && eficiencia < 90 || eficiencia > 110 && eficiencia <= 120) {
        corRealizado = '#eab308'; // amarelo - eficiência média
      }

      data.push({
        data: format(date, 'dd/MM'),
        consumoPrevisto,
        consumoRealizado,
        corRealizado
      });
    }
    return data;
  };

  const data = generateMockData();

  const CustomBar = (props: any) => {
    const { payload, ...rest } = props;
    return <Bar {...rest} fill={payload?.corRealizado || '#ef4444'} />;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs and Back Button */}
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Análise de Desvios</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Button 
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Análise de Desvios</h1>
          <p className="text-text-secondary">Monitore desvios operacionais no carregamento e distribuição de ração</p>
        </div>

        {/* Content Grid - Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Desvios Totais"
            value="12"
            subtitle="↗ +3 vs ontem"
            trend="up"
            icon={<AlertTriangle className="h-6 w-6" />}
          />
          <MetricCard
            title="Desvio Médio"
            value="2.4 kg"
            subtitle="↘ -0.8 kg vs semana"
            trend="down"
            icon={<TrendingDown className="h-6 w-6" />}
          />
          <MetricCard
            title="Carregamentos"
            value="18"
            subtitle="↗ +2 vs ontem"
            trend="up"
            icon={<TruckIcon className="h-6 w-6" />}
          />
          <MetricCard
            title="Distribuições"
            value="24"
            subtitle="→ Estável"
            trend="stable"
            icon={<MapPin className="h-6 w-6" />}
          />
        </div>

        {/* Tabs for Different Analysis Types */}
        <Tabs defaultValue="carregamento" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="carregamento" className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4" />
              Desvios em Carregamento
            </TabsTrigger>
            <TabsTrigger value="distribuicao" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Desvios em Distribuição
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carregamento">
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TruckIcon className="h-5 w-5" />
                  Análise de Desvios em Carregamento - Últimos 14 Dias
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="data"
                        stroke="white"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="white"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Peso Carregado (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--text-primary))'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} kg`,
                          name === 'consumoPrevisto' ? 'Planejado' : 'Carregado'
                        ]}
                      />
                      <Legend 
                        wrapperStyle={{ color: 'hsl(var(--text-secondary))' }}
                        formatter={(value: string) => value === 'consumoPrevisto' ? 'Planejado' : 'Carregado'}
                      />
                      <Bar 
                        dataKey="consumoPrevisto" 
                        fill="#3b82f6"
                        name="Planejado"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="consumoRealizado" 
                        name="Carregado"
                        radius={[4, 4, 0, 0]}
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.corRealizado} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legenda de cores */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-text-secondary">Desvio Baixo (90-110%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-text-secondary">Desvio Médio (80-90% | 110-120%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-text-secondary">Desvio Alto (&lt;80% | &gt;120%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribuicao">
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Análise de Desvios em Distribuição - Últimos 14 Dias
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="data"
                        stroke="white"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="white"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Peso Distribuído (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--text-primary))'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} kg`,
                          name === 'consumoPrevisto' ? 'Programado' : 'Distribuído'
                        ]}
                      />
                      <Legend 
                        wrapperStyle={{ color: 'hsl(var(--text-secondary))' }}
                        formatter={(value: string) => value === 'consumoPrevisto' ? 'Programado' : 'Distribuído'}
                      />
                      <Bar 
                        dataKey="consumoPrevisto" 
                        fill="#3b82f6"
                        name="Programado"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="consumoRealizado" 
                        name="Distribuído"
                        radius={[4, 4, 0, 0]}
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.corRealizado} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legenda de cores */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-text-secondary">Desvio Baixo (90-110%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-text-secondary">Desvio Médio (80-90% | 110-120%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-text-secondary">Desvio Alto (&lt;80% | &gt;120%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}