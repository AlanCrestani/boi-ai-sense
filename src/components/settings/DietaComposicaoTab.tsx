import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useDietas } from "@/hooks/useDietas";
import { useIngredientes } from "@/hooks/useIngredientes";
import { useDietaComposicao, CreateDietaComposicaoData, DietaComposicao } from "@/hooks/useDietaComposicao";

// Funções auxiliares de formatação
const formatKg = (valor?: number): string => {
  return valor ? `${valor.toFixed(2)} kg` : "0.00 kg";
};

const formatPercent = (valor?: number): string => {
  return valor ? `${(valor * 100).toFixed(2)}%` : "0.00%";
};

const formatCurrency = (valor?: number): string => {
  return valor ? `R$ ${valor.toFixed(2)}` : "R$ 0.00";
};

// Componente para renderizar o badge de tipo
function getTipoBadgeClass(tipo: string) {
  switch (tipo) {
    case 'adaptacao': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'crescimento': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'terminacao': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'recria': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'pre-mistura': return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
    case 'proteinado': return 'bg-green-700/10 text-green-700 border-green-700/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}

function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    'adaptacao': 'Adaptação',
    'crescimento': 'Crescimento',
    'terminacao': 'Terminação',
    'recria': 'Recria',
    'pre-mistura': 'Pré-Mistura',
    'proteinado': 'Proteinado',
  };
  return labels[tipo] || tipo;
}

// Componente interno para cada dieta no accordion
function DietaAccordionContent({ dietaId, dietaNome }: { dietaId: string; dietaNome: string }) {
  const { ingredientes } = useIngredientes();

  const {
    composicao,
    createComposicao,
    updateComposicao,
    deleteComposicao,
    isCreating,
    isUpdating,
    calcularTotais,
  } = useDietaComposicao(dietaId);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DietaComposicao | null>(null);

  const [newItem, setNewItem] = useState<CreateDietaComposicaoData>({
    dieta_id: dietaId,
    ingrediente_id: "",
    cons_ms_kg: 0,
    percentual_ms: 0.8850,
    custo_mo_ton: 0,
    local_mistura: "vagao",
    ordem_mistura: 1,
  });

  const [percentualMSInput, setPercentualMSInput] = useState<string>("88.50");
  const [percentualMSEditInput, setPercentualMSEditInput] = useState<string>("88.50");

  const handleAddItem = () => {
    if (!dietaId || !newItem.ingrediente_id || newItem.cons_ms_kg <= 0) {
      return;
    }

    createComposicao({
      ...newItem,
      dieta_id: dietaId,
    });

    setNewItem({
      dieta_id: dietaId,
      ingrediente_id: "",
      cons_ms_kg: 0,
      percentual_ms: 0.8850,
      custo_mo_ton: 0,
      local_mistura: "vagao",
      ordem_mistura: composicao.length + 1,
    });
    setPercentualMSInput("88.50");
    setIsAddOpen(false);
  };

  const handleEditItem = (item: DietaComposicao) => {
    setEditingItem(item);
    setPercentualMSEditInput((item.percentual_ms * 100).toFixed(2));
    setIsEditOpen(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    updateComposicao({
      id: editingItem.id,
      data: {
        cons_ms_kg: editingItem.cons_ms_kg,
        percentual_ms: editingItem.percentual_ms,
        custo_mo_ton: editingItem.custo_mo_ton,
        local_mistura: editingItem.local_mistura,
        ordem_mistura: editingItem.ordem_mistura,
        observacoes: editingItem.observacoes,
      },
    });
    setIsEditOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este ingrediente da dieta?")) {
      deleteComposicao(id);
    }
  };

  const totais = calcularTotais();

  return (
    <div className="space-y-4">
      {/* Botão para adicionar ingrediente */}
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Ingrediente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Ingrediente</DialogTitle>
              <DialogDescription>
                Adicione um ingrediente à dieta {dietaNome}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ingrediente" className="text-right">
                  Ingrediente *
                </Label>
                <Select
                  value={newItem.ingrediente_id}
                  onValueChange={(value) => setNewItem({ ...newItem, ingrediente_id: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredientes.filter(i => i.ativo).map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.nome} {ing.codigo && `(${ing.codigo})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cons_ms" className="text-right">
                  Cons MS (Kg) *
                </Label>
                <Input
                  id="cons_ms"
                  type="number"
                  step="0.01"
                  value={newItem.cons_ms_kg}
                  onChange={(e) => setNewItem({ ...newItem, cons_ms_kg: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="percentual_ms" className="text-right">
                  %MS *
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="percentual_ms"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={percentualMSInput}
                    onChange={(e) => {
                      const percentual = e.target.value;
                      setPercentualMSInput(percentual);
                      const decimal = parseFloat(percentual) / 100;
                      setNewItem({ ...newItem, percentual_ms: decimal });
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="custo_mo" className="text-right">
                  Custo MO (R$/Ton)
                </Label>
                <Input
                  id="custo_mo"
                  type="number"
                  step="0.01"
                  value={newItem.custo_mo_ton || 0}
                  onChange={(e) => setNewItem({ ...newItem, custo_mo_ton: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="local_mistura" className="text-right">
                  Local Mistura
                </Label>
                <Select
                  value={newItem.local_mistura}
                  onValueChange={(value: 'vagao' | 'pre-mistura') =>
                    setNewItem({ ...newItem, local_mistura: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vagao">Vagão</SelectItem>
                    <SelectItem value="pre-mistura">Pré-Mistura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddItem} disabled={isCreating}>
                {isCreating ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de composição */}
      {composicao.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum ingrediente adicionado a esta dieta
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead>Cons MS (Kg)</TableHead>
                <TableHead>%MS</TableHead>
                <TableHead>Cons MO (Kg)</TableHead>
                <TableHead>Custo MO</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {composicao.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {ingredientes.find(i => i.id === item.ingrediente_id)?.nome || "N/A"}
                  </TableCell>
                  <TableCell>{formatKg(item.cons_ms_kg)}</TableCell>
                  <TableCell>{formatPercent(item.percentual_ms)}</TableCell>
                  <TableCell>{formatKg(item.cons_mo_kg)}</TableCell>
                  <TableCell>{formatCurrency(item.custo_mo_ton)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.local_mistura === 'vagao' ? 'Vagão' : 'Pré-Mistura'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.ordem_mistura}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Card de Totais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Totais da Dieta</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground">Total Cons MS</Label>
                <p className="text-lg font-semibold">{formatKg(totais.totalConsMS)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Total Cons MO</Label>
                <p className="text-lg font-semibold">{formatKg(totais.totalConsMO)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Custo da Diária Alimentar</Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(
                    composicao.reduce((total, item) => {
                      // SOMARPRODUTO((Cons MO; Custo MO)/1000)
                      // Divide por 1000 porque custo_mo_ton está em R$/tonelada e cons_mo_kg em kg
                      const produto = (item.cons_mo_kg || 0) * (item.custo_mo_ton || 0);
                      return total + (produto / 1000);
                    }, 0)
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">MS Prevista da Dieta</Label>
                <p className="text-lg font-semibold">
                  {totais.totalConsMO > 0
                    ? `${((totais.totalConsMS / totais.totalConsMO) * 100).toFixed(2)}%`
                    : "0.00%"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Ingrediente</DialogTitle>
            <DialogDescription>
              Atualize as informações do ingrediente na dieta {dietaNome}
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ingrediente</Label>
                <p className="col-span-3 font-medium">
                  {ingredientes.find(i => i.id === editingItem.ingrediente_id)?.nome || "N/A"}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cons_ms" className="text-right">
                  Cons MS (Kg) *
                </Label>
                <Input
                  id="edit-cons_ms"
                  type="number"
                  step="0.01"
                  value={editingItem.cons_ms_kg}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, cons_ms_kg: parseFloat(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-percentual_ms" className="text-right">
                  %MS *
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="edit-percentual_ms"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={percentualMSEditInput}
                    onChange={(e) => {
                      const percentual = e.target.value;
                      setPercentualMSEditInput(percentual);
                      const decimal = parseFloat(percentual) / 100;
                      setEditingItem({ ...editingItem, percentual_ms: decimal });
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-custo_mo" className="text-right">
                  Custo MO (R$/Ton)
                </Label>
                <Input
                  id="edit-custo_mo"
                  type="number"
                  step="0.01"
                  value={editingItem.custo_mo_ton || 0}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, custo_mo_ton: parseFloat(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-local_mistura" className="text-right">
                  Local Mistura
                </Label>
                <Select
                  value={editingItem.local_mistura}
                  onValueChange={(value: 'vagao' | 'pre-mistura') =>
                    setEditingItem({ ...editingItem, local_mistura: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vagao">Vagão</SelectItem>
                    <SelectItem value="pre-mistura">Pré-Mistura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ordem" className="text-right">
                  Ordem Mistura
                </Label>
                <Input
                  id="edit-ordem"
                  type="number"
                  min="1"
                  value={editingItem.ordem_mistura}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, ordem_mistura: parseInt(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-obs" className="text-right">
                  Observações
                </Label>
                <Textarea
                  id="edit-obs"
                  value={editingItem.observacoes || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, observacoes: e.target.value })
                  }
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateItem} disabled={isUpdating}>
              {isUpdating ? "Atualizando..." : "Atualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente principal
export function DietaComposicaoTab() {
  const { dietas } = useDietas();

  // Ordem de exibição das dietas
  const ordemTipos = ['mineral', 'pre-mistura', 'proteinado', 'recria', 'adaptacao', 'crescimento', 'terminacao'];

  const dietasAtivas = dietas
    .filter(d => d.ativo)
    .sort((a, b) => {
      const indexA = ordemTipos.indexOf(a.tipo);
      const indexB = ordemTipos.indexOf(b.tipo);

      // Se o tipo não está na lista, coloca no final
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composição de Dietas</CardTitle>
        <CardDescription>
          Clique em uma dieta para visualizar ou editar seus ingredientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dietasAtivas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma dieta ativa encontrada. Cadastre dietas na aba "Dietas" primeiro.
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {dietasAtivas.map((dieta) => (
              <AccordionItem key={dieta.id} value={dieta.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-semibold">{dieta.nome}</span>
                    <Badge variant="outline" className={getTipoBadgeClass(dieta.tipo)}>
                      {getTipoLabel(dieta.tipo)}
                    </Badge>
                    {dieta.cms_kg_dia && (
                      <span className="text-sm text-muted-foreground">
                        CMS: {dieta.cms_kg_dia} kg/dia
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <DietaAccordionContent dietaId={dieta.id} dietaNome={dieta.nome} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
