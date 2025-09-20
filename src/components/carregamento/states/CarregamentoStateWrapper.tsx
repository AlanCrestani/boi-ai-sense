import React from 'react';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

interface CarregamentoStateWrapperProps {
  isLoading: boolean;
  error: Error | null;
  data: any[] | null;
  loadingType?: 'metrics' | 'charts' | 'filters';
  loadingCount?: number;
  errorType?: 'connection' | 'validation' | 'database' | 'general';
  emptyType?: 'no-data' | 'no-results' | 'no-uploads' | 'date-range';
  onRetry?: () => void;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  children: React.ReactNode;
  showEmptyWhenNoData?: boolean;
}

export const CarregamentoStateWrapper: React.FC<CarregamentoStateWrapperProps> = ({
  isLoading,
  error,
  data,
  loadingType = 'charts',
  loadingCount = 2,
  errorType = 'general',
  emptyType = 'no-data',
  onRetry,
  onEmptyAction,
  emptyActionLabel,
  children,
  showEmptyWhenNoData = true
}) => {
  // Estado de carregamento
  if (isLoading) {
    return (
      <LoadingState
        type={loadingType}
        count={loadingCount}
      />
    );
  }

  // Estado de erro
  if (error) {
    return (
      <ErrorState
        error={error}
        type={errorType}
        onRetry={onRetry}
      />
    );
  }

  // Estado vazio (quando não há dados)
  if (showEmptyWhenNoData && (!data || data.length === 0)) {
    return (
      <EmptyState
        type={emptyType}
        onAction={onEmptyAction}
        actionLabel={emptyActionLabel}
      />
    );
  }

  // Estado normal - renderizar conteúdo
  return <>{children}</>;
};