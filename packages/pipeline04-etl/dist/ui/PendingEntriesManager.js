import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * UI Component for Managing Pending Entries - Pipeline 04
 * Allows manual registration and resolution of pending curral/dieta entries
 */
import { useState, useEffect } from 'react';
export const PendingEntriesManager = ({ organizationId, onPendingResolved, onPendingRejected, }) => {
    const [pendingEntries, setPendingEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [resolveMode, setResolveMode] = useState(null);
    const [filterType, setFilterType] = useState('all');
    // Form states
    const [newCurralName, setNewCurralName] = useState('');
    const [newDietaDescription, setNewDietaDescription] = useState('');
    const [mapToExistingId, setMapToExistingId] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    useEffect(() => {
        loadPendingEntries();
    }, [organizationId]);
    const loadPendingEntries = async () => {
        setLoading(true);
        try {
            // Em implementação real, usar o serviço injetado
            // const entries = await dimensionService.getPendingEntries(organizationId);
            // setPendingEntries(entries);
            // Mock data para demonstração
            const mockEntries = [
                {
                    id: 'pending-curral-001',
                    type: 'curral',
                    code: 'CUR-999',
                    organizationId,
                    status: 'pending',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                },
                {
                    id: 'pending-dieta-001',
                    type: 'dieta',
                    code: 'Dieta Especial X',
                    organizationId,
                    status: 'pending',
                    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
                },
                {
                    id: 'pending-curral-002',
                    type: 'curral',
                    code: 'CUR-777',
                    organizationId,
                    status: 'pending',
                    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                },
            ];
            setPendingEntries(mockEntries);
        }
        catch (error) {
            console.error('Erro ao carregar entradas pendentes:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const filteredEntries = pendingEntries.filter(entry => {
        if (filterType === 'all')
            return true;
        return entry.type === filterType;
    });
    const handleResolveEntry = async (mode) => {
        if (!selectedEntry)
            return;
        try {
            let resolvedValue = '';
            if (mode === 'create') {
                if (selectedEntry.type === 'curral') {
                    // Create new curral
                    if (!newCurralName.trim()) {
                        alert('Por favor, forneça um nome para o curral');
                        return;
                    }
                    // resolvedValue = await dimensionService.createCurral(selectedEntry.code, newCurralName, organizationId);
                    resolvedValue = `new-curral-${Date.now()}`; // Mock
                }
                else {
                    // Create new dieta
                    if (!newDietaDescription.trim()) {
                        alert('Por favor, forneça uma descrição para a dieta');
                        return;
                    }
                    // resolvedValue = await dimensionService.createDieta(selectedEntry.code, newDietaDescription, organizationId);
                    resolvedValue = `new-dieta-${Date.now()}`; // Mock
                }
            }
            else {
                // Map to existing
                if (!mapToExistingId.trim()) {
                    alert('Por favor, forneça o ID da dimensão existente');
                    return;
                }
                resolvedValue = mapToExistingId;
            }
            // Resolve pending entry
            // await dimensionService.resolvePendingEntry(selectedEntry.id, resolvedValue, 'current-user');
            // Update local state
            setPendingEntries(prev => prev.filter(e => e.id !== selectedEntry.id));
            // Notify parent
            onPendingResolved?.(selectedEntry.id, resolvedValue);
            // Reset form
            resetForm();
            alert(`${selectedEntry.type === 'curral' ? 'Curral' : 'Dieta'} "${selectedEntry.code}" resolvido com sucesso!`);
        }
        catch (error) {
            console.error('Erro ao resolver entrada pendente:', error);
            alert('Erro ao resolver entrada pendente');
        }
    };
    const handleRejectEntry = async () => {
        if (!selectedEntry || !rejectionReason.trim()) {
            alert('Por favor, forneça um motivo para rejeição');
            return;
        }
        try {
            // await dimensionService.rejectPendingEntry(selectedEntry.id, rejectionReason, 'current-user');
            // Update local state
            setPendingEntries(prev => prev.filter(e => e.id !== selectedEntry.id));
            // Notify parent
            onPendingRejected?.(selectedEntry.id, rejectionReason);
            // Reset form
            resetForm();
            alert(`${selectedEntry.type === 'curral' ? 'Curral' : 'Dieta'} "${selectedEntry.code}" rejeitado.`);
        }
        catch (error) {
            console.error('Erro ao rejeitar entrada pendente:', error);
            alert('Erro ao rejeitar entrada pendente');
        }
    };
    const resetForm = () => {
        setSelectedEntry(null);
        setResolveMode(null);
        setNewCurralName('');
        setNewDietaDescription('');
        setMapToExistingId('');
        setRejectionReason('');
    };
    const formatTimeAgo = (date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0) {
            return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
        }
        else if (diffHours > 0) {
            return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
        }
        else {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "flex items-center justify-center p-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-2", children: "Carregando entradas pendentes..." })] }));
    }
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Gerenciar Entradas Pendentes - Pipeline 04" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Resolva c\u00F3digos de curral e dieta n\u00E3o encontrados durante o processamento ETL" })] }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-6 flex items-center space-x-4", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Filtrar por tipo:" }), _jsxs("select", { value: filterType, onChange: (e) => setFilterType(e.target.value), className: "border border-gray-300 rounded px-3 py-1 text-sm", children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "curral", children: "Currais" }), _jsx("option", { value: "dieta", children: "Dietas" })] }), _jsxs("span", { className: "text-sm text-gray-500", children: [filteredEntries.length, " entrada", filteredEntries.length !== 1 ? 's' : '', " pendente", filteredEntries.length !== 1 ? 's' : ''] })] }), filteredEntries.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-gray-400 text-lg mb-2", children: "\uD83C\uDF89" }), _jsx("p", { className: "text-gray-600", children: "N\u00E3o h\u00E1 entradas pendentes para resolver!" })] })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: filteredEntries.map((entry) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors", children: [_jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${entry.type === 'curral'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-green-100 text-green-800'}`, children: entry.type === 'curral' ? '🏟️ Curral' : '🥗 Dieta' }), _jsx("span", { className: "text-xs text-gray-500", children: formatTimeAgo(entry.createdAt) })] }), _jsx("h3", { className: "font-medium text-gray-900 mt-2", children: entry.code }), _jsxs("p", { className: "text-sm text-gray-600", children: ["ID: ", entry.id.slice(-8)] })] }) }), _jsxs("div", { className: "mt-4 flex space-x-2", children: [_jsx("button", { onClick: () => {
                                                        setSelectedEntry(entry);
                                                        setResolveMode('create');
                                                    }, className: "flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700", children: "Criar Novo" }), _jsx("button", { onClick: () => {
                                                        setSelectedEntry(entry);
                                                        setResolveMode('map');
                                                    }, className: "flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700", children: "Mapear" }), _jsx("button", { onClick: () => {
                                                        setSelectedEntry(entry);
                                                        setResolveMode(null);
                                                    }, className: "bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700", children: "Rejeitar" })] })] }, entry.id))) }))] })] }), selectedEntry && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsxs("h3", { className: "text-lg font-semibold", children: [resolveMode === 'create' && `Criar Novo ${selectedEntry.type === 'curral' ? 'Curral' : 'Dieta'}`, resolveMode === 'map' && `Mapear ${selectedEntry.type === 'curral' ? 'Curral' : 'Dieta'}`, !resolveMode && `Rejeitar ${selectedEntry.type === 'curral' ? 'Curral' : 'Dieta'}`] }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["C\u00F3digo: ", _jsx("strong", { children: selectedEntry.code })] })] }), _jsxs("div", { className: "p-6", children: [resolveMode === 'create' && (_jsx("div", { children: selectedEntry.type === 'curral' ? (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nome do Curral:" }), _jsx("input", { type: "text", value: newCurralName, onChange: (e) => setNewCurralName(e.target.value), placeholder: "Ex: Curral 999 - Setor Norte", className: "w-full border border-gray-300 rounded px-3 py-2" }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["C\u00F3digo: ", selectedEntry.code, " | Nome: ", newCurralName || '(vazio)'] })] })) : (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Descri\u00E7\u00E3o da Dieta:" }), _jsx("textarea", { value: newDietaDescription, onChange: (e) => setNewDietaDescription(e.target.value), placeholder: "Ex: Dieta especial para engorda com alta prote\u00EDna", className: "w-full border border-gray-300 rounded px-3 py-2 h-20" }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Nome: ", selectedEntry.code] })] })) })), resolveMode === 'map' && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["ID da ", selectedEntry.type === 'curral' ? 'Curral' : 'Dieta', " Existente:"] }), _jsx("input", { type: "text", value: mapToExistingId, onChange: (e) => setMapToExistingId(e.target.value), placeholder: "Ex: dim_curral_123 ou dim_dieta_456", className: "w-full border border-gray-300 rounded px-3 py-2" }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Mapear \"", selectedEntry.code, "\" para ID existente"] })] })), !resolveMode && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Motivo da Rejei\u00E7\u00E3o:" }), _jsx("textarea", { value: rejectionReason, onChange: (e) => setRejectionReason(e.target.value), placeholder: "Ex: C\u00F3digo incorreto, duplicata, n\u00E3o utilizamos mais", className: "w-full border border-gray-300 rounded px-3 py-2 h-20" })] }))] }), _jsxs("div", { className: "px-6 py-4 border-t border-gray-200 flex justify-end space-x-3", children: [_jsx("button", { onClick: resetForm, className: "px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50", children: "Cancelar" }), resolveMode ? (_jsx("button", { onClick: () => handleResolveEntry(resolveMode), className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", children: resolveMode === 'create' ? 'Criar e Resolver' : 'Mapear e Resolver' })) : (_jsx("button", { onClick: handleRejectEntry, className: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700", children: "Rejeitar" }))] })] }) }))] }));
};
