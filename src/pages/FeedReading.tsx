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
import { ArrowLeft, Scale, TrendingUp, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";

export default function FeedReading() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
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

        {/* Main Content Area - Placeholder for future features */}
        <div className="tech-card p-8 text-center">
          <Scale className="h-16 w-16 mx-auto mb-4 text-primary/60" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Sistema de Leitura de Cocho
          </h2>
          <p className="text-text-secondary mb-6">
            Aqui você pode monitorar em tempo real o consumo de ração, 
            níveis dos cochos e receber alertas sobre anomalias no sistema.
          </p>
          <Button variant="default">
            Configurar Sensores
          </Button>
        </div>
      </div>
    </Layout>
  );
}