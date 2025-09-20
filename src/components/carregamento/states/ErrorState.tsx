import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, Database, AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  type?: 'connection' | 'validation' | 'database' | 'general';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  type = 'general'
}) => {
  const getErrorDetails = () => {
    const errorMessage = typeof error === 'string' ? error : error.message;

    switch (type) {
      case 'connection':
        return {
          icon: <Wifi className="h-12 w-12 text-red-500" />,
          title: 'Erro de Conexão',
          message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
          suggestion: 'Tente novamente em alguns instantes ou verifique sua conexão de rede.'
        };
      case 'validation':
        return {
          icon: <AlertCircle className="h-12 w-12 text-orange-500" />,
          title: 'Erro de Validação',
          message: errorMessage || 'Os dados fornecidos não são válidos.',
          suggestion: 'Verifique os filtros aplicados e tente novamente.'
        };
      case 'database':
        return {
          icon: <Database className="h-12 w-12 text-red-500" />,
          title: 'Erro no Banco de Dados',
          message: 'Erro ao acessar os dados do sistema.',
          suggestion: 'Este problema pode ser temporário. Tente novamente.'
        };
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
          title: 'Erro Inesperado',
          message: errorMessage || 'Ocorreu um erro inesperado.',
          suggestion: 'Tente recarregar a página ou entre em contato com o suporte.'
        };
    }
  };

  const { icon, title, message, suggestion } = getErrorDetails();

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {icon}
          </div>
          <CardTitle className="text-xl text-text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-text-secondary">{message}</p>
          <p className="text-sm text-text-muted">{suggestion}</p>

          {onRetry && (
            <Button
              onClick={onRetry}
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};