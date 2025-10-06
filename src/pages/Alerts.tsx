import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, XCircle, Bell, RefreshCw, AlertCircle } from "lucide-react";
import { useSystemAlerts } from "@/hooks/useSystemAlerts";
import { Skeleton } from "@/components/ui/skeleton";

const getAlertIcon = (type: string) => {
  switch (type) {
    case "vermelho":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "laranja":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "amarelo":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getAlertBadge = (type: string, badgeText: string) => {
  switch (type) {
    case "vermelho":
      return <Badge variant="destructive" className="bg-red-600">{badgeText}</Badge>;
    case "laranja":
      return <Badge variant="secondary" className="bg-orange-500 text-white border-orange-600">{badgeText}</Badge>;
    case "amarelo":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">{badgeText}</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

const getCategoryBadge = (category: string) => {
  switch (category) {
    case "Análise Estatística":
      return <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-300">{category}</Badge>;
    case "Desvio de Consumo":
      return <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-300">{category}</Badge>;
    case "Leitura de Cocho":
      return <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 bg-green-50 text-green-700 border-green-300">{category}</Badge>;
    case "Compliance":
      return <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-300">{category}</Badge>;
    default:
      return <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0">{category}</Badge>;
  }
};

export default function Alerts() {
  const { data: alerts, isLoading, refetch } = useSystemAlerts();
  const [filterType, setFilterType] = useState<'all' | 'amarelo' | 'laranja' | 'vermelho'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'Análise Estatística' | 'Desvio de Consumo' | 'Leitura de Cocho' | 'Compliance'>('all');
  const [sortBy, setSortBy] = useState<'metric' | 'curral' | 'category'>('metric');

  // Filtrar e ordenar alertas
  const processedAlerts = useMemo(() => {
    if (!alerts) return [];

    let filtered = alerts;

    // Aplicar filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.type === filterType);
    }

    // Aplicar filtro por categoria
    if (filterCategory !== 'all') {
      filtered = filtered.filter(alert => alert.category === filterCategory);
    }

    // Aplicar ordenação
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'metric':
          // Para Leitura de Cocho, menor é pior. Para outros, maior é pior.
          if (a.category === 'Leitura de Cocho' && b.category === 'Leitura de Cocho') {
            return a.metric - b.metric;
          }
          return b.metric - a.metric;
        case 'curral':
          return (a.curralLote || '').localeCompare(b.curralLote || '');
        case 'category':
        default:
          return a.category.localeCompare(b.category);
      }
    });

    return sorted;
  }, [alerts, filterType, filterCategory, sortBy]);

  // Calcular estatísticas baseadas nos alertas filtrados
  const stats = useMemo(() => {
    if (!processedAlerts || processedAlerts.length === 0) {
      return { total: 0, amarelo: 0, laranja: 0, vermelho: 0 };
    }

    return {
      total: processedAlerts.length,
      amarelo: processedAlerts.filter(a => a.type === 'amarelo').length,
      laranja: processedAlerts.filter(a => a.type === 'laranja').length,
      vermelho: processedAlerts.filter(a => a.type === 'vermelho').length
    };
  }, [processedAlerts]);

  // Determinar status geral baseado nos alertas filtrados
  const statusGeral = stats.vermelho > 0 ? "Alerta Vermelho" : stats.laranja > 0 ? "Alerta Laranja" : stats.amarelo > 0 ? "Atenção" : "Normal";
  const statusColor = stats.vermelho > 0 ? "text-red-600" : stats.laranja > 0 ? "text-orange-500" : stats.amarelo > 0 ? "text-yellow-600" : "text-green-600";
  const StatusIcon = stats.vermelho > 0 ? XCircle : stats.laranja > 0 ? AlertCircle : stats.amarelo > 0 ? AlertTriangle : CheckCircle;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return 'recente';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Central de Alertas</h1>
            <p className="text-text-secondary">Monitoramento de consistência, precisão e acurácia da leitura de cocho</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Status Geral</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className={`text-xl font-bold ${statusColor}`}>{statusGeral}</p>
                  )}
                </div>
                <StatusIcon className={`h-8 w-8 ${statusColor}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Necessita de Atenção</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-yellow-600">{stats.amarelo}</p>
                  )}
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Alerta Laranja</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-orange-500">{stats.laranja}</p>
                  )}
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Alerta Vermelho</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-red-600">{stats.vermelho}</p>
                  )}
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <Select value={filterCategory} onValueChange={(value: any) => setFilterCategory(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="Análise Estatística">Análise Estatística</SelectItem>
              <SelectItem value="Desvio de Consumo">Desvio de Consumo</SelectItem>
              <SelectItem value="Compliance">Compliance</SelectItem>
              <SelectItem value="Leitura de Cocho">Leitura de Cocho</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Severidades</SelectItem>
              <SelectItem value="amarelo">Necessita de Atenção</SelectItem>
              <SelectItem value="laranja">Alerta Laranja</SelectItem>
              <SelectItem value="vermelho">Alerta Vermelho</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Maior Gravidade</SelectItem>
              <SelectItem value="curral">Curral/Lote</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-4 text-sm text-text-tertiary">
            <span>{processedAlerts.length} alerta{processedAlerts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Alerts List */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-border-subtle">
                    <Skeleton className="h-4 w-4 rounded-full mt-1" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : processedAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-text-secondary">Nenhum alerta ativo no momento</p>
                <p className="text-sm text-text-tertiary mt-2">Todos os lotes estão dentro dos parâmetros esperados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {processedAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 rounded-lg border border-border-subtle bg-background-primary/50 hover:bg-background-primary/70 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            {alert.title}
                            {getCategoryBadge(alert.category)}
                          </h4>
                          <p className="text-sm text-text-secondary mt-1">{alert.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-text-tertiary">
                              {alert.metricLabel}: {alert.metric.toFixed(2)}{alert.metricLabel === 'Taxa de Acerto' || alert.metricLabel === 'CV' || alert.metricLabel === 'Desvio' ? '%' : ''}
                            </span>
                            <span className="text-xs text-text-tertiary">•</span>
                            <span className="text-xs text-text-tertiary">
                              {formatTimeAgo(alert.data)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getAlertBadge(alert.type, alert.badgeText)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
