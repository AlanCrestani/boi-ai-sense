import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceProfiler } from '@/utils/performance';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  TruckIcon,
  BarChart3,
  Activity,
  Package
} from 'lucide-react';
import { CarregamentoMetrics as MetricsType } from '@/hooks/useCarregamentoMetrics';
import { CarregamentoStateWrapper } from './states';

interface CarregamentoMetricsProps {
  metrics: MetricsType;
  isLoading: boolean;
  error?: Error | null;
  hasData: boolean;
  className?: string;
  onRetry?: () => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  isLoading?: boolean;
  variant?: 'default' | 'warning' | 'success' | 'error';
}

const MetricCard = memo<MetricCardProps>(({
  title,
  value,
  subtitle,
  trend,
  icon,
  isLoading = false,
  variant = 'default'
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-border-subtle bg-card-secondary/50';
    }
  };

  return (
    <Card className={`backdrop-blur-sm ${getVariantStyles()} min-h-[120px] flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-text-secondary truncate pr-2">
          {title}
        </CardTitle>
        <div className="text-text-secondary flex-shrink-0">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-xl sm:text-2xl font-bold text-text-primary mb-1 truncate">
          {isLoading ? (
            <div className="animate-pulse bg-gray-300 h-6 sm:h-8 w-12 sm:w-16 rounded"></div>
          ) : (
            value
          )}
        </div>
        <div className={`text-xs flex items-center gap-1 ${getTrendColor()} mt-auto`}>
          {getTrendIcon()}
          <span className="truncate">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  );
});

export const CarregamentoMetrics = memo<CarregamentoMetricsProps>(({
  metrics,
  isLoading,
  error,
  hasData,
  className = "",
  onRetry
}) => {
  usePerformanceProfiler('CarregamentoMetrics', [metrics, isLoading, error, hasData]);
  // Determinar variantes dos cards baseado nos valores das métricas
  const getDesvioVariant = () => {
    if (metrics.desvioMedio <= 1) return 'success';
    if (metrics.desvioMedio <= 3) return 'warning';
    return 'error';
  };

  const getEficienciaVariant = () => {
    if (metrics.eficienciaMedia >= 95) return 'success';
    if (metrics.eficienciaMedia >= 85) return 'warning';
    return 'error';
  };

  const getCarregamentosVariant = () => {
    if (metrics.totalCarregamentos >= 15) return 'success';
    if (metrics.totalCarregamentos >= 10) return 'warning';
    return 'error';
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}t`;
    }
    return `${volume.toFixed(0)} kg`;
  };

  return (
    <CarregamentoStateWrapper
      isLoading={isLoading}
      error={error}
      data={hasData ? [metrics] : []}
      loadingType="metrics"
      errorType="database"
      emptyType="no-results"
      onRetry={onRetry}
      className={className}
    >
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
        {/* Card 1: Desvios Totais */}
        <MetricCard
          title="Desvios Detectados"
          value={metrics.totalDesvios}
          subtitle={`Período: ${metrics.periodoAnalisado}`}
          trend={metrics.tendencia}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={metrics.totalDesvios > 10 ? 'warning' : 'default'}
        />

        {/* Card 2: Desvio Médio */}
        <MetricCard
          title="Desvio Médio"
          value={`${metrics.desvioMedio.toFixed(1)} kg`}
          subtitle={`Eficiência: ${metrics.eficienciaMedia.toFixed(1)}%`}
          trend={metrics.eficienciaMedia >= 95 ? 'up' : metrics.eficienciaMedia >= 85 ? 'stable' : 'down'}
          icon={<BarChart3 className="h-5 w-5" />}
          variant={getDesvioVariant()}
        />

        {/* Card 3: Total de Carregamentos */}
        <MetricCard
          title="Carregamentos"
          value={metrics.totalCarregamentos}
          subtitle={`Volume: ${formatVolume(metrics.volumeTotal)}`}
          trend={metrics.totalCarregamentos >= 15 ? 'up' : metrics.totalCarregamentos >= 10 ? 'stable' : 'down'}
          icon={<TruckIcon className="h-5 w-5" />}
          variant={getCarregamentosVariant()}
        />

        {/* Card 4: Status Operacional */}
        <MetricCard
          title="Status"
          value={hasData ? "Operacional" : "Sem dados"}
          subtitle={hasData ? "Dados atualizados" : "Ajuste os filtros"}
          trend={hasData ? 'up' : 'down'}
          icon={<Activity className="h-5 w-5" />}
          variant={hasData ? 'success' : 'error'}
        />
      </div>
    </CarregamentoStateWrapper>
  );
});