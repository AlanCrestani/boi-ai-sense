import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface PrecisaoPrevisaoCardProps {
  dados: DadosConsumo[];
  curralLote: string;
}

export const PrecisaoPrevisaoCard = ({ dados, curralLote }: PrecisaoPrevisaoCardProps) => {
  if (!dados || dados.length === 0) {
    return null;
  }

  // Formatar título: "1 - 01-G2-25" -> "Curral 01: 01-G2-25"
  const formatarTitulo = (texto: string) => {
    // Tenta fazer parse do formato "X - Lote" (onde X é número do curral)
    const match = texto.match(/^(\d+)\s*-\s*(.+)$/);
    if (match) {
      const curralNum = match[1].padStart(2, '0'); // Adiciona zero à esquerda se necessário
      const lote = match[2];
      return `Curral ${curralNum}: ${lote}`;
    }
    // Se não der match, retorna o texto original
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

  if (dadosValidos.length === 0) {
    return null;
  }

  // Análise dos desvios
  const desviosPercentuais = dadosValidos.map(d => d.desvio_abs_pc);
  const desviosAbsolutos = dadosValidos.map(d => d.desvio_kg_abs);

  // Média dos desvios
  const mediaDesvioPerc =
    desviosPercentuais.reduce((acc, val) => acc + val, 0) / desviosPercentuais.length;
  const mediaDesvioAbs =
    desviosAbsolutos.reduce((acc, val) => acc + val, 0) / desviosAbsolutos.length;

  // Desvio padrão dos desvios percentuais
  const varianciaDesvio =
    desviosPercentuais.reduce((acc, val) => acc + Math.pow(val - mediaDesvioPerc, 2), 0) /
    desviosPercentuais.length;
  const desvioPadraoDesvio = Math.sqrt(varianciaDesvio);

  // Coeficiente de Variação dos desvios
  const cvDesvios = mediaDesvioPerc > 0 ? (desvioPadraoDesvio / mediaDesvioPerc) * 100 : 0;

  // Frequência de dias dentro do target (≤2%, ≤5%, >5%)
  const diasTarget2 = dadosValidos.filter(d => d.desvio_abs_pc <= 2).length;
  const diasAlerta = dadosValidos.filter(d => d.desvio_abs_pc > 2 && d.desvio_abs_pc <= 5).length;
  const diasCriticos = dadosValidos.filter(d => d.desvio_abs_pc > 5).length;
  const diasTarget5 = dadosValidos.filter(d => d.desvio_abs_pc <= 5).length;
  const diasTarget10 = dadosValidos.filter(d => d.desvio_abs_pc <= 10).length;
  const diasAcima10 = dadosValidos.filter(d => d.desvio_abs_pc > 10).length;

  // Percentuais
  const percTarget2 = (diasTarget2 / dadosValidos.length) * 100;
  const percAlerta = (diasAlerta / dadosValidos.length) * 100;
  const percCriticos = (diasCriticos / dadosValidos.length) * 100;
  const percTarget5 = (diasTarget5 / dadosValidos.length) * 100;
  const percTarget10 = (diasTarget10 / dadosValidos.length) * 100;
  const percAcima10 = (diasAcima10 / dadosValidos.length) * 100;

  // Tendência: sobre-consumo ou sub-consumo
  const sobreConsumo = dadosValidos.filter(d => d.realizado > d.previsto).length;
  const subConsumo = dadosValidos.filter(d => d.realizado < d.previsto).length;
  const exato = dadosValidos.filter(d => d.realizado === d.previsto).length;

  const percSobre = (sobreConsumo / dadosValidos.length) * 100;
  const percSub = (subConsumo / dadosValidos.length) * 100;

  // Classificação de precisão baseada na média de desvio
  const getPrecisaoColor = (desvio: number) => {
    if (desvio <= 2) return '#22C55E'; // Verde
    if (desvio <= 5) return '#EAB308'; // Amarelo
    if (desvio <= 10) return '#FB923C'; // Laranja
    return '#EF4444'; // Vermelho
  };

  const getPrecisaoText = (desvio: number) => {
    if (desvio <= 2) return 'Boa Precisão';
    if (desvio <= 5) return 'Necessita de Atenção';
    if (desvio <= 10) return 'Precisão Baixa';
    return 'Precisão Crítica';
  };

  const getPrecisaoTextColor = (desvio: number) => {
    if (desvio <= 2) return 'text-white';
    if (desvio <= 5) return 'text-gray-900';
    if (desvio <= 10) return 'text-gray-900';
    return 'text-white';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Desvio de Consumo MS - {formatarTitulo(curralLote)}
            </CardTitle>
            <CardDescription>Análise dos desvios entre previsto e realizado</CardDescription>
          </div>
          <div
            className={`px-3 py-1 rounded-full border-2 text-sm font-semibold ${getPrecisaoTextColor(mediaDesvioPerc)}`}
            style={{
              backgroundColor: getPrecisaoColor(mediaDesvioPerc),
              borderColor: getPrecisaoColor(mediaDesvioPerc),
            }}
          >
            {getPrecisaoText(mediaDesvioPerc)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Desvio Médio */}
          <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Desvio Médio
              </span>
              <Target className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {mediaDesvioPerc.toFixed(2)}%
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              ±{mediaDesvioAbs.toFixed(2)} kg
            </div>
          </div>

          {/* Dias no Target (≤2%) */}
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Dias no Target
              </span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {percTarget2.toFixed(2)}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              {diasTarget2} de {dadosValidos.length} dias ≤2%
            </div>
          </div>

          {/* Dias em Alerta (2-5%) */}
          <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                Dias em Alerta
              </span>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {percAlerta.toFixed(2)}%
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              {diasAlerta} de {dadosValidos.length} dias 2-5%
            </div>
          </div>

          {/* Dias Críticos (>5%) */}
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Dias Críticos
              </span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {percCriticos.toFixed(2)}%
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              {diasCriticos} de {dadosValidos.length} dias &gt;5%
            </div>
          </div>
        </div>

        {/* Distribuição de Desvios */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Distribuição dos Desvios
          </h4>

          {/* Barras de progresso */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Bom (≤2%)</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {diasTarget2} dias ({percTarget2.toFixed(2)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percTarget2}%`, backgroundColor: '#22C55E' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Moderado (2-5%)</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {diasAlerta} dias ({percAlerta.toFixed(2)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percAlerta}%`, backgroundColor: '#EAB308' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Crítico (&gt;5%)</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {diasCriticos} dias ({percCriticos.toFixed(2)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percCriticos}%`, backgroundColor: '#EF4444' }}
                />
              </div>
            </div>
          </div>

          {/* Análise de Tendência */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <TooltipProvider>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <div className="text-2xl font-bold text-orange-600">{sobreConsumo}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Sobre-consumo</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Dias em que o realizado foi maior que o previsto.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <div className="text-2xl font-bold text-gray-600">{exato}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Exato</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Dias em que o realizado foi exatamente igual ao previsto.
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <div className="text-2xl font-bold text-blue-600">{subConsumo}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Sub-consumo</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Dias em que o realizado foi menor que o previsto.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Interpretação */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              <strong>Interpretação:</strong>{' '}
              {mediaDesvioPerc <= 2
                ? `Excelente! ${percTarget2.toFixed(2)}% dos dias ficaram dentro do target ideal (≤2%). A previsão está muito precisa e o manejo está sendo executado conforme planejado.`
                : mediaDesvioPerc <= 5
                  ? `Atenção moderada. ${percAlerta.toFixed(2)}% dos dias ficaram em alerta (2-5%) e apenas ${percTarget2.toFixed(2)}% no target ideal. ${percSobre > percSub ? 'Há tendência de sobre-consumo - revise a formulação e controle de fornecimento.' : 'Há tendência de sub-consumo - investigue palatabilidade, saúde dos animais e disponibilidade de água.'}`
                  : percCriticos > 30
                    ? `Situação crítica! ${percCriticos.toFixed(2)}% dos dias tiveram desvios acima de 5%. ${percSobre > percSub ? 'Forte tendência de sobre-consumo indica possível subavaliação na formulação ou problemas graves de controle.' : 'Forte tendência de sub-consumo pode indicar problemas sérios de palatabilidade, saúde, competição ou disponibilidade de água.'}`
                    : `Precisão precisa melhorar. ${percCriticos.toFixed(2)}% dos dias ficaram críticos (>5%) e ${percAlerta.toFixed(2)}% em alerta (2-5%). ${percSobre > percSub ? 'Tendência de sobre-consumo - ajuste urgente na formulação.' : 'Tendência de sub-consumo - investigação necessária.'}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
