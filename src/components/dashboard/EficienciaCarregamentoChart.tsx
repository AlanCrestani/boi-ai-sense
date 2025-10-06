import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEficienciaCarregamento } from '@/hooks/useEficienciaCarregamento';
import { useVagoes } from '@/hooks/useVagoes';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-xl min-w-[250px]">
        <p className="font-bold mb-3 text-gray-900 text-base border-b pb-2">
          Carregamento #{label}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Vagão:</span>
            <span className="font-bold text-purple-600">
              {data.vagao || 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Dieta:</span>
            <span className="font-bold" style={{ color: data.color }}>
              {data.dieta ? data.dieta.replace(/\s+\d{6}$/, '') : 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Previsto:</span>
            <span className="font-bold text-blue-600">
              {data.previsto.toLocaleString('pt-BR')} kg
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Realizado:</span>
            <span className="font-bold text-green-600">
              {data.realizado.toLocaleString('pt-BR')} kg
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium text-gray-700">Eficiência:</span>
            <span
              className={`font-bold text-lg ${
                data.eficiencia >= 100
                  ? 'text-green-600'
                  : data.eficiencia >= 95
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {data.eficiencia}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const EficienciaCarregamentoChart = () => {
  const [selectedVagao, setSelectedVagao] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 7;

  const { data: result, isLoading, error } = useEficienciaCarregamento({
    vagaoFilter: selectedVagao === 'all' ? undefined : selectedVagao
  });
  const { data: vagoes, isLoading: isLoadingVagoes } = useVagoes();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset page when data or filter changes - moved here before conditionals
  useEffect(() => {
    if (result && 'data' in result && result.data) {
      setCurrentPage(0);
    }
  }, [result, selectedVagao]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eficiência por Carregamento</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eficiência por Carregamento</CardTitle>
          <CardDescription>Erro ao carregar dados</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar os dados de eficiência. Por favor, tente novamente mais
              tarde.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!result || !('data' in result) || !result.data || result.data.length === 0) {
    const noDataMessage = selectedVagao !== 'all'
      ? "Não há dados para esse Vagão hoje!"
      : "Não há dados de eficiência disponíveis.";

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Eficiência por Carregamento</CardTitle>
            {/* Filtro por Vagão - Desktop */}
            <div className="hidden sm:block w-48">
              <Select value={selectedVagao} onValueChange={setSelectedVagao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os vagões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vagões</SelectItem>
                  {isLoadingVagoes ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : (
                    vagoes?.map((vagao) => (
                      <SelectItem key={vagao.id} value={vagao.codigo}>
                        Vagão {vagao.codigo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>Nenhum dado disponível</CardDescription>

          {/* Filtro por Vagão - Mobile */}
          <div className="sm:hidden mt-4">
            <Select value={selectedVagao} onValueChange={setSelectedVagao}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os vagões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vagões</SelectItem>
                {isLoadingVagoes ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : (
                  vagoes?.map((vagao) => (
                    <SelectItem key={vagao.id} value={vagao.codigo}>
                      Vagão {vagao.codigo}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{noDataMessage}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { data, dataReferencia } = result as { data: any[]; dataReferencia: string };

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  const displayedData = data.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Formatar data de referência
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Eficiência por Carregamento</CardTitle>
          {/* Filtro por Vagão - Desktop */}
          <div className="hidden sm:block w-48">
            <Select value={selectedVagao} onValueChange={setSelectedVagao}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os vagões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vagões</SelectItem>
                {isLoadingVagoes ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : (
                  vagoes?.map((vagao) => (
                    <SelectItem key={vagao.id} value={vagao.codigo}>
                      Vagão {vagao.codigo}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          Relação Realizado x Previsto (%) - {formatDate(dataReferencia)}
        </CardDescription>

        {/* Filtro por Vagão - Mobile */}
        <div className="sm:hidden mt-4">
          <Select value={selectedVagao} onValueChange={setSelectedVagao}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os vagões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os vagões</SelectItem>
              {isLoadingVagoes ? (
                <SelectItem value="loading" disabled>Carregando...</SelectItem>
              ) : (
                vagoes?.map((vagao) => (
                  <SelectItem key={vagao.id} value={vagao.codigo}>
                    Vagão {vagao.codigo}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {!isMobile && "Anterior"}
          </Button>

          <span className="text-sm text-gray-600">
            {startIndex + 1} - {endIndex} de {data.length} carregamentos
            <br />
            <span className="text-xs">Página {currentPage + 1} de {totalPages}</span>
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1"
          >
            {!isMobile && "Próximo"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={displayedData} margin={isMobile ? { top: 5, right: 5, left: 0, bottom: 15 } : { top: 5, right: 30, left: 30, bottom: 25 }} barCategoryGap={isMobile ? "20%" : "10%"}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="nroCarregamento"
              label={!isMobile ? { value: 'Nº Carregamento', position: 'insideBottom', offset: -5 } : undefined}
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <YAxis
              label={!isMobile ? {
                value: 'Eficiência (%)',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                style: { textAnchor: 'middle' },
              } : undefined}
              domain={[95, 105]}
              ticks={[95, 97.5, 100, 102.5, 105]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Linha de referência 100% */}
            <ReferenceLine
              y={100}
              stroke="green"
              strokeDasharray="5 5"
              label={{ value: 'Meta 100%', position: 'right' }}
            />

            {/* Linha de referência 95% */}
            <ReferenceLine
              y={95}
              stroke="orange"
              strokeDasharray="3 3"
              label={{ value: 'Mínimo 95%', position: 'right' }}
            />

            <Bar dataKey="eficiencia" radius={[4, 4, 0, 0]}>
              {displayedData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda de cores das dietas - Oculta no mobile */}
        {!isMobile && (
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-4 justify-center text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4CC9A7' }} />
              <span className="text-gray-600">Adaptação</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F4C542' }} />
              <span className="text-gray-600">Crescimento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E74C3C' }} />
              <span className="text-gray-600">Terminação</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3A7DFF' }} />
              <span className="text-gray-600">Recria</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F28C3C' }} />
              <span className="text-gray-600">Pré-mistura</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2E7D6A' }} />
              <span className="text-gray-600">Proteinado 0.3%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
