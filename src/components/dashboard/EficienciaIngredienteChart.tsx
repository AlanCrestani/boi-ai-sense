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
import { useEficienciaIngrediente } from '@/hooks/useEficienciaIngrediente';
import { useVagoes } from '@/hooks/useVagoes';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-white p-3 sm:p-4 border-2 border-gray-200 rounded-lg shadow-xl min-w-[200px] sm:min-w-[250px] max-w-[280px] sm:max-w-none">
        <p className="font-bold mb-2 sm:mb-3 text-gray-900 text-sm sm:text-base border-b pb-2">
          {label}
        </p>

        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Previsto:</span>
            <span className="font-bold text-blue-600 text-xs sm:text-sm">
              {data.previsto.toLocaleString('pt-BR')} kg
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Realizado:</span>
            <span className="font-bold text-green-600 text-xs sm:text-sm">
              {data.realizado.toLocaleString('pt-BR')} kg
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Diferença:</span>
            <span className={`font-bold text-xs sm:text-sm ${
              data.realizado - data.previsto >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(data.realizado - data.previsto) > 0 ? '+' : ''}{(data.realizado - data.previsto).toFixed(2)} kg
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 sm:pt-2 border-t">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Eficiência:</span>
            <span
              className={`font-bold text-base sm:text-lg ${
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

export const EficienciaIngredienteChart = () => {
  const [selectedVagao, setSelectedVagao] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);
  const { data: result, isLoading, error } = useEficienciaIngrediente({
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eficiência por Ingrediente</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eficiência por Ingrediente</CardTitle>
          <CardDescription>Erro ao carregar dados</CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar os dados de eficiência por ingrediente.
              Por favor, tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!result || !('data' in result) || !result.data || result.data.length === 0) {
    const noDataMessage = selectedVagao !== 'all'
      ? "Não há dados para esse Vagão hoje!"
      : "Não há dados de eficiência por ingrediente disponíveis.";

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Eficiência por Ingrediente</CardTitle>
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
        <CardContent className="p-2 sm:p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{noDataMessage}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { data, dataReferencia } = result as { data: any[]; dataReferencia: string };

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
          <CardTitle className="text-lg sm:text-xl">Eficiência por Ingrediente</CardTitle>
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
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={isMobile ? { top: 5, right: 5, left: 0, bottom: 15 } : { top: 5, right: 10, left: 10, bottom: 25 }}
            barCategoryGap={isMobile ? "10%" : "10%"}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="abreviacao"
              angle={0}
              textAnchor="middle"
              height={50}
              interval={0}
              fontSize={10}
              tick={{ fontSize: 9 }}
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
              tick={{ fontSize: 10 }}
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
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda dinâmica com abreviações e nomes completos - Oculta no mobile */}
        {!isMobile && (
          <div className="mt-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 text-center">Legenda dos Ingredientes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-2 text-xs">
              {data.slice(0, 12).map((item, index) => (
                <div key={item.ingrediente} className="flex items-center gap-1 sm:gap-2 min-w-0">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span
                      className="font-medium text-xs"
                      style={{ color: item.color }}
                    >
                      {item.abreviacao}
                    </span>
                  </div>
                  <span className="text-gray-600 truncate text-xs">{item.ingrediente}</span>
                </div>
              ))}
            </div>
            {data.length > 12 && (
              <p className="text-xs text-gray-500 text-center mt-1 sm:mt-2">
                ... e mais {data.length - 12} ingredientes
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};