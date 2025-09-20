import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Pipeline 04 ETL Dashboard Component
 * Provides overview and monitoring for feeding treatment data processing
 */
import { useState, useEffect } from 'react';
import { PendingEntriesManager } from './PendingEntriesManager';
export const Pipeline04Dashboard = ({ organizationId, stats: propStats, onRefreshStats, onExportData, }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(propStats || {
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
    const getHealthStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'error': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    const getHealthStatusIcon = (status) => {
        switch (status) {
            case 'healthy': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '❓';
        }
    };
    const formatTimeAgo = (date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffHours > 0) {
            return `${diffHours}h atrás`;
        }
        else {
            return `${diffMinutes}min atrás`;
        }
    };
    const getLevelIcon = (level) => {
        switch (level) {
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '📝';
        }
    };
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Pipeline 04 - Trato por Curral" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Monitoramento e gerenciamento do processamento ETL de dados de alimenta\u00E7\u00E3o" })] }), _jsx("div", { className: "mb-6", children: _jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "-mb-px flex space-x-8", children: [
                            { id: 'overview', label: 'Visão Geral', icon: '📊' },
                            { id: 'pending', label: `Pendentes (${stats.pendingEntriesCount})`, icon: '⏳' },
                            { id: 'logs', label: 'Logs', icon: '📋' },
                        ].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx("span", { className: "mr-2", children: tab.icon }), tab.label] }, tab.id))) }) }) }), activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Status do Sistema" }), _jsxs("div", { className: "flex items-center mt-2", children: [_jsx("span", { className: "mr-2", children: getHealthStatusIcon(stats.processingHealthStatus) }), _jsxs("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(stats.processingHealthStatus)}`, children: [stats.processingHealthStatus === 'healthy' && 'Saudável', stats.processingHealthStatus === 'warning' && 'Atenção', stats.processingHealthStatus === 'error' && 'Crítico'] })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: onRefreshStats, className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700", children: "\uD83D\uDD04 Atualizar" }), _jsx("button", { onClick: onExportData, className: "bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700", children: "\uD83D\uDCE5 Exportar" })] })] }) }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-4", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "text-2xl", children: "\uD83D\uDCC8" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Processado" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats.totalRecordsProcessed.toLocaleString() })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "text-2xl", children: "\uD83D\uDCC5" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Hoje" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats.recordsToday }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Esta semana: ", stats.recordsThisWeek] })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "text-2xl", children: "\u23F3" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Entradas Pendentes" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats.pendingEntriesCount }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Currais: ", stats.pendingCurrals, " | Dietas: ", stats.pendingDietas] })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "text-2xl", children: "\u26A1" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Performance" }), _jsxs("p", { className: "text-2xl font-semibold text-gray-900", children: [stats.avgProcessingTimeMs, "ms"] }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Taxa de erro: ", (stats.errorRate * 100).toFixed(1), "%"] })] })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Atividade Recente" }) }), _jsxs("div", { className: "p-6", children: [stats.lastProcessedAt && (_jsx("div", { className: "mb-4 p-3 bg-blue-50 rounded", children: _jsxs("p", { className: "text-sm text-blue-800", children: [_jsx("strong", { children: "\u00DAltimo processamento:" }), " ", formatTimeAgo(stats.lastProcessedAt)] }) })), stats.pendingEntriesCount > 0 && (_jsxs("div", { className: "mb-4 p-3 bg-yellow-50 rounded", children: [_jsxs("p", { className: "text-sm text-yellow-800", children: [_jsx("strong", { children: "A\u00E7\u00E3o necess\u00E1ria:" }), " ", stats.pendingEntriesCount, " entrada", stats.pendingEntriesCount > 1 ? 's' : '', " pendente", stats.pendingEntriesCount > 1 ? 's' : '', " aguardando resolu\u00E7\u00E3o"] }), _jsx("button", { onClick: () => setActiveTab('pending'), className: "text-xs text-yellow-700 underline mt-1", children: "Ver entradas pendentes \u2192" })] })), _jsx("div", { className: "space-y-3", children: recentLogs.slice(0, 3).map((log) => (_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("span", { className: "text-lg", children: getLevelIcon(log.level) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm text-gray-900", children: log.message }), _jsx("p", { className: "text-xs text-gray-500", children: log.details }), _jsx("p", { className: "text-xs text-gray-400", children: formatTimeAgo(log.timestamp) })] })] }, log.id))) })] })] })] })), activeTab === 'pending' && (_jsx(PendingEntriesManager, { organizationId: organizationId, onPendingResolved: (pendingId, resolvedValue) => {
                    // Update stats
                    setStats(prev => ({
                        ...prev,
                        pendingEntriesCount: prev.pendingEntriesCount - 1,
                    }));
                    console.log('Pending resolved:', pendingId, resolvedValue);
                }, onPendingRejected: (pendingId, reason) => {
                    // Update stats
                    setStats(prev => ({
                        ...prev,
                        pendingEntriesCount: prev.pendingEntriesCount - 1,
                    }));
                    console.log('Pending rejected:', pendingId, reason);
                } })), activeTab === 'logs' && (_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Logs do Sistema" }), _jsx("p", { className: "text-sm text-gray-600", children: "Hist\u00F3rico de processamento e eventos" })] }), _jsxs("div", { className: "p-6", children: [_jsx("div", { className: "space-y-4", children: recentLogs.map((log) => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("span", { className: "text-lg", children: getLevelIcon(log.level) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: log.message }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: log.details })] })] }), _jsx("span", { className: "text-xs text-gray-500", children: log.timestamp.toLocaleString('pt-BR') })] }) }, log.id))) }), _jsx("div", { className: "mt-6 text-center", children: _jsx("button", { className: "text-blue-600 hover:text-blue-700 text-sm", children: "Ver todos os logs \u2192" }) })] })] }))] }));
};
