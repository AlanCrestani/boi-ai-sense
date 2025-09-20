/**
 * UI Component for Managing Pending Entries - Pipeline 04
 * Allows manual registration and resolution of pending curral/dieta entries
 */

import React, { useState, useEffect } from 'react';

export interface PendingEntry {
  id: string;
  type: 'curral' | 'dieta';
  code: string;
  organizationId: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolvedValue?: string;
  notes?: string;
}

export interface PendingEntriesManagerProps {
  organizationId: string;
  onPendingResolved?: (pendingId: string, resolvedValue: string) => void;
  onPendingRejected?: (pendingId: string, reason: string) => void;
}

export interface DimensionService {
  getPendingEntries(organizationId: string): Promise<PendingEntry[]>;
  resolvePendingEntry(pendingId: string, resolvedValue: string, resolvedBy: string): Promise<void>;
  rejectPendingEntry(pendingId: string, reason: string, rejectedBy: string): Promise<void>;
  createCurral(codigo: string, nome: string, organizationId: string): Promise<string>;
  createDieta(nome: string, descricao: string, organizationId: string): Promise<string>;
}

export const PendingEntriesManager: React.FC<PendingEntriesManagerProps> = ({
  organizationId,
  onPendingResolved,
  onPendingRejected,
}) => {
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<PendingEntry | null>(null);
  const [resolveMode, setResolveMode] = useState<'create' | 'map' | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'curral' | 'dieta'>('all');

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
      const mockEntries: PendingEntry[] = [
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
    } catch (error) {
      console.error('Erro ao carregar entradas pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = pendingEntries.filter(entry => {
    if (filterType === 'all') return true;
    return entry.type === filterType;
  });

  const handleResolveEntry = async (mode: 'create' | 'map') => {
    if (!selectedEntry) return;

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
        } else {
          // Create new dieta
          if (!newDietaDescription.trim()) {
            alert('Por favor, forneça uma descrição para a dieta');
            return;
          }
          // resolvedValue = await dimensionService.createDieta(selectedEntry.code, newDietaDescription, organizationId);
          resolvedValue = `new-dieta-${Date.now()}`; // Mock
        }
      } else {
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
    } catch (error) {
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
    } catch (error) {
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando entradas pendentes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Gerenciar Entradas Pendentes - Pipeline 04
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Resolva códigos de curral e dieta não encontrados durante o processamento ETL
          </p>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filtrar por tipo:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'curral' | 'dieta')}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">Todos</option>
              <option value="curral">Currais</option>
              <option value="dieta">Dietas</option>
            </select>
            <span className="text-sm text-gray-500">
              {filteredEntries.length} entrada{filteredEntries.length !== 1 ? 's' : ''} pendente{filteredEntries.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Pending Entries List */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">🎉</div>
              <p className="text-gray-600">Não há entradas pendentes para resolver!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          entry.type === 'curral'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {entry.type === 'curral' ? '🏟️ Curral' : '🥗 Dieta'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(entry.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mt-2">{entry.code}</h3>
                      <p className="text-sm text-gray-600">ID: {entry.id.slice(-8)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setResolveMode('create');
                      }}
                      className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Criar Novo
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setResolveMode('map');
                      }}
                      className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      Mapear
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setResolveMode(null);
                      }}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {resolveMode === 'create' && `Criar Novo ${selectedEntry.type === 'curral' ? 'Curral' : 'Dieta'}`}
                {resolveMode === 'map' && `Mapear ${selectedEntry.type === 'curral' ? 'Curral' : 'Dieta'}`}
                {!resolveMode && `Rejeitar ${selectedEntry.type === 'curral' ? 'Curral' : 'Dieta'}`}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Código: <strong>{selectedEntry.code}</strong>
              </p>
            </div>

            <div className="p-6">
              {resolveMode === 'create' && (
                <div>
                  {selectedEntry.type === 'curral' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Curral:
                      </label>
                      <input
                        type="text"
                        value={newCurralName}
                        onChange={(e) => setNewCurralName(e.target.value)}
                        placeholder="Ex: Curral 999 - Setor Norte"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Código: {selectedEntry.code} | Nome: {newCurralName || '(vazio)'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição da Dieta:
                      </label>
                      <textarea
                        value={newDietaDescription}
                        onChange={(e) => setNewDietaDescription(e.target.value)}
                        placeholder="Ex: Dieta especial para engorda com alta proteína"
                        className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Nome: {selectedEntry.code}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {resolveMode === 'map' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID da {selectedEntry.type === 'curral' ? 'Curral' : 'Dieta'} Existente:
                  </label>
                  <input
                    type="text"
                    value={mapToExistingId}
                    onChange={(e) => setMapToExistingId(e.target.value)}
                    placeholder="Ex: dim_curral_123 ou dim_dieta_456"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mapear "{selectedEntry.code}" para ID existente
                  </p>
                </div>
              )}

              {!resolveMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Rejeição:
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: Código incorreto, duplicata, não utilizamos mais"
                    className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              {resolveMode ? (
                <button
                  onClick={() => handleResolveEntry(resolveMode)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {resolveMode === 'create' ? 'Criar e Resolver' : 'Mapear e Resolver'}
                </button>
              ) : (
                <button
                  onClick={handleRejectEntry}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Rejeitar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};