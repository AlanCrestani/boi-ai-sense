import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'normal';
  category: 'consumo' | 'acuracia';
  title: string;
  description: string;
  curral?: string;
  lote?: string;
  curralLote?: string;
  data: string;
  metric?: number; // Para desvio percentual ou compliance/taxa de acerto
  metricLabel?: string; // Label do metric (ex: "Desvio", "Compliance", "Taxa de Acerto")
  desvioKg?: number;
  realizado?: number;
  previsto?: number;
  qtdAnimais?: number;
  status?: string;
  escore?: number;
}

// Manter o nome antigo para compatibilidade
export interface ConsumoAlert extends SystemAlert {}

export const useConsumoAlerts = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['consumo-alerts', organization?.id],
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

      // 1. ALERTAS DE CONSUMO - Buscar dados com status amarelo ou vermelho/preto
      const { data: alertData, error } = await supabase
        .from('view_consumo_materia_seca')
        .select('*')
        .eq('organization_id', orgId)
        .eq('data', latestDate)
        .in('status', ['amarelo', 'vermelho', 'preto'])
        .not('cms_realizado_kg', 'is', null)
        .gt('cms_realizado_kg', 0)
        .order('desvio_abs_pc', { ascending: false });

      if (!error && alertData) {
        // Transformar os dados de consumo em alertas
        alertData.forEach((item, index) => {
        let type: 'critical' | 'warning' | 'normal' = 'normal';
        let title = '';
        let description = '';

        // Definir tipo e mensagem baseado no status e desvio
        if (item.status === 'preto' || item.desvio_abs_pc > 10) {
          type = 'critical';
          title = `Desvio crítico no ${item.curral_lote}`;
          description = `Desvio de ${item.desvio_abs_pc.toFixed(1)}% (${item.desvio_kg_abs.toFixed(1)} kg). `;
        } else if (item.status === 'vermelho') {
          type = 'critical';
          title = `Desvio elevado no ${item.curral_lote}`;
          description = `Desvio de ${item.desvio_abs_pc.toFixed(1)}% (${item.desvio_kg_abs.toFixed(1)} kg). `;
        } else if (item.status === 'amarelo') {
          type = 'warning';
          title = `Atenção no ${item.curral_lote}`;
          description = `Desvio de ${item.desvio_abs_pc.toFixed(1)}% (${item.desvio_kg_abs.toFixed(1)} kg). `;
        }

        // Adicionar informação sobre sobre ou sub-consumo
        if (item.cms_realizado_kg > item.cms_previsto_kg) {
          description += `Consumo acima do previsto (${item.cms_realizado_kg.toFixed(1)} kg vs ${item.cms_previsto_kg.toFixed(1)} kg).`;
        } else {
          description += `Consumo abaixo do previsto (${item.cms_realizado_kg.toFixed(1)} kg vs ${item.cms_previsto_kg.toFixed(1)} kg).`;
        }

        // Adicionar recomendação baseada no escore
        if (item.escore === -2) {
          description += ' Recomendação: Aumentar muito o fornecimento.';
        } else if (item.escore === -1) {
          description += ' Recomendação: Aumentar moderadamente o fornecimento.';
        } else if (item.escore === 0) {
          description += ' Recomendação: Aumentar levemente o fornecimento.';
        } else if (item.escore === 2) {
          description += ' Recomendação: Diminuir levemente o fornecimento.';
        } else if (item.escore === 3) {
          description += ' Recomendação: Diminuir moderadamente o fornecimento.';
        } else if (item.escore === 4) {
          description += ' Recomendação: Diminuir muito o fornecimento.';
        }

          allAlerts.push({
            id: `consumo-${item.curral_lote}-${item.data}-${index}`,
            type,
            category: 'consumo',
            title,
            description,
            curral: item.curral,
            lote: item.lote,
            curralLote: item.curral_lote,
            data: item.data,
            metric: item.desvio_abs_pc,
            metricLabel: 'Desvio',
            desvioKg: item.desvio_kg_abs,
            realizado: item.cms_realizado_kg,
            previsto: item.cms_previsto_kg,
            qtdAnimais: item.qtd_animais || 0,
            status: item.status,
            escore: item.escore
          });
        });
      }

      // 2. ALERTAS DE ACURÁCIA - Buscar dados de acurácia
      // Buscar dados dos últimos 2 dias para calcular compliance e taxa de acerto
      const previousDate = new Date(latestDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      const { data: acuraciaData } = await supabase
        .from('view_consumo_materia_seca')
        .select('curral, lote, curral_lote, data, escore, cms_previsto_kg, cms_realizado_kg, qtd_animais')
        .eq('organization_id', orgId)
        .in('data', [previousDateStr, latestDate])
        .not('escore', 'is', null)
        .order('curral_lote', { ascending: true })
        .order('data', { ascending: true });

      if (acuraciaData && acuraciaData.length > 0) {
        // Agrupar por lote
        const loteMap = new Map<string, any[]>();
        acuraciaData.forEach(row => {
          const key = row.lote;
          if (!loteMap.has(key)) {
            loteMap.set(key, []);
          }
          loteMap.get(key)!.push(row);
        });

        // Calcular métricas por lote e criar alertas se necessário
        loteMap.forEach((dados, lote) => {
          const dadosOrdenados = dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

          if (dadosOrdenados.length >= 2) {
            const ontem = dadosOrdenados[dadosOrdenados.length - 2];
            const hoje = dadosOrdenados[dadosOrdenados.length - 1];

            // Calcular compliance (se ontem estava dentro de ±2%)
            const ratioOntem = ontem.cms_previsto_kg > 0 ? ontem.cms_realizado_kg / ontem.cms_previsto_kg : 0;
            const complianceOntem = ratioOntem >= 0.98 && ratioOntem <= 1.02;

            // Validar acurácia (se o escore de ontem foi correto baseado no de hoje)
            let acertouEscore = false;
            if (ontem.escore === 1) {
              acertouEscore = true; // NOTA 1 é sempre acerto
            } else if (ontem.escore === -2) {
              acertouEscore = [-1, 0, 1].includes(hoje.escore);
            } else if (ontem.escore === -1) {
              acertouEscore = [0, 1].includes(hoje.escore);
            } else if (ontem.escore === 0) {
              acertouEscore = hoje.escore === 1;
            } else if (ontem.escore === 2) {
              acertouEscore = hoje.escore === 1;
            } else if (ontem.escore === 3) {
              acertouEscore = hoje.escore === 1;
            } else if (ontem.escore === 4) {
              acertouEscore = [1, 2, 3].includes(hoje.escore);
            }

            // Criar alertas baseados nas métricas
            // Alerta de Compliance baixa
            if (!complianceOntem) {
              const desvioOntem = Math.abs((ratioOntem - 1) * 100);
              let type: 'critical' | 'warning' = desvioOntem > 5 ? 'critical' : 'warning';

              allAlerts.push({
                id: `compliance-${hoje.curral_lote}-${hoje.data}`,
                type,
                category: 'acuracia',
                title: `Baixa compliance no ${hoje.curral_lote}`,
                description: `Tratador não seguiu a recomendação ontem. Desvio de ${desvioOntem.toFixed(1)}% na execução. ${ontem.cms_realizado_kg > ontem.cms_previsto_kg ? 'Forneceu mais que o recomendado.' : 'Forneceu menos que o recomendado.'}`,
                curral: hoje.curral,
                lote: hoje.lote,
                curralLote: hoje.curral_lote,
                data: hoje.data,
                metric: desvioOntem,
                metricLabel: 'Desvio de Execução',
                qtdAnimais: hoje.qtd_animais || 0
              });
            }

            // Alerta de Taxa de Acerto baixa (escore incorreto)
            if (!acertouEscore && ontem.escore !== 1) {
              allAlerts.push({
                id: `acuracia-${hoje.curral_lote}-${hoje.data}`,
                type: 'warning',
                category: 'acuracia',
                title: `Ajuste incorreto no ${hoje.curral_lote}`,
                description: `O escore ${ontem.escore > 0 ? '+' : ''}${ontem.escore} de ontem não resultou na correção esperada. Escore hoje: ${hoje.escore > 0 ? '+' : ''}${hoje.escore}. Revisar estratégia de ajuste.`,
                curral: hoje.curral,
                lote: hoje.lote,
                curralLote: hoje.curral_lote,
                data: hoje.data,
                metric: ontem.escore,
                metricLabel: 'Escore Incorreto',
                qtdAnimais: hoje.qtd_animais || 0,
                escore: ontem.escore
              });
            }
          }
        });
      }

      // Ordenar alertas por criticidade e desvio
      return allAlerts.sort((a, b) => {
        // Primeiro por tipo (critical > warning > normal)
        const typeOrder = { critical: 0, warning: 1, normal: 2 };
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;

        // Depois por métrica (maior primeiro)
        return (b.metric || 0) - (a.metric || 0);
      });
    },
    enabled: true,
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};