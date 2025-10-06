import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SystemAlert {
  id: string;
  type: 'amarelo' | 'laranja' | 'vermelho'; // Novo sistema de cores
  category: 'Análise Estatística' | 'Desvio de Consumo' | 'Leitura de Cocho' | 'Compliance';
  title: string;
  description: string;
  curral?: string;
  lote?: string;
  curralLote?: string;
  data: string;
  metric: number; // Valor da métrica (CV, desvio %, taxa acerto %, compliance %)
  metricLabel: string; // Label do metric
  badgeText: string; // Texto do badge (ex: "Consistência em Observação", "Necessita de Atenção")
}

export const useSystemAlerts = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['system-alerts', organization?.id],
    queryFn: async (): Promise<SystemAlert[]> => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const allAlerts: SystemAlert[] = [];

      // Buscar a data mais recente
      const { data: latestDateData } = await supabase
        .from('view_consumo_materia_seca')
        .select('data')
        .eq('organization_id', orgId)
        .order('data', { ascending: false })
        .limit(1);

      if (!latestDateData || latestDateData.length === 0) {
        return [];
      }

      const latestDate = latestDateData[0].data;

      // Buscar dados dos últimos 14 dias para cálculos
      const date14DaysAgo = new Date(latestDate);
      date14DaysAgo.setDate(date14DaysAgo.getDate() - 13);
      const date14DaysAgoStr = date14DaysAgo.toISOString().split('T')[0];

      // Buscar dados de consumo (sem filtrar realizado > 0 aqui, fazer depois por lote)
      const { data: consumoData } = await supabase
        .from('view_consumo_materia_seca')
        .select('*')
        .eq('organization_id', orgId)
        .gte('data', date14DaysAgoStr)
        .lte('data', latestDate)
        .order('curral_lote', { ascending: true })
        .order('data', { ascending: true });

      if (!consumoData || consumoData.length === 0) {
        return [];
      }

      // Primeiro, identificar a posição atual (curral_lote) de cada lote na data mais recente
      const lotesPosicaoAtual = new Map<string, string>(); // lote -> curral_lote atual

      consumoData.forEach(row => {
        if (row.data === latestDate) {
          lotesPosicaoAtual.set(row.lote, row.curral_lote);
        }
      });

      // Agrupar por LOTE (não por curral_lote), mas usar o curral_lote atual como chave
      const loteMap = new Map<string, any[]>();

      consumoData.forEach(row => {
        const lote = row.lote;
        const curralLoteAtual = lotesPosicaoAtual.get(lote);

        // Só processar lotes que têm posição atual conhecida
        if (!curralLoteAtual) {
          return;
        }

        if (!loteMap.has(curralLoteAtual)) {
          loteMap.set(curralLoteAtual, []);
        }

        loteMap.get(curralLoteAtual)!.push(row);
      });

      // Processar cada lote
      loteMap.forEach((dados, curralLote) => {
        // ARREDONDAR VALORES PRIMEIRO (antes de qualquer filtro ou cálculo)
        const dadosArredondados = dados.map(d => ({
          ...d,
          cms_realizado_kg: parseFloat((d.cms_realizado_kg || 0).toFixed(2)),
          cms_previsto_kg: parseFloat((d.cms_previsto_kg || 0).toFixed(2)),
          desvio_abs_pc: parseFloat((d.desvio_abs_pc || 0).toFixed(2))
        }));

        // Ordenar por data para pegar o último dia
        const dadosOrdenados = [...dadosArredondados].sort((a, b) => b.data.localeCompare(a.data));
        const ultimoDia = dadosOrdenados[0];

        // Se o último dia tem cms_realizado <= 0, excluir ele do cálculo (usar só 13 dias)
        // Se o último dia tem cms_realizado > 0, incluir ele (usar 14 dias)
        const ultimoDiaTemDados = ultimoDia && ultimoDia.cms_realizado_kg > 0;

        const dadosParaCalculo = !ultimoDiaTemDados
          ? dadosArredondados.filter(d => d.data !== ultimoDia.data && d.cms_realizado_kg > 0)
          : dadosArredondados.filter(d => d.cms_realizado_kg > 0);

        const dadosValidos = dadosParaCalculo;

        // DEBUG: Log para curral específico
        if (curralLote.includes('36-G3-25')) {
          console.log('🔍 DEBUG ALERTAS - Curral 53: 36-G3-25');
          console.log('Total de dados no período:', dados.length);
          console.log('Último dia:', ultimoDia?.data, 'realizado:', ultimoDia?.cms_realizado_kg);
          console.log('Último dia tem dados?', ultimoDiaTemDados);
          console.log('Dados válidos após filtro:', dadosValidos.length);
          console.log('Valores realizados (já arredondados):', dadosValidos.map(d => d.cms_realizado_kg));
        }

        if (dadosValidos.length === 0) return;

        // Extrair curral e lote
        const match = curralLote.match(/^(\d+)\s*-\s*(.+)$/);
        const curral = match ? match[1] : '';
        const lote = match ? match[2] : '';

        // 1. ANÁLISE ESTATÍSTICA (CV do consumo realizado)
        // Os valores já foram arredondados no início (dadosArredondados)
        const realizados = dadosValidos.map(d => d.cms_realizado_kg);
        const mediaRealizado = realizados.reduce((acc, val) => acc + val, 0) / realizados.length;
        const varianciaRealizado = realizados.reduce((acc, val) => acc + Math.pow(val - mediaRealizado, 2), 0) / realizados.length;
        const desvioPadraoRealizado = Math.sqrt(varianciaRealizado);
        const cvRealizado = (desvioPadraoRealizado / mediaRealizado) * 100;

        // DEBUG: Log do CV calculado para curral específico
        if (curralLote.includes('36-G3-25')) {
          console.log('📊 Cálculo CV:');
          console.log('Média:', mediaRealizado);
          console.log('Desvio Padrão:', desvioPadraoRealizado);
          console.log('CV:', cvRealizado);
        }

        // Classificar CV
        let cvType: 'amarelo' | 'laranja' | 'vermelho' | null = null;
        let cvBadge = '';

        if (cvRealizado > 5 && cvRealizado <= 10) {
          cvType = 'amarelo';
          cvBadge = 'Consistência em Observação';
        } else if (cvRealizado > 10 && cvRealizado <= 15) {
          cvType = 'laranja';
          cvBadge = 'Consistência Baixa';
        } else if (cvRealizado > 15) {
          cvType = 'vermelho';
          cvBadge = 'Consistência Crítica';
        }

        if (cvType) {
          allAlerts.push({
            id: `cv-${curralLote}-${latestDate}`,
            type: cvType,
            category: 'Análise Estatística',
            title: `${cvBadge} - ${curralLote}`,
            description: `Coeficiente de Variação de ${cvRealizado.toFixed(2)}% indica ${
              cvType === 'amarelo' ? 'variação moderada no consumo.' :
              cvType === 'laranja' ? 'alta variabilidade no consumo.' :
              'variabilidade crítica no consumo.'
            }`,
            curral,
            lote,
            curralLote,
            data: latestDate,
            metric: cvRealizado,
            metricLabel: 'CV',
            badgeText: cvBadge
          });
        }

        // 2. DESVIO DE CONSUMO MS (média do desvio percentual)
        // Os valores já foram arredondados no início (dadosArredondados)
        const desviosPercentuais = dadosValidos.map(d => d.desvio_abs_pc);
        const mediaDesvioPerc = desviosPercentuais.reduce((acc, val) => acc + val, 0) / desviosPercentuais.length;

        // Classificar Desvio
        let desvioType: 'amarelo' | 'laranja' | 'vermelho' | null = null;
        let desvioBadge = '';

        if (mediaDesvioPerc > 2 && mediaDesvioPerc <= 5) {
          desvioType = 'amarelo';
          desvioBadge = 'Necessita de Atenção';
        } else if (mediaDesvioPerc > 5 && mediaDesvioPerc <= 10) {
          desvioType = 'laranja';
          desvioBadge = 'Precisão Baixa';
        } else if (mediaDesvioPerc > 10) {
          desvioType = 'vermelho';
          desvioBadge = 'Precisão Crítica';
        }

        if (desvioType) {
          // Calcular dias no target (≤2%)
          const diasTarget2 = desviosPercentuais.filter(d => d <= 2).length;
          const percTarget2 = (diasTarget2 / dadosValidos.length) * 100;
          const totalDias = dadosValidos.length;

          allAlerts.push({
            id: `desvio-${curralLote}-${latestDate}`,
            type: desvioType,
            category: 'Desvio de Consumo',
            title: `${desvioBadge} - ${curralLote}`,
            description: `${diasTarget2} de ${totalDias} dias ≤2% (${percTarget2.toFixed(2)}% Dias no Target). Desvio médio de ${mediaDesvioPerc.toFixed(2)}% entre previsto e realizado.`,
            curral,
            lote,
            curralLote,
            data: latestDate,
            metric: mediaDesvioPerc,
            metricLabel: 'Desvio',
            badgeText: desvioBadge
          });
        }

        // 2.5. COMPLIANCE (% de dias no target ≤2%)
        // Calcular compliance independente do desvio médio
        const diasTarget2Compliance = desviosPercentuais.filter(d => d <= 2).length;
        const percTarget2Compliance = (diasTarget2Compliance / dadosValidos.length) * 100;
        const totalDiasCompliance = dadosValidos.length;

        // Classificar Compliance
        let complianceType: 'amarelo' | 'laranja' | 'vermelho' | null = null;
        let complianceBadge = '';

        if (percTarget2Compliance < 50) {
          complianceType = 'vermelho';
          complianceBadge = 'Compliance Crítica';
        } else if (percTarget2Compliance >= 50 && percTarget2Compliance < 75) {
          complianceType = 'laranja';
          complianceBadge = 'Compliance Baixa';
        } else if (percTarget2Compliance >= 75 && percTarget2Compliance < 83) {
          complianceType = 'amarelo';
          complianceBadge = 'Atenção';
        }
        // Verde (≥83%) não gera alerta

        if (complianceType) {
          allAlerts.push({
            id: `compliance-${curralLote}-${latestDate}`,
            type: complianceType,
            category: 'Compliance',
            title: `${complianceBadge} - ${curralLote}`,
            description: `${diasTarget2Compliance} de ${totalDiasCompliance} dias ≤2% (${percTarget2Compliance.toFixed(2)}% de Compliance).`,
            curral,
            lote,
            curralLote,
            data: latestDate,
            metric: percTarget2Compliance,
            metricLabel: 'Compliance',
            badgeText: complianceBadge
          });
        }
      });

      // 3. ALERTAS DE LEITURA DE COCHO (Acurácia)
      // Buscar dados da view de acurácia
      const { data: acuraciaData } = await supabase
        .from('view_acuracia_leitura_cocho')
        .select('*')
        .eq('organization_id', orgId);

      if (acuraciaData && acuraciaData.length > 0) {
        // Agrupar por curral/lote
        const acuraciaMap = new Map<string, any[]>();
        acuraciaData.forEach(row => {
          const key = `${row.curral}-${row.lote}`;
          if (!acuraciaMap.has(key)) {
            acuraciaMap.set(key, []);
          }
          acuraciaMap.get(key)!.push(row);
        });

        // Processar cada lote
        acuraciaMap.forEach((validacoes, key) => {
          if (validacoes.length === 0) return;

          const firstRow = validacoes[0];
          const curral = firstRow.curral;
          const lote = firstRow.lote;
          const curralLote = `${curral.padStart(2, '0')} - ${lote}`;
          const taxaAcerto = firstRow.taxa_acerto_percentual || 0;

          // Classificar Taxa de Acerto
          let acuraciaType: 'amarelo' | 'laranja' | 'vermelho' | null = null;
          let acuraciaBadge = '';

          if (taxaAcerto >= 71 && taxaAcerto < 85) {
            acuraciaType = 'amarelo';
            acuraciaBadge = 'Atenção';
          } else if (taxaAcerto < 71) {
            acuraciaType = 'vermelho';
            acuraciaBadge = 'Tem que Melhorar';
          }

          if (acuraciaType) {
            const totalAcertos = firstRow.total_acertos || 0;
            const totalValidacoes = firstRow.total_validacoes_compliance || 0;

            allAlerts.push({
              id: `acuracia-${key}-${latestDate}`,
              type: acuraciaType,
              category: 'Leitura de Cocho',
              title: `${acuraciaBadge} - ${curralLote}`,
              description: `Taxa de acerto de ${taxaAcerto.toFixed(2)}% (${totalAcertos}/${totalValidacoes} validações).`,
              curral,
              lote,
              curralLote,
              data: latestDate,
              metric: taxaAcerto,
              metricLabel: 'Taxa de Acerto',
              badgeText: acuraciaBadge
            });
          }
        });
      }

      // 4. FILTRAR APENAS LOTES ATIVOS (que existem na base na data mais recente)
      const { data: lotesAtivosData } = await supabase
        .from('view_consumo_materia_seca')
        .select('curral_lote')
        .eq('organization_id', orgId)
        .eq('data', latestDate);

      // Criar Set de lotes ativos para lookup O(1)
      const lotesAtivos = new Set<string>();
      if (lotesAtivosData && lotesAtivosData.length > 0) {
        lotesAtivosData.forEach(row => {
          if (row.curral_lote) {
            lotesAtivos.add(row.curral_lote);
          }
        });
      }

      // Filtrar apenas alertas dentro da janela de 14 dias (sincronizado com o gráfico)
      let filteredAlerts = allAlerts.filter(alert => alert.data >= date14DaysAgoStr);

      // Filtrar apenas alertas de lotes ativos (que existem na data mais recente)
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.curralLote && lotesAtivos.has(alert.curralLote)
      );

      // Ordenar alertas: vermelho > laranja > amarelo, depois por métrica
      return filteredAlerts.sort((a, b) => {
        const typeOrder = { vermelho: 0, laranja: 1, amarelo: 2 };
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;

        // Depois por métrica (maior primeiro para CV e Desvio, menor para Acurácia)
        if (a.category === 'Leitura de Cocho' && b.category === 'Leitura de Cocho') {
          return a.metric - b.metric; // Menor taxa de acerto = mais grave
        }
        return b.metric - a.metric; // Maior CV/Desvio = mais grave
      });
    },
    enabled: !!organization?.id,
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};
