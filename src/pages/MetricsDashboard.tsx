/**
 * ETL Metrics Dashboard
 * Comprehensive metrics visualization for ETL pipeline monitoring
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  TrendingUp,
  TrendingDown,
  Zap,
  RefreshCw,
  Settings,
  Bell,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Interfaces for metrics data
interface MetricsOverview {
  totalFiles: number;
  processingFiles: number;
  successRate: number;
  errorRate: number;
  avgProcessingTime: number;
  dlqSize: number;
  activeRetries: number;
}

interface PerformanceSnapshot {
  snapshotTime: string;
  totalFilesProcessed: number;
  filesUploaded: number;
  filesProcessing: number;
  filesValidated: number;
  filesApproved: number;
  filesLoaded: number;
  filesFailed: number;
  avgProcessingTimeMs: number;
  errorRatePercentage: number;
  successRatePercentage: number;
  throughputRecordsPerMinute: number;
  dlqEntries: number;
  activeRetries: number;
}

interface AlertSummary {
  id: string;
  alertName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: string;
  acknowledged: boolean;
  resolved: boolean;
}

const MetricsDashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [snapshotPeriod, setSnapshotPeriod] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Color schemes for charts
  const statusColors = {
    uploaded: '#3b82f6',
    processing: '#f59e0b',
    validated: '#10b981',
    approved: '#8b5cf6',
    loaded: '#059669',
    failed: '#ef4444'
  };

  const severityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444'
  };

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [user, timeRange, snapshotPeriod]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange, snapshotPeriod]);

  const loadDashboardData = async () => {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      await Promise.all([
        loadMetricsOverview(),
        loadPerformanceSnapshots(),
        loadRecentAlerts()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetricsOverview = async () => {
    // Get current files count by status
    const { data: files, error: filesError } = await supabase
      .from('etl_file')
      .select('status')
      .eq('organization_id', user?.organizationId);

    if (filesError) throw filesError;

    // Get latest performance snapshot
    const { data: latestSnapshot, error: snapshotError } = await supabase
      .from('etl_performance_snapshots')
      .select('*')
      .eq('organization_id', user?.organizationId)
      .eq('snapshot_period', 'hourly')
      .order('snapshot_time', { ascending: false })
      .limit(1)
      .single();

    if (snapshotError && snapshotError.code !== 'PGRST116') {
      console.warn('No performance snapshot found:', snapshotError);
    }

    // Get DLQ size
    const { data: dlqData, error: dlqError } = await supabase
      .from('etl_dead_letter_queue')
      .select('id')
      .eq('organization_id', user?.organizationId)
      .eq('resolved', false);

    if (dlqError) throw dlqError;

    const filesByStatus = files?.reduce((acc, file) => {
      acc[file.status] = (acc[file.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    setOverview({
      totalFiles: files?.length || 0,
      processingFiles: filesByStatus.processing || 0,
      successRate: latestSnapshot?.success_rate_percentage || 100,
      errorRate: latestSnapshot?.error_rate_percentage || 0,
      avgProcessingTime: latestSnapshot?.avg_processing_time_ms || 0,
      dlqSize: dlqData?.length || 0,
      activeRetries: latestSnapshot?.active_retries || 0
    });
  };

  const loadPerformanceSnapshots = async () => {
    const limit = timeRange === '1h' ? 60 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;

    const { data, error } = await supabase
      .from('etl_performance_snapshots')
      .select('*')
      .eq('organization_id', user?.organizationId)
      .eq('snapshot_period', snapshotPeriod)
      .order('snapshot_time', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const formattedSnapshots = data?.map(snapshot => ({
      snapshotTime: new Date(snapshot.snapshot_time).toLocaleString('pt-BR'),
      totalFilesProcessed: snapshot.total_files_processed,
      filesUploaded: snapshot.files_uploaded,
      filesProcessing: snapshot.files_processing,
      filesValidated: snapshot.files_validated,
      filesApproved: snapshot.files_approved,
      filesLoaded: snapshot.files_loaded,
      filesFailed: snapshot.files_failed,
      avgProcessingTimeMs: snapshot.avg_processing_time_ms,
      errorRatePercentage: snapshot.error_rate_percentage,
      successRatePercentage: snapshot.success_rate_percentage,
      throughputRecordsPerMinute: snapshot.throughput_records_per_minute,
      dlqEntries: snapshot.dlq_entries,
      activeRetries: snapshot.active_retries
    })).reverse() || [];

    setSnapshots(formattedSnapshots);
  };

  const loadRecentAlerts = async () => {
    const { data, error } = await supabase
      .from('etl_alert_history')
      .select('id, alert_name, severity, triggered_at, acknowledged, resolved')
      .eq('organization_id', user?.organizationId)
      .order('triggered_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const formattedAlerts = data?.map(alert => ({
      id: alert.id,
      alertName: alert.alert_name,
      severity: alert.severity,
      triggeredAt: new Date(alert.triggered_at).toLocaleString('pt-BR'),
      acknowledged: alert.acknowledged,
      resolved: alert.resolved
    })) || [];

    setAlerts(formattedAlerts);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Prepare chart data
  const fileStatusData = overview ? [
    { name: 'Carregados', value: snapshots[snapshots.length - 1]?.filesUploaded || 0, color: statusColors.uploaded },
    { name: 'Processando', value: snapshots[snapshots.length - 1]?.filesProcessing || 0, color: statusColors.processing },
    { name: 'Validados', value: snapshots[snapshots.length - 1]?.filesValidated || 0, color: statusColors.validated },
    { name: 'Aprovados', value: snapshots[snapshots.length - 1]?.filesApproved || 0, color: statusColors.approved },
    { name: 'Carregados DW', value: snapshots[snapshots.length - 1]?.filesLoaded || 0, color: statusColors.loaded },
    { name: 'Falhas', value: snapshots[snapshots.length - 1]?.filesFailed || 0, color: statusColors.failed }
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Métricas ETL</h1>
            <p className="text-muted-foreground">
              Monitoramento em tempo real do pipeline ETL e métricas de performance
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hora</SelectItem>
                <SelectItem value="24h">24 Horas</SelectItem>
                <SelectItem value="7d">7 Dias</SelectItem>
                <SelectItem value="30d">30 Dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={snapshotPeriod} onValueChange={(value: any) => setSnapshotPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Por Hora</SelectItem>
                <SelectItem value="daily">Por Dia</SelectItem>
                <SelectItem value="weekly">Por Semana</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              {autoRefresh ? (
                <Zap className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {autoRefresh ? "Auto Refresh" : "Manual"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Arquivos</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold">{overview?.totalFiles || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Database className="h-3 w-3 mr-1" />
                Processados
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processando</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold text-yellow-600">{overview?.processingFiles || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Em andamento
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold text-green-600">{overview?.successRate?.toFixed(1) || 100}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Concluídos
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Erro</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold text-red-600">{overview?.errorRate?.toFixed(1) || 0}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Falhas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold">{formatDuration(overview?.avgProcessingTime || 0)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Activity className="h-3 w-3 mr-1" />
                Processamento
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">DLQ</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold text-orange-600">{overview?.dlqSize || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Target className="h-3 w-3 mr-1" />
                Entradas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tentativas</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold text-blue-600">{overview?.activeRetries || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 mr-1" />
                Ativas
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="status">Status dos Arquivos</TabsTrigger>
            <TabsTrigger value="errors">Análise de Erros</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tempo de Processamento</CardTitle>
                  <CardDescription>Evolução do tempo médio de processamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={snapshots}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="snapshotTime" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatDuration(value as number), 'Tempo']} />
                      <Line
                        type="monotone"
                        dataKey="avgProcessingTimeMs"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Sucesso vs Erro</CardTitle>
                  <CardDescription>Evolução das taxas de sucesso e erro</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={snapshots}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="snapshotTime" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Area
                        type="monotone"
                        dataKey="successRatePercentage"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Sucesso"
                      />
                      <Area
                        type="monotone"
                        dataKey="errorRatePercentage"
                        stackId="2"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.6}
                        name="Erro"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Throughput de Processamento</CardTitle>
                <CardDescription>Arquivos processados por período de tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={snapshots}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="snapshotTime" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalFilesProcessed" fill="#3b82f6" name="Arquivos Processados" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                  <CardDescription>Status atual dos arquivos ETL</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={fileStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {fileStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Evolução por Status</CardTitle>
                  <CardDescription>Mudanças nos status ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={snapshots}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="snapshotTime" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="filesUploaded" stackId="1" stroke={statusColors.uploaded} fill={statusColors.uploaded} fillOpacity={0.6} name="Carregados" />
                      <Area type="monotone" dataKey="filesProcessing" stackId="1" stroke={statusColors.processing} fill={statusColors.processing} fillOpacity={0.6} name="Processando" />
                      <Area type="monotone" dataKey="filesValidated" stackId="1" stroke={statusColors.validated} fill={statusColors.validated} fillOpacity={0.6} name="Validados" />
                      <Area type="monotone" dataKey="filesLoaded" stackId="1" stroke={statusColors.loaded} fill={statusColors.loaded} fillOpacity={0.6} name="Carregados" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dead Letter Queue</CardTitle>
                  <CardDescription>Entradas em fila de reprocessamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={snapshots}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="snapshotTime" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="dlqEntries" stroke="#f97316" strokeWidth={2} name="Entradas DLQ" />
                      <Line type="monotone" dataKey="activeRetries" stroke="#3b82f6" strokeWidth={2} name="Tentativas Ativas" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Arquivos com Falha</CardTitle>
                  <CardDescription>Evolução de arquivos que falharam no processamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={snapshots}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="snapshotTime" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="filesFailed" fill="#ef4444" name="Arquivos com Falha" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recentes</CardTitle>
                <CardDescription>Últimos alertas disparados pelo sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum alerta recente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full`}
                            style={{ backgroundColor: severityColors[alert.severity] }}
                          />
                          <div>
                            <p className="font-medium">{alert.alertName}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.triggeredAt} • {alert.severity.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {alert.resolved ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Resolvido
                            </span>
                          ) : alert.acknowledged ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Reconhecido
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Ativo
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MetricsDashboard;