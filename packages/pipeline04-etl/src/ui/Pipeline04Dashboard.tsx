/**
 * Pipeline 04 ETL Dashboard Component
 * Provides overview and monitoring for feeding treatment data processing
 */

import React, { useState, useEffect } from 'react';
import { PendingEntriesManager } from './PendingEntriesManager';

export interface Pipeline04Stats {
  totalRecordsProcessed: number;
  recordsToday: number;
  recordsThisWeek: number;
  pendingEntriesCount: number;
  pendingCurrals: number;
  pendingDietas: number;
  processingHealthStatus: 'healthy' | 'warning' | 'error';
  avgProcessingTimeMs: number;
  lastProcessedAt?: Date;
  errorRate: number;
}

export interface Pipeline04DashboardProps {
  organizationId: string;
  stats?: Pipeline04Stats;
  onRefreshStats?: () => void;
  onExportData?: () => void;
}

export const Pipeline04Dashboard: React.FC<Pipeline04DashboardProps> = ({
  organizationId,
  stats: propStats,
  onRefreshStats,
  onExportData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'logs'>('overview');
  const [stats, setStats] = useState<Pipeline04Stats>(propStats || {
    totalRecordsProcessed: 1250,
    recordsToday: 85,
    recordsThisWeek: 320,
    pendingEntriesCount: 12,
    pendingCurrals: 8,
    pendingDietas: 4,
    processingHealthStatus: 'warning',
    avgProcessingTimeMs: 45,
    lastProcessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    errorRate: 0.02, // 2%
  });

  const [recentLogs] = useState([
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      level: 'info',
      message: '25 registros de trato processados com sucesso',
      details: 'Arquivo: trato_2024-09-15_14-30.csv',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      level: 'warning',
      message: 'Curral CUR-888 criado como entrada pendente',
      details: 'Linha 12: Código não encontrado na dimensão',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      level: 'success',
      message: 'Entrada pendente resolvida: Dieta Especial -> dim_dieta_456',
      details: 'Usuário: joão.silva@fazenda.com',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      level: 'error',
      message: 'Falha na validação: Quantidade negativa rejeitada',
      details: 'Linha 8: quantidade_kg = -150.5',
    },
  ]);

  useEffect(() => {
    if (propStats) {
      setStats(propStats);
    }
  }, [propStats]);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h atrás`;
    } else {
      return `${diffMinutes}min atrás`;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline 04 - Trato por Curral</h1>
        <p className="text-gray-600 mt-1">
          Monitoramento e gerenciamento do processamento ETL de dados de alimentação
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: '📊' },
              { id: 'pending', label: `Pendentes (${stats.pendingEntriesCount})`, icon: '⏳' },
              { id: 'logs', label: 'Logs', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Status do Sistema</h2>
                <div className="flex items-center mt-2">
                  <span className="mr-2">{getHealthStatusIcon(stats.processingHealthStatus)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(stats.processingHealthStatus)}`}>
                    {stats.processingHealthStatus === 'healthy' && 'Saudável'}
                    {stats.processingHealthStatus === 'warning' && 'Atenção'}
                    {stats.processingHealthStatus === 'error' && 'Crítico'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={onRefreshStats}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  🔄 Atualizar
                </button>
                <button
                  onClick={onExportData}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  📥 Exportar
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📈</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Processado</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalRecordsProcessed.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📅</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hoje</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.recordsToday}</p>
                  <p className="text-xs text-gray-500">Esta semana: {stats.recordsThisWeek}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">⏳</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Entradas Pendentes</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingEntriesCount}</p>
                  <p className="text-xs text-gray-500">
                    Currais: {stats.pendingCurrals} | Dietas: {stats.pendingDietas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">⚡</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Performance</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.avgProcessingTimeMs}ms</p>
                  <p className="text-xs text-gray-500">
                    Taxa de erro: {(stats.errorRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
            </div>
            <div className="p-6">
              {stats.lastProcessedAt && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Último processamento:</strong> {formatTimeAgo(stats.lastProcessedAt)}
                  </p>
                </div>
              )}

              {stats.pendingEntriesCount > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Ação necessária:</strong> {stats.pendingEntriesCount} entrada{stats.pendingEntriesCount > 1 ? 's' : ''} pendente{stats.pendingEntriesCount > 1 ? 's' : ''} aguardando resolução
                  </p>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className="text-xs text-yellow-700 underline mt-1"
                  >
                    Ver entradas pendentes →
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {recentLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <span className="text-lg">{getLevelIcon(log.level)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{log.message}</p>
                      <p className="text-xs text-gray-500">{log.details}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Entries Tab */}
      {activeTab === 'pending' && (
        <PendingEntriesManager
          organizationId={organizationId}
          onPendingResolved={(pendingId, resolvedValue) => {
            // Update stats
            setStats(prev => ({
              ...prev,
              pendingEntriesCount: prev.pendingEntriesCount - 1,
            }));
            console.log('Pending resolved:', pendingId, resolvedValue);
          }}
          onPendingRejected={(pendingId, reason) => {
            // Update stats
            setStats(prev => ({
              ...prev,
              pendingEntriesCount: prev.pendingEntriesCount - 1,
            }));
            console.log('Pending rejected:', pendingId, reason);
          }}
        />
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Logs do Sistema</h3>
            <p className="text-sm text-gray-600">Histórico de processamento e eventos</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getLevelIcon(log.level)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.message}</p>
                        <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {log.timestamp.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button className="text-blue-600 hover:text-blue-700 text-sm">
                Ver todos os logs →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};