import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDietaResumo, getLatestAvailableDateDieta } from '@/hooks/useDietaResumo';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const percentual = ((item.value / item.payload.total) * 100).toFixed(1);

    return (
      <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-xl min-w-[200px]">
        <p className="font-bold mb-3 text-gray-900 text-base border-b pb-2">
          {item.payload.dieta}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Quantidade:</span>
            <span className="font-bold text-blue-600 text-base">
              {item.value.toLocaleString('pt-BR')} kg
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Carregamentos:</span>
            <span className="font-bold text-green-600">
              {item.payload.numCarregamentos}
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Buscar a data mais recente disponível
  useEffect(() => {
    const fetchLatestDate = async () => {
      const latestDate = await getLatestAvailableDateDieta('b7a05c98-9fc5-4aef-b92f-bfa0586bf495');
      setSelectedDate(latestDate);
    };
    fetchLatestDate();
  }, []);

  const { data: dietaData, loading: isLoading, error } = useDietaResumo({
    date: selectedDate,
    organizationId: 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495',
    enabled: !!selectedDate
  });

  // Buscar dados de carregamentos para cada dieta
  const [carregamentosData, setCarregamentosData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!selectedDate || !dietaData || dietaData.length === 0) return;

    const fetchCarregamentos = async () => {
      const formattedDate = selectedDate.toISOString().split('T')[0];

      const { data: carregamentos, error: carregamentosError } = await supabase
        .from('fato_carregamento')
        .select('dieta, id_carregamento')
        .eq('organization_id', 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495')
        .eq('data', formattedDate)
        .not('dieta', 'is', null);

      if (carregamentosError) {
        console.error('Erro ao buscar carregamentos:', carregamentosError);
        return;
      }

      // Contar carregamentos únicos por dieta
      const counts: Record<string, Set<string>> = {};
      carregamentos?.forEach(item => {
        if (!counts[item.dieta]) {
          counts[item.dieta] = new Set();
        }
        counts[item.dieta].add(item.id_carregamento);
      });

      // Converter para contagem final
      const finalCounts: Record<string, number> = {};
      Object.entries(counts).forEach(([dieta, ids]) => {
        finalCounts[dieta] = ids.size;
      });

      setCarregamentosData(finalCounts);
    };

    fetchCarregamentos();
  }, [selectedDate, dietaData]);

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

  if (!dietaData || dietaData.length === 0) {
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

  // Mapeamento de cores por tipo de dieta
  const dietaColors: Record<string, string> = {
    'adaptação': '#4CC9A7',
    'adaptacao': '#4CC9A7',
    'crescimento': '#F4C542',
    'terminação': '#E74C3C',
    'terminacao': '#E74C3C',
    'recria': '#3A7DFF',
    'pré-mistura': '#F28C3C',
    'pre-mistura': '#F28C3C',
    'premistura': '#F28C3C',
    'proteinado': '#2E7D6A',
    'proteinado 0.3%': '#2E7D6A'
  };

  const FALLBACK_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  // Função para obter cor da dieta
  const getDietaColor = (dieta: string, fallbackIndex: number = 0): string => {
    if (!dieta) return FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];

    const dietaNormalizada = dieta.toLowerCase()
      .replace(/\s+\d{6}$/, '') // Remove códigos numéricos do final
      .replace(/\s+/g, ' ')
      .trim();

    for (const [key, color] of Object.entries(dietaColors)) {
      if (dietaNormalizada.includes(key)) {
        return color;
      }
    }

    return FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
  };

  // Calcular total para percentuais
  const totalKg = dietaData.reduce((sum, item) => sum + item.realizado_kg, 0);
  const dataWithTotal = dietaData.map((item, index) => ({
    dieta: item.dieta,
    totalRealizado: item.realizado_kg,
    numCarregamentos: carregamentosData[item.dieta] || 0,
    total: totalKg,
    name: item.dieta,
    value: item.realizado_kg,
    color: getDietaColor(item.dieta, index)
  }));

  // Formatar data de referência
  const formatDate = (date: Date) => {
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
          Distribuição por tipo de dieta (kg) - {selectedDate ? formatDate(selectedDate) : 'Carregando...'}
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
          {dataWithTotal.map((item, index) => (
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