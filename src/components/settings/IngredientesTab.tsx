import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIngredientes, CreateIngredienteData } from "@/hooks/useIngredientes";

export function IngredientesTab() {
  const { ingredientes, isLoading, isCreating, isUpdating, createIngrediente, updateIngrediente, deleteIngrediente } = useIngredientes();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingIngrediente, setEditingIngrediente] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [newIngrediente, setNewIngrediente] = useState<CreateIngredienteData>({
    nome: "",
    codigo: "",
    unidade_medida: "kg",
    tipo: "",
    ativo: true,
    requer_atualizacao_ms: false,
  });

  const handleAdd = async () => {
    if (!newIngrediente.nome) {
      return;
    }

    await createIngrediente(newIngrediente);
    setNewIngrediente({
      nome: "",
      codigo: "",
      unidade_medida: "kg",
      tipo: "",
      ativo: true,
      requer_atualizacao_ms: false,
    });
    setIsAddOpen(false);
  };

  const handleEdit = (ingrediente: any) => {
    setEditingIngrediente({ ...ingrediente });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingIngrediente) return;

    await updateIngrediente(editingIngrediente.id, {
      nome: editingIngrediente.nome,
      codigo: editingIngrediente.codigo,
      unidade_medida: editingIngrediente.unidade_medida,
      tipo: editingIngrediente.tipo,
      ativo: editingIngrediente.ativo,
      requer_atualizacao_ms: editingIngrediente.requer_atualizacao_ms,
    });
    setIsEditOpen(false);
    setEditingIngrediente(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este ingrediente?")) {
      await deleteIngrediente(id);
    }
  };

  const handleToggleStatus = (ingrediente: any) => {
    if (ingrediente.ativo) {
      updateIngrediente(ingrediente.id, { ativo: false });
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const filteredIngredientes = useMemo(() => {
    let filtered = ingredientes;

    if (!showInactive) {
      filtered = filtered.filter(ing => ing.ativo);
    }

    if (searchTerm) {
      filtered = filtered.filter(ing =>
        ing.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ing.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ing.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "nome":
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
          break;
        case "codigo":
          aValue = a.codigo?.toLowerCase() || "";
          bValue = b.codigo?.toLowerCase() || "";
          break;
        case "tipo":
          aValue = a.tipo?.toLowerCase() || "";
          bValue = b.tipo?.toLowerCase() || "";
          break;
        case "unidade_medida":
          aValue = a.unidade_medida.toLowerCase();
          bValue = b.unidade_medida.toLowerCase();
          break;
        case "status":
          aValue = a.ativo ? 1 : 0;
          bValue = b.ativo ? 1 : 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [ingredientes, showInactive, searchTerm, sortBy, sortOrder]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ingredientes</CardTitle>
            <CardDescription>
              Gerencie os ingredientes disponíveis
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Ingrediente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Ingrediente</DialogTitle>
                <DialogDescription>
                  Cadastre um novo ingrediente
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">
                    Nome *
                  </Label>
                  <Input
                    id="nome"
                    value={newIngrediente.nome}
                    onChange={(e) => setNewIngrediente({ ...newIngrediente, nome: e.target.value })}
                    className="col-span-3"
                    placeholder="Nome do ingrediente"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="codigo" className="text-right">
                    Código
                  </Label>
                  <Input
                    id="codigo"
                    value={newIngrediente.codigo}
                    onChange={(e) => setNewIngrediente({ ...newIngrediente, codigo: e.target.value })}
                    className="col-span-3"
                    placeholder="Código/SKU"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={newIngrediente.tipo}
                    onValueChange={(value) => setNewIngrediente({ ...newIngrediente, tipo: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volumoso">Volumoso</SelectItem>
                      <SelectItem value="proteico">Proteico</SelectItem>
                      <SelectItem value="energetico">Energético</SelectItem>
                      <SelectItem value="mineral">Mineral</SelectItem>
                      <SelectItem value="aditivo">Aditivo</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unidade" className="text-right">
                    Unidade
                  </Label>
                  <Select
                    value={newIngrediente.unidade_medida}
                    onValueChange={(value) => setNewIngrediente({ ...newIngrediente, unidade_medida: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg (quilograma)</SelectItem>
                      <SelectItem value="ton">ton (tonelada)</SelectItem>
                      <SelectItem value="sc">sc (saco)</SelectItem>
                      <SelectItem value="un">un (unidade)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="requer-ms" className="text-right">
                    Atualização MS
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Switch
                      id="requer-ms"
                      checked={newIngrediente.requer_atualizacao_ms}
                      onCheckedChange={(checked) =>
                        setNewIngrediente({ ...newIngrediente, requer_atualizacao_ms: checked })
                      }
                    />
                    <Label htmlFor="requer-ms" className="text-sm text-muted-foreground cursor-pointer">
                      Requer atualização de Matéria Seca
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdd} disabled={isCreating}>
                  {isCreating ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, código ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive-ingredientes"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive-ingredientes" className="cursor-pointer">
              Mostrar inativos
            </Label>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("nome")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  Nome
                  {sortBy === "nome" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="w-[15%]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("codigo")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  Código
                  {sortBy === "codigo" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="w-[15%]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("tipo")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  Tipo
                  {sortBy === "tipo" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="w-[15%]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("unidade_medida")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  Unidade
                  {sortBy === "unidade_medida" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="w-[10%]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  Status
                  {sortBy === "status" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="w-[15%]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIngredientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum ingrediente encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredIngredientes.map((ingrediente) => (
                <TableRow key={ingrediente.id}>
                  <TableCell className="font-medium">{ingrediente.nome}</TableCell>
                  <TableCell>{ingrediente.codigo || "-"}</TableCell>
                  <TableCell>{ingrediente.tipo || "-"}</TableCell>
                  <TableCell>{ingrediente.unidade_medida}</TableCell>
                  <TableCell>
                    <Badge
                      variant={ingrediente.ativo ? "default" : "secondary"}
                      className={ingrediente.ativo ? "cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" : ""}
                      onClick={() => handleToggleStatus(ingrediente)}
                    >
                      {ingrediente.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(ingrediente)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ingrediente.id)}
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
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Ingrediente</DialogTitle>
              <DialogDescription>
                Atualize as informações do ingrediente
              </DialogDescription>
            </DialogHeader>
            {editingIngrediente && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nome" className="text-right">
                    Nome *
                  </Label>
                  <Input
                    id="edit-nome"
                    value={editingIngrediente.nome}
                    onChange={(e) =>
                      setEditingIngrediente({ ...editingIngrediente, nome: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-codigo" className="text-right">
                    Código
                  </Label>
                  <Input
                    id="edit-codigo"
                    value={editingIngrediente.codigo || ""}
                    onChange={(e) =>
                      setEditingIngrediente({ ...editingIngrediente, codigo: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-tipo" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={editingIngrediente.tipo || ""}
                    onValueChange={(value) =>
                      setEditingIngrediente({ ...editingIngrediente, tipo: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volumoso">Volumoso</SelectItem>
                      <SelectItem value="proteico">Proteico</SelectItem>
                      <SelectItem value="energetico">Energético</SelectItem>
                      <SelectItem value="mineral">Mineral</SelectItem>
                      <SelectItem value="aditivo">Aditivo</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-unidade" className="text-right">
                    Unidade
                  </Label>
                  <Select
                    value={editingIngrediente.unidade_medida}
                    onValueChange={(value) =>
                      setEditingIngrediente({ ...editingIngrediente, unidade_medida: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg (quilograma)</SelectItem>
                      <SelectItem value="ton">ton (tonelada)</SelectItem>
                      <SelectItem value="sc">sc (saco)</SelectItem>
                      <SelectItem value="un">un (unidade)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-ativo" className="text-right">
                    Ativo
                  </Label>
                  <Switch
                    id="edit-ativo"
                    checked={editingIngrediente.ativo}
                    onCheckedChange={(checked) =>
                      setEditingIngrediente({ ...editingIngrediente, ativo: checked })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-requer-ms" className="text-right">
                    Atualização MS
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Switch
                      id="edit-requer-ms"
                      checked={editingIngrediente.requer_atualizacao_ms || false}
                      onCheckedChange={(checked) =>
                        setEditingIngrediente({ ...editingIngrediente, requer_atualizacao_ms: checked })
                      }
                    />
                    <Label htmlFor="edit-requer-ms" className="text-sm text-muted-foreground cursor-pointer">
                      Requer atualização de Matéria Seca
                    </Label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? "Atualizando..." : "Atualizar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}