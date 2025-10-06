import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMateriaSecaDataView } from '@/hooks/useMateriaSecaDataView';
import { useEscoresCocho } from '@/hooks/useEscoresCocho';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Função para determinar a cor baseada no status da view
const getBarColorFromStatus = (status: string) => {
  switch (status) {
    case 'verde':
      return '#22C55E'; // Verde - até 2%
    case 'amarelo':
      return '#EAB308'; // Amarelo - 2% a 5%
    case 'vermelho':
      return '#EF4444'; // Vermelho - 5% a 10%
    case 'preto':
      return '#7F1D1D'; // Vermelho muito escuro - acima de 10%
    case 'cinza':
      return '#9CA3AF'; // Cinza - previsto = 0
    default:
      return '#3B82F6'; // Azul padrão
  }
};

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-xl">
        <p className="font-bold mb-3 text-gray-900 text-base">{`${label} (${data?.data})`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{
                backgroundColor: entry.dataKey === 'previsto' ? '#3B82F6' : entry.fill,
              }}
            />
            <span className="text-sm font-semibold text-gray-900">
              {entry.dataKey === 'previsto' ? 'Previsto' : 'Realizado'}:{' '}
              <span className="font-bold">{entry.value.toFixed(2)} kg</span>
            </span>
          </div>
        ))}
        {data && (
          <>
            <div className="mt-3 pt-3 border-t-2 border-gray-200 text-sm font-medium space-y-1">
              <div className="text-gray-900">
                Desvio Absoluto:{' '}
                <span className="font-bold text-orange-600">
                  {data.desvio_kg_abs.toFixed(2)} kg
                </span>
              </div>
              <div className="text-gray-900">
                Desvio %:{' '}
                <span className="font-bold text-purple-600">{data.desvio_abs_pc.toFixed(1)}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
  return null;
};

// Componente customizado para renderizar label de escore no eixo X
const CustomXAxisTick = ({ x, y, payload, index, data }: any) => {
  // Usar o índice para pegar o item correto, não buscar pelo nome do dia
  const dataItem = data[index];
  const escore = dataItem?.escore;

  // Determinar cor do retângulo baseado no escore
  const getEscoreColor = (score: number) => {
    if (score === 1) return '#22C55E'; // Verde
    if (score === 0 || score === 2) return '#EAB308'; // Amarelo
    if (score === -2 || score === -1 || score === 3 || score === 4) return '#EF4444'; // Vermelho
    return '#D1D5DB'; // Cinza padrão
  };

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Label do dia da semana */}
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
        {payload.value}
      </text>
      {/* Retângulo com escore */}
      {escore !== undefined && escore !== null && (
        <g>
          <rect
            x={-16}
            y={26}
            width={32}
            height={18}
            rx={4}
            ry={4}
            fill={getEscoreColor(escore)}
            opacity={0.9}
          />
          <text
            x={0}
            y={35}
            dy={0}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={12}
            fontWeight="700"
            dominantBaseline="central"
          >
            {escore.toFixed(1)}
          </text>
        </g>
      )}
    </g>
  );
};

interface DadosConsumo {
  data: string;
  dia: string;
  previsto: number;
  realizado: number;
  desvio_kg_abs: number;
  desvio_abs_pc: number;
  escore: number;
  status: string;
  media_movel_4_dias: number;
}

interface MateriaSecaChartProps {
  onMetricsChange?: (metrics: {
    qtd_animais: number;
    peso_estimado_kg: number;
    cms_realizado_pcpv: number;
    dias_confinados: number;
  } | null) => void;
  onDataChange?: (data: { dados: DadosConsumo[]; curralLote: string } | null) => void;
}

export const MateriaSecaChart = ({ onMetricsChange, onDataChange }: MateriaSecaChartProps = {}) => {
  const { currentData, currentIndex, total, next, prev, isLoading, error } =
    useMateriaSecaDataView();
  const { escores } = useEscoresCocho();
  const [isMobile, setIsMobile] = useState(false);
  const [escoreSelecionado, setEscoreSelecionado] = useState<number | null>(null);
  const [ajusteAplicado, setAjusteAplicado] = useState<number>(0);
  const [mostrarMediaMovel, setMostrarMediaMovel] = useState(false);
  const [tooltipHabilitado, setTooltipHabilitado] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset escore selecionado quando mudar de curral/lote
  useEffect(() => {
    setEscoreSelecionado(null);
    setAjusteAplicado(0);
  }, [currentIndex]);

  // Notificar mudança de métricas e dados quando currentData mudar
  useEffect(() => {
    if (currentData && currentData.dados.length > 0) {
      // Buscar o último dia que tem cms_realizado_pcpv > 0 (dados válidos)
      const lastDayWithData = [...currentData.dados]
        .reverse()
        .find(d => d.cms_realizado_pcpv && d.cms_realizado_pcpv > 0);

      // Se não encontrar, usar o último dia mesmo
      const lastDayData = lastDayWithData || currentData.dados[currentData.dados.length - 1];

      // Notificar métricas
      if (onMetricsChange) {
        onMetricsChange({
          qtd_animais: lastDayData.qtd_animais || 0,
          peso_estimado_kg: lastDayData.peso_estimado_kg || 0,
          cms_realizado_pcpv: lastDayData.cms_realizado_pcpv || 0,
          dias_confinados: lastDayData.dias_confinados || 0,
        });
      }

      // Notificar dados completos para estatísticas
      if (onDataChange) {
        onDataChange({
          dados: currentData.dados,
          curralLote: currentData.curral_lote
        });
      }
    } else {
      if (onMetricsChange) onMetricsChange(null);
      if (onDataChange) onDataChange(null);
    }
  }, [currentData, onMetricsChange, onDataChange]);

  // Função para aplicar escore
  const handleEscoreClick = (escore: number) => {
    const escoreConfig = escores.find((e: any) => e.escore === escore);
    if (escoreConfig) {
      setEscoreSelecionado(escore);
      setAjusteAplicado(escoreConfig.ajuste_kg);
    }
  };

  // Calcular o período dos dados
  const getPeriodDescription = () => {
    if (!currentData || !currentData.dados || currentData.dados.length === 0) return '';

    const dates = currentData.dados.map((item: any) => new Date(item.data + 'T00:00:00'));
    dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    return `${formatDate(firstDate)} a ${formatDate(lastDate)}`;
  };

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Consumo de Matéria Seca</CardTitle>
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
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Consumo de Matéria Seca</CardTitle>
          <CardDescription>Erro ao carregar dados</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar os dados do consumo de matéria seca. Por favor, tente
              novamente mais tarde.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!currentData || total === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Consumo de Matéria Seca</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não há dados de consumo de matéria seca disponíveis para os últimos 14 dias.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Adicionar cores aos dados e aplicar ajuste de escore
  const dataWithColors = currentData.dados.map((item: any, index: number) => {
    const isLastDay = index === currentData.dados.length - 1;
    const realizadoAjustado =
      isLastDay && escoreSelecionado !== null ? item.previsto + ajusteAplicado : item.realizado;

    // Recalcular status se houver ajuste aplicado
    let status = item.status;
    if (isLastDay && escoreSelecionado !== null) {
      const desvioAbs = Math.abs(realizadoAjustado - item.previsto);
      const desvioPerc = item.previsto > 0 ? (desvioAbs / item.previsto) * 100 : 0;

      if (item.previsto === 0) status = 'cinza';
      else if (desvioPerc <= 2) status = 'verde';
      else if (desvioPerc <= 5) status = 'amarelo';
      else if (desvioPerc <= 10) status = 'vermelho';
      else status = 'preto';
    }

    return {
      ...item,
      realizado: realizadoAjustado,
      realizadoOriginal: item.realizado,
      realizadoColor: getBarColorFromStatus(status),
      isLastDay,
    };
  });

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Consumo de Matéria Seca - {currentData.curral_lote} - Últimos 14 Dias
              </CardTitle>
              <CardDescription>
                Previsto vs Realizado (kg/animal) - {getPeriodDescription()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                disabled={total <= 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {total}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={next}
                disabled={total <= 1}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Seletor de Escores */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Selecione a nota de leitura de cocho (ajuste para hoje):
              </span>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    id="media-movel"
                    checked={mostrarMediaMovel}
                    onCheckedChange={setMostrarMediaMovel}
                  />
                  <Label htmlFor="media-movel" className="text-sm cursor-pointer">
                    Mostrar média móvel 4 dias
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="tooltip"
                    checked={tooltipHabilitado}
                    onCheckedChange={setTooltipHabilitado}
                  />
                  <Label htmlFor="tooltip" className="text-sm cursor-pointer">
                    Mostrar detalhes ao passar o mouse
                  </Label>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {escores.map((escore: any) => (
                <Badge
                  key={escore.id}
                  variant={escoreSelecionado === escore.escore ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/90 transition-colors px-3 py-1"
                  onClick={() => handleEscoreClick(escore.escore)}
                >
                  Nota {escore.escore}: {escore.ajuste_kg > 0 ? '+' : ''}
                  {escore.ajuste_kg.toFixed(3)} kg
                </Badge>
              ))}
              {escoreSelecionado !== null && (
                <Badge
                  variant="destructive"
                  className="cursor-pointer px-3 py-1"
                  onClick={() => {
                    setEscoreSelecionado(null);
                    setAjusteAplicado(0);
                  }}
                >
                  Limpar
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground min-h-[20px]">
              {escoreSelecionado !== null && (
                <>
                  Ajuste aplicado: {ajusteAplicado > 0 ? '+' : ''}
                  {ajusteAplicado.toFixed(3)} kg para o dia de hoje
                </>
              )}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart
            data={dataWithColors}
            margin={
              isMobile
                ? {
                    top: 10,
                    right: 5,
                    left: 0,
                    bottom: 30,
                  }
                : {
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 30,
                  }
            }
            barCategoryGap={isMobile ? '15%' : '10%'}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="dia"
              tick={<CustomXAxisTick data={dataWithColors} />}
              height={70}
            />
            <YAxis
              label={
                !isMobile
                  ? {
                      value: 'CMS (Kg/dia)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 0,
                      style: { textAnchor: 'middle' },
                    }
                  : undefined
              }
              domain={[0, 14]}
            />
            {tooltipHabilitado && <Tooltip content={<CustomTooltip />} />}
            <Bar dataKey="previsto" fill="#3B82F6" name="Previsto" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realizado" name="Realizado" radius={[4, 4, 0, 0]}>
              {dataWithColors.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.realizadoColor} />
              ))}
            </Bar>
            {mostrarMediaMovel && (
              <Line
                type="monotone"
                dataKey="media_movel_4_dias"
                stroke="#FF6B6B"
                strokeWidth={2}
                dot={false}
                name="Média Móvel 4 dias"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        {!isMobile && (
          <div className="mt-4 flex justify-center gap-4 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Previsto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Desvio até 3%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Desvio 3% a 7%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Desvio 7% a 10%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-900 rounded"></div>
              <span>Desvio &gt; 10%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
