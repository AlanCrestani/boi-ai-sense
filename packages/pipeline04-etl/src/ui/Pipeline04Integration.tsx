/**
 * Pipeline 04 Integration Component
 * Main integration point for Pipeline 04 ETL in the Conecta Boi app
 */

import React, { useState, useEffect } from 'react';
import { Pipeline04Dashboard } from './Pipeline04Dashboard';
import { Pipeline04UIService, UIProcessingStats } from '../services/ui-integration';

export interface Pipeline04IntegrationProps {
  supabaseClient: any;
  organizationId: string;
  currentUser: {
    id: string;
    email: string;
    name: string;
  };
  onNavigate?: (path: string) => void;
}

export const Pipeline04Integration: React.FC<Pipeline04IntegrationProps> = ({
  supabaseClient,
  organizationId,
  currentUser,
  onNavigate,
}) => {
  const [uiService] = useState(() => new Pipeline04UIService(supabaseClient, organizationId));
  const [stats, setStats] = useState<UIProcessingStats | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [organizationId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const freshStats = await uiService.getProcessingStats();
      setStats(freshStats);
    } catch (err) {
      console.error('Error loading Pipeline 04 stats:', err);
      setError('Erro ao carregar estatísticas do Pipeline 04');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const csvData = await uiService.exportProcessingData({
        start: startDate,
        end: endDate,
      });

      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pipeline04-trato-curral-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log the export
      await uiService.logProcessingEvent({
        level: 'info',
        message: 'Dados do Pipeline 04 exportados',
        details: `Exportado por ${currentUser.name} (${currentUser.email})`,
        organizationId,
      });

    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Erro ao exportar dados');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando Pipeline 04...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro no Pipeline 04</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadStats}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => onNavigate?.('/')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  🏠 Dashboard
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="text-gray-400 mx-2">/</span>
                  <button
                    onClick={() => onNavigate?.('/etl')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    🔄 ETL
                  </button>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="text-gray-400 mx-2">/</span>
                  <span className="text-gray-900 font-medium">🐄 Pipeline 04 - Trato por Curral</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Dashboard */}
      <Pipeline04Dashboard
        organizationId={organizationId}
        stats={stats}
        onRefreshStats={loadStats}
        onExportData={handleExportData}
      />

      {/* Health Status Floating Alert */}
      {stats && stats.processingHealthStatus === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start">
            <span className="text-xl mr-2">🚨</span>
            <div>
              <h4 className="font-semibold">Status Crítico</h4>
              <p className="text-sm mt-1">
                O Pipeline 04 requer atenção imediata.
              </p>
              {stats.recommendations.length > 0 && (
                <ul className="text-xs mt-2 space-y-1">
                  {stats.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning Status Floating Alert */}
      {stats && stats.processingHealthStatus === 'warning' && stats.pendingEntriesCount > 10 && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start">
            <span className="text-xl mr-2">⚠️</span>
            <div>
              <h4 className="font-semibold">Atenção Necessária</h4>
              <p className="text-sm mt-1">
                {stats.pendingEntriesCount} entradas pendentes aguardando resolução.
              </p>
              <button
                onClick={() => {/* Trigger switch to pending tab */}}
                className="text-xs underline mt-2"
              >
                Resolver agora →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};