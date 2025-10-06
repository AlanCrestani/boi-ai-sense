import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDietas, CreateDietaData, Dieta } from "@/hooks/useDietas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export function DietasTab() {
  const { dietas, createDieta, updateDieta, deleteDieta, isCreating, isUpdating } = useDietas();
  const { organization } = useAuth();

  const [isAddDietaOpen, setIsAddDietaOpen] = useState(false);
  const [isEditDietaOpen, setIsEditDietaOpen] = useState(false);
  const [editingDieta, setEditingDieta] = useState<Dieta | null>(null);

  const [newDieta, setNewDieta] = useState<CreateDietaData>({
    nome: "",
    tipo: "adaptacao",
    cms_percentual_peso_vivo: 0.025,
    descricao: "",
    ativo: true,
  });

  // Estado para CMS em formato de percentual (ex: 2.46 ao invés de 0.0246)
  const [cmsPercentualInput, setCmsPercentualInput] = useState<string>("2.50");
  const [cmsPercentualEditInput, setCmsPercentualEditInput] = useState<string>("2.50");

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Estados para ordenação
  const [sortBy, setSortBy] = useState<string>("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleAddDieta = () => {
    if (!newDieta.nome || newDieta.cms_percentual_peso_vivo <= 0) {
      return;
    }

    createDieta(newDieta);
    setNewDieta({
      nome: "",
      tipo: "adaptacao",
      cms_percentual_peso_vivo: 0.025,
      descricao: "",
      ativo: true,
    });
    setCmsPercentualInput("2.50");
    setIsAddDietaOpen(false);
  };

  const handleEditDieta = (dieta: Dieta) => {
    setEditingDieta(dieta);
    // Converter decimal para percentual para exibição (0.0246 → 2.46)
    setCmsPercentualEditInput((dieta.cms_percentual_peso_vivo * 100).toFixed(2));
    setIsEditDietaOpen(true);
  };

  const handleUpdateDieta = () => {
    if (!editingDieta) return;

    updateDieta({
      id: editingDieta.id,
      data: {
        nome: editingDieta.nome,
        tipo: editingDieta.tipo,
        cms_percentual_peso_vivo: editingDieta.cms_percentual_peso_vivo,
        descricao: editingDieta.descricao,
        ativo: editingDieta.ativo,
      },
    });
    setIsEditDietaOpen(false);
    setEditingDieta(null);
  };

  const handleDeleteDieta = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover esta dieta?")) {
      deleteDieta(id);
    }
  };

  const getTipoBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'adaptacao': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'crescimento': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'terminacao': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'recria': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'pre-mistura': return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
      case 'proteinado': return 'bg-green-700/10 text-green-700 border-green-700/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTipoLabel = (tipo: string): string => {
    switch (tipo) {
      case 'adaptacao': return 'Adaptação';
      case 'crescimento': return 'Crescimento';
      case 'terminacao': return 'Terminação';
      case 'recria': return 'Recria';
      case 'pre-mistura': return 'Pré-Mistura';
      case 'proteinado': return 'Proteinado';
      default: return tipo;
    }
  };

  const formatPercentual = (valor: number | string): string => {
    // Garantir que é número e converter para percentual
    const numericValue = typeof valor === 'string' ? parseFloat(valor) : valor;
    return `${(numericValue * 100).toFixed(2)}%`;
  };

  // Buscar composição de todas as dietas para calcular MS Prevista
  const { data: composicoes = [] } = useQuery({
    queryKey: ['all-dietas-composicao', organization?.id],
    queryFn: async () => {
      const orgId = organization?.id || 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
      const { data, error } = await supabase
        .from('dieta_composicao')
        .select('dieta_id, cons_ms_kg, cons_mo_kg')
        .eq('organization_id', orgId)
        .eq('ativo', true);

      if (error) throw error;
      return data || [];
    },
  });

  // Calcular MS Prevista por dieta
  const getMSPrevista = (dietaId: string): string => {
    const composicaoDieta = composicoes.filter(c => c.dieta_id === dietaId);
    if (composicaoDieta.length === 0) return "-";

    const totalConsMS = composicaoDieta.reduce((sum, c) => sum + (c.cons_ms_kg || 0), 0);
    const totalConsMO = composicaoDieta.reduce((sum, c) => sum + (c.cons_mo_kg || 0), 0);

    if (totalConsMO === 0) return "-";
    return `${((totalConsMS / totalConsMO) * 100).toFixed(2)}%`;
  };

  // Handler para toggle de status
  const handleToggleStatus = (dieta: Dieta) => {
    if (dieta.ativo) {
      // Só permite inativar clicando no badge
      updateDieta({
        id: dieta.id,
        data: { ativo: false },
      });
    }
    // Para reativar, usuário precisa ir na edição
  };

  // Handler para mudança de ordenação
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Se já está ordenando por esta coluna, inverte a ordem
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Se é uma nova coluna, ordena ascendente
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Filtrar e ordenar dietas
  const filteredDietas = useMemo(() => {
    let filtered = dietas;

    // Filtrar por status (ativo/inativo)
    if (!showInactive) {
      filtered = filtered.filter(dieta => dieta.ativo);
    }

    // Filtrar por termo de pesquisa
    if (searchTerm) {
      filtered = filtered.filter(dieta =>
        dieta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTipoLabel(dieta.tipo).toLowerCase().includes(searchTerm.toLowerCase()) ||
        dieta.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "nome":
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
          break;
        case "tipo":
          aValue = getTipoLabel(a.tipo).toLowerCase();
          bValue = getTipoLabel(b.tipo).toLowerCase();
          break;
        case "cms":
          aValue = a.cms_percentual_peso_vivo;
          bValue = b.cms_percentual_peso_vivo;
          break;
        case "ms_prevista":
          // Calcular MS Prevista para ordenação
          const msA = getMSPrevista(a.id);
          const msB = getMSPrevista(b.id);
          aValue = msA === "-" ? -1 : parseFloat(msA);
          bValue = msB === "-" ? -1 : parseFloat(msB);
          break;
        case "status":
          aValue = a.ativo ? 1 : 0;
          bValue = b.ativo ? 1 : 0;
          break;
        default:
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [dietas, showInactive, searchTerm, sortBy, sortOrder, composicoes]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dietas</CardTitle>
            <CardDescription>
              Gerencie dietas e seus percentuais de CMS
            </CardDescription>
          </div>

          <Dialog open={isAddDietaOpen} onOpenChange={setIsAddDietaOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nova Dieta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Dieta</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova dieta no sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    value={newDieta.nome}
                    onChange={(e) => setNewDieta({ ...newDieta, nome: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: Proteinado 20%, Dieta Crescimento"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={newDieta.tipo}
                    onValueChange={(value) =>
                      setNewDieta({ ...newDieta, tipo: value as any })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adaptacao">Adaptação</SelectItem>
                      <SelectItem value="crescimento">Crescimento</SelectItem>
                      <SelectItem value="terminacao">Terminação</SelectItem>
                      <SelectItem value="recria">Recria</SelectItem>
                      <SelectItem value="pre-mistura">Pré-Mistura</SelectItem>
                      <SelectItem value="proteinado">Proteinado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cms" className="text-right">
                    CMS % Peso Vivo
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="cms"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={cmsPercentualInput}
                      onChange={(e) => {
                        const percentual = e.target.value;
                        setCmsPercentualInput(percentual);
                        // Converter percentual para decimal (2.46 → 0.0246)
                        const decimal = parseFloat(percentual) / 100;
                        setNewDieta({ ...newDieta, cms_percentual_peso_vivo: decimal });
                      }}
                      className="flex-1"
                      placeholder="Ex: 2.46"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descricao" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    value={newDieta.descricao}
                    onChange={(e) => setNewDieta({ ...newDieta, descricao: e.target.value })}
                    className="col-span-3"
                    placeholder="Descrição opcional da dieta"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDietaOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddDieta} disabled={isCreating}>
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
              placeholder="Pesquisar por nome, tipo ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="cursor-pointer">
              Mostrar inativas
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
                  className="h-8 px-2 hover:bg-transparent"
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
                  onClick={() => handleSort("tipo")}
                  className="h-8 px-2 hover:bg-transparent"
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
                  onClick={() => handleSort("cms")}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  CMS % Peso Vivo
                  {sortBy === "cms" ? (
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
                  onClick={() => handleSort("ms_prevista")}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  MS Prevista da Dieta
                  {sortBy === "ms_prevista" ? (
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
              <TableHead className="w-[12%]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="h-8 px-2 hover:bg-transparent"
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
              <TableHead className="w-[13%]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDietas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchTerm ? "Nenhuma dieta encontrada com os filtros aplicados" : "Nenhuma dieta cadastrada"}
                </TableCell>
              </TableRow>
            ) : (
              filteredDietas.map((dieta) => (
                <TableRow key={dieta.id}>
                  <TableCell className="font-medium">{dieta.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTipoBadgeClass(dieta.tipo)}>
                      {getTipoLabel(dieta.tipo)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPercentual(dieta.cms_percentual_peso_vivo)}</TableCell>
                  <TableCell className="font-medium">{getMSPrevista(dieta.id)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={dieta.ativo ? "default" : "secondary"}
                      className={dieta.ativo ? "cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" : ""}
                      onClick={() => handleToggleStatus(dieta)}
                    >
                      {dieta.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditDieta(dieta)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDieta(dieta.id)}
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
        <Dialog open={isEditDietaOpen} onOpenChange={setIsEditDietaOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Dieta</DialogTitle>
              <DialogDescription>
                Atualize as informações da dieta
              </DialogDescription>
            </DialogHeader>
            {editingDieta && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nome" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="edit-nome"
                    value={editingDieta.nome}
                    onChange={(e) =>
                      setEditingDieta({ ...editingDieta, nome: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-tipo" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={editingDieta.tipo}
                    onValueChange={(value) =>
                      setEditingDieta({ ...editingDieta, tipo: value as any })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adaptacao">Adaptação</SelectItem>
                      <SelectItem value="crescimento">Crescimento</SelectItem>
                      <SelectItem value="terminacao">Terminação</SelectItem>
                      <SelectItem value="recria">Recria</SelectItem>
                      <SelectItem value="pre-mistura">Pré-Mistura</SelectItem>
                      <SelectItem value="proteinado">Proteinado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-cms" className="text-right">
                    CMS % Peso Vivo
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="edit-cms"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={cmsPercentualEditInput}
                      onChange={(e) => {
                        const percentual = e.target.value;
                        setCmsPercentualEditInput(percentual);
                        // Converter percentual para decimal (2.46 → 0.0246)
                        const decimal = parseFloat(percentual) / 100;
                        setEditingDieta({
                          ...editingDieta,
                          cms_percentual_peso_vivo: decimal,
                        });
                      }}
                      className="flex-1"
                      placeholder="Ex: 2.46"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-descricao" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="edit-descricao"
                    value={editingDieta.descricao || ""}
                    onChange={(e) =>
                      setEditingDieta({ ...editingDieta, descricao: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDietaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateDieta} disabled={isUpdating}>
                {isUpdating ? "Atualizando..." : "Atualizar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}