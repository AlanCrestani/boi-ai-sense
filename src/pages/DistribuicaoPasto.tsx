import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Package, Calendar } from "lucide-react";
import { useLotesPasto } from "@/hooks/useLotesPasto";
import { useDistribuicaoPasto, DistribuicaoPasto as DistribuicaoPastoType } from "@/hooks/useDistribuicaoPasto";
import { useDietas } from "@/hooks/useDietas";
import { useEstoqueInsumosPasto } from "@/hooks/useEstoqueInsumosPasto";
import { useRotasDistribuicao } from "@/hooks/useRotasDistribuicao";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DistribuicaoModal } from "@/components/DistribuicaoModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DIAS_SEMANA = [
  { value: 1, label: "Dom", fullLabel: "Domingo" },
  { value: 2, label: "Seg", fullLabel: "Segunda" },
  { value: 3, label: "Ter", fullLabel: "Terça" },
  { value: 4, label: "Qua", fullLabel: "Quarta" },
  { value: 5, label: "Qui", fullLabel: "Quinta" },
  { value: 6, label: "Sex", fullLabel: "Sexta" },
  { value: 7, label: "Sáb", fullLabel: "Sábado" },
];

export default function DistribuicaoPasto() {
  const { lotes } = useLotesPasto();
  const { calcularPesoAtual, calcularConsumoPrevisto, createDistribuicao, isCreating, distribuicoes } = useDistribuicaoPasto();
  const { dietas } = useDietas();
  const { saldos } = useEstoqueInsumosPasto();
  const { rotas } = useRotasDistribuicao();

  const [rotaSelecionada, setRotaSelecionada] = useState<string | undefined>(undefined);
  const [dietaSelecionada, setDietaSelecionada] = useState<string>("");
  const [modalAberto, setModalAberto] = useState(false);
  const [loteAtual, setLoteAtual] = useState<any>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [dataLancamento, setDataLancamento] = useState<string>(new Date().toISOString().split('T')[0]);

  // Controle de estoque local para performance
  const [saldoEstoqueLocal, setSaldoEstoqueLocal] = useState<number>(0);
  const [distribuicoesLocais, setDistribuicoesLocais] = useState<Array<{
    lote_id: string;
    quantidade: number;
  }>>([]);

  // Filtrar apenas lotes ativos
  const lotesAtivos = lotes.filter(l => l.ativo);

  // Ordenar lotes pela rota selecionada
  const lotesOrdenados = rotaSelecionada
    ? (() => {
        const rota = rotas.find(r => r.id === rotaSelecionada);
        if (!rota || !rota.itens) return lotesAtivos;

        const lotesNaRota = rota.itens
          .sort((a, b) => a.sequencia - b.sequencia)
          .map(item => lotesAtivos.find(l => l.id === item.lote_id))
          .filter(Boolean);

        const lotesForaDaRota = lotesAtivos.filter(
          l => !rota.itens?.some(item => item.lote_id === l.id)
        );

        return [...lotesNaRota, ...lotesForaDaRota];
      })()
    : lotesAtivos;

  // Buscar primeira dieta de proteinado ativa (mantém compatibilidade)
  const dietaProteinado = dietas.find(d => d.tipo === 'proteinado' && d.ativo);
  const dietaSelecionadaObj = dietaSelecionada
    ? dietas.find(d => d.id === dietaSelecionada)
    : dietaProteinado;

  // Buscar saldo de proteinado
  const saldoProteinado = saldos.find(s => s.ingrediente.toLowerCase().includes('proteinado'));

  const abrirModalLote = (lote: any, indice: number) => {
    if (!dietaSelecionadaObj) {
      alert("Selecione uma dieta antes de iniciar a distribuição");
      return;
    }

    // Verificar se já existe lançamento para esta data
    const jaTemLancamento = distribuicoes.some(d =>
      d.lote_id === lote.id &&
      d.data_registro === dataLancamento &&
      d.status !== 'cancelado'
    );

    if (jaTemLancamento) {
      const confirmar = window.confirm(
        `Já existe um lançamento para o lote ${lote.nome} na data ${new Date(dataLancamento).toLocaleDateString('pt-BR')}.\n\nDeseja fazer um novo lançamento mesmo assim?`
      );
      if (!confirmar) return;
    }

    // Inicializar saldo local quando abrir o modal
    const nomeIngrediente = `Proteinado - ${dietaSelecionadaObj.nome}`;
    const saldoAtual = saldos.find(s => s.ingrediente === nomeIngrediente)?.saldo_atual_kg || 0;
    setSaldoEstoqueLocal(saldoAtual);
    setDistribuicoesLocais([]);

    setLoteAtual(lote);
    setIndiceAtual(indice);
    setModalAberto(true);
  };

  const handleConfirmarDistribuicao = async (data: {
    diasSelecionados: number[];
    consumoRealizado?: number;
    cochoVazio: boolean;
    cochoComSobra: boolean;
    observacoes: string;
  }) => {
    if (!loteAtual || !dietaSelecionadaObj) return;

    const pesoAtual = calcularPesoAtual(loteAtual);
    const consumoPrevisto = calcularConsumoPrevisto(
      pesoAtual,
      dietaSelecionadaObj.cms_percentual_peso_vivo,
      loteAtual.quantidade_animais || 0,
      data.diasSelecionados.length
    );

    // Atualizar saldo local IMEDIATAMENTE (sem aguardar trigger)
    if (data.consumoRealizado) {
      setSaldoEstoqueLocal(prev => prev - data.consumoRealizado!);
      setDistribuicoesLocais(prev => [...prev, {
        lote_id: loteAtual.id,
        quantidade: data.consumoRealizado!
      }]);
    }

    // Calcular desvio
    const desvio_kg = data.consumoRealizado !== undefined ? data.consumoRealizado - consumoPrevisto : null;
    const desvio_percentual = data.consumoRealizado !== undefined && consumoPrevisto > 0
      ? (desvio_kg! / consumoPrevisto) * 100
      : null;

    createDistribuicao({
      lote_id: loteAtual.id,
      dieta_id: dietaSelecionadaObj.id,
      dias_fornecimento: data.diasSelecionados,
      quantidade_dias_selecionados: data.diasSelecionados.length,
      peso_medio_atual_kg: pesoAtual,
      quantidade_animais: loteAtual.quantidade_animais || 0,
      cms_percentual: dietaSelecionadaObj.cms_percentual_peso_vivo,
      consumo_previsto_kg: consumoPrevisto,
      consumo_realizado_kg: data.consumoRealizado || null,
      desvio_kg: desvio_kg,
      desvio_percentual: desvio_percentual,
      rota_id: rotaSelecionada || undefined,
      data_registro: dataLancamento, // Passar data selecionada
    });

    // Avançar para o próximo lote se houver, mantendo o modal aberto
    if (indiceAtual < lotesOrdenados.length - 1) {
      const proximoLote = lotesOrdenados[indiceAtual + 1];
      if (proximoLote) {
        setLoteAtual(proximoLote);
        setIndiceAtual(indiceAtual + 1);
      }
    } else {
      // Se for o último lote, fechar o modal
      setModalAberto(false);
    }
  };

  const formatKg = (valor: number): string => {
    return `${valor.toFixed(2)} kg`;
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 py-2 sm:py-8 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                Distribuição de Proteinado
              </h1>
              <p className="text-sm sm:text-base text-text-secondary">
                Registre o fornecimento de proteinado nos lotes de pasto
              </p>
            </div>
          </div>

          {/* Cards de Informações */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Proteinado</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {saldoProteinado ? formatKg(saldoProteinado.saldo_atual_kg) : "0.00 kg"}
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo atual disponível
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Data de registro
              </p>
            </CardContent>
          </Card>
        </div>

          {/* Filtros */}
          <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione data, rota e dieta para distribuição</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="data-lancamento">Data do Lançamento</Label>
                <Input
                  id="data-lancamento"
                  type="date"
                  value={dataLancamento}
                  onChange={(e) => setDataLancamento(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Rota de Distribuição</Label>
                <Select value={rotaSelecionada || "none"} onValueChange={(value) => setRotaSelecionada(value === "none" ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma rota (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem rota específica</SelectItem>
                    {rotas.filter(r => r.ativo).map((rota) => (
                      <SelectItem key={rota.id} value={rota.id}>
                        {rota.nome} ({rota.itens?.length || 0} lotes)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dieta</Label>
                <Select value={dietaSelecionada} onValueChange={setDietaSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder={dietaProteinado ? dietaProteinado.nome : "Selecione uma dieta"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dietas
                      .filter(d => d.tipo === 'proteinado' && d.ativo)
                      .map((dieta) => (
                        <SelectItem key={dieta.id} value={dieta.id}>
                          {dieta.nome} (CMS: {(dieta.cms_percentual_peso_vivo * 100).toFixed(2)}%)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Lista de Lotes */}
          {!rotaSelecionada || !dietaSelecionadaObj ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Selecione uma rota e uma dieta para visualizar os lotes disponíveis
                </p>
              </CardContent>
            </Card>
          ) : lotesOrdenados.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Nenhum lote ativo encontrado
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Lotes para Distribuição</CardTitle>
                  <CardDescription>Clique em um lote para iniciar a distribuição</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {lotesOrdenados.map((lote, index) => {
                      if (!lote) return null;

                      const pesoAtual = calcularPesoAtual(lote);
                      const consumoPrevisto = dietaSelecionadaObj
                        ? calcularConsumoPrevisto(
                            pesoAtual,
                            dietaSelecionadaObj.cms_percentual_peso_vivo,
                            lote.quantidade_animais || 0,
                            1 // Assumir 1 dia para preview
                          )
                        : 0;

                      // Verificar se já foi lançado para hoje (considerando dias_fornecimento)
                      const hoje = new Date();
                      const diaHoje = hoje.getDay() === 0 ? 7 : hoje.getDay(); // Converter domingo de 0 para 7

                      const jaLancado = distribuicoes.some(d => {
                        if (d.lote_id !== lote.id || d.status === 'cancelado') return false;

                        // Verificar se hoje está dentro dos dias fornecidos neste lançamento
                        if (!d.dias_fornecimento || d.dias_fornecimento.length === 0) return false;

                        // Verificar se o dia de hoje (da semana) está na lista de dias fornecidos
                        return d.dias_fornecimento.includes(diaHoje);
                      });

                      return (
                        <button
                          key={lote.id}
                          onClick={() => abrirModalLote(lote, index)}
                          className={`text-left p-4 border-2 rounded-lg transition-all ${
                            jaLancado
                              ? 'border-[#16a34a] bg-[#16a34a] text-white hover:bg-[#15803d]'
                              : 'border-muted hover:border-[#16a34a] hover:bg-[#16a34a]/5'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {rotaSelecionada && (
                                <Badge variant="outline" className={`text-xs px-1.5 py-0 ${jaLancado ? 'border-white/50 text-white' : ''}`}>
                                  #{index + 1}
                                </Badge>
                              )}
                              <span className="font-semibold text-sm">{lote.nome}</span>
                            </div>
                            <Badge variant={jaLancado ? "secondary" : "default"} className={`text-xs ${jaLancado ? 'bg-white/20 text-white border-white/30' : ''}`}>
                              {lote.quantidade_animais || 0}
                            </Badge>
                          </div>
                          <p className={`text-xs mb-2 ${jaLancado ? 'text-white/90' : 'text-muted-foreground'}`}>
                            {lote.pasto?.setor?.nome} - {lote.pasto?.nome}
                          </p>
                          <div className={`text-xs ${jaLancado ? 'text-white/80' : 'text-muted-foreground'}`}>
                            Peso: {formatKg(pesoAtual)} • {dietaSelecionadaObj?.nome || "Sem dieta"}
                            {jaLancado && <span className="ml-2 font-semibold">✓ Lançado</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Resumo */}
              {distribuicoes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuições Lançadas Hoje</CardTitle>
                    <CardDescription>Resumo das distribuições registradas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lote</TableHead>
                            <TableHead>Dieta</TableHead>
                            <TableHead>Dias</TableHead>
                            <TableHead>Previsto</TableHead>
                            <TableHead>Realizado</TableHead>
                            <TableHead>Desvio</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {distribuicoes
                            .filter(d => {
                              const hoje = new Date().toISOString().split('T')[0];
                              return d.data_registro === hoje;
                            })
                            .slice(0, 10)
                            .map((dist) => {
                              const lote = lotes.find(l => l.id === dist.lote_id);
                              const dieta = dietas.find(d => d.id === dist.dieta_id);

                              return (
                                <TableRow key={dist.id}>
                                  <TableCell className="font-medium">{lote?.nome || dist.lote_id}</TableCell>
                                  <TableCell>{dieta?.nome || "N/A"}</TableCell>
                                  <TableCell>{dist.quantidade_dias_selecionados}</TableCell>
                                  <TableCell>{formatKg(dist.consumo_previsto_kg)}</TableCell>
                                  <TableCell>
                                    {dist.consumo_realizado_kg ? formatKg(dist.consumo_realizado_kg) : "-"}
                                  </TableCell>
                                  <TableCell>
                                    {dist.desvio_kg !== null ? (
                                      <span className={dist.desvio_kg >= 0 ? "text-green-600" : "text-red-600"}>
                                        {dist.desvio_kg > 0 ? "+" : ""}{dist.desvio_kg.toFixed(2)} kg
                                      </span>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        dist.status === 'concluido' ? 'default' :
                                        dist.status === 'em_andamento' ? 'secondary' :
                                        'outline'
                                      }
                                    >
                                      {dist.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Modal de Distribuição */}
          {loteAtual && dietaSelecionadaObj && (
            <DistribuicaoModal
              isOpen={modalAberto}
              onClose={() => setModalAberto(false)}
              lote={loteAtual}
              dieta={dietaSelecionadaObj}
              pesoAtual={calcularPesoAtual(loteAtual)}
              consumoPrevisto={calcularConsumoPrevisto(
                calcularPesoAtual(loteAtual),
                dietaSelecionadaObj.cms_percentual_peso_vivo,
                loteAtual.quantidade_animais || 0,
                1
              )}
              sequencia={rotaSelecionada ? indiceAtual + 1 : undefined}
              onConfirm={handleConfirmarDistribuicao}
              isLoading={isCreating}
              saldoEstoqueLocal={saldoEstoqueLocal}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}