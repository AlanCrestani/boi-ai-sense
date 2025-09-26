import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EficienciaCarregamento {
  nroCarregamento: string;
  dieta: string;
  previsto: number;
  realizado: number;
  eficiencia: number;
  color: string;
}

export const useEficienciaCarregamento = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['eficiencia-carregamento', organization?.id],
    queryFn: async () => {
      console.log('useEficienciaCarregamento - Iniciando queryFn');

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useEficienciaCarregamento - Usando orgId:', orgId);

      // Primeiro, buscar a data mais recente disponível
      const { data: latestDateData, error: latestDateError } = await supabase
        .from('fato_carregamento')
        .select('data')
        .eq('organization_id', orgId)
        .not('previsto_kg', 'is', null)
        .not('realizado_kg', 'is', null)
        .order('data', { ascending: false })
        .limit(1);

      if (latestDateError) throw latestDateError;
      if (!latestDateData || latestDateData.length === 0) {
        return [];
      }

      const latestDate = latestDateData[0].data;

      // Buscar os dados agregados do dia mais recente
      const { data, error } = await supabase
        .from('fato_carregamento')
        .select('nro_carregamento, dieta, previsto_kg, realizado_kg')
        .eq('organization_id', orgId)
        .eq('data', latestDate)
        .not('previsto_kg', 'is', null)
        .not('realizado_kg', 'is', null)
        .gt('previsto_kg', 0); // Apenas carregamentos com previsto > 0

      if (error) throw error;

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

      // Função para obter cor da dieta
      const getDietaColor = (dieta: string): string => {
        if (!dieta) return '#8884d8'; // Cor padrão

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

        return '#8884d8'; // Cor padrão se não encontrar match
      };

      // Agrupar por nro_carregamento
      const groupedData = data.reduce((acc: any, curr) => {
        const nroCarregamento = curr.nro_carregamento;
        if (!acc[nroCarregamento]) {
          acc[nroCarregamento] = {
            dieta: curr.dieta,
            totalPrevisto: 0,
            totalRealizado: 0
          };
        }
        acc[nroCarregamento].totalPrevisto += parseFloat(String(curr.previsto_kg || 0));
        acc[nroCarregamento].totalRealizado += parseFloat(String(curr.realizado_kg || 0));
        return acc;
      }, {});

      // Converter para o formato final e calcular eficiência
      const processedData: EficienciaCarregamento[] = Object.entries(groupedData)
        .map(([nroCarregamento, values]: [string, any]) => ({
          nroCarregamento,
          dieta: values.dieta,
          previsto: parseFloat(values.totalPrevisto.toFixed(2)),
          realizado: parseFloat(values.totalRealizado.toFixed(2)),
          eficiencia: parseFloat(((values.totalRealizado / values.totalPrevisto) * 100).toFixed(1)),
          color: getDietaColor(values.dieta)
        }))
        .sort((a, b) => {
          // Ordenar por número de carregamento (crescente)
          const numA = parseInt(a.nroCarregamento) || 0;
          const numB = parseInt(b.nroCarregamento) || 0;
          return numA - numB;
        })
        .slice(0, 20); // Limitar a 20 carregamentos para melhor visualização

      console.log('useEficienciaCarregamento - Dados processados:', processedData);
      console.log('useEficienciaCarregamento - Data de referência:', latestDate);

      return {
        data: processedData,
        dataReferencia: latestDate
      };
    },
    enabled: true,
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};