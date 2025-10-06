import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EficienciaIngrediente {
  ingrediente: string;
  abreviacao: string;
  previsto: number;
  realizado: number;
  eficiencia: number;
  color: string;
}

interface UseEficienciaIngredienteProps {
  vagaoFilter?: string;
}

export const useEficienciaIngrediente = (props?: UseEficienciaIngredienteProps) => {
  const { organization } = useAuth();
  const { vagaoFilter } = props || {};

  return useQuery({
    queryKey: ['eficiencia-ingrediente', organization?.id, vagaoFilter],
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
      let query = supabase
        .from('fato_carregamento')
        .select('ingrediente, previsto_kg, realizado_kg')
        .eq('organization_id', orgId)
        .eq('data', latestDate)
        .not('previsto_kg', 'is', null)
        .not('realizado_kg', 'is', null)
        .not('ingrediente', 'is', null)
        .gt('previsto_kg', 0); // Apenas ingredientes com previsto > 0

      // Aplicar filtro por vagão se fornecido
      if (vagaoFilter) {
        query = query.eq('vagao', vagaoFilter);
      }

      const { data, error } = await query;

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

      // Função para obter cor do ingrediente baseada na abreviação
      const getIngredienteColor = (ingrediente: string, abreviacao: string): string => {
        // Cores padrão específicas por abreviação
        const coresPadrao: Record<string, string> = {
          'SIL': '#6FCF97',
          'MAI': '#F4C542',
          'MLH': '#F4C542', // Milho usa a mesma cor do MAI
          'CAP': '#4CC9A7',
          'SOJ': '#D4A62C',
          'PRÉ': '#A0522D',
          'PRE': '#A0522D', // Variação sem acento
          'PMX': '#A0522D', // Premix usa a mesma cor do PRÉ
          'URE': '#F5F5F5',
          'NUC': '#3F80FF',
          'CAL': '#DCDCDC'
        };

        // Verificar se há cor específica para a abreviação
        if (coresPadrao[abreviacao]) {
          return coresPadrao[abreviacao];
        }

        // Fallback: usar as cores antigas baseadas em palavras-chave
        if (!ingrediente) return '#8884d8';

        const ingredienteNormalizado = ingrediente.toLowerCase()
          .replace(/[áàâã]/g, 'a')
          .replace(/[éèê]/g, 'e')
          .replace(/[íì]/g, 'i')
          .replace(/[óòôõ]/g, 'o')
          .replace(/[úù]/g, 'u')
          .replace(/[ç]/g, 'c');

        for (const [key, color] of Object.entries(ingredienteColors)) {
          if (ingredienteNormalizado.includes(key)) {
            return color;
          }
        }

        // Última opção: cores baseadas em hash
        const hashCode = ingrediente.split('').reduce((acc, char) => {
          return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);

        const fallbackColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#00C49F', '#0088FE'];
        return fallbackColors[Math.abs(hashCode) % fallbackColors.length];
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

      // Função para gerar abreviação do ingrediente
      const getAbreviacao = (ingrediente: string): string => {
        const ingredienteLower = ingrediente.toLowerCase();

        // Mapeamentos específicos para ingredientes comuns
        const abreviacoes: Record<string, string> = {
          'milho': 'MLH',
          'soja': 'SOJ',
          'farelo': 'FAR',
          'silagem': 'SIL',
          'concentrado': 'CON',
          'premix': 'PMX',
          'suplemento': 'SUP',
          'calcario': 'CAL',
          'fosfato': 'FOS',
          'ureia': 'URE',
          'sal': 'SAL',
          'mineral': 'MIN',
          'vitamina': 'VIT',
          'proteinado': 'PRO',
          'energia': 'ENE',
          'fibra': 'FIB'
        };

        // Procurar por palavra-chave no nome do ingrediente
        for (const [palavra, abrev] of Object.entries(abreviacoes)) {
          if (ingredienteLower.includes(palavra)) {
            return abrev;
          }
        }

        // Se não encontrar mapeamento específico, usar as primeiras 3 letras
        return ingrediente.substring(0, 3).toUpperCase();
      };

      // Função para converter para Title Case (primeiras letras maiúsculas)
      const toTitleCase = (str: string): string => {
        return str.toLowerCase().split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      };

      // Converter para o formato final e calcular eficiência
      const processedData: EficienciaIngrediente[] = Object.entries(groupedData)
        .map(([ingrediente, values]: [string, any]) => {
          const nomeFormatado = toTitleCase(ingrediente);
          return {
            ingrediente: nomeFormatado,
            abreviacao: getAbreviacao(ingrediente),
            previsto: parseFloat(values.totalPrevisto.toFixed(2)),
            realizado: parseFloat(values.totalRealizado.toFixed(2)),
            eficiencia: parseFloat(((values.totalRealizado / values.totalPrevisto) * 100).toFixed(1)),
            color: getIngredienteColor(ingrediente, getAbreviacao(ingrediente))
          };
        })
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