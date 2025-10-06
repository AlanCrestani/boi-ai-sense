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
import { useFornecedores, CreateFornecedorData } from "@/hooks/useFornecedores";

export function FornecedoresTab() {
  const { fornecedores, isLoading, isCreating, isUpdating, createFornecedor, updateFornecedor, deleteFornecedor } = useFornecedores();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [newFornecedor, setNewFornecedor] = useState<CreateFornecedorData>({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    ativo: true,
  });

  const handleAdd = async () => {
    if (!newFornecedor.nome) {
      return;
    }

    await createFornecedor(newFornecedor);
    setNewFornecedor({
      nome: "",
      cnpj: "",
      telefone: "",
      email: "",
      ativo: true,
    });
    setIsAddOpen(false);
  };

  const handleEdit = (fornecedor: any) => {
    setEditingFornecedor(fornecedor);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingFornecedor) return;

    await updateFornecedor(editingFornecedor.id, {
      nome: editingFornecedor.nome,
      cnpj: editingFornecedor.cnpj,
      telefone: editingFornecedor.telefone,
      email: editingFornecedor.email,
      ativo: editingFornecedor.ativo,
    });
    setIsEditOpen(false);
    setEditingFornecedor(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este fornecedor?")) {
      await deleteFornecedor(id);
    }
  };

  const handleToggleStatus = (fornecedor: any) => {
    if (fornecedor.ativo) {
      updateFornecedor(fornecedor.id, { ativo: false });
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

  const filteredFornecedores = useMemo(() => {
    let filtered = fornecedores;

    if (!showInactive) {
      filtered = filtered.filter(forn => forn.ativo);
    }

    if (searchTerm) {
      filtered = filtered.filter(forn =>
        forn.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        forn.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        forn.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "nome":
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
          break;
        case "cnpj":
          aValue = a.cnpj?.toLowerCase() || "";
          bValue = b.cnpj?.toLowerCase() || "";
          break;
        case "telefone":
          aValue = a.telefone?.toLowerCase() || "";
          bValue = b.telefone?.toLowerCase() || "";
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
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
  }, [fornecedores, showInactive, searchTerm, sortBy, sortOrder]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fornecedores</CardTitle>
            <CardDescription>
              Gerencie os fornecedores de ingredientes
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
                <DialogDescription>
                  Cadastre um novo fornecedor de ingredientes
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">
                    Nome *
                  </Label>
                  <Input
                    id="nome"
                    value={newFornecedor.nome}
                    onChange={(e) => setNewFornecedor({ ...newFornecedor, nome: e.target.value })}
                    className="col-span-3"
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cnpj" className="text-right">
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    value={newFornecedor.cnpj}
                    onChange={(e) => setNewFornecedor({ ...newFornecedor, cnpj: e.target.value })}
                    className="col-span-3"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="telefone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={newFornecedor.telefone}
                    onChange={(e) => setNewFornecedor({ ...newFornecedor, telefone: e.target.value })}
                    className="col-span-3"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newFornecedor.email}
                    onChange={(e) => setNewFornecedor({ ...newFornecedor, email: e.target.value })}
                    className="col-span-3"
                    placeholder="contato@fornecedor.com"
                  />
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
              placeholder="Pesquisar por nome, CNPJ ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive-fornecedores"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive-fornecedores" className="cursor-pointer">
              Mostrar inativos
            </Label>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">
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
                  onClick={() => handleSort("cnpj")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  CNPJ
                  {sortBy === "cnpj" ? (
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
                  onClick={() => handleSort("telefone")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  Telefone
                  {sortBy === "telefone" ? (
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
              <TableHead className="w-[20%]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("email")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  E-mail
                  {sortBy === "email" ? (
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
            {filteredFornecedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum fornecedor encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredFornecedores.map((fornecedor) => (
                <TableRow key={fornecedor.id}>
                  <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                  <TableCell>{fornecedor.cnpj || "-"}</TableCell>
                  <TableCell>{fornecedor.telefone || "-"}</TableCell>
                  <TableCell>{fornecedor.email || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={fornecedor.ativo ? "default" : "secondary"}
                      className={fornecedor.ativo ? "cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" : ""}
                      onClick={() => handleToggleStatus(fornecedor)}
                    >
                      {fornecedor.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(fornecedor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(fornecedor.id)}
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
              <DialogTitle>Editar Fornecedor</DialogTitle>
              <DialogDescription>
                Atualize as informações do fornecedor
              </DialogDescription>
            </DialogHeader>
            {editingFornecedor && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nome" className="text-right">
                    Nome *
                  </Label>
                  <Input
                    id="edit-nome"
                    value={editingFornecedor.nome}
                    onChange={(e) =>
                      setEditingFornecedor({ ...editingFornecedor, nome: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-cnpj" className="text-right">
                    CNPJ
                  </Label>
                  <Input
                    id="edit-cnpj"
                    value={editingFornecedor.cnpj || ""}
                    onChange={(e) =>
                      setEditingFornecedor({ ...editingFornecedor, cnpj: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-telefone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="edit-telefone"
                    value={editingFornecedor.telefone || ""}
                    onChange={(e) =>
                      setEditingFornecedor({ ...editingFornecedor, telefone: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    E-mail
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingFornecedor.email || ""}
                    onChange={(e) =>
                      setEditingFornecedor({ ...editingFornecedor, email: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-ativo" className="text-right">
                    Ativo
                  </Label>
                  <Switch
                    id="edit-ativo"
                    checked={editingFornecedor.ativo}
                    onCheckedChange={(checked) =>
                      setEditingFornecedor({ ...editingFornecedor, ativo: checked })
                    }
                  />
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