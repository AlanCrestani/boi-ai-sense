import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';

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

interface EstatisticasConsumoCardProps {
  dados: DadosConsumo[];
  curralLote: string;
}

export const EstatisticasConsumoCard = ({ dados, curralLote }: EstatisticasConsumoCardProps) => {
  if (!dados || dados.length === 0) {
    return null;
  }

  // Formatar título: "1 - 01-G2-25" -> "Curral 01: 01-G2-25"
  const formatarTitulo = (texto: string) => {
    const match = texto.match(/^(\d+)\s*-\s*(.+)$/);
    if (match) {
      const curralNum = match[1].padStart(2, '0');
      const lote = match[2];
      return `Curral ${curralNum}: ${lote}`;
    }
    return texto;
  };

  // Ordenar por data para pegar o último dia
  const dadosOrdenados = [...dados].sort((a, b) => b.data.localeCompare(a.data));
  const ultimoDia = dadosOrdenados[0];

  // Se o último dia tem realizado = 0, excluir ele do cálculo (usar só 13 dias)
  // Se o último dia tem realizado > 0, incluir ele (usar 14 dias)
  const dadosParaCalculo = ultimoDia && ultimoDia.realizado === 0
    ? dados.filter(d => d.data !== ultimoDia.data && d.realizado > 0)
    : dados.filter(d => d.realizado > 0);

  const dadosValidos = dadosParaCalculo;

  // DEBUG: Log para curral específico
  if (curralLote.includes('36-G3-25')) {
    console.log('🔍 DEBUG FEED-READING - Curral 53: 36-G3-25');
    console.log('Total de dados no período:', dados.length);
    console.log('Último dia:', ultimoDia?.data, 'realizado:', ultimoDia?.realizado);
    console.log('Último dia tem dados?', ultimoDia && ultimoDia.realizado > 0);
    console.log('Dados válidos após filtro:', dadosValidos.length);
    console.log('Valores realizados:', dadosValidos.map(d => d.realizado));
  }

  if (dadosValidos.length === 0) {
    return null;
  }

  // Calcular estatísticas do consumo realizado
  const realizados = dadosValidos.map(d => d.realizado);
  const previstos = dadosValidos.map(d => d.previsto);
  const desvios = dadosValidos.map(d => d.desvio_abs_pc);

  // Média
  const mediaRealizado = realizados.reduce((acc, val) => acc + val, 0) / realizados.length;
  const mediaPrevisto = previstos.reduce((acc, val) => acc + val, 0) / previstos.length;
  const mediaDesvio = desvios.reduce((acc, val) => acc + val, 0) / desvios.length;

  // Desvio Padrão
  const varianciaRealizado = realizados.reduce((acc, val) => acc + Math.pow(val - mediaRealizado, 2), 0) / realizados.length;
  const desvioPadraoRealizado = Math.sqrt(varianciaRealizado);

  // Coeficiente de Variação (CV)
  const cvRealizado = (desvioPadraoRealizado / mediaRealizado) * 100;

  // DEBUG: Log do CV calculado para curral específico
  if (curralLote.includes('36-G3-25')) {
    console.log('📊 Cálculo CV (FEED-READING):');
    console.log('Média:', mediaRealizado);
    console.log('Desvio Padrão:', desvioPadraoRealizado);
    console.log('CV:', cvRealizado);
  }

  // Mínimo e Máximo
  const minRealizado = Math.min(...realizados);
  const maxRealizado = Math.max(...realizados);

  // Amplitude
  const amplitude = maxRealizado - minRealizado;

  // Índice de Consistência (1 - CV/100) - quanto mais próximo de 1, mais consistente
  const indiceConsistencia = Math.max(0, 1 - cvRealizado / 100);

  // Diferença média entre realizado e previsto
  const diferencaMedia = mediaRealizado - mediaPrevisto;
  const diferencaPercentual = mediaPrevisto > 0 ? (diferencaMedia / mediaPrevisto) * 100 : 0;

  // Determinar cor do badge de consistência (critérios mais rigorosos)
  // Cores iguais aos labels de escore: Verde #22C55E, Amarelo #EAB308, Vermelho #EF4444
  const getConsistenciaColor = (cv: number) => {
    if (cv <= 5) return 'text-white border-[#22C55E]' as const;
    if (cv <= 10) return 'text-gray-900 border-[#EAB308]' as const;
    if (cv <= 15) return 'text-gray-900 border-orange-500' as const;
    return 'text-white border-[#EF4444]' as const;
  };

  const getConsistenciaBackgroundColor = (cv: number) => {
    if (cv <= 5) return '#22C55E'; // Verde
    if (cv <= 10) return '#EAB308'; // Amarelo
    if (cv <= 15) return '#FB923C'; // Laranja
    return '#EF4444'; // Vermelho
  };

  const getConsistenciaText = (cv: number) => {
    if (cv <= 5) return 'Boa Consistência';
    if (cv <= 10) return 'Consistência em Observação';
    if (cv <= 15) return 'Consistência Baixa';
    return 'Consistência Crítica';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise Estatística - {formatarTitulo(curralLote)}
            </CardTitle>
            <CardDescription>
              Estatísticas dos últimos {dadosValidos.length} dias com dados
            </CardDescription>
          </div>
          <div
            className={`px-3 py-1 rounded-full border-2 text-sm font-semibold ${getConsistenciaColor(cvRealizado)}`}
            style={{ backgroundColor: getConsistenciaBackgroundColor(cvRealizado) }}
          >
            {getConsistenciaText(cvRealizado)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Média */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Média Realizado</span>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {mediaRealizado.toFixed(2)} kg
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Previsto: {mediaPrevisto.toFixed(2)} kg
            </div>
          </div>

          {/* Desvio Padrão */}
          <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Desvio Padrão</span>
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ±{desvioPadraoRealizado.toFixed(2)} kg
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              CV: {cvRealizado.toFixed(2)}%
            </div>
          </div>

          {/* Amplitude */}
          <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Amplitude</span>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {minRealizado.toFixed(2)}
              </div>
              <div className="text-sm text-orange-600">a</div>
              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {maxRealizado.toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Variação: {amplitude.toFixed(2)} kg
            </div>
          </div>

          {/* Diferença Média */}
          <div className={`rounded-lg p-4 border ${
            diferencaMedia >= 0
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                diferencaMedia >= 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                Diferença Média
              </span>
              {diferencaMedia >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className={`text-2xl font-bold ${
              diferencaMedia >= 0
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              {diferencaMedia >= 0 ? '+' : ''}{diferencaMedia.toFixed(2)} kg
            </div>
            <div className={`text-xs mt-1 ${
              diferencaMedia >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {diferencaPercentual >= 0 ? '+' : ''}{diferencaPercentual.toFixed(2)}% vs previsto
            </div>
          </div>
        </div>

        {/* Resumo detalhado */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Resumo da Análise
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Coeficiente de Variação:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {cvRealizado.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Índice de Consistência:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {(indiceConsistencia * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Desvio Médio do Previsto:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {mediaDesvio.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Dias Analisados:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {dadosValidos.length} de {dados.length}
              </span>
            </div>
          </div>

          {/* Interpretação */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              <strong>Interpretação:</strong> {cvRealizado <= 5
                ? 'Excelente! O consumo apresenta variação muito baixa e controlada. O lote está com padrão alimentar muito estável e previsível.'
                : cvRealizado <= 10
                  ? 'O consumo apresenta boa consistência, com variação aceitável entre os dias. Continue monitorando para manter a estabilidade.'
                  : cvRealizado <= 15
                    ? 'O consumo apresenta variação moderada. Atenção: monitore fatores que possam estar afetando a regularidade do consumo (clima, palatabilidade, competição).'
                    : cvRealizado <= 25
                      ? 'Atenção! O consumo apresenta alta variabilidade. Investigue possíveis causas: mudanças na dieta, problemas de manejo, condições climáticas, disponibilidade de água, ou problemas de saúde.'
                      : 'Crítico! Variabilidade muito alta detectada. Ação urgente necessária: revisar formulação da dieta, verificar qualidade dos ingredientes, avaliar estado de saúde do lote, checar disponibilidade de água e condições de cocho.'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
