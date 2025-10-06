import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EficienciaConsumoData {
  eficienciaConsumo: number;
  dataAtualizacao: string;
  variacaoOntem: number;
  percentualVariacao: number;
  totalRegistros: number;
  totalAnimais: number;
  taxaAcerto: number;
  totalAcertos: number;
  totalValidacoes: number;
}

/**
 * Valida se a nota de ontem estava correta baseado na nota de hoje
 */
function validarNotaOntem(notaOntem: number, notaHoje: number): boolean {
  // NOTA 1 é sempre acerto (é o objetivo, pode repetir)
  if (notaOntem === 1) {
    return true;
  }

  // NOTA -2 (aumentar muito)
  if (notaOntem === -2) {
    return [-1, 0, 1].includes(notaHoje);
  }

  // NOTA -1 (aumentar moderado)
  if (notaOntem === -1) {
    return [0, 1].includes(notaHoje);
  }

  // NOTA 0 (aumentar leve)
  if (notaOntem === 0) {
    return notaHoje === 1;
  }

  // NOTA 2 (diminuir leve)
  if (notaOntem === 2) {
    return notaHoje === 1;
  }

  // NOTA 3 (diminuir moderado)
  if (notaOntem === 3) {
    return notaHoje === 1;
  }

  // NOTA 4 (diminuir muito)
  if (notaOntem === 4) {
    return [1, 2, 3].includes(notaHoje);
  }

  return false;
}

export const useEficienciaConsumo = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['eficiencia-consumo', organization?.id],
    queryFn: async (): Promise<EficienciaConsumoData> => {
      console.log('useEficienciaConsumo - Iniciando queryFn');

      // Para teste ou quando não houver organization, usar ID padrão
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      console.log('useEficienciaConsumo - Usando orgId:', orgId);

      // Buscar a data mais recente disponível
      const { data: latestDateData, error: latestDateError } = await supabase
        .from('fato_historico_consumo')
        .select('data')
        .eq('organization_id', orgId)
        .order('data', { ascending: false })
        .limit(1);

      if (latestDateError) throw latestDateError;
      if (!latestDateData || latestDateData.length === 0) {
        return {
          eficienciaConsumo: 0,
          dataAtualizacao: new Date().toISOString().split('T')[0],
          variacaoOntem: 0,
          percentualVariacao: 0,
          totalRegistros: 0,
          totalAnimais: 0,
          taxaAcerto: 0,
          totalAcertos: 0,
          totalValidacoes: 0
        };
      }

      const latestDate = latestDateData[0].data;

      // Buscar eficiência de consumo da última data
      const { data: currentData, error: currentError } = await supabase
        .from('fato_historico_consumo')
        .select('cms_realizado_kg, cms_previsto_kg, qtd_animais')
        .eq('organization_id', orgId)
        .eq('data', latestDate)
        .gt('cms_previsto_kg', 0)
        .not('cms_realizado_kg', 'is', null);

      if (currentError) throw currentError;

      // Calcular eficiência média da última data
      const eficienciasHoje = currentData.map(item =>
        (item.cms_realizado_kg / item.cms_previsto_kg) * 100
      );
      const eficienciaConsumoHoje = eficienciasHoje.length > 0
        ? eficienciasHoje.reduce((sum, eff) => sum + eff, 0) / eficienciasHoje.length
        : 0;

      const totalAnimaisHoje = currentData.reduce((sum, item) => sum + (item.qtd_animais || 0), 0);

      // Buscar eficiência do dia anterior
      const previousDate = new Date(latestDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      const { data: previousData, error: previousError } = await supabase
        .from('fato_historico_consumo')
        .select('cms_realizado_kg, cms_previsto_kg')
        .eq('organization_id', orgId)
        .eq('data', previousDateStr)
        .gt('cms_previsto_kg', 0)
        .not('cms_realizado_kg', 'is', null);

      if (previousError || !previousData || previousData.length === 0) {
        // Se não houver dados do dia anterior, retornar sem variação
        return {
          eficienciaConsumo: parseFloat(eficienciaConsumoHoje.toFixed(2)),
          dataAtualizacao: latestDate,
          variacaoOntem: 0,
          percentualVariacao: 0,
          totalRegistros: currentData.length,
          totalAnimais: totalAnimaisHoje,
          taxaAcerto: 0,
          totalAcertos: 0,
          totalValidacoes: 0
        };
      }

      // Calcular eficiência média do dia anterior
      const eficienciasOntem = previousData.map(item =>
        (item.cms_realizado_kg / item.cms_previsto_kg) * 100
      );
      const eficienciaConsumoOntem = eficienciasOntem.length > 0
        ? eficienciasOntem.reduce((sum, eff) => sum + eff, 0) / eficienciasOntem.length
        : 0;

      const variacaoOntem = eficienciaConsumoHoje - eficienciaConsumoOntem;
      const percentualVariacao = eficienciaConsumoOntem > 0
        ? ((variacaoOntem / eficienciaConsumoOntem) * 100)
        : 0;

      // Calcular Taxa de Acerto (das notas de ontem, quantas acertei hoje?)
      // Buscar dados da view_consumo_materia_seca para as últimas 2 datas
      console.log('[useEficienciaConsumo] Buscando dados da view para:', { previousDateStr, latestDate, orgId });

      const { data: viewData, error: viewError } = await supabase
        .from('view_consumo_materia_seca')
        .select('curral_lote, lote, data, escore, cms_realizado_kg')
        .eq('organization_id', orgId)
        .in('data', [previousDateStr, latestDate])
        .not('escore', 'is', null)
        .order('curral_lote', { ascending: true })
        .order('data', { ascending: true });

      console.log('[useEficienciaConsumo] Dados da view:', {
        viewError,
        viewDataLength: viewData?.length,
        sampleData: viewData?.slice(0, 5)
      });

      // Debug: verificar primeiro lote com detalhes
      if (viewData && viewData.length > 0) {
        const primeiroLote = viewData.filter(d => d.lote === '01-G2-25');
        console.log('[useEficienciaConsumo] Exemplo lote 01-G2-25:', primeiroLote);
      }

      let totalAcertos = 0;
      let totalValidacoes = 0;

      if (!viewError && viewData && viewData.length > 0) {
        // Agrupar por lote para comparar ontem vs hoje
        const loteMap = new Map<string, any[]>();
        viewData.forEach(row => {
          const key = row.lote;
          if (!loteMap.has(key)) {
            loteMap.set(key, []);
          }
          loteMap.get(key)!.push(row);
        });

        console.log('[useEficienciaConsumo] Lotes agrupados:', loteMap.size);
        console.log('[useEficienciaConsumo] Sample lote data:', Array.from(loteMap.entries()).slice(0, 2));

        // Para cada lote, validar se a nota de ontem estava correta
        loteMap.forEach((dados, lote) => {
          const dadosValidos = dados
            .filter(d => d.escore !== null && d.escore !== undefined && d.escore !== 0)
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

          console.log(`[useEficienciaConsumo] Lote ${lote} - total: ${dados.length}, válidos: ${dadosValidos.length}`);

          if (dadosValidos.length >= 2) {
            const hoje = dadosValidos[0];
            const ontem = dadosValidos[1];

            console.log(`[useEficienciaConsumo] Lote ${lote} - Ontem: ${ontem.escore}, Hoje: ${hoje.escore}`);

            const acertou = validarNotaOntem(ontem.escore, hoje.escore);
            if (acertou) {
              totalAcertos++;
            }
            totalValidacoes++;
          }
        });

        console.log('[useEficienciaConsumo] Totais finais:', { totalAcertos, totalValidacoes });
      }

      const taxaAcerto = totalValidacoes > 0 ? (totalAcertos / totalValidacoes) * 100 : 0;

      console.log('useEficienciaConsumo - Dados retornados:', {
        eficienciaConsumoHoje,
        eficienciaConsumoOntem,
        variacaoOntem,
        percentualVariacao,
        taxaAcerto,
        totalAcertos,
        totalValidacoes
      });

      return {
        eficienciaConsumo: parseFloat(eficienciaConsumoHoje.toFixed(2)),
        dataAtualizacao: latestDate,
        variacaoOntem: parseFloat(variacaoOntem.toFixed(2)),
        percentualVariacao: parseFloat(percentualVariacao.toFixed(2)),
        totalRegistros: currentData.length,
        totalAnimais: totalAnimaisHoje,
        taxaAcerto: parseFloat(taxaAcerto.toFixed(2)),
        totalAcertos,
        totalValidacoes
      };
    },
    enabled: true, // Sempre habilitado, usando o ID padrão quando necessário
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
};