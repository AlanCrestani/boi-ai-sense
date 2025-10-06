import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, TreePine, MapPin, ArrowUpDown, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSetores, Setor } from "@/hooks/useSetores";
import { usePastos, CreatePastoData } from "@/hooks/usePastos";
import { useLotesPasto, CreateLotePastoData, UpdateLotePastoData, LotePasto } from "@/hooks/useLotesPasto";

// Interface removida - agora usando LotePasto do hook

export default function CadastrosPasto() {
  const { setores, isLoading: setoresLoading } = useSetores();
  const {
    pastos,
    isLoading: pastosLoading,
    createPasto,
    updatePasto,
    deletePasto,
    isCreating,
    isUpdating
  } = usePastos();

  const {
    lotes,
    isLoading: lotesLoading,
    createLote,
    updateLote,
    transitionToIndividual,
    deleteLote,
    isCreating: isCreatingLote,
    isUpdating: isUpdatingLote,
    isTransitioning,
    isDeleting: isDeletingLote
  } = useLotesPasto();

  const [newPasto, setNewPasto] = useState<CreatePastoData>({
    nome: "",
    area_hectares: 0,
    setor_id: "",
    localizacao: "",
    quantidade_cocho_metros: 0,
    tipo_cocho: "",
    tipo_solo: "",
    tipo_pasto: "",
    especie_forrageira: ""
  });

  // Helper para obter data atual no formato local YYYY-MM-DD
  const getLocalDateString = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  // Helper para formatar data sem problemas de timezone (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "-";
    const [ano, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const [tipoPesagem, setTipoPesagem] = useState<'coletivo' | 'individual'>('coletivo');
  const [newLote, setNewLote] = useState<CreateLotePastoData>({
    quantidade_animais: 0,
    peso_liquido_total: 0,
    data_entrada: getLocalDateString(),
    pasto_id: "",
    gmd_informado: 0,
    proteinado: "",
    sexo: "",
    observacoes: ""
  });

  const [isAddPastoOpen, setIsAddPastoOpen] = useState(false);
  const [isEditPastoOpen, setIsEditPastoOpen] = useState(false);
  const [editingPasto, setEditingPasto] = useState<string | null>(null);
  const [isAddLoteOpen, setIsAddLoteOpen] = useState(false);

  // Estados para edição de lotes
  const [isEditLoteOpen, setIsEditLoteOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<LotePasto | null>(null);
  const [editTipoPesagem, setEditTipoPesagem] = useState<'coletivo' | 'individual'>('coletivo');
  const [editLoteData, setEditLoteData] = useState<UpdateLotePastoData>({
    quantidade_animais: 0,
    peso_liquido_total: 0,
    data_entrada: getLocalDateString(),
    pasto_id: "",
    gmd_informado: 0,
    proteinado: "",
    sexo: "",
    observacoes: "",
    status_pesagem: 'coletivo'
  });

  // Estados para pesquisa e ordenação - Pastos
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Estados para pesquisa e ordenação - Lotes
  const [searchTermLotes, setSearchTermLotes] = useState("");
  const [sortByLotes, setSortByLotes] = useState<string>("created_at");
  const [sortOrderLotes, setSortOrderLotes] = useState<"asc" | "desc">("desc");

  // Estado para modal de confirmação de ativar/inativar lote
  const [loteToToggle, setLoteToToggle] = useState<LotePasto | null>(null);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);

  // Função para confirmar ativação/inativação do lote
  const handleToggleLoteStatus = () => {
    if (!loteToToggle) return;

    updateLote({
      id: loteToToggle.id,
      data: { ativo: !loteToToggle.ativo }
    });
    setIsToggleModalOpen(false);
    setLoteToToggle(null);
  };

  // Função para obter cor do setor baseado no tipo
  const getSetorColor = (tipo: string) => {
    const colors = {
      'confinamento': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'semiconfinamento': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'pasto': 'bg-green-500/10 text-green-500 border-green-500/20',
      'enfermaria': 'bg-red-500/10 text-red-500 border-red-500/20',
      'maternidade': 'bg-pink-500/10 text-pink-500 border-pink-500/20'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  // Função para ordenação - Pastos
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Função para ordenação - Lotes
  const handleSortLotes = (column: string) => {
    if (sortByLotes === column) {
      setSortOrderLotes(sortOrderLotes === "asc" ? "desc" : "asc");
    } else {
      setSortByLotes(column);
      setSortOrderLotes("asc");
    }
  };

  // Filtrar e ordenar pastos
  const filteredAndSortedPastos = useMemo(() => {
    let filtered = pastos.filter(pasto =>
      pasto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pasto.setor?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pasto.tipo_cocho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pasto.tipo_solo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pasto.tipo_pasto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pasto.especie_forrageira?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "nome":
          aValue = a.nome;
          bValue = b.nome;
          break;
        case "area":
          aValue = a.area_hectares || 0;
          bValue = b.area_hectares || 0;
          break;
        case "setor":
          aValue = a.setor?.nome || "";
          bValue = b.setor?.nome || "";
          break;
        case "localizacao":
          aValue = a.localizacao || "";
          bValue = b.localizacao || "";
          break;
        default:
          aValue = a.nome;
          bValue = b.nome;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortOrder === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return filtered;
  }, [pastos, searchTerm, sortBy, sortOrder]);

  // Filtrar e ordenar lotes
  const filteredAndSortedLotes = useMemo(() => {
    let filtered = lotes.filter(lote =>
      lote.nome?.toLowerCase().includes(searchTermLotes.toLowerCase()) ||
      lote.pasto?.nome.toLowerCase().includes(searchTermLotes.toLowerCase()) ||
      lote.pasto?.setor?.nome.toLowerCase().includes(searchTermLotes.toLowerCase()) ||
      lote.sexo?.toLowerCase().includes(searchTermLotes.toLowerCase()) ||
      lote.proteinado?.toLowerCase().includes(searchTermLotes.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortByLotes) {
        case "nome":
          aValue = a.nome || "";
          bValue = b.nome || "";
          break;
        case "pasto":
          aValue = a.pasto?.nome || "";
          bValue = b.pasto?.nome || "";
          break;
        case "data_entrada":
          aValue = a.data_entrada || "";
          bValue = b.data_entrada || "";
          break;
        case "animais":
          aValue = a.quantidade_animais || 0;
          bValue = b.quantidade_animais || 0;
          break;
        case "peso_medio_entrada":
          aValue = a.peso_medio_entrada || 0;
          bValue = b.peso_medio_entrada || 0;
          break;
        case "sexo":
          aValue = a.sexo || "";
          bValue = b.sexo || "";
          break;
        case "gmd":
          aValue = a.gmd_informado || 0;
          bValue = b.gmd_informado || 0;
          break;
        case "created_at":
          aValue = a.created_at || "";
          bValue = b.created_at || "";
          break;
        case "updated_at":
          aValue = a.updated_at || "";
          bValue = b.updated_at || "";
          break;
        default:
          aValue = a.created_at || "";
          bValue = b.created_at || "";
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrderLotes === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortOrderLotes === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return filtered;
  }, [lotes, searchTermLotes, sortByLotes, sortOrderLotes]);

  const handleAddPasto = () => {
    if (!newPasto.nome || !newPasto.setor_id) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    createPasto(newPasto);
    setNewPasto({ nome: "", area_hectares: 0, setor_id: "", localizacao: "", quantidade_cocho_metros: 0, tipo_cocho: "", tipo_solo: "", tipo_pasto: "", especie_forrageira: "" });
    setIsAddPastoOpen(false);
  };

  const handleAddLote = () => {
    if (!newLote.quantidade_animais || !newLote.peso_liquido_total) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const loteData = {
      ...newLote,
      status_pesagem: tipoPesagem
    };

    createLote(loteData);
    setTipoPesagem('coletivo');
    setNewLote({
      quantidade_animais: 0,
      peso_liquido_total: 0,
      data_entrada: getLocalDateString(),
      pasto_id: "",
      gmd_informado: 0,
      proteinado: "",
      observacoes: ""
    });
    setIsAddLoteOpen(false);
  };


  const handleEditPasto = (pasto: any) => {
    setEditingPasto(pasto.id);
    setNewPasto({
      nome: pasto.nome,
      area_hectares: pasto.area_hectares || 0,
      setor_id: pasto.setor_id || "",
      localizacao: pasto.localizacao || "",
      quantidade_cocho_metros: pasto.quantidade_cocho_metros || 0,
      tipo_cocho: pasto.tipo_cocho || "",
      tipo_solo: pasto.tipo_solo || "",
      tipo_pasto: pasto.tipo_pasto || "",
      especie_forrageira: pasto.especie_forrageira || ""
    });
    setIsEditPastoOpen(true);
  };

  const handleUpdatePasto = () => {
    if (!newPasto.nome || !newPasto.setor_id) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (editingPasto) {
      updatePasto({ id: editingPasto, data: newPasto });
      setEditingPasto(null);
      setNewPasto({
        nome: "",
        area_hectares: 0,
        setor_id: "",
        localizacao: "",
        quantidade_cocho_metros: 0,
        tipo_cocho: "",
        tipo_solo: "",
        tipo_pasto: "",
        especie_forrageira: ""
      });
      setIsEditPastoOpen(false);
    }
  };

  const handleDeletePasto = (id: string) => {
    deletePasto(id);
  };

  const handleDeleteLote = (id: string) => {
    deleteLote(id);
  };

  // Funções para edição de lotes
  const handleEditLote = (lote: LotePasto) => {
    setEditingLote(lote);
    setEditTipoPesagem(lote.status_pesagem || 'coletivo');
    setEditLoteData({
      quantidade_animais: lote.quantidade_animais || 0,
      peso_liquido_total: lote.peso_medio_entrada || 0,
      data_entrada: lote.data_entrada || getLocalDateString(),
      pasto_id: lote.pasto_id || "",
      gmd_informado: lote.gmd_informado || 0,
      proteinado: lote.proteinado || "",
      sexo: lote.sexo || "",
      observacoes: lote.observacoes || "",
      status_pesagem: lote.status_pesagem || 'coletivo'
    });
    setIsEditLoteOpen(true);
  };

  const handleUpdateLote = () => {
    if (!editingLote || !editLoteData.quantidade_animais || !editLoteData.peso_liquido_total) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const updateData = {
      ...editLoteData,
      status_pesagem: editTipoPesagem,
      ativo: editingLote.ativo
    };

    updateLote({ id: editingLote.id, data: updateData });
    setIsEditLoteOpen(false);
    setEditingLote(null);
    setEditTipoPesagem('coletivo');
    setEditLoteData({
      quantidade_animais: 0,
      peso_liquido_total: 0,
      data_entrada: getLocalDateString(),
      pasto_id: "",
      gmd_informado: 0,
      proteinado: "",
      observacoes: "",
      status_pesagem: 'coletivo'
    });
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 py-2 sm:py-8 lg:px-8">
        <div className="space-y-6">
          <div className="mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                Cadastros - Operacional Pasto
              </h1>
              <p className="text-sm sm:text-base text-text-secondary">
                Gerencie o cadastro de pastos e lotes
              </p>
            </div>
          </div>

        <Tabs defaultValue="pastos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pastos" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              Pastos
            </TabsTrigger>
            <TabsTrigger value="lotes" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Lotes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pastos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cadastro de Pastos</CardTitle>
                    <CardDescription>
                      Gerencie os pastos disponíveis para operação
                    </CardDescription>
                  </div>
                  <Dialog open={isAddPastoOpen} onOpenChange={setIsAddPastoOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Adicionar Pasto
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Pasto</DialogTitle>
                        <DialogDescription>
                          Preencha as informações do novo pasto
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome do Pasto *</Label>
                          <Input
                            id="nome"
                            value={newPasto.nome}
                            onChange={(e) => setNewPasto({ ...newPasto, nome: e.target.value })}
                            placeholder="Ex: Pasto Norte"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="area">Área (hectares)</Label>
                          <Input
                            id="area"
                            type="number"
                            value={newPasto.area_hectares}
                            onChange={(e) => setNewPasto({ ...newPasto, area_hectares: Number(e.target.value) })}
                            placeholder="Ex: 150"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="setor">Setor *</Label>
                          <select
                            id="setor"
                            value={newPasto.setor_id}
                            onChange={(e) => setNewPasto({ ...newPasto, setor_id: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">{setoresLoading ? "Carregando setores..." : "Selecione um setor"}</option>
                            {setores.filter(s => s.tipo === 'pasto').map((setor) => (
                              <option key={setor.id} value={setor.id}>
                                {setor.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="localizacao">Localização</Label>
                          <Input
                            id="localizacao"
                            value={newPasto.localizacao}
                            onChange={(e) => setNewPasto({ ...newPasto, localizacao: e.target.value })}
                            placeholder="Ex: Setor Norte"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quantidade_cocho">Quantidade de Cocho (m)</Label>
                          <Input
                            id="quantidade_cocho"
                            type="number"
                            value={newPasto.quantidade_cocho_metros}
                            onChange={(e) => setNewPasto({ ...newPasto, quantidade_cocho_metros: Number(e.target.value) })}
                            placeholder="Ex: 80"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tipo_cocho">Tipo de Cocho</Label>
                          <select
                            id="tipo_cocho"
                            value={newPasto.tipo_cocho}
                            onChange={(e) => setNewPasto({ ...newPasto, tipo_cocho: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione o tipo de cocho</option>
                            <option value="Concreto">Concreto</option>
                            <option value="Madeira">Madeira</option>
                            <option value="Plástico">Plástico</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tipo_solo">Tipo de Solo</Label>
                          <select
                            id="tipo_solo"
                            value={newPasto.tipo_solo}
                            onChange={(e) => setNewPasto({ ...newPasto, tipo_solo: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione o tipo de solo</option>
                            <option value="Argiloso">Argiloso</option>
                            <option value="Arenoso">Arenoso</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tipo_pasto">Tipo de Pasto</Label>
                          <select
                            id="tipo_pasto"
                            value={newPasto.tipo_pasto}
                            onChange={(e) => setNewPasto({ ...newPasto, tipo_pasto: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione o tipo de pasto</option>
                            <option value="Rotacionado">Rotacionado</option>
                            <option value="Contínuo">Contínuo</option>
                            <option value="Alternado">Alternado</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="especie_forrageira">Espécie Forrageira</Label>
                          <select
                            id="especie_forrageira"
                            value={newPasto.especie_forrageira}
                            onChange={(e) => setNewPasto({ ...newPasto, especie_forrageira: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione a espécie forrageira</option>
                            <option value="Brachiaria Brizantha">Brachiaria Brizantha</option>
                            <option value="Mombaça">Mombaça</option>
                            <option value="Paredão">Paredão</option>
                            <option value="Piatã">Piatã</option>
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddPastoOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddPasto} disabled={isCreating}>
                          {isCreating ? "Adicionando..." : "Adicionar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Modal de Edição de Pasto */}
                  <Dialog open={isEditPastoOpen} onOpenChange={setIsEditPastoOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Pasto</DialogTitle>
                        <DialogDescription>
                          Atualize as informações do pasto
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-nome">Nome do Pasto *</Label>
                          <Input
                            id="edit-nome"
                            value={newPasto.nome}
                            onChange={(e) => setNewPasto({ ...newPasto, nome: e.target.value })}
                            placeholder="Ex: Pasto Norte"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-area">Área (hectares)</Label>
                          <Input
                            id="edit-area"
                            type="number"
                            value={newPasto.area_hectares}
                            onChange={(e) => setNewPasto({ ...newPasto, area_hectares: Number(e.target.value) })}
                            placeholder="Ex: 150"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-setor">Setor *</Label>
                          <select
                            id="edit-setor"
                            value={newPasto.setor_id}
                            onChange={(e) => setNewPasto({ ...newPasto, setor_id: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">{setoresLoading ? "Carregando setores..." : "Selecione um setor"}</option>
                            {setores.filter(s => s.tipo === 'pasto').map((setor) => (
                              <option key={setor.id} value={setor.id}>
                                {setor.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-localizacao">Localização</Label>
                          <Input
                            id="edit-localizacao"
                            value={newPasto.localizacao}
                            onChange={(e) => setNewPasto({ ...newPasto, localizacao: e.target.value })}
                            placeholder="Ex: Setor Norte"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-quantidade_cocho">Quantidade de Cocho (m)</Label>
                          <Input
                            id="edit-quantidade_cocho"
                            type="number"
                            value={newPasto.quantidade_cocho_metros}
                            onChange={(e) => setNewPasto({ ...newPasto, quantidade_cocho_metros: Number(e.target.value) })}
                            placeholder="Ex: 80"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-tipo_cocho">Tipo de Cocho</Label>
                          <select
                            id="edit-tipo_cocho"
                            value={newPasto.tipo_cocho}
                            onChange={(e) => setNewPasto({ ...newPasto, tipo_cocho: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione o tipo de cocho</option>
                            <option value="Concreto">Concreto</option>
                            <option value="Madeira">Madeira</option>
                            <option value="Plástico">Plástico</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-tipo_solo">Tipo de Solo</Label>
                          <select
                            id="edit-tipo_solo"
                            value={newPasto.tipo_solo}
                            onChange={(e) => setNewPasto({ ...newPasto, tipo_solo: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione o tipo de solo</option>
                            <option value="Argiloso">Argiloso</option>
                            <option value="Arenoso">Arenoso</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-tipo_pasto">Tipo de Pasto</Label>
                          <select
                            id="edit-tipo_pasto"
                            value={newPasto.tipo_pasto}
                            onChange={(e) => setNewPasto({ ...newPasto, tipo_pasto: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione o tipo de pasto</option>
                            <option value="Rotacionado">Rotacionado</option>
                            <option value="Contínuo">Contínuo</option>
                            <option value="Alternado">Alternado</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-especie_forrageira">Espécie Forrageira</Label>
                          <select
                            id="edit-especie_forrageira"
                            value={newPasto.especie_forrageira}
                            onChange={(e) => setNewPasto({ ...newPasto, especie_forrageira: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione a espécie forrageira</option>
                            <option value="Brachiaria Brizantha">Brachiaria Brizantha</option>
                            <option value="Mombaça">Mombaça</option>
                            <option value="Paredão">Paredão</option>
                            <option value="Piatã">Piatã</option>
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsEditPastoOpen(false);
                          setEditingPasto(null);
                          setNewPasto({
                            nome: "",
                            area_hectares: 0,
                            setor_id: "",
                            localizacao: "",
                            quantidade_cocho_metros: 0,
                            tipo_solo: "",
                            tipo_pasto: "",
                            especie_forrageira: ""
                          });
                        }}>
                          Cancelar
                        </Button>
                        <Button onClick={handleUpdatePasto} disabled={isUpdating}>
                          {isUpdating ? "Atualizando..." : "Atualizar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Campo de Pesquisa */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome, setor ou localização..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("nome")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Nome
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("area")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Área (ha)
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("setor")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Setor
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Cocho (m)</TableHead>
                      <TableHead>Tipo Cocho</TableHead>
                      <TableHead>Tipo Solo</TableHead>
                      <TableHead>Tipo Pasto</TableHead>
                      <TableHead>Espécie Forrageira</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastosLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">Carregando pastos...</TableCell>
                      </TableRow>
                    ) : pastos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">Nenhum pasto cadastrado</TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedPastos.map((pasto) => {
                        return (
                          <TableRow key={pasto.id}>
                            <TableCell className="font-medium whitespace-nowrap">{pasto.nome}</TableCell>
                            <TableCell>{pasto.area_hectares || 0}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getSetorColor(pasto.setor?.tipo || "")}>
                                {pasto.setor?.nome || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>{pasto.quantidade_cocho_metros || 0} m</TableCell>
                            <TableCell>{pasto.tipo_cocho || "-"}</TableCell>
                            <TableCell>{pasto.tipo_solo || "-"}</TableCell>
                            <TableCell>{pasto.tipo_pasto || "-"}</TableCell>
                            <TableCell>{pasto.especie_forrageira || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPasto(pasto)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePasto(pasto.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lotes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cadastro de Lotes</CardTitle>
                    <CardDescription>
                      Gerencie os lotes de animais nos pastos
                    </CardDescription>
                  </div>
                  <Dialog open={isAddLoteOpen} onOpenChange={setIsAddLoteOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Adicionar Lote
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Lote</DialogTitle>
                        <DialogDescription>
                          Preencha as informações do novo lote
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="quantidade_animais">Quantidade de Animais *</Label>
                            <Input
                              id="quantidade_animais"
                              type="number"
                              value={newLote.quantidade_animais || 0}
                              onChange={(e) => setNewLote({ ...newLote, quantidade_animais: Number(e.target.value) })}
                              placeholder="Ex: 150"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="data_entrada">Data de Entrada *</Label>
                            <Input
                              id="data_entrada"
                              type="date"
                              value={newLote.data_entrada}
                              onChange={(e) => setNewLote({ ...newLote, data_entrada: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pasto_id">Pasto</Label>
                          <select
                            id="pasto_id"
                            value={newLote.pasto_id || ""}
                            onChange={(e) => setNewLote({ ...newLote, pasto_id: e.target.value || undefined })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">{pastosLoading ? "Carregando pastos..." : "Selecione um pasto (opcional)"}</option>
                            {pastos.map((pasto) => (
                              <option key={pasto.id} value={pasto.id}>
                                {pasto.nome} - {pasto.setor?.nome}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Toggle para tipo de pesagem */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <Label className="text-base font-medium">Tipo de Pesagem</Label>
                              <p className="text-sm text-gray-500 mt-1">
                                Escolha se o peso foi obtido de forma coletiva ou individual
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Label className={tipoPesagem === 'coletivo' ? 'font-medium' : 'text-gray-500'}>
                                Coletivo
                              </Label>
                              <Switch
                                checked={tipoPesagem === 'individual'}
                                onCheckedChange={(checked) => setTipoPesagem(checked ? 'individual' : 'coletivo')}
                              />
                              <Label className={tipoPesagem === 'individual' ? 'font-medium' : 'text-gray-500'}>
                                Individual
                              </Label>
                            </div>
                          </div>

                          {/* Campo de peso médio */}
                          <div className="space-y-2">
                            <Label htmlFor="peso_medio">
                              Peso Médio ({tipoPesagem === 'coletivo' ? 'Coletivo' : 'Individual'}) (kg) *
                            </Label>
                            <Input
                              id="peso_medio"
                              type="number"
                              step="0.01"
                              value={newLote.peso_liquido_total || 0}
                              onChange={(e) => setNewLote({ ...newLote, peso_liquido_total: Number(e.target.value) })}
                              placeholder={tipoPesagem === 'coletivo' ? "Ex: 200 kg (peso médio do grupo)" : "Ex: 185 kg (peso médio individual)"}
                            />
                            <p className="text-sm text-gray-500">
                              {tipoPesagem === 'coletivo'
                                ? 'Peso médio calculado a partir da pesagem coletiva (ex: caminhão dividido por número de animais)'
                                : 'Peso médio baseado na pesagem individual de cada animal'
                              }
                            </p>
                          </div>
                        </div>


                        {/* Campos GMD, Proteinado e Sexo */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="gmd_informado">GMD Informado (kg/dia)</Label>
                            <Input
                              id="gmd_informado"
                              type="number"
                              step="0.01"
                              value={newLote.gmd_informado || 0}
                              onChange={(e) => setNewLote({ ...newLote, gmd_informado: Number(e.target.value) })}
                              placeholder="Ex: 1.2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="proteinado">Proteinado</Label>
                            <select
                              id="proteinado"
                              value={newLote.proteinado || ""}
                              onChange={(e) => setNewLote({ ...newLote, proteinado: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecione o proteinado</option>
                              <option value="PROTEINADO 03.%PV">PROTEINADO 03.%PV</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sexo">Sexo</Label>
                            <select
                              id="sexo"
                              value={newLote.sexo || ""}
                              onChange={(e) => setNewLote({ ...newLote, sexo: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecione o sexo</option>
                              <option value="Macho">Macho</option>
                              <option value="Fêmea">Fêmea</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="observacoes">Observações</Label>
                          <Input
                            id="observacoes"
                            value={newLote.observacoes || ""}
                            onChange={(e) => setNewLote({ ...newLote, observacoes: e.target.value })}
                            placeholder="Ex: Animais em bom estado..."
                          />
                        </div>

                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddLoteOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddLote}>
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Campo de Pesquisa */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome, pasto, setor ou sexo..."
                      value={searchTermLotes}
                      onChange={(e) => setSearchTermLotes(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table className="whitespace-nowrap">
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSortLotes("nome")}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Lote
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortLotes("pasto")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Pasto
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortLotes("data_entrada")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Data Entrada
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortLotes("animais")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Animais
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortLotes("peso_medio_entrada")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Peso Entrada
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortLotes("sexo")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Sexo
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortLotes("gmd")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          GMD
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotesLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">Carregando lotes...</TableCell>
                      </TableRow>
                    ) : filteredAndSortedLotes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">
                          {searchTermLotes ? "Nenhum lote encontrado com os filtros aplicados" : "Nenhum lote cadastrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedLotes.map((lote) => (
                        <TableRow key={lote.id}>
                          <TableCell>
                            <div className="font-medium">{lote.nome || "-"}</div>
                            <Badge
                              variant={lote.ativo ? "default" : "secondary"}
                              className={lote.ativo ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                              onClick={() => {
                                if (lote.ativo) {
                                  setLoteToToggle(lote);
                                  setIsToggleModalOpen(true);
                                }
                              }}
                            >
                              {lote.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{lote.pasto?.nome || "Sem pasto"}</div>
                            {lote.pasto?.setor && (
                              <div className="text-sm text-gray-500">{lote.pasto.setor.nome}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>{formatDateDisplay(lote.data_entrada || "")}</div>
                          </TableCell>
                          <TableCell>{lote.quantidade_animais || 0}</TableCell>
                          <TableCell>
                            {lote.peso_medio_entrada ? `${lote.peso_medio_entrada.toFixed(2)} kg` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {lote.sexo || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lote.gmd_informado ? (
                              <div>
                                <div className="font-medium">{lote.gmd_informado.toFixed(2)} kg/dia</div>
                                <div className="text-sm text-gray-500">Informado</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={lote.status_pesagem === 'individual' ? 'default' : 'destructive'}>
                              {lote.sigla_status} - {lote.status_pesagem === 'individual' ? 'Individual' : 'Coletivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditLote(lote)}
                                disabled={isUpdatingLote}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLote(lote.id)}
                                disabled={isDeletingLote}
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
                </div>
              </CardContent>
            </Card>

            {/* Modal de Edição de Lote */}
            <Dialog open={isEditLoteOpen} onOpenChange={setIsEditLoteOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Lote</DialogTitle>
                  <DialogDescription>
                    Edite as informações do lote selecionado
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_pasto_id">Pasto</Label>
                      <select
                        id="edit_pasto_id"
                        value={editLoteData.pasto_id}
                        onChange={(e) => setEditLoteData({ ...editLoteData, pasto_id: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecione um pasto</option>
                        {pastos.map((pasto) => (
                          <option key={pasto.id} value={pasto.id}>
                            {pasto.nome} - {pasto.setor?.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_data_entrada">Data de Entrada</Label>
                      <Input
                        id="edit_data_entrada"
                        type="date"
                        value={editLoteData.data_entrada}
                        onChange={(e) => setEditLoteData({ ...editLoteData, data_entrada: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_quantidade_animais">Quantidade de Animais *</Label>
                      <Input
                        id="edit_quantidade_animais"
                        type="number"
                        min="1"
                        value={editLoteData.quantidade_animais}
                        onChange={(e) => setEditLoteData({ ...editLoteData, quantidade_animais: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    {/* Toggle para tipo de pesagem */}
                    <div className="space-y-2">
                      <Label>Tipo de Pesagem</Label>
                      <div className="flex items-center space-x-3">
                        <Label className={editTipoPesagem === 'coletivo' ? 'font-medium' : 'text-gray-500'}>
                          Coletivo
                        </Label>
                        <Switch
                          checked={editTipoPesagem === 'individual'}
                          onCheckedChange={(checked) => setEditTipoPesagem(checked ? 'individual' : 'coletivo')}
                        />
                        <Label className={editTipoPesagem === 'individual' ? 'font-medium' : 'text-gray-500'}>
                          Individual
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_peso_liquido_total">
                      Peso médio ({editTipoPesagem === 'coletivo' ? 'Coletivo' : 'Individual'}) (kg) *
                    </Label>
                    <Input
                      id="edit_peso_liquido_total"
                      type="number"
                      step="0.1"
                      min="0"
                      value={editLoteData.peso_liquido_total}
                      onChange={(e) => setEditLoteData({ ...editLoteData, peso_liquido_total: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  {/* Campos GMD, Proteinado e Sexo */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_gmd_informado">GMD Informado (kg/dia)</Label>
                      <Input
                        id="edit_gmd_informado"
                        type="number"
                        step="0.01"
                        value={editLoteData.gmd_informado || 0}
                        onChange={(e) => setEditLoteData({ ...editLoteData, gmd_informado: Number(e.target.value) })}
                        placeholder="Ex: 1.2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_proteinado">Proteinado</Label>
                      <select
                        id="edit_proteinado"
                        value={editLoteData.proteinado || ""}
                        onChange={(e) => setEditLoteData({ ...editLoteData, proteinado: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecione o proteinado</option>
                        <option value="PROTEINADO 03.%PV">PROTEINADO 03.%PV</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_sexo">Sexo</Label>
                      <select
                        id="edit_sexo"
                        value={editLoteData.sexo || ""}
                        onChange={(e) => setEditLoteData({ ...editLoteData, sexo: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecione o sexo</option>
                        <option value="Macho">Macho</option>
                        <option value="Fêmea">Fêmea</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_observacoes">Observações</Label>
                    <Input
                      id="edit_observacoes"
                      value={editLoteData.observacoes}
                      onChange={(e) => setEditLoteData({ ...editLoteData, observacoes: e.target.value })}
                      placeholder="Observações sobre o lote"
                    />
                  </div>

                  {/* Toggle Ativo/Inativo */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Status do Lote</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        {editingLote?.ativo ? "Lote está ativo no sistema" : "Lote está inativo no sistema"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Label className={!editingLote?.ativo ? 'font-medium' : 'text-gray-500'}>
                        Inativo
                      </Label>
                      <Switch
                        checked={editingLote?.ativo || false}
                        onCheckedChange={(checked) => {
                          if (editingLote) {
                            setEditingLote({ ...editingLote, ativo: checked });
                          }
                        }}
                      />
                      <Label className={editingLote?.ativo ? 'font-medium' : 'text-gray-500'}>
                        Ativo
                      </Label>
                    </div>
                  </div>

                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditLoteOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateLote} disabled={isUpdatingLote}>
                    {isUpdatingLote ? "Atualizando..." : "Atualizar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          </Tabs>

          {/* Modal de Confirmação para Inativar Lote */}
          <Dialog open={isToggleModalOpen} onOpenChange={setIsToggleModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Inativar Lote</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja inativar este lote?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsToggleModalOpen(false);
                    setLoteToToggle(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleToggleLoteStatus}
                  disabled={isUpdatingLote}
                >
                  {isUpdatingLote ? "Processando..." : "Inativar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}