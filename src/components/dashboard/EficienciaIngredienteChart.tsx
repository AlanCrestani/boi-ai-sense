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
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-xl min-w-[250px]">
        <p className="font-bold mb-3 text-gray-900 text-base border-b pb-2">
          {label}
        </p>

        <div className="space-y-2">
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

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Diferença:</span>
            <span className={`font-bold ${
              data.realizado - data.previsto >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(data.realizado - data.previsto) > 0 ? '+' : ''}{(data.realizado - data.previsto).toFixed(2)} kg
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

export const EficienciaIngredienteChart = () => {
  const { data: result, isLoading, error } = useEficienciaIngrediente();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eficiência por Ingrediente</CardTitle>
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
          <CardTitle>Eficiência por Ingrediente</CardTitle>
          <CardDescription>Erro ao carregar dados</CardDescription>
        </CardHeader>
        <CardContent>
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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eficiência por Ingrediente</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Não há dados de eficiência por ingrediente disponíveis.</AlertDescription>
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
        <CardTitle>Eficiência por Ingrediente</CardTitle>
        <CardDescription>Realizado vs Previsto (%) - {formatDate(dataReferencia)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ingrediente"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              fontSize={11}
            />
            <YAxis
              label={{ value: 'Eficiência (%)', angle: -90, position: 'insideLeft' }}
              domain={[85, 115]}
              ticks={[85, 90, 95, 100, 105, 110, 115]}
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

        {/* Legenda simplificada */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFBB28' }} />
            <span className="text-gray-600">Milho</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#14B981' }} />
            <span className="text-gray-600">Soja</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF8042' }} />
            <span className="text-gray-600">Farelo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0088FE' }} />
            <span className="text-gray-600">Silagem</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8884d8' }} />
            <span className="text-gray-600">Outros</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};