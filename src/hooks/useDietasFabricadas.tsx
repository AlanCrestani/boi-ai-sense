import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChartDataDieta {
  data: string;
  dia: string;
  [key: string]: string | number;
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

  // Normalizar nome da dieta (remover números e espaços extras)
  const dietaNormalizada = dieta.toLowerCase()
    .replace(/\s+\d{6}$/, '') // Remove códigos numéricos do final
    .replace(/\s+/g, ' ')
    .trim();

  // Procurar por palavras-chave na dieta
  for (const [key, color] of Object.entries(dietaColors)) {
    if (dietaNormalizada.includes(key)) {
      return color;
    }
  }

  return FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length]; // Cor de fallback se não encontrar match
};

export const useDietasFabricadas = (days: number = 14) => {
  const { organization } = useAuth();

  const query = useQuery({
    queryKey: ['dietas-fabricadas', organization?.id, days],
    queryFn: async () => {
      console.log('useDietasFabricadas - Iniciando queryFn');

      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useDietasFabricadas - Usando orgId:', orgId);

      // Buscar a data mais recente disponível
      const { data: latestDateData, error: latestDateError } = await supabase
        .from('fato_carregamento')
        .select('data')
        .eq('organization_id', orgId)
        .order('data', { ascending: false })
        .limit(1);

      if (latestDateError) throw latestDateError;
      if (!latestDateData || latestDateData.length === 0) {
        return [];
      }

      const latestDate = new Date(latestDateData[0].data);

      // Calcular a data de início (últimos X dias)
      const startDate = new Date(latestDate);
      startDate.setDate(startDate.getDate() - (days - 1));

      // Formatar as datas para o filtro
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = latestDate.toISOString().split('T')[0];

      // Buscar dados de carregamento dos últimos dias
      const { data: rawData, error: rawError } = await supabase
        .from('fato_carregamento')
        .select('data, dieta, realizado_kg')
        .eq('organization_id', orgId)
        .gte('data', startDateStr)
        .lte('data', endDateStr)
        .not('dieta', 'is', null)
        .not('realizado_kg', 'is', null)
        .order('data', { ascending: true })
        .order('dieta', { ascending: true });

      if (rawError) throw rawError;

      if (!rawData || rawData.length === 0) {
        return [];
      }

      // Agrupar dados por data e dieta
      const dataMap: Record<string, Record<string, number>> = {};
      const dietasSet = new Set<string>();

      rawData.forEach(item => {
        const data = item.data;
        const dieta = item.dieta.replace(/\s+\d{6}$/, ''); // Remove códigos numéricos
        const realizado = item.realizado_kg || 0;

        dietasSet.add(dieta);

        if (!dataMap[data]) {
          dataMap[data] = {};
        }

        if (!dataMap[data][dieta]) {
          dataMap[data][dieta] = 0;
        }

        dataMap[data][dieta] += realizado;
      });

      // Converter para array ordenado
      const chartData: ChartDataDieta[] = Object.entries(dataMap)
        .map(([data, dietas]) => {
          const dateObj = new Date(data + 'T00:00:00');
          const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          const dia = dias[dateObj.getDay()];

          const item: ChartDataDieta = {
            data,
            dia
          };

          // Adicionar cada dieta como propriedade do objeto
          Array.from(dietasSet).forEach(dieta => {
            item[dieta] = Math.round((dietas[dieta] || 0) * 100) / 100;
          });

          return item;
        })
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      console.log('useDietasFabricadas - Dietas encontradas:', Array.from(dietasSet));
      console.log('useDietasFabricadas - Dados processados:', chartData.length);

      return {
        chartData,
        dietas: Array.from(dietasSet).sort(),
        dietasColors: Array.from(dietasSet).reduce((acc, dieta, index) => {
          acc[dieta] = getDietaColor(dieta, index);
          return acc;
        }, {} as Record<string, string>)
      };
    },
    enabled: true,
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });

  return {
    ...query,
    chartData: query.data?.chartData || [],
    dietas: query.data?.dietas || [],
    dietasColors: query.data?.dietasColors || {}
  };
};