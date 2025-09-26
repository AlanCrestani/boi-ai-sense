import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DietaFabricada {
  dieta: string;
  totalRealizado: number;
  numCarregamentos: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export const useDietasFabricadas = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['dietas-fabricadas', organization?.id],
    queryFn: async () => {
      console.log('useDietasFabricadas - Iniciando queryFn');

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useDietasFabricadas - Usando orgId:', orgId);

      // Primeiro, buscar a data mais recente disponível
      const { data: latestDateData, error: latestDateError } = await supabase
        .from('fato_carregamento')
        .select('data')
        .eq('organization_id', orgId)
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
        .select('dieta, realizado_kg, id_carregamento')
        .eq('organization_id', orgId)
        .eq('data', latestDate)
        .not('realizado_kg', 'is', null)
        .gt('realizado_kg', 0);

      if (error) throw error;

      // Agrupar por dieta
      const groupedData = data.reduce((acc: any, curr) => {
        const dieta = curr.dieta;
        if (!acc[dieta]) {
          acc[dieta] = {
            totalRealizado: 0,
            carregamentos: new Set()
          };
        }
        acc[dieta].totalRealizado += parseFloat(curr.realizado_kg);
        acc[dieta].carregamentos.add(curr.id_carregamento);
        return acc;
      }, {});

      // Converter para o formato final
      const processedData: DietaFabricada[] = Object.entries(groupedData)
        .map(([dieta, values]: [string, any], index) => ({
          dieta: dieta.replace(/\s+\d{6}$/, ''), // Remove códigos numéricos do final
          totalRealizado: parseFloat(values.totalRealizado.toFixed(2)),
          numCarregamentos: values.carregamentos.size,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.totalRealizado - a.totalRealizado) // Ordenar por quantidade decrescente
        .slice(0, 8); // Limitar a 8 dietas principais

      console.log('useDietasFabricadas - Dados processados:', processedData);
      console.log('useDietasFabricadas - Data mais recente:', latestDate);

      return {
        data: processedData,
        dataReferencia: latestDate
      };
    },
    enabled: true,
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};