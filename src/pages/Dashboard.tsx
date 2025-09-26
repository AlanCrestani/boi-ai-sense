import { MetricCard } from "@/components/dashboard/MetricCard";
import { AIAgentCard } from "@/components/dashboard/AIAgentCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { MateriaSecaChart } from "@/components/dashboard/MateriaSecaChart";
import { DietaFabricadaChart } from "@/components/dashboard/DietaFabricadaChart";
import { EficienciaCarregamentoChart } from "@/components/dashboard/EficienciaCarregamentoChart";
import { LoadingAgentChat } from "@/components/LoadingAgentChat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnimalCount } from "@/hooks/useAnimalCount";
import { useEficienciaConsumo } from "@/hooks/useEficienciaConsumo";
import { useDiasConfinamento } from "@/hooks/useDiasConfinamento";
import { useLotesAtivos } from "@/hooks/useLotesAtivos";
import { useState } from "react";

import { 
  Brain, 
  Truck, 
  TrendingUp, 
  Gauge, 
  Users, 
  MapPin, 
  Clock,
  Target,
  BarChart3,
  Upload,
  MessageCircle
} from "lucide-react";

export default function Dashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { data: animalData, isLoading: animalLoading } = useAnimalCount();
  const { data: eficienciaData, isLoading: eficienciaLoading } = useEficienciaConsumo();
  const { data: diasData, isLoading: diasLoading } = useDiasConfinamento();
  const { data: lotesData, isLoading: lotesLoading } = useLotesAtivos();

  console.log('Dashboard - animalData:', animalData);
  console.log('Dashboard - animalLoading:', animalLoading);
  console.log('Dashboard - eficienciaData:', eficienciaData);
  console.log('Dashboard - eficienciaLoading:', eficienciaLoading);
  console.log('Dashboard - diasData:', diasData);
  console.log('Dashboard - diasLoading:', diasLoading);
  console.log('Dashboard - lotesData:', lotesData);
  console.log('Dashboard - lotesLoading:', lotesLoading);
  
  // Mock data for demonstration
  const mockAlerts = [
    {
      id: "1",
      type: "critical" as const,
      title: "Lote 15 - Consumo abaixo do esperado",
      description: "Redução de 15% no consumo nas últimas 4 horas",
      time: "há 12 minutos"
    },
    {
      id: "2", 
      type: "warning" as const,
      title: "Desvio na rota de distribuição",
      description: "Caminhão 03 com atraso de 25 minutos",
      time: "há 45 minutos"
    },
    {
      id: "3",
      type: "info" as const,
      title: "Ajuste nutricional aplicado",
      description: "IA otimizou fórmula do Lote 08",
      time: "há 1 hora"
    }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
            <p className="text-text-secondary">Visão geral completa do seu sistema ConectaBoi</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsChatOpen(true)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat IA
            </Button>
            <Button
              onClick={() => window.location.href = '/csv-upload'}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Atualizar BD
            </Button>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Métricas em Tempo Real
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Quantidade de Cabeças"
              value={animalLoading ? "..." : animalData?.totalAnimais.toLocaleString('pt-BR') || "0"}
              subtitle={
                animalLoading
                  ? "Carregando..."
                  : animalData?.variacaoOntem
                    ? `${animalData.variacaoOntem > 0 ? '↗' : '↘'} ${animalData.variacaoOntem > 0 ? '+' : ''}${animalData.percentualVariacao}% vs ontem`
                    : "→ Status estável"
              }
              trend={
                animalLoading
                  ? "stable"
                  : animalData?.variacaoOntem
                    ? animalData.variacaoOntem > 0 ? "up" : "down"
                    : "stable"
              }
              icon={<BarChart3 className="h-6 w-6" />}
            />
            <MetricCard
              title="Eficiência de Consumo"
              value={eficienciaLoading ? "..." : eficienciaData?.eficienciaConsumo ? `${eficienciaData.eficienciaConsumo}%` : "0%"}
              subtitle={
                eficienciaLoading
                  ? "Carregando..."
                  : eficienciaData?.variacaoOntem
                    ? `${eficienciaData.variacaoOntem > 0 ? '↗' : '↘'} ${eficienciaData.variacaoOntem > 0 ? '+' : ''}${eficienciaData.percentualVariacao}% vs ontem`
                    : "→ Status estável"
              }
              trend={
                eficienciaLoading
                  ? "stable"
                  : eficienciaData?.variacaoOntem
                    ? eficienciaData.variacaoOntem > 0 ? "up" : "down"
                    : "stable"
              }
              icon={<Target className="h-6 w-6" />}
            />
            <MetricCard
              title="Dias de Confinamento"
              value={diasLoading ? "..." : diasData?.mediaDias ? `${diasData.mediaDias} dias` : "0 dias"}
              subtitle={
                diasLoading
                  ? "Carregando..."
                  : diasData?.variacaoOntem
                    ? `${diasData.variacaoOntem > 0 ? '↗' : '↘'} ${diasData.variacaoOntem > 0 ? '+' : ''}${diasData.variacaoOntem} dias vs ontem`
                    : "→ Status estável"
              }
              trend={
                diasLoading
                  ? "stable"
                  : diasData?.variacaoOntem
                    ? diasData.variacaoOntem > 0 ? "up" : "down"
                    : "stable"
              }
              icon={<Clock className="h-6 w-6" />}
            />
            <MetricCard
              title="Lotes Ativos"
              value={lotesLoading ? "..." : lotesData?.totalLotes || "0"}
              subtitle={
                lotesLoading
                  ? "Carregando..."
                  : lotesData?.variacaoOntem
                    ? `${lotesData.variacaoOntem > 0 ? '↗' : '↘'} ${lotesData.variacaoOntem > 0 ? '+' : ''}${lotesData.variacaoOntem} lotes vs ontem`
                    : "→ Status estável"
              }
              trend={
                lotesLoading
                  ? "stable"
                  : lotesData?.variacaoOntem
                    ? lotesData.variacaoOntem > 0 ? "up" : "down"
                    : "stable"
              }
              icon={<Users className="h-6 w-6" />}
            />
          </div>
        </div>

        {/* Charts Section */}
                {/* Análises Quantitativas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Análises Quantitativas</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de Barras - Consumo Matéria Seca */}
            <MateriaSecaChart />
            
            {/* Gráfico de Pizza - Dieta Fabricada */}
            <DietaFabricadaChart />
            
            {/* Eficiência por Carregamento */}
            <EficienciaCarregamentoChart />

            {/* Desvio por Trato */}
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Desvio Absoluto por Trato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { trato: 'Trato 1', desvio: 3.2 },
                        { trato: 'Trato 2', desvio: 2.1 },
                        { trato: 'Trato 3', desvio: 1.8 },
                        { trato: 'Trato 4', desvio: 1.2 }
                      ]} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="trato" stroke="white" fontSize={12} />
                      <YAxis stroke="white" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--text-primary))'
                        }}
                        formatter={(value) => [`${value} kg`, 'Desvio']}
                      />
                      <Bar dataKey="desvio" fill="#FFBB28" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Análises Qualitativas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Análises Qualitativas</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição de Eficiência */}
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Eficiência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { faixa: '80-85%', quantidade: 5 },
                        { faixa: '85-90%', quantidade: 12 },
                        { faixa: '90-95%', quantidade: 18 },
                        { faixa: '95-100%', quantidade: 22 },
                        { faixa: '100-105%', quantidade: 15 },
                        { faixa: '105-110%', quantidade: 8 }
                      ]} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="faixa" stroke="white" fontSize={12} />
                      <YAxis stroke="white" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--text-primary))'
                        }}
                        formatter={(value) => [`${value}`, 'Quantidade']}
                      />
                      <Bar dataKey="quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Volume por Dieta */}
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Volume por Dieta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { dieta: 'Engorda', volume: 2800 },
                        { dieta: 'Crescimento', volume: 1950 },
                        { dieta: 'Lactação', volume: 1450 },
                        { dieta: 'Gestação', volume: 890 }
                      ]} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dieta" stroke="white" fontSize={12} />
                      <YAxis stroke="white" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--text-primary))'
                        }}
                        formatter={(value) => [`${value} kg`, 'Volume']}
                      />
                      <Bar dataKey="volume" fill="#84cc16" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Agents Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              Agentes de IA Especializados
            </h2>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Brain className="h-3 w-3 mr-1" />
              4 Agentes Ativos
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIAgentCard
              name="Nutrição Inteligente"
              status="active"
              description="Monitora consumo e otimiza fórmulas em tempo real"
              icon={<Target className="h-5 w-5 text-primary" />}
              metrics={[
                { label: "Lotes Monitorados", value: "24" },
                { label: "Ajustes Aplicados", value: "8" }
              ]}
            />
            
            <AIAgentCard
              name="Logística Otimizada"
              status="monitoring"
              description="Calcula rotas e tempos ideais de distribuição"
              icon={<MapPin className="h-5 w-5 text-accent" />}
              metrics={[
                { label: "Rotas Ativas", value: "12" },
                { label: "Economia Tempo", value: "18%" }
              ]}
            />
            
            <AIAgentCard
              name="Leitura de Cocho"
              status="active"
              description="Analisa sobras e padrões de consumo"
              icon={<Gauge className="h-5 w-5 text-primary" />}
              metrics={[
                { label: "Pontos Leitura", value: "48" },
                { label: "Precisão Média", value: "97.3%" }
              ]}
            />
            
            <AIAgentCard
              name="Detecção de Desvios"
              status="alert"
              description="Identifica anomalias antes que virem perdas"
              icon={<TrendingUp className="h-5 w-5 text-destructive" />}
              metrics={[
                { label: "Alertas Ativos", value: "3" },
                { label: "Perdas Evitadas", value: "R$ 18k" }
              ]}
            />
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="mb-12">
          <AlertsPanel alerts={mockAlerts} />
        </div>
      </div>

      {/* Agent Chat */}
      <LoadingAgentChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        agentType="loading"
      />
    </Layout>
  );
}