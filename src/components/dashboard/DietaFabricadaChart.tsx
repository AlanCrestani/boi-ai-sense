import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDietasFabricadas } from '@/hooks/useDietasFabricadas';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentual = ((data.value / data.payload.total) * 100).toFixed(1);

    return (
      <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-xl min-w-[200px]">
        <p className="font-bold mb-3 text-gray-900 text-base border-b pb-2">
          {data.payload.dieta}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Quantidade:</span>
            <span className="font-bold text-blue-600 text-base">
              {data.value.toLocaleString('pt-BR')} kg
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Carregamentos:</span>
            <span className="font-bold text-green-600">
              {data.payload.numCarregamentos}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium text-gray-700">Participação:</span>
            <span className="font-bold text-purple-600 text-lg">
              {percentual}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DietaFabricadaChart = () => {
  const { data: result, isLoading, error } = useDietasFabricadas();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dietas Fabricadas</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle>Dietas Fabricadas</CardTitle>
          <CardDescription>
            Erro ao carregar dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar os dados das dietas fabricadas.
              Por favor, tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!result || !result.data || result.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dietas Fabricadas</CardTitle>
          <CardDescription>
            Nenhum dado disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não há dados de dietas fabricadas disponíveis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { data, dataReferencia } = result;

  // Calcular total para percentuais
  const totalKg = data.reduce((sum, item) => sum + item.totalRealizado, 0);
  const dataWithTotal = data.map(item => ({
    ...item,
    total: totalKg,
    name: item.dieta,
    value: item.totalRealizado
  }));

  // Formatar data de referência
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dietas Fabricadas</CardTitle>
        <CardDescription>
          Distribuição por tipo de dieta (kg) - {formatDate(dataReferencia)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) =>
                `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithTotal.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legenda personalizada com totais */}
        <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
          {data.map((item, index) => (
            <div key={item.dieta} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate font-medium">
                  {item.dieta}
                </span>
              </div>
              <span className="text-gray-600">
                {item.totalRealizado.toLocaleString('pt-BR')} kg
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t text-center">
          <p className="text-lg font-semibold text-gray-700">
            Total: {totalKg.toLocaleString('pt-BR')} kg
          </p>
        </div>
      </CardContent>
    </Card>
  );
};