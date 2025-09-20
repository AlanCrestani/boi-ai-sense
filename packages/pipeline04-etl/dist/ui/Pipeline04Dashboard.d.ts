/**
 * Pipeline 04 ETL Dashboard Component
 * Provides overview and monitoring for feeding treatment data processing
 */
import React from 'react';
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
export declare const Pipeline04Dashboard: React.FC<Pipeline04DashboardProps>;
