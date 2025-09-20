import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileX, Calendar, Filter, Upload, Settings } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'no-uploads' | 'date-range';
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  onAction,
  actionLabel
}) => {
  const getEmptyStateDetails = () => {
    switch (type) {
      case 'no-data':
        return {
          icon: <FileX className="h-16 w-16 text-gray-400" />,
          title: 'Nenhum Dado Disponível',
          message: 'Não há dados de carregamento no sistema.',
          suggestion: 'Faça o upload de arquivos CSV com dados de carregamento para visualizar os relatórios.',
          actionIcon: <Upload className="h-4 w-4 mr-2" />,
          defaultActionLabel: 'Fazer Upload de Dados'
        };
      case 'no-results':
        return {
          icon: <Filter className="h-16 w-16 text-gray-400" />,
          title: 'Nenhum Resultado Encontrado',
          message: 'Não há dados para os filtros aplicados.',
          suggestion: 'Tente ajustar os filtros de data ou limpar todos os filtros para ver mais resultados.',
          actionIcon: <Settings className="h-4 w-4 mr-2" />,
          defaultActionLabel: 'Limpar Filtros'
        };
      case 'no-uploads':
        return {
          icon: <Upload className="h-16 w-16 text-gray-400" />,
          title: 'Nenhum Arquivo Enviado',
          message: 'Ainda não há arquivos de carregamento no sistema.',
          suggestion: 'Comece enviando arquivos CSV com dados de desvios em carregamento.',
          actionIcon: <Upload className="h-4 w-4 mr-2" />,
          defaultActionLabel: 'Enviar Primeiro Arquivo'
        };
      case 'date-range':
        return {
          icon: <Calendar className="h-16 w-16 text-gray-400" />,
          title: 'Período Sem Dados',
          message: 'Não há dados de carregamento para o período selecionado.',
          suggestion: 'Tente selecionar um período diferente ou verificar se há dados disponíveis.',
          actionIcon: <Calendar className="h-4 w-4 mr-2" />,
          defaultActionLabel: 'Ajustar Período'
        };
      default:
        return {
          icon: <FileX className="h-16 w-16 text-gray-400" />,
          title: 'Sem Dados',
          message: 'Nenhum dado encontrado.',
          suggestion: 'Verifique os filtros ou tente novamente mais tarde.',
          actionIcon: <Settings className="h-4 w-4 mr-2" />,
          defaultActionLabel: 'Configurar'
        };
    }
  };

  const { icon, title, message, suggestion, actionIcon, defaultActionLabel } = getEmptyStateDetails();

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            {icon}
          </div>
          <CardTitle className="text-xl text-text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-text-secondary">{message}</p>
          <p className="text-sm text-text-muted">{suggestion}</p>

          {onAction && (
            <div className="pt-4">
              <Button
                onClick={onAction}
                className="mt-2"
                variant="default"
              >
                {actionIcon}
                {actionLabel || defaultActionLabel}
              </Button>
            </div>
          )}

          {/* Links de ajuda */}
          <div className="pt-4 border-t border-border-subtle">
            <p className="text-xs text-text-muted mb-2">Precisa de ajuda?</p>
            <div className="flex justify-center space-x-4 text-xs">
              <button className="text-blue-500 hover:text-blue-600 underline">
                Ver Documentação
              </button>
              <button className="text-blue-500 hover:text-blue-600 underline">
                Contatar Suporte
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};