import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, GripVertical, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRotasDistribuicao, CreateRotaData, RotaDistribuicao } from "@/hooks/useRotasDistribuicao";
import { useLotesPasto } from "@/hooks/useLotesPasto";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RotasTab() {
  const { rotas, createRota, updateRota, deleteRota, updateSequenciaLotes, isCreating, isUpdating, isUpdatingSequencia } = useRotasDistribuicao();
  const { lotes } = useLotesPasto();

  const [isAddRotaOpen, setIsAddRotaOpen] = useState(false);
  const [isEditRotaOpen, setIsEditRotaOpen] = useState(false);
  const [isEditSequenciaOpen, setIsEditSequenciaOpen] = useState(false);
  const [editingRota, setEditingRota] = useState<RotaDistribuicao | null>(null);

  const [newRota, setNewRota] = useState<CreateRotaData>({
    nome: "",
    descricao: "",
    ativo: true,
  });

  // Estado para gerenciar lotes selecionados na edição de sequência
  const [selectedLotes, setSelectedLotes] = useState<string[]>([]);

  const handleAddRota = () => {
    if (!newRota.nome) {
      return;
    }

    createRota(newRota);
    setNewRota({
      nome: "",
      descricao: "",
      ativo: true,
    });
    setIsAddRotaOpen(false);
  };

  const handleEditRota = (rota: RotaDistribuicao) => {
    setEditingRota(rota);
    setIsEditRotaOpen(true);
  };

  const handleUpdateRota = () => {
    if (!editingRota) return;

    updateRota({
      id: editingRota.id,
      data: {
        nome: editingRota.nome,
        descricao: editingRota.descricao,
        ativo: editingRota.ativo,
      },
    });
    setIsEditRotaOpen(false);
    setEditingRota(null);
  };

  const handleDeleteRota = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover esta rota?")) {
      deleteRota(id);
    }
  };

  const handleEditSequencia = (rota: RotaDistribuicao) => {
    setEditingRota(rota);
    const lotesIds = (rota.itens || []).map(item => item.lote_id);
    setSelectedLotes(lotesIds);
    setIsEditSequenciaOpen(true);
  };

  const handleUpdateSequencia = () => {
    if (!editingRota) return;

    updateSequenciaLotes({
      rotaId: editingRota.id,
      loteIds: selectedLotes,
    });
    setIsEditSequenciaOpen(false);
    setEditingRota(null);
    setSelectedLotes([]);
  };

  const handleAddLoteToSequencia = (loteId: string) => {
    if (!selectedLotes.includes(loteId)) {
      setSelectedLotes([...selectedLotes, loteId]);
    }
  };

  const handleRemoveLoteFromSequencia = (loteId: string) => {
    setSelectedLotes(selectedLotes.filter(id => id !== loteId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newLotes = [...selectedLotes];
    [newLotes[index - 1], newLotes[index]] = [newLotes[index], newLotes[index - 1]];
    setSelectedLotes(newLotes);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedLotes.length - 1) return;
    const newLotes = [...selectedLotes];
    [newLotes[index], newLotes[index + 1]] = [newLotes[index + 1], newLotes[index]];
    setSelectedLotes(newLotes);
  };

  const getLoteById = (loteId: string) => {
    return lotes.find(l => l.id === loteId);
  };

  // Filtrar apenas lotes ativos
  const lotesAtivos = lotes.filter(l => l.ativo);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rotas de Distribuição</CardTitle>
            <CardDescription>
              Gerencie rotas e a sequência de atendimento dos lotes
            </CardDescription>
          </div>
          <Dialog open={isAddRotaOpen} onOpenChange={setIsAddRotaOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nova Rota
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Rota</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova rota de distribuição
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    value={newRota.nome}
                    onChange={(e) => setNewRota({ ...newRota, nome: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: Rota Manhã, Rota Setor A"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descricao" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    value={newRota.descricao}
                    onChange={(e) => setNewRota({ ...newRota, descricao: e.target.value })}
                    className="col-span-3"
                    placeholder="Descrição opcional da rota"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddRotaOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddRota} disabled={isCreating}>
                  {isCreating ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Lotes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rotas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma rota cadastrada
                </TableCell>
              </TableRow>
            ) : (
              rotas.map((rota) => (
                <TableRow key={rota.id}>
                  <TableCell className="font-medium">{rota.nome}</TableCell>
                  <TableCell className="max-w-xs truncate">{rota.descricao || "-"}</TableCell>
                  <TableCell>{rota.itens?.length || 0} lotes</TableCell>
                  <TableCell>
                    <Badge variant={rota.ativo ? "default" : "secondary"}>
                      {rota.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSequencia(rota)}
                      >
                        <GripVertical className="h-4 w-4 mr-1" />
                        Sequência
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRota(rota)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRota(rota.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Modal de Edição */}
        <Dialog open={isEditRotaOpen} onOpenChange={setIsEditRotaOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Rota</DialogTitle>
              <DialogDescription>
                Atualize as informações da rota
              </DialogDescription>
            </DialogHeader>
            {editingRota && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nome" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="edit-nome"
                    value={editingRota.nome}
                    onChange={(e) =>
                      setEditingRota({ ...editingRota, nome: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-descricao" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="edit-descricao"
                    value={editingRota.descricao || ""}
                    onChange={(e) =>
                      setEditingRota({ ...editingRota, descricao: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditRotaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateRota} disabled={isUpdating}>
                {isUpdating ? "Atualizando..." : "Atualizar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Sequência */}
        <Dialog open={isEditSequenciaOpen} onOpenChange={setIsEditSequenciaOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Sequência - {editingRota?.nome}</DialogTitle>
              <DialogDescription>
                Defina a ordem de atendimento dos lotes nesta rota
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Seletor de Lote */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Adicionar Lote</Label>
                  <Select onValueChange={handleAddLoteToSequencia}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {lotesAtivos
                        .filter(l => !selectedLotes.includes(l.id))
                        .map((lote) => (
                          <SelectItem key={lote.id} value={lote.id}>
                            {lote.nome} - {lote.pasto?.nome || "Sem pasto"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista de Lotes Selecionados */}
              <div>
                <Label>Sequência de Lotes</Label>
                <div className="mt-2 space-y-2 border rounded-md p-2">
                  {selectedLotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum lote adicionado
                    </p>
                  ) : (
                    selectedLotes.map((loteId, index) => {
                      const lote = getLoteById(loteId);
                      return (
                        <div
                          key={loteId}
                          className="flex items-center gap-2 p-2 bg-secondary rounded"
                        >
                          <span className="font-semibold text-sm w-8">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="font-medium">{lote?.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {lote?.pasto?.nome || "Sem pasto"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === selectedLotes.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLoteFromSequencia(loteId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditSequenciaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateSequencia} disabled={isUpdatingSequencia}>
                {isUpdatingSequencia ? "Salvando..." : "Salvar Sequência"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}