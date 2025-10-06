import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { PlusCircle, Edit, Trash2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEscoresCocho, CreateEscoreCochoData, EscoreCocho } from "@/hooks/useEscoresCocho";

export function LeituraCochoTab() {
  const { escores, createEscore, updateEscore, deleteEscore, isLoading, isCreating, isUpdating } = useEscoresCocho();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEscore, setEditingEscore] = useState<EscoreCocho | null>(null);

  const [newEscore, setNewEscore] = useState<CreateEscoreCochoData>({
    escore: 0,
    ajuste_kg: 0.000,
    descricao: "",
    ativo: true,
    ordem: 0,
  });

  const handleAddEscore = () => {
    if (newEscore.escore === undefined || newEscore.ajuste_kg === undefined) {
      return;
    }

    createEscore(newEscore);
    setNewEscore({
      escore: 0,
      ajuste_kg: 0,
      descricao: "",
      ativo: true,
      ordem: escores.length + 1,
    });
    setIsAddOpen(false);
  };

  const handleOpenEdit = (escore: EscoreCocho) => {
    setEditingEscore(escore);
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditingEscore(null);
    setIsEditOpen(false);
  };

  const handleUpdateEscore = () => {
    if (!editingEscore) return;

    updateEscore({
      id: editingEscore.id,
      data: {
        escore: editingEscore.escore,
        ajuste_kg: editingEscore.ajuste_kg,
        descricao: editingEscore.descricao || undefined,
        ativo: editingEscore.ativo,
        ordem: editingEscore.ordem,
      },
    });
    handleCloseEdit();
  };

  const handleDeleteEscore = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este escore?')) {
      deleteEscore(id);
    }
  };

  const getAjusteBadgeColor = (ajuste: number) => {
    if (ajuste > 0) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (ajuste < 0) return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  const formatAjuste = (ajuste: number) => {
    if (ajuste > 0) return `+${ajuste.toFixed(3)} kg`;
    if (ajuste < 0) return `${ajuste.toFixed(3)} kg`;
    return `${ajuste.toFixed(3)} kg`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Escores de Leitura de Cocho
            </CardTitle>
            <CardDescription>
              Configure as notas de avaliação de cocho e seus respectivos ajustes de matéria seca
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Nova Nota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Nota de Escore</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova nota de avaliação e seu ajuste correspondente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="escore">Nota/Escore *</Label>
                    <Input
                      id="escore"
                      type="number"
                      value={newEscore.escore || 0}
                      onChange={(e) => setNewEscore({ ...newEscore, escore: parseInt(e.target.value) || 0 })}
                      placeholder="Ex: -2, 0, 1, 4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ajuste">Ajuste (kg) *</Label>
                    <Input
                      id="ajuste"
                      type="number"
                      step="0.001"
                      value={newEscore.ajuste_kg || 0}
                      onChange={(e) => setNewEscore({ ...newEscore, ajuste_kg: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 0.600, -0.200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={newEscore.descricao}
                    onChange={(e) => setNewEscore({ ...newEscore, descricao: e.target.value })}
                    placeholder="Ex: Cocho vazio - aumentar 600g"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem de Exibição</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={newEscore.ordem}
                    onChange={(e) => setNewEscore({ ...newEscore, ordem: parseInt(e.target.value) })}
                    placeholder="Ex: 1, 2, 3..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddEscore} disabled={isCreating}>
                  {isCreating ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Edição */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Nota de Escore</DialogTitle>
                <DialogDescription>
                  Atualize as informações da nota de avaliação
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-escore">Nota/Escore *</Label>
                    <Input
                      id="edit-escore"
                      type="number"
                      value={editingEscore?.escore || 0}
                      onChange={(e) => setEditingEscore(editingEscore ? { ...editingEscore, escore: parseInt(e.target.value) } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ajuste">Ajuste (kg) *</Label>
                    <Input
                      id="edit-ajuste"
                      type="number"
                      step="0.001"
                      value={editingEscore?.ajuste_kg || 0}
                      onChange={(e) => setEditingEscore(editingEscore ? { ...editingEscore, ajuste_kg: parseFloat(e.target.value) } : null)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Input
                    id="edit-descricao"
                    value={editingEscore?.descricao || ""}
                    onChange={(e) => setEditingEscore(editingEscore ? { ...editingEscore, descricao: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ordem">Ordem de Exibição</Label>
                  <Input
                    id="edit-ordem"
                    type="number"
                    value={editingEscore?.ordem || 0}
                    onChange={(e) => setEditingEscore(editingEscore ? { ...editingEscore, ordem: parseInt(e.target.value) } : null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseEdit}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateEscore} disabled={isUpdating}>
                  {isUpdating ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Nota/Escore</TableHead>
                <TableHead>Ajuste (kg)</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escores.map((escore) => (
                <TableRow key={escore.id}>
                  <TableCell className="font-medium">{escore.ordem}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {escore.escore}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getAjusteBadgeColor(escore.ajuste_kg)}>
                      {formatAjuste(escore.ajuste_kg)}
                    </Badge>
                  </TableCell>
                  <TableCell>{escore.descricao || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(escore)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEscore(escore.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
