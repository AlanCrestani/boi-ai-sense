import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EficienciaIngrediente {
  ingrediente: string;
  previsto: number;
  realizado: number;
  eficiencia: number;
  color: string;
}

export const useEficienciaIngrediente = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['eficiencia-ingrediente', organization?.id],
    queryFn: async () => {
      console.log('useEficienciaIngrediente - Iniciando queryFn');

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useEficienciaIngrediente - Usando orgId:', orgId);

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
        .select('ingrediente, previsto_kg, realizado_kg')
        .eq('organization_id', orgId)
        .eq('data', latestDate)
        .not('previsto_kg', 'is', null)
        .not('realizado_kg', 'is', null)
        .not('ingrediente', 'is', null)
        .gt('previsto_kg', 0); // Apenas ingredientes com previsto > 0

      if (error) throw error;

      // Cores para diferentes tipos de ingredientes
      const ingredienteColors: Record<string, string> = {
        'milho': '#FFBB28',
        'soja': '#14B981',
        'farelo': '#FF8042',
        'nucleo': '#8884d8',
        'mineral': '#82ca9d',
        'vitamina': '#ffc658',
        'sal': '#ff7c7c',
        'calcario': '#a4a4a4',
        'ureia': '#00C49F',
        'silagem': '#0088FE'
      };

      // Função para obter cor do ingrediente
      const getIngredienteColor = (ingrediente: string): string => {
        if (!ingrediente) return '#8884d8'; // Cor padrão

        // Normalizar nome do ingrediente
        const ingredienteNormalizado = ingrediente.toLowerCase()
          .replace(/[áàâã]/g, 'a')
          .replace(/[éèê]/g, 'e')
          .replace(/[íì]/g, 'i')
          .replace(/[óòôõ]/g, 'o')
          .replace(/[úù]/g, 'u')
          .replace(/[ç]/g, 'c');

        // Procurar por palavras-chave no ingrediente
        for (const [key, color] of Object.entries(ingredienteColors)) {
          if (ingredienteNormalizado.includes(key)) {
            return color;
          }
        }

        // Cores alternativas para outros ingredientes
        const hashCode = ingrediente.split('').reduce((acc, char) => {
          return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);

        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#00C49F', '#0088FE'];
        return colors[Math.abs(hashCode) % colors.length];
      };

      // Agrupar por ingrediente
      const groupedData = data.reduce((acc: any, curr) => {
        const ingrediente = curr.ingrediente;
        if (!acc[ingrediente]) {
          acc[ingrediente] = {
            totalPrevisto: 0,
            totalRealizado: 0
          };
        }
        acc[ingrediente].totalPrevisto += parseFloat(curr.previsto_kg || 0);
        acc[ingrediente].totalRealizado += parseFloat(curr.realizado_kg || 0);
        return acc;
      }, {});

      // Converter para o formato final e calcular eficiência
      const processedData: EficienciaIngrediente[] = Object.entries(groupedData)
        .map(([ingrediente, values]: [string, any]) => ({
          ingrediente: ingrediente.charAt(0).toUpperCase() + ingrediente.slice(1),
          previsto: parseFloat(values.totalPrevisto.toFixed(2)),
          realizado: parseFloat(values.totalRealizado.toFixed(2)),
          eficiencia: parseFloat(((values.totalRealizado / values.totalPrevisto) * 100).toFixed(1)),
          color: getIngredienteColor(ingrediente)
        }))
        .sort((a, b) => b.realizado - a.realizado) // Ordenar por quantidade realizada (decrescente)
        .slice(0, 15); // Limitar a 15 ingredientes principais

      console.log('useEficienciaIngrediente - Dados processados:', processedData);
      console.log('useEficienciaIngrediente - Data de referência:', latestDate);

      return {
        data: processedData,
        dataReferencia: latestDate
      };
    },
    enabled: true,
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};