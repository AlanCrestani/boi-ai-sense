import { MetricCard } from "@/components/dashboard/MetricCard";
import { AIAgentCard } from "@/components/dashboard/AIAgentCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";

import { 
  Brain, 
  Truck, 
  TrendingUp, 
  Gauge, 
  Users, 
  MapPin, 
  Clock,
  Target,
  BarChart3
} from "lucide-react";

export default function Dashboard() {
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
        <div className="mb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-6">
            <span className="text-text-tertiary">ConectaBoi</span>
            <span className="text-text-secondary">/</span>
            <span className="text-text-primary">Dashboard</span>
          </nav>
          
          <div className="flex items-center justify-between mb-2">
            {/* Título */}
            <h1 className="text-3xl text-text-primary">Dashboard</h1>
            
            {/* Botão Voltar para Dashboard */}
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors duration-200 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011 1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Voltar para Dashboard
            </button>
          </div>
          <p className="text-text-secondary">Visão geral completa do seu sistema ConectaBoi</p>
        </div>

        {/* Real-time Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Métricas em Tempo Real
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Consumo Total"
              value="1.247 ton"
              subtitle="↗ +3.2% vs ontem"
              trend="up"
              icon={<BarChart3 className="h-6 w-6" />}
            />
            <MetricCard
              title="Eficiência Logística"
              value="94.8%"
              subtitle="↗ +1.5% vs semana"
              trend="up"
              icon={<Truck className="h-6 w-6" />}
            />
            <MetricCard
              title="Animais Monitorados"
              value="3.840"
              subtitle="→ Status estável"
              trend="stable"
              icon={<Users className="h-6 w-6" />}
            />
            <MetricCard
              title="Tempo Médio Trato"
              value="2h 15min"
              subtitle="↘ -8min vs ontem"
              trend="down"
              icon={<Clock className="h-6 w-6" />}
            />
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
    </Layout>
  );
}