import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMateriaSecaData } from '@/hooks/useMateriaSecaData';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Função para determinar a cor baseada na variação
const getBarColor = (variacao: number) => {
  if (variacao > 2) return '#F00F30'; // Vermelho - variação alta
  if (variacao < -2) return '#F00F30'; // Vermelho - variação baixa
  if (Math.abs(variacao) <= 0.5) return '#14B981'; // Verde - dentro da meta
  return '#F49E0D'; // Amarelo - variação média
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
                backgroundColor: entry.dataKey === 'previsto' ? '#3B82F6' : entry.fill
              }}
            />
            <span className="text-sm font-semibold text-gray-900">
              {entry.dataKey === 'previsto' ? 'Previsto' : 'Realizado'}: <span className="font-bold">{entry.value} kg/animal</span>
            </span>
          </div>
        ))}
        {data && (
          <>
            <div className="mt-3 pt-3 border-t-2 border-gray-200 text-sm font-medium">
              <div className="text-gray-900 mb-1">Total de animais: <span className="font-bold text-blue-600">{data.totalAnimais.toLocaleString('pt-BR')}</span></div>
              <div className="text-gray-900">
                Variação: <span className={`font-bold ${data.variacao > 0 ? 'text-green-600' : data.variacao < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {data.variacao > 0 ? '+' : ''}{data.variacao} kg ({data.variacaoPercentual > 0 ? '+' : ''}{data.variacaoPercentual}%)
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
  return null;
};

export const MateriaSecaChart = () => {
  const { data, isLoading, error } = useMateriaSecaData();

  // Calcular o período dos dados
  const getPeriodDescription = () => {
    if (!data || data.length === 0) return '';
    const firstDate = new Date(data[0].data);
    const lastDate = new Date(data[data.length - 1].data);
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
          <CardDescription>
            Carregando dados...
          </CardDescription>
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
          <CardDescription>
            Erro ao carregar dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar os dados do consumo de matéria seca.
              Por favor, tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Consumo de Matéria Seca</CardTitle>
          <CardDescription>
            Nenhum dado disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não há dados de consumo de matéria seca disponíveis para os últimos 7 dias.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Adicionar cores aos dados baseadas na variação
  const dataWithColors = data.map(item => ({
    ...item,
    realizadoColor: getBarColor(item.variacaoPercentual)
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Consumo de Matéria Seca</CardTitle>
        <CardDescription>
          Média Ponderada - Previsto vs Realizado (kg/animal) - {getPeriodDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={dataWithColors}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis
              label={{
                value: 'Consumo (kg/animal)',
                angle: -90,
                position: 'insideLeft'
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="previsto"
              fill="#3B82F6"
              name="Previsto"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="realizado"
              name="Realizado"
              radius={[4, 4, 0, 0]}
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.realizadoColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Dentro da meta (±0.5kg)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Variação média</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Variação alta (&gt;2kg)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};