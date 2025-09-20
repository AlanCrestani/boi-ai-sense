/**
 * UI Component for Managing Pending Entries - Pipeline 04
 * Allows manual registration and resolution of pending curral/dieta entries
 */
import React from 'react';
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
export declare const PendingEntriesManager: React.FC<PendingEntriesManagerProps>;
