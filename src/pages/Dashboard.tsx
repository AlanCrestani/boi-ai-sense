import { MetricCard } from "@/components/dashboard/MetricCard";
import { AIAgentCard } from "@/components/dashboard/AIAgentCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { DietaFabricadaChart } from "@/components/dashboard/DietaFabricadaChart";
import { EficienciaCarregamentoChart } from "@/components/dashboard/EficienciaCarregamentoChart";
import { EficienciaIngredienteChart } from "@/components/dashboard/EficienciaIngredienteChart";
import { HistoricoConsumoChart } from "@/components/dashboard/HistoricoConsumoChart";
import { EntradaMensalChart } from "@/components/dashboard/EntradaMensalChart";
import { PrevisaoConsumoIngredientesChart } from "@/components/dashboard/PrevisaoConsumoIngredientesChart";
import { LoadingAgentChat } from "@/components/LoadingAgentChat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnimalCount } from "@/hooks/useAnimalCount";
import { useEficienciaConsumo } from "@/hooks/useEficienciaConsumo";
import { useDiasConfinamento } from "@/hooks/useDiasConfinamento";
import { useConsumoMateriaSecaCard } from "@/hooks/useConsumoMateriaSecaCard";
import { usePesoMedioPonderado } from "@/hooks/usePesoMedioPonderado";
import { useCmsPerceitoCard } from "@/hooks/useCmsPerceitoCard";
import { usePesoEntradaCard } from "@/hooks/usePesoEntradaCard";
import { useCmnRealizadoCard } from "@/hooks/useCmnRealizadoCard";
import { useAcuraciaLeituraCocho } from "@/hooks/useAcuraciaLeituraCocho";
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
  const { data: consumoData, isLoading: consumoLoading } = useConsumoMateriaSecaCard();
  const { data: pesoData, isLoading: pesoLoading } = usePesoMedioPonderado();
  const { data: cmsPerceitoData, isLoading: cmsPerceitoLoading } = useCmsPerceitoCard();
  const { data: pesoEntradaData, isLoading: pesoEntradaLoading } = usePesoEntradaCard();
  const { data: cmnRealizadoData, isLoading: cmnRealizadoLoading } = useCmnRealizadoCard();
  const { data: acuraciaData, isLoading: acuraciaLoading } = useAcuraciaLeituraCocho();

  console.log('Dashboard - animalData:', animalData);
  console.log('Dashboard - animalLoading:', animalLoading);
  console.log('Dashboard - eficienciaData:', eficienciaData);
  console.log('Dashboard - eficienciaLoading:', eficienciaLoading);
  console.log('Dashboard - diasData:', diasData);
  console.log('Dashboard - diasLoading:', diasLoading);
  console.log('Dashboard - consumoData:', consumoData);
  console.log('Dashboard - consumoLoading:', consumoLoading);
  console.log('Dashboard - pesoData:', pesoData);
  console.log('Dashboard - pesoLoading:', pesoLoading);
  
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-8 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
              <p className="text-sm sm:text-base text-text-secondary">Visão geral completa do seu sistema ConectaBoi</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => setIsChatOpen(true)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 w-full sm:w-auto"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat IA
              </Button>
              <Button
                onClick={() => window.location.href = '/csv-upload'}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto hidden sm:flex"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Atualizar BD
              </Button>
            </div>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
            Métricas Principais
          </h2>
          {/* Primeira linha de cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-2 sm:mb-6">
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
              title="Peso Médio de Entrada"
              value={pesoEntradaLoading ? "..." : pesoEntradaData?.pesoEntradaMedio ? `${pesoEntradaData.pesoEntradaMedio} kg` : "0 kg"}
              subtitle={
                pesoEntradaLoading
                  ? "Carregando..."
                  : pesoEntradaData?.variacaoOntem
                    ? `${pesoEntradaData.variacaoOntem > 0 ? '↗' : '↘'} ${pesoEntradaData.variacaoOntem > 0 ? '+' : ''}${pesoEntradaData.percentualVariacao}% vs ontem`
                    : "→ Status estável"
              }
              trend={
                pesoEntradaLoading
                  ? "stable"
                  : pesoEntradaData?.variacaoOntem
                    ? pesoEntradaData.variacaoOntem > 0 ? "up" : "down"
                    : "stable"
              }
              icon={<Truck className="h-6 w-6" />}
            />
            <MetricCard
              title="Peso Médio Estimado"
              value={pesoLoading ? "..." : pesoData?.pesoMedio ? `${pesoData.pesoMedio} kg` : "0 kg"}
              subtitle={
                pesoLoading
                  ? "Carregando..."
                  : pesoData?.variacaoOntem
                    ? `${pesoData.variacaoOntem > 0 ? '↗' : '↘'} ${pesoData.variacaoOntem > 0 ? '+' : ''}${pesoData.percentualVariacao}% vs ontem`
                    : "→ Status estável"
              }
              trend={
                pesoLoading
                  ? "stable"
                  : pesoData?.variacaoOntem
                    ? pesoData.variacaoOntem > 0 ? "up" : "down"
                    : "stable"
              }
              icon={<Gauge className="h-6 w-6" />}
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
          </div>

          {/* Segunda linha de cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
            <MetricCard
              title="CMS Médio Realizado"
              value={consumoLoading ? "..." : consumoData?.consumoMedio ? `${consumoData.consumoMedio} kg` : "0 kg"}
              subtitle={
                consumoLoading
                  ? "Carregando..."
                  : consumoData?.variacaoOntem
                    ? `${consumoData.variacaoOntem > 0 ? '↗' : '↘'} ${consumoData.variacaoOntem > 0 ? '+' : ''}${consumoData.percentualVariacao}% vs ontem`
                    : "→ Status estável"
              }
              trend={
                consumoLoading
                  ? "stable"
                  : consumoData?.variacaoOntem
                    ? consumoData.variacaoOntem > 0 ? "up" : "down"
                    : "stable"
              }
              icon={<BarChart3 className="h-6 w-6" />}
            />
            <MetricCard
              title="CMN Médio Realizado"
              value={cmnRealizadoLoading ? "..." : cmnRealizadoData?.cmnRealizadoMedio ? `${cmnRealizadoData.cmnRealizadoMedio} kg` : "0 kg"}
              subtitle={
                cmnRealizadoLoading
                  ? "Carregando..."
                  : cmnRealizadoData?.variacaoOntem
                    ? `${cmnRealizadoData.variacaoOntem > 0 ? '↗' : '↘'} ${cmnRealizadoData.variacaoOntem > 0 ? '+' : ''}${cmnRealizadoData.percentualVariacao}% vs ontem`
                    : "→ Status estável"
              }
              trend={
                cmnRealizadoLoading
                  ? "stable"
                  : cmnRealizadoData?.variacaoOntem
                    ? cmnRealizadoData.variacaoOntem > 0 ? "up" : "down"
                    : "stable"
              }
              icon={<TrendingUp className="h-6 w-6" />}
            />
            <MetricCard
              title="CMS Médio % Peso Vivo"
              value={cmsPerceitoLoading ? "..." : cmsPerceitoData?.cmsPerceitoMedio ? `${cmsPerceitoData.cmsPerceitoMedio}%` : "0%"}
              subtitle={
                cmsPerceitoLoading
                  ? "Carregando..."
                  : cmsPerceitoData?.variacaoOntem
                    ? `${cmsPerceitoData.variacaoOntem > 0 ? '↗' : '↘'} ${cmsPerceitoData.variacaoOntem > 0 ? '+' : ''}${cmsPerceitoData.percentualVariacao}% vs ontem`
                    : "→ Status estável"
              }
              trend={
                cmsPerceitoLoading
                  ? "stable"
                  : cmsPerceitoData?.variacaoOntem
                    ? cmsPerceitoData.variacaoOntem > 0 ? "up" : "down"
                    : "stable"
              }
              icon={<Target className="h-6 w-6" />}
            />
            <MetricCard
              title="Leitura de Cocho Acurácia"
              value={acuraciaLoading ? "..." : acuraciaData?.taxaAcertoAvaliados !== undefined ? `${acuraciaData.taxaAcertoAvaliados}%` : "0%"}
              subtitle={
                acuraciaLoading
                  ? "Carregando..."
                  : acuraciaData?.totalAcertosAvaliados !== undefined && acuraciaData?.totalLotesAvaliados !== undefined
                    ? `${acuraciaData.totalAcertosAvaliados} acertos de ${acuraciaData.totalLotesAvaliados} lotes`
                    : "→ Sem dados de acurácia"
              }
              trend={
                acuraciaLoading
                  ? "stable"
                  : acuraciaData?.taxaAcertoAvaliados
                    ? acuraciaData.taxaAcertoAvaliados >= 85 ? "up" : acuraciaData.taxaAcertoAvaliados >= 71 ? "stable" : "down"
                    : "stable"
              }
              icon={<Target className="h-6 w-6" />}
            />
          </div>
        </div>


        {/* Gráficos de Análise - Logo após os cards */}
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Gráfico de Animais por Grupo Genético */}
            <HistoricoConsumoChart />

            {/* Gráfico de Entrada Mensal de Animais */}
            <EntradaMensalChart />

            {/* Gráfico de Previsão de Consumo de Ingredientes - Ocupa 2 colunas */}
            <div className="xl:col-span-2">
              <PrevisaoConsumoIngredientesChart />
            </div>
          </div>
        </div>

        {/* Charts Section */}
                {/* Análises Quantitativas */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">Análises Quantitativas</h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-6 mb-2 sm:mb-6">

            {/* Gráfico de Pizza - Dieta Fabricada */}
            <DietaFabricadaChart />

            {/* Eficiência por Carregamento */}
            <EficienciaCarregamentoChart />

            {/* Eficiência por Ingrediente - Ocupa 2 colunas no desktop */}
            <div className="xl:col-span-2">
              <EficienciaIngredienteChart />
            </div>
          </div>
        </div>

        {/* AI Agents Grid */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
              Agentes de IA Especializados
            </h2>
            <Badge className="bg-primary/20 text-primary border-primary/30 w-fit">
              <Brain className="h-3 w-3 mr-1" />
              4 Agentes Ativos
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6">
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
        <div className="mb-8 sm:mb-12">
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