import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Pipeline 04 Integration Component
 * Main integration point for Pipeline 04 ETL in the Conecta Boi app
 */
import { useState, useEffect } from 'react';
import { Pipeline04Dashboard } from './Pipeline04Dashboard';
import { Pipeline04UIService } from '../services/ui-integration';
export const Pipeline04Integration = ({ supabaseClient, organizationId, currentUser, onNavigate, }) => {
    const [uiService] = useState(() => new Pipeline04UIService(supabaseClient, organizationId));
    const [stats, setStats] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadStats();
    }, [organizationId]);
    const loadStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const freshStats = await uiService.getProcessingStats();
            setStats(freshStats);
        }
        catch (err) {
            console.error('Error loading Pipeline 04 stats:', err);
            setError('Erro ao carregar estatísticas do Pipeline 04');
        }
        finally {
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
        }
        catch (err) {
            console.error('Error exporting data:', err);
            alert('Erro ao exportar dados');
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Carregando Pipeline 04..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-red-500 text-4xl mb-4", children: "\u274C" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Erro no Pipeline 04" }), _jsx("p", { className: "text-gray-600 mb-4", children: error }), _jsx("button", { onClick: loadStats, className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700", children: "Tentar Novamente" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-6 py-3", children: _jsx("nav", { className: "flex", "aria-label": "Breadcrumb", children: _jsxs("ol", { className: "inline-flex items-center space-x-1 md:space-x-3", children: [_jsx("li", { className: "inline-flex items-center", children: _jsx("button", { onClick: () => onNavigate?.('/'), className: "text-gray-500 hover:text-gray-700", children: "\uD83C\uDFE0 Dashboard" }) }), _jsx("li", { children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-gray-400 mx-2", children: "/" }), _jsx("button", { onClick: () => onNavigate?.('/etl'), className: "text-gray-500 hover:text-gray-700", children: "\uD83D\uDD04 ETL" })] }) }), _jsx("li", { "aria-current": "page", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-gray-400 mx-2", children: "/" }), _jsx("span", { className: "text-gray-900 font-medium", children: "\uD83D\uDC04 Pipeline 04 - Trato por Curral" })] }) })] }) }) }) }), _jsx(Pipeline04Dashboard, { organizationId: organizationId, stats: stats, onRefreshStats: loadStats, onExportData: handleExportData }), stats && stats.processingHealthStatus === 'error' && (_jsx("div", { className: "fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm", children: _jsxs("div", { className: "flex items-start", children: [_jsx("span", { className: "text-xl mr-2", children: "\uD83D\uDEA8" }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold", children: "Status Cr\u00EDtico" }), _jsx("p", { className: "text-sm mt-1", children: "O Pipeline 04 requer aten\u00E7\u00E3o imediata." }), stats.recommendations.length > 0 && (_jsx("ul", { className: "text-xs mt-2 space-y-1", children: stats.recommendations.slice(0, 2).map((rec, idx) => (_jsxs("li", { children: ["\u2022 ", rec] }, idx))) }))] })] }) })), stats && stats.processingHealthStatus === 'warning' && stats.pendingEntriesCount > 10 && (_jsx("div", { className: "fixed bottom-4 right-4 bg-yellow-600 text-white p-4 rounded-lg shadow-lg max-w-sm", children: _jsxs("div", { className: "flex items-start", children: [_jsx("span", { className: "text-xl mr-2", children: "\u26A0\uFE0F" }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold", children: "Aten\u00E7\u00E3o Necess\u00E1ria" }), _jsxs("p", { className: "text-sm mt-1", children: [stats.pendingEntriesCount, " entradas pendentes aguardando resolu\u00E7\u00E3o."] }), _jsx("button", { onClick: () => { }, className: "text-xs underline mt-2", children: "Resolver agora \u2192" })] })] }) }))] }));
};
