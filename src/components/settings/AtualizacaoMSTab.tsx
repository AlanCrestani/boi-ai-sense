import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Trash2, TrendingUp } from "lucide-react";
import { useIngredientes } from "@/hooks/useIngredientes";
import { useHistoricoMateriaSeca } from "@/hooks/useHistoricoMateriaSeca";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IngredienteAccordionContentProps {
  ingredienteId: string;
  ingredienteNome: string;
}

function IngredienteAccordionContent({ ingredienteId, ingredienteNome }: IngredienteAccordionContentProps) {
  const { historico, isLoading, isCreating, createHistoricoMS, deleteHistoricoMS } = useHistoricoMateriaSeca(ingredienteId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [novoValorMS, setNovoValorMS] = useState("");
  const [novaData, setNovaData] = useState("");

  const handleAdd = async () => {
    if (!novoValorMS) {
      return;
    }

    // Ajustar data para evitar problema de fuso horário
    let dataRegistro: string | undefined = undefined;
    if (novaData) {
      const [ano, mes, dia] = novaData.split('-');
      const dataLocal = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 12, 0, 0);
      dataRegistro = dataLocal.toISOString();
    }

    await createHistoricoMS({
      ingrediente_id: ingredienteId,
      valor_ms: parseFloat(novoValorMS),
      data_registro: dataRegistro,
    });

    setNovoValorMS("");
    setNovaData("");
    setIsAddOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este registro?")) {
      await deleteHistoricoMS(id);
    }
  };

  // Preparar dados para o gráfico (últimos 7 dias)
  const chartData = useMemo(() => {
    const hoje = startOfDay(new Date());
    const ultimosSete = Array.from({ length: 7 }, (_, i) => {
      const dia = subDays(hoje, 6 - i);
      return {
        data: format(dia, 'yyyy-MM-dd'),
        dataFormatada: format(dia, 'EEE', { locale: ptBR }),
        valor_ms: null as number | null,
        temLancamento: false,
      };
    });

    // Preencher com dados reais
    const historicoOrdenado = [...historico].sort((a, b) =>
      new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime()
    );

    let ultimoValor: number | null = null;

    ultimosSete.forEach((dia) => {
      const registroDia = historicoOrdenado.find((h) => {
        const dataRegistro = format(parseISO(h.data_registro), 'yyyy-MM-dd');
        return dataRegistro === dia.data;
      });

      if (registroDia) {
        dia.valor_ms = registroDia.valor_ms;
        dia.temLancamento = true;
        ultimoValor = registroDia.valor_ms;
      } else if (ultimoValor !== null) {
        // Repete o valor do dia anterior
        dia.valor_ms = ultimoValor;
        dia.temLancamento = false;
      }
    });

    return ultimosSete;
  }, [historico]);

  const ultimoValorMS = historico.length > 0 ? historico[0].valor_ms : null;

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Botão Novo Registro */}
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Matéria Seca</DialogTitle>
              <DialogDescription>
                Adicione um novo valor de MS para {ingredienteNome}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valor-ms" className="text-right">
                  Valor MS (%) *
                </Label>
                <Input
                  id="valor-ms"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={novoValorMS}
                  onChange={(e) => setNovoValorMS(e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: 35.50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data-registro" className="text-right">
                  Data
                </Label>
                <Input
                  id="data-registro"
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <p className="text-xs text-muted-foreground col-span-4 text-center">
                Se não informar a data, será registrado com a data/hora atual
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={isCreating || !novoValorMS}>
                {isCreating ? "Registrando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gráfico de Linha */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Variação de MS - Últimos 7 Dias</CardTitle>
              <CardDescription>
                {ultimoValorMS !== null && (
                  <span className="text-sm">
                    Última MS registrada: <span className="font-semibold text-foreground">{ultimoValorMS.toFixed(2)}%</span>
                  </span>
                )}
              </CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {chartData.some(d => d.valor_ms !== null) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="dataFormatada"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0, 100]}
                  tick={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: any) => [`${value?.toFixed(2)}%`, 'MS']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="valor_ms"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (!payload.temLancamento) return null;
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" />
                        <text
                          x={cx}
                          y={cy - 10}
                          textAnchor="middle"
                          fill="hsl(var(--foreground))"
                          fontSize="11"
                          fontWeight="600"
                        >
                          {payload.valor_ms?.toFixed(1)}%
                        </text>
                      </g>
                    );
                  }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nenhum dado registrado nos últimos 7 dias
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Registros</CardTitle>
          <CardDescription>Todos os registros de MS para {ingredienteNome}</CardDescription>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro de MS encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="text-right">Valor MS (%)</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>
                      {format(parseISO(registro.data_registro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {registro.valor_ms.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(registro.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AtualizacaoMSTab() {
  const { ingredientes, isLoading } = useIngredientes();

  const ingredientesComMS = useMemo(() => {
    return ingredientes
      .filter(ing => ing.ativo && ing.requer_atualizacao_ms)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [ingredientes]);

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (ingredientesComMS.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center max-w-md">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Nenhum Ingrediente Configurado
              </h3>
              <p className="text-sm text-muted-foreground">
                Não há ingredientes marcados para atualização de MS. Vá para a aba "Ingredientes" e marque os ingredientes que precisam de atualização de Matéria Seca.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atualização de Matéria Seca</CardTitle>
        <CardDescription>
          Registre e acompanhe as variações de MS dos ingredientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {ingredientesComMS.map((ingrediente) => (
            <AccordionItem key={ingrediente.id} value={ingrediente.id}>
              <AccordionTrigger className="hover:no-underline pr-0">
                <div className="flex items-center justify-between flex-1 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{ingrediente.nome}</span>
                    {ingrediente.codigo && (
                      <span className="text-sm text-muted-foreground">({ingrediente.codigo})</span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <IngredienteAccordionContent
                  ingredienteId={ingrediente.id}
                  ingredienteNome={ingrediente.nome}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
