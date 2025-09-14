import { MetricCard } from "@/components/dashboard/MetricCard";
import { AIAgentCard } from "@/components/dashboard/AIAgentCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import heroImage from "@/assets/hero-dashboard.jpg";

import { 
  Activity, 
  Brain, 
  Truck, 
  TrendingUp, 
  Gauge, 
  Users, 
  MapPin, 
  Clock,
  Zap,
  Target,
  BarChart3
} from "lucide-react";

export default function ConectaBoiDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [loading, user, navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/signup");
    }
  };

  const handleSignIn = () => {
    navigate("/signin");
  };
  
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
              <Zap className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="gradient-text">ConectaBoi</span>
              <br />
              <span className="text-foreground">Insights</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl">
              No confinamento, cada detalhe importa.
            </p>
            <p className="text-lg text-foreground mb-8 max-w-2xl font-medium">
              O ConectaBoi Insights transforma dados em decisões inteligentes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="tech" size="xl">
                <Activity className="h-5 w-5" />
                Dashboard Completo
              </Button>
              <Button variant="action" size="xl">
                <Brain className="h-5 w-5" />
                Agentes de IA
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Real-time Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
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
            <h2 className="text-2xl font-bold text-foreground">
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

        {/* Key Benefits */}
        <div className="tech-card p-8 text-center">
          <h2 className="text-3xl font-bold gradient-text mb-4">
            Transforme Dados em Decisões Inteligentes
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            Mais que um sistema, é como ter uma <strong className="text-foreground">sala de controle com agentes de IA especializados</strong> trabalhando lado a lado com você, 24 horas por dia.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                IA Especializada
              </h3>
              <p className="text-sm text-muted-foreground">
                Múltiplos agentes focados em nutrição, logística e produção
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Tempo Real
              </h3>
              <p className="text-sm text-muted-foreground">
                Monitoramento contínuo com alertas e feedbacks automáticos
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                ROI Garantido
              </h3>
              <p className="text-sm text-muted-foreground">
                Redução de custos e otimização de tempo por arroba
              </p>
            </div>
          </div>
          
          <Button 
            variant="tech" 
            size="xl"
            onClick={handleGetStarted}
          >
            <Zap className="h-5 w-5" />
            {user ? "Ir para Dashboard" : "Começar Agora"}
          </Button>
        </div>
      </section>
    </div>
  );
}