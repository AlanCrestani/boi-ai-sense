import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Scale, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

export default function FeedReading() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
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
                <BreadcrumbPage>Leitura de Cocho</BreadcrumbPage>
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
          <h1 className="text-3xl font-bold text-text-primary mb-2">Leitura de Cocho</h1>
          <p className="text-text-secondary">Monitore o consumo de ração e níveis dos cochos em tempo real</p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Cochos Ativos"
            value="24"
            subtitle="↗ +2 vs ontem"
            trend="up"
            icon={<Scale className="h-6 w-6" />}
          />
          <MetricCard
            title="Consumo Médio"
            value="85.4 kg"
            subtitle="↗ +5.2% vs semana"
            trend="up"
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <MetricCard
            title="Eficiência"
            value="92.8%"
            subtitle="↗ +1.3% vs ontem"
            trend="up"
            icon={<Activity className="h-6 w-6" />}
          />
          <MetricCard
            title="Alertas Ativos"
            value="3"
            subtitle="↘ -2 vs ontem"
            trend="down"
            icon={<Scale className="h-6 w-6" />}
          />
        </div>

        {/* Chart Area */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Consumo de Matéria Seca - Últimos 14 Dias
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
                    label={{ value: 'Matéria Seca (kg/dia)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }}
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
                      name === 'consumoPrevisto' ? 'Previsto' : 'Realizado'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'hsl(var(--text-secondary))' }}
                    formatter={(value: string) => value === 'consumoPrevisto' ? 'Previsto' : 'Realizado'}
                  />
                  <Bar 
                    dataKey="consumoPrevisto" 
                    fill="#3b82f6"
                    name="Previsto"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="consumoRealizado" 
                    name="Realizado"
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
                <span className="text-text-secondary">Eficiência Boa (90-110%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-text-secondary">Eficiência Média (80-90% | 110-120%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-text-secondary">Eficiência Ruim (&lt;80% | &gt;120%)</span>
              </div>
            </div>
            
            {/* Botões para lançar leitura de cocho */}
            <div className="mt-6 border-t border-border-subtle pt-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Lançar Leitura de Cocho</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {[-2, -1, 0, 1, 2, 3, 4].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    className="min-w-[60px] h-12 text-lg font-bold hover:bg-accent-primary/10"
                    onClick={() => console.log(`Leitura lançada: ${value}`)}
                  >
                    {value > 0 ? `+${value}` : value}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}