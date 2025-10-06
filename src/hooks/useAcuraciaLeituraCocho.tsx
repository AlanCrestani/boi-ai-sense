import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Validacao {
  data: string;
  escoreDia1: number;
  escoreDia2: number;
  resultado: {
    tipo: 'ACERTO' | 'ERRO_LEVE' | 'ERRO_GRAVE' | 'INVALIDO';
    motivo: string;
  };
  compliance: number;
  complianceOk: boolean;
}

interface MatrizTransicao {
  escoreOrigem: number;
  resultados: {
    melhorou: number;
    manteve: number;
    piorou: number;
    total: number;
  };
}

export interface AcuraciaMetrics {
  taxaAcertoGeral: number;
  acertos: number;
  errosLeves: number;
  errosGraves: number;
  errosRepetirNota: number;
  complianceTratador: number;
  lotesComCompliance: number;
  totalLotesCompliance: number;
  totalValidacoes: number;
  totalValidacoesCompliance: number;
  validacoes: Validacao[];
  matrizTransicao: MatrizTransicao[];
  insights: string[];
}

export function useAcuraciaLeituraCocho(curral: string, lote: string) {
  // Buscar dados da view otimizada
  // A view já normaliza o curral internamente (remove zeros à esquerda)
  const { data: viewData, isLoading } = useQuery({
    queryKey: ['acuracia-leitura-cocho', curral, lote],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('view_acuracia_leitura_cocho')
        .select('*')
        .eq('curral', curral)
        .eq('lote', lote)
        .order('data_dia1', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!curral && !!lote,
  });

  if (isLoading || !viewData || viewData.length === 0) {
    return {
      taxaAcertoGeral: 0,
      acertos: 0,
      errosLeves: 0,
      errosGraves: 0,
      errosRepetirNota: 0,
      complianceTratador: 0,
      lotesComCompliance: 0,
      totalLotesCompliance: 0,
      totalValidacoes: 0,
      totalValidacoesCompliance: 0,
      validacoes: [],
      matrizTransicao: [],
      insights: []
    };
  }

  // Pegar totais da primeira linha (window functions retornam o mesmo valor em todas as linhas)
  const firstRow = viewData[0];
  const totalValidacoes = firstRow.total_validacoes || 0;
  const totalValidacoesCompliance = firstRow.total_validacoes_compliance || 0;
  const totalAcertos = firstRow.total_acertos || 0;
  const totalErrosLeves = firstRow.total_erros_leves || 0;
  const totalErrosGraves = firstRow.total_erros_graves || 0;
  const taxaAcertoGeral = firstRow.taxa_acerto_percentual || 0;
  const complianceTratador = firstRow.compliance_tratador_percentual || 0;

  // Converter dados da view para formato do componente
  const validacoes: Validacao[] = viewData.map(row => ({
    data: row.data_dia1,
    escoreDia1: row.escore_dia1,
    escoreDia2: row.escore_dia2,
    resultado: {
      tipo: row.tipo_validacao as 'ACERTO' | 'ERRO_LEVE' | 'ERRO_GRAVE' | 'INVALIDO',
      motivo: row.motivo
    },
    compliance: row.ratio_compliance,
    complianceOk: row.compliance_ok
  }));

  // Construir matriz de transição
  const validacoesCompliance = validacoes.filter(v => v.complianceOk);
  const matrizMap = new Map<number, { melhorou: number; manteve: number; piorou: number; total: number }>();

  validacoesCompliance.forEach(v => {
    if (!matrizMap.has(v.escoreDia1)) {
      matrizMap.set(v.escoreDia1, { melhorou: 0, manteve: 0, piorou: 0, total: 0 });
    }

    const entry = matrizMap.get(v.escoreDia1)!;
    entry.total++;

    if (v.resultado.tipo === 'ACERTO') {
      entry.melhorou++;
    } else if (v.resultado.tipo === 'ERRO_LEVE') {
      entry.manteve++;
    } else {
      entry.piorou++;
    }
  });

  const matrizTransicao: MatrizTransicao[] = Array.from(matrizMap.entries())
    .map(([escore, resultados]) => ({ escoreOrigem: escore, resultados }))
    .sort((a, b) => a.escoreOrigem - b.escoreOrigem);

  // Gerar insights
  const insights: string[] = [];
  const errosGravesPercent = totalValidacoesCompliance > 0 ? (totalErrosGraves / totalValidacoesCompliance) * 100 : 0;
  const errosLevesPercent = totalValidacoesCompliance > 0 ? (totalErrosLeves / totalValidacoesCompliance) * 100 : 0;

  // Insight sobre compliance do tratador
  if (complianceTratador < 85) {
    insights.push(`🚨 PROBLEMA DE EXECUÇÃO: Tratador só executou corretamente em ${complianceTratador.toFixed(0)}% dos dias (realizado/previsto fora de ±2%). Análise considera apenas os ${totalValidacoesCompliance} dias executados corretamente.`);
  }

  // Insights sobre acurácia
  if (totalValidacoesCompliance === 0) {
    insights.push(`⚠️ Não há dados válidos para análise. Tratador não executou nenhum dia dentro da tolerância de ±2%.`);
  } else {
    if (taxaAcertoGeral >= 85) {
      insights.push(`✅ EXCELENTE: ${taxaAcertoGeral.toFixed(0)}% de acertos! Você acertou ${totalAcertos} de ${totalValidacoesCompliance} validações. As notas dadas ONTEM foram corretas considerando o que aconteceu HOJE. Continue assim!`);
    } else if (taxaAcertoGeral >= 71) {
      insights.push(`🟡 BOM: ${taxaAcertoGeral.toFixed(0)}% de acertos (${totalAcertos} de ${totalValidacoesCompliance} validações). Há espaço para melhorar a antecipação dos ajustes.`);
    } else {
      insights.push(`🔴 TEM QUE MELHORAR: Apenas ${taxaAcertoGeral.toFixed(0)}% de acertos (${totalAcertos} de ${totalValidacoesCompliance} validações). Muitas notas poderiam ter sido ajustadas no dia anterior.`);
    }

    const totalErros = totalErrosLeves + totalErrosGraves;
    if (totalErros > 0) {
      insights.push(`\n📊 DETALHAMENTO DOS ${totalErros} ERROS:`);

      if (totalErrosLeves > 0) {
        insights.push(`\n🟠 ERROS LEVES (${totalErrosLeves} - ${errosLevesPercent.toFixed(0)}%): Podia ter ajustado 1 casa antes. Ex: deu nota 1 ontem mas hoje deu nota 0 ou 2 (podia ter antecipado).`);
      }

      if (totalErrosGraves > 0) {
        insights.push(`\n🔴 ERROS GRAVES (${totalErrosGraves} - ${errosGravesPercent.toFixed(0)}%): Pulou 2+ casas ou foi na direção errada. Ex: deu nota 3 mas no dia seguinte foi direto para nota 1 (deveria passar por nota 2 primeiro).`);
      }
    } else {
      insights.push(`\n🎯 PERFEITO! Todas as ${totalValidacoesCompliance} notas foram dadas no momento certo!`);
    }
  }

  // Contar erros de repetição de nota (exceto nota 1)
  const errosRepetirNota = validacoesCompliance.filter(v =>
    v.escoreDia1 === v.escoreDia2 && v.escoreDia1 !== 1 && v.resultado.tipo !== 'ACERTO'
  ).length;

  return {
    taxaAcertoGeral,
    acertos: totalAcertos,
    errosLeves: totalErrosLeves,
    errosGraves: totalErrosGraves,
    errosRepetirNota,
    complianceTratador,
    lotesComCompliance: validacoesCompliance.length,
    totalLotesCompliance: validacoes.length,
    totalValidacoes,
    totalValidacoesCompliance,
    validacoes,
    matrizTransicao,
    insights
  };
}
