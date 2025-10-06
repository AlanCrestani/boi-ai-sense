import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Users, Weight, Activity, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MateriaSecaChart } from "@/components/dashboard/MateriaSecaChart";
import { EstatisticasConsumoCard } from "@/components/dashboard/EstatisticasConsumoCard";
import { PrecisaoPrevisaoCard } from "@/components/dashboard/PrecisaoPrevisaoCard";
import { AcuraciaLeituraCard } from "@/components/dashboard/AcuraciaLeituraCard";
import { useState, useCallback } from "react";

interface DadosConsumo {
  data: string;
  dia: string;
  previsto: number;
  realizado: number;
  desvio_kg_abs: number;
  desvio_abs_pc: number;
  escore: number;
  status: string;
  media_movel_4_dias: number;
}

export default function FeedReading() {
  const navigate = useNavigate();
  const [currentMetrics, setCurrentMetrics] = useState<{
    qtd_animais: number;
    peso_estimado_kg: number;
    cms_realizado_pcpv: number;
    dias_confinados: number;
  } | null>(null);
  const [currentChartData, setCurrentChartData] = useState<{
    dados: DadosConsumo[];
    curralLote: string;
  } | null>(null);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleMetricsChange = useCallback((metrics: {
    qtd_animais: number;
    peso_estimado_kg: number;
    cms_realizado_pcpv: number;
    dias_confinados: number;
  } | null) => {
    setCurrentMetrics(metrics);
  }, []);

  const handleDataChange = useCallback((data: {
    dados: DadosConsumo[];
    curralLote: string;
  } | null) => {
    setCurrentChartData(data);
  }, []);

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
            title="Quantidade de Animais"
            value={currentMetrics?.qtd_animais.toString() || "-"}
            subtitle="Cabeças no lote atual"
            icon={<Users className="h-6 w-6" />}
          />
          <MetricCard
            title="Peso Estimado"
            value={currentMetrics ? `${currentMetrics.peso_estimado_kg.toFixed(0)} kg` : "-"}
            subtitle="Peso médio por animal"
            icon={<Weight className="h-6 w-6" />}
          />
          <MetricCard
            title="CMS %PV"
            value={currentMetrics ? `${currentMetrics.cms_realizado_pcpv.toFixed(2)}%` : "-"}
            subtitle="Consumo % peso vivo"
            icon={<Activity className="h-6 w-6" />}
          />
          <MetricCard
            title="Dias Confinados"
            value={currentMetrics?.dias_confinados.toString() || "-"}
            subtitle="Total de dias no confinamento"
            icon={<Calendar className="h-6 w-6" />}
          />
        </div>

        {/* Chart Area - Componente MateriaSecaChart com funcionalidade de escore */}
        <MateriaSecaChart
          onMetricsChange={handleMetricsChange}
          onDataChange={handleDataChange}
        />

        {/* Análise Estatística */}
        {currentChartData && currentChartData.dados && (
          <div className="mt-8 space-y-6">
            <EstatisticasConsumoCard
              dados={currentChartData.dados}
              curralLote={currentChartData.curralLote}
            />
            <PrecisaoPrevisaoCard
              dados={currentChartData.dados}
              curralLote={currentChartData.curralLote}
            />
            <AcuraciaLeituraCard
              dados={currentChartData.dados}
              curralLote={currentChartData.curralLote}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}