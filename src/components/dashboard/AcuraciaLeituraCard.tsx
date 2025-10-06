import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, UserCheck } from 'lucide-react';
import { useAcuraciaLeituraCocho } from '@/hooks/useAcuraciaLeituraCocho';

interface DadosConsumo {
  data: string;
  dia: string;
  previsto: number;
  realizado: number;
  desvio_kg_abs: number;
  desvio_abs_pc: number;
  escore: number;
  status: string;
  media_movel_4_dias: number;
}

interface AcuraciaLeituraCardProps {
  dados: DadosConsumo[];
  curralLote: string;
}

export const AcuraciaLeituraCard = ({ dados, curralLote }: AcuraciaLeituraCardProps) => {
  // Extrair curral e lote do formato "1 - 01-G2-25"
  const parseCurralLote = (texto: string) => {
    const match = texto.match(/^(\d+)\s*-\s*(.+)$/);
    if (match) {
      return {
        curral: match[1], // Manter sem zero à esquerda (formato do banco)
        lote: match[2]
      };
    }
    return { curral: '', lote: '' };
  };

  const { curral, lote } = parseCurralLote(curralLote);
  const metrics = useAcuraciaLeituraCocho(curral, lote);

  if (!curral || !lote || metrics.totalValidacoes === 0) {
    return null;
  }

  // Formatar título: "Curral 01: 01-G2-25" (adiciona zero à esquerda apenas para exibição)
  const tituloFormatado = `Curral ${curral.padStart(2, '0')}: ${lote}`;

  // Classificação de acurácia baseada em acertos/dias
  // Critério do usuário: 12/14 = Bom (85.7%), 10/14 = Atenção (71.4%), <10/14 = Tem que melhorar (<71.4%)
  const getAcuraciaColor = (taxa: number) => {
    if (taxa >= 85) return '#22C55E'; // Verde - Bom (≥12/14)
    if (taxa >= 71) return '#EAB308'; // Amarelo - Atenção (≥10/14)
    return '#EF4444'; // Vermelho - Tem que melhorar (<10/14)
  };

  const getAcuraciaText = (taxa: number) => {
    if (taxa >= 85) return 'Bom';
    if (taxa >= 71) return 'Atenção';
    return 'Tem que Melhorar';
  };

  const getAcuraciaTextColor = (taxa: number) => {
    if (taxa >= 85) return 'text-white';
    if (taxa >= 71) return 'text-gray-900';
    return 'text-white';
  };

  const percAcertos = metrics.totalValidacoesCompliance > 0
    ? (metrics.acertos / metrics.totalValidacoesCompliance) * 100
    : 0;

  const percErrosGraves = metrics.totalValidacoesCompliance > 0
    ? (metrics.errosGraves / metrics.totalValidacoesCompliance) * 100
    : 0;

  const percErrosLeves = metrics.totalValidacoesCompliance > 0
    ? (metrics.errosLeves / metrics.totalValidacoesCompliance) * 100
    : 0;

  const percErrosRepetir = metrics.totalValidacoesCompliance > 0
    ? (metrics.errosRepetirNota / metrics.totalValidacoesCompliance) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Acurácia da Leitura de Cocho - {tituloFormatado}
            </CardTitle>
            <CardDescription>
              Análise de {metrics.totalValidacoesCompliance} pares de dias (de {metrics.totalValidacoes} total) onde tratador executou corretamente (±2%)
            </CardDescription>
          </div>
          <div
            className={`px-3 py-1 rounded-full border-2 text-sm font-semibold ${getAcuraciaTextColor(metrics.taxaAcertoGeral)}`}
            style={{
              backgroundColor: getAcuraciaColor(metrics.taxaAcertoGeral),
              borderColor: getAcuraciaColor(metrics.taxaAcertoGeral)
            }}
          >
            {getAcuraciaText(metrics.taxaAcertoGeral)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grid de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Acertos */}
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Acertos</span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {percAcertos.toFixed(2)}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              {metrics.acertos} notas corretas
            </div>
          </div>

          {/* Erros Leves */}
          <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Erros Leves</span>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {percErrosLeves.toFixed(2)}%
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {metrics.errosLeves} podia mais/menos
            </div>
          </div>

          {/* Erros Graves */}
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Erros Graves</span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {percErrosGraves.toFixed(2)}%
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              {metrics.errosGraves} erros graves
            </div>
          </div>

          {/* Notas Repetidas */}
          <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Notas Repetidas</span>
              <TrendingDown className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {percErrosRepetir.toFixed(2)}%
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {metrics.errosRepetirNota} vezes (só nota 1 pode)
            </div>
          </div>

          {/* Compliance do Tratador */}
          <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Compliance</span>
              <UserCheck className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              {metrics.complianceTratador.toFixed(2)}%
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              {metrics.totalLotesCompliance > 0
                ? `${metrics.lotesComCompliance} de ${metrics.totalLotesCompliance} execuções`
                : 'Sem dados de compliance'}
            </div>
          </div>

          {/* Taxa de Acerto Geral */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Taxa de Acerto</span>
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {metrics.taxaAcertoGeral.toFixed(2)}%
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {metrics.acertos} de {metrics.totalValidacoesCompliance} validações
            </div>
          </div>
        </div>

        {/* Matriz de Transição */}
        {metrics.matrizTransicao.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Matriz de Transição - O que aconteceu no dia seguinte?
            </h4>

            <div className="space-y-3">
              {metrics.matrizTransicao.map((matriz) => {
                const percMelhorou = matriz.resultados.total > 0
                  ? (matriz.resultados.melhorou / matriz.resultados.total) * 100
                  : 0;
                const percManteve = matriz.resultados.total > 0
                  ? (matriz.resultados.manteve / matriz.resultados.total) * 100
                  : 0;
                const percPiorou = matriz.resultados.total > 0
                  ? (matriz.resultados.piorou / matriz.resultados.total) * 100
                  : 0;

                return (
                  <div key={matriz.escoreOrigem} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quando dei nota {matriz.escoreOrigem}:
                      </span>
                      <span className="text-xs text-gray-500">
                        {matriz.resultados.total} {matriz.resultados.total === 1 ? 'vez' : 'vezes'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-400">✅ Melhorou</span>
                            <span className="font-semibold text-green-600">
                              {matriz.resultados.melhorou} ({percMelhorou.toFixed(2)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${percMelhorou}%`, backgroundColor: '#22C55E' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-400">⚠️ Manteve</span>
                            <span className="font-semibold text-yellow-600">
                              {matriz.resultados.manteve} ({percManteve.toFixed(2)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${percManteve}%`, backgroundColor: '#EAB308' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-400">❌ Piorou</span>
                            <span className="font-semibold text-red-600">
                              {matriz.resultados.piorou} ({percPiorou.toFixed(2)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${percPiorou}%`, backgroundColor: '#EF4444' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Insights */}
        {metrics.insights.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Insights e Recomendações
            </h4>
            <div className="space-y-2">
              {metrics.insights.map((insight, idx) => (
                <div key={idx} className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explicação */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong>Como funciona:</strong> Este card valida se você deu a nota correta HOJE comparando com a nota dada ONTEM.
            <br/><br/>
            <strong>1º CHECK - Compliance do Tratador:</strong> Verifica se o tratador executou corretamente ONTEM (realizado/previsto entre 0.98 e 1.02 = ±2%). Só valida acurácia se este check passar.
            <br/><br/>
            <strong>REGRAS DE VALIDAÇÃO:</strong>
            <br/>• <strong>Nota 1 (OBJETIVO):</strong> Só é acerto se HOJE também der nota 1 (pode repetir). Se HOJE deu outra nota, significa que ONTEM já podia ter ajustado.
            <br/>• <strong>Notas -2, -1, 0 (aumentar):</strong> Acerto se HOJE a nota melhorou em direção ao 1. Erro se repetir ou ultrapassar o 1.
            <br/>• <strong>Notas 2, 3, 4 (diminuir):</strong> Acerto se HOJE a nota melhorou em direção ao 1. Erro se repetir ou ultrapassar o 1.
            <br/><br/>
            <strong>Exemplo ACERTO:</strong> Quinta dei nota 2 (diminuir 0.4kg) → Sexta dei nota 1 (alcançou objetivo). ✅ Acerto! Caminhou corretamente em direção ao 1.
            <br/><br/>
            <strong>Exemplo ERRO LEVE:</strong> Domingo dei nota 1 (manter) → Segunda dei nota 0 (aumentar 0.2kg). ❌ Erro leve porque domingo já podia ter dado nota 0.
            <br/><br/>
            <strong>Exemplo ERRO GRAVE:</strong> Quinta dei nota 3 (diminuir 1.2kg) → Sexta dei nota 0 (aumentar). ❌ Erro grave! Saiu de 3 e foi para 0 (ultrapassou o 1 na direção errada).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
