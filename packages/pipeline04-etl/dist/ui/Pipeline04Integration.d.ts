/**
 * Pipeline 04 Integration Component
 * Main integration point for Pipeline 04 ETL in the Conecta Boi app
 */
import React from 'react';
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
export declare const Pipeline04Integration: React.FC<Pipeline04IntegrationProps>;
