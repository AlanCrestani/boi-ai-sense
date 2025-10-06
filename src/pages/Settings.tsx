import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { PlusCircle, Edit, Trash2, Settings as SettingsIcon, Truck, Users, Building, Route, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSetores, CreateSetorData, Setor } from "@/hooks/useSetores";
import { useColaboradores, CreateColaboradorData, Colaborador } from "@/hooks/useColaboradores";
import { useCargos, CreateCargoData, Cargo } from "@/hooks/useCargos";
import { RotasTab } from "@/components/settings/RotasTab";
import { LeituraCochoTab } from "@/components/settings/LeituraCochoTab";
import { VagoesSettings } from "@/components/settings/VagoesSettings";


interface Maquinario {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  ano_fabricacao?: number;
  status: 'ativo' | 'manutencao' | 'inativo';
  capacidade_operacional?: string;
}

// As interfaces Colaborador e Cargo agora vêm dos hooks

export default function Settings() {
  // Hooks para gerenciar dados
  const { setores, createSetor, updateSetor, deleteSetor, isLoading, isCreating, isUpdating } = useSetores();
  const { colaboradores, createColaborador, updateColaborador, deleteColaborador, isCreating: isCreatingColaborador, isUpdating: isUpdatingColaborador } = useColaboradores();
  const { cargos } = useCargos();

  // Estados para Maquinários
  const [maquinarios, setMaquinarios] = useState<Maquinario[]>([
    { id: "1", codigo: "MAQ-001", nome: "Trator John Deere 6110J", tipo: "Trator", marca: "John Deere", modelo: "6110J", ano_fabricacao: 2020, status: "ativo", capacidade_operacional: "110 CV" },
    { id: "2", codigo: "MAQ-002", nome: "Misturador Totalmix", tipo: "Misturador", marca: "Totalmix", modelo: "TM-15", ano_fabricacao: 2019, status: "ativo", capacidade_operacional: "15 m³" },
    { id: "3", codigo: "MAQ-003", nome: "Carreta Distribuição", tipo: "Carreta", marca: "Siltomac", modelo: "CD-8000", ano_fabricacao: 2021, status: "manutencao", capacidade_operacional: "8000 kg" },
  ]);

  // Estados para colaboradores (agora vem do hook useColaboradores)

  // Estados para modais e formulários
  const [isAddSetorOpen, setIsAddSetorOpen] = useState(false);
  const [isEditSetorOpen, setIsEditSetorOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [isAddMaquinarioOpen, setIsAddMaquinarioOpen] = useState(false);
  const [isAddColaboradorOpen, setIsAddColaboradorOpen] = useState(false);
  const [isEditColaboradorOpen, setIsEditColaboradorOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);

  const [newSetor, setNewSetor] = useState<CreateSetorData>({
    codigo: "CONF-01",
    nome: "",
    tipo: "confinamento",
    descricao: "",
    responsavel: "",
    ativo: true
  });

  // Função para gerar código do setor automaticamente
  const generateSetorCode = (tipo: string) => {
    const prefixMap = {
      'confinamento': 'CONF',
      'semiconfinamento': 'SEMI',
      'pasto': 'PASTO',
      'enfermaria': 'ENF',
      'maternidade': 'MAT'
    };

    const prefix = prefixMap[tipo as keyof typeof prefixMap] || 'SET';
    const existingCodes = setores
      .filter(s => s.tipo === tipo)
      .map(s => s.codigo)
      .sort();

    let nextNumber = 1;
    for (const code of existingCodes) {
      const match = code.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const num = parseInt(match[1]);
        if (num >= nextNumber) {
          nextNumber = num + 1;
        }
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(2, '0')}`;
  };

  // Handler para mudança de tipo do setor
  const handleSetorTipoChange = (tipo: string) => {
    const codigo = generateSetorCode(tipo);
    setNewSetor({ ...newSetor, tipo: tipo as any, codigo });
  };

  const [newMaquinario, setNewMaquinario] = useState<Omit<Maquinario, "id">>({
    codigo: "",
    nome: "",
    tipo: "",
    marca: "",
    modelo: "",
    ano_fabricacao: 0,
    status: "ativo",
    capacidade_operacional: ""
  });

  const [newColaborador, setNewColaborador] = useState<CreateColaboradorData>({
    nome_completo: "",
    cargo_id: "",
    telefone: "",
    email: "",
    data_admissao: new Date().toISOString().split('T')[0],
    status: "ativo"
  });


  // Handlers para Setores
  const handleAddSetor = () => {
    if (!newSetor.nome || !newSetor.tipo) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    createSetor(newSetor);
    resetNewSetor();
    setIsAddSetorOpen(false);
  };

  // Função para resetar formulário de setor
  const resetNewSetor = () => {
    const codigo = generateSetorCode("confinamento");
    setNewSetor({ codigo, nome: "", tipo: "confinamento", descricao: "", responsavel: "", ativo: true });
  };

  // Handler para abertura do diálogo de setor
  const handleOpenAddSetor = () => {
    resetNewSetor();
    setIsAddSetorOpen(true);
  };

  // Handlers para edição de setor
  const handleOpenEditSetor = (setor: Setor) => {
    setEditingSetor(setor);
    setIsEditSetorOpen(true);
  };

  const handleCloseEditSetor = () => {
    setEditingSetor(null);
    setIsEditSetorOpen(false);
  };

  const handleUpdateSetor = () => {
    if (!editingSetor) return;

    if (!editingSetor.nome || !editingSetor.tipo) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    const updateData: Partial<CreateSetorData> = {
      nome: editingSetor.nome,
      tipo: editingSetor.tipo,
      descricao: editingSetor.descricao,
      responsavel: editingSetor.responsavel,
      ativo: editingSetor.ativo
    };

    updateSetor({ id: editingSetor.id, data: updateData });
    handleCloseEditSetor();
  };

  // Handlers para Maquinários
  const handleAddMaquinario = () => {
    if (!newMaquinario.codigo || !newMaquinario.nome || !newMaquinario.tipo) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    const maquinario: Maquinario = {
      ...newMaquinario,
      id: Date.now().toString()
    };

    setMaquinarios([...maquinarios, maquinario]);
    setNewMaquinario({ codigo: "", nome: "", tipo: "", marca: "", modelo: "", ano_fabricacao: 0, status: "ativo", capacidade_operacional: "" });
    setIsAddMaquinarioOpen(false);
    toast.success("Maquinário cadastrado com sucesso!");
  };

  // Handlers para Colaboradores
  const handleAddColaborador = () => {
    if (!newColaborador.nome_completo) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    createColaborador(newColaborador);
    setNewColaborador({
      nome_completo: "",
      cargo_id: "",
      telefone: "",
      email: "",
      data_admissao: new Date().toISOString().split('T')[0],
      status: "ativo"
    });
    setIsAddColaboradorOpen(false);
  };

  // Handlers para edição de colaborador
  const handleOpenEditColaborador = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
    setIsEditColaboradorOpen(true);
  };

  const handleCloseEditColaborador = () => {
    setEditingColaborador(null);
    setIsEditColaboradorOpen(false);
  };

  const handleUpdateColaborador = () => {
    if (!editingColaborador) return;

    if (!editingColaborador.nome_completo) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    const updateData: Partial<CreateColaboradorData> = {
      nome_completo: editingColaborador.nome_completo,
      email: editingColaborador.email,
      telefone: editingColaborador.telefone,
      cargo_id: editingColaborador.cargo_id,
      status: editingColaborador.status,
      data_admissao: editingColaborador.data_admissao
    };

    updateColaborador({ id: editingColaborador.id, data: updateData });
    handleCloseEditColaborador();
  };

  // Handler para deletar colaborador
  const handleDeleteColaborador = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este colaborador?')) {
      deleteColaborador(id);
    }
  };


  // Funções para obter badges coloridos
  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'confinamento':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'semiconfinamento':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'pasto':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'manutencao':
      case 'afastado':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'inativo':
      case 'demitido':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Enriquecer colaboradores com dados do cargo
  const colaboradoresEnriquecidos = colaboradores.map(col => ({
    ...col,
    cargoNome: col.cargo?.nome || cargos.find(c => c.id === col.cargo_id)?.nome || "-"
  }));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-8 lg:px-8">
        <div className="space-y-6">
          <div className="mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                Configurações - Cadastros Gerais
              </h1>
              <p className="text-sm sm:text-base text-text-secondary">
                Gerencie maquinário, setores e colaboradores
              </p>
            </div>
          </div>

          <Tabs defaultValue="vagoes" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="vagoes" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Vagões
              </TabsTrigger>
              <TabsTrigger value="setores" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Setores
              </TabsTrigger>
              <TabsTrigger value="colaboradores" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Colaboradores
              </TabsTrigger>
              <TabsTrigger value="rotas" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Rotas
              </TabsTrigger>
              <TabsTrigger value="leitura-cocho" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Leitura de Cocho
              </TabsTrigger>
            </TabsList>

            {/* ABA VAGÕES */}
            <TabsContent value="vagoes" className="space-y-4">
              <VagoesSettings />
            </TabsContent>

            {/* ABA SETORES */}
            <TabsContent value="setores" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Setores</CardTitle>
                      <CardDescription>
                        Gerencie setores de confinamento, semiconfinamento, pasto, enfermaria e maternidade
                      </CardDescription>
                    </div>
                    <Dialog open={isAddSetorOpen} onOpenChange={setIsAddSetorOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="flex items-center gap-2"
                          onClick={handleOpenAddSetor}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Novo Setor
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Setor</DialogTitle>
                          <DialogDescription>
                            Cadastre um novo setor organizacional
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="set-tipo">Tipo *</Label>
                            <select
                              id="set-tipo"
                              value={newSetor.tipo}
                              onChange={(e) => handleSetorTipoChange(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="confinamento">Confinamento</option>
                              <option value="semiconfinamento">Semiconfinamento</option>
                              <option value="pasto">Pasto</option>
                              <option value="enfermaria">Enfermaria</option>
                              <option value="maternidade">Maternidade</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="set-nome">Nome *</Label>
                            <Input
                              id="set-nome"
                              value={newSetor.nome}
                              onChange={(e) => setNewSetor({ ...newSetor, nome: e.target.value })}
                              placeholder="Ex: Setor Norte Pasto"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="set-codigo">Código (Gerado Automaticamente)</Label>
                            <Input
                              id="set-codigo"
                              value={newSetor.codigo}
                              readOnly
                              className="bg-muted cursor-not-allowed"
                              placeholder="Código será gerado automaticamente"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="set-descricao">Descrição</Label>
                            <Input
                              id="set-descricao"
                              value={newSetor.descricao}
                              onChange={(e) => setNewSetor({ ...newSetor, descricao: e.target.value })}
                              placeholder="Descrição do setor"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="set-responsavel">Responsável</Label>
                            <select
                              id="set-responsavel"
                              value={newSetor.responsavel}
                              onChange={(e) => setNewSetor({ ...newSetor, responsavel: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecione um responsável</option>
                              {colaboradores
                                .filter(colaborador => colaborador.status === 'ativo')
                                .map((colaborador) => (
                                  <option key={colaborador.id} value={colaborador.nome_completo}>
                                    {colaborador.nome_completo} ({colaborador.codigo})
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="set-ativo">Status</Label>
                            <select
                              id="set-ativo"
                              value={newSetor.ativo ? "true" : "false"}
                              onChange={(e) => setNewSetor({ ...newSetor, ativo: e.target.value === "true" })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="true">Ativo</option>
                              <option value="false">Inativo</option>
                            </select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddSetorOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddSetor} disabled={isCreating}>
                            {isCreating ? "Cadastrando..." : "Cadastrar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Modal de Edição de Setor */}
                    <Dialog open={isEditSetorOpen} onOpenChange={setIsEditSetorOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Setor</DialogTitle>
                          <DialogDescription>
                            Edite as informações do setor
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-tipo">Tipo *</Label>
                            <select
                              id="edit-tipo"
                              value={editingSetor?.tipo || ""}
                              onChange={(e) => setEditingSetor(editingSetor ? { ...editingSetor, tipo: e.target.value as any } : null)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="confinamento">Confinamento</option>
                              <option value="semiconfinamento">Semiconfinamento</option>
                              <option value="pasto">Pasto</option>
                              <option value="enfermaria">Enfermaria</option>
                              <option value="maternidade">Maternidade</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-nome">Nome *</Label>
                            <Input
                              id="edit-nome"
                              value={editingSetor?.nome || ""}
                              onChange={(e) => setEditingSetor(editingSetor ? { ...editingSetor, nome: e.target.value } : null)}
                              placeholder="Ex: Setor Norte Pasto"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-codigo">Código (Não Editável)</Label>
                            <Input
                              id="edit-codigo"
                              value={editingSetor?.codigo || ""}
                              readOnly
                              className="bg-muted cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-descricao">Descrição</Label>
                            <Input
                              id="edit-descricao"
                              value={editingSetor?.descricao || ""}
                              onChange={(e) => setEditingSetor(editingSetor ? { ...editingSetor, descricao: e.target.value } : null)}
                              placeholder="Descrição do setor"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-responsavel">Responsável</Label>
                            <select
                              id="edit-responsavel"
                              value={editingSetor?.responsavel || ""}
                              onChange={(e) => setEditingSetor(editingSetor ? { ...editingSetor, responsavel: e.target.value } : null)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecione um responsável</option>
                              {colaboradores
                                .filter(colaborador => colaborador.status === 'ativo')
                                .map((colaborador) => (
                                  <option key={colaborador.id} value={colaborador.nome_completo}>
                                    {colaborador.nome_completo} ({colaborador.codigo})
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-ativo">Status</Label>
                            <select
                              id="edit-ativo"
                              value={editingSetor?.ativo ? "true" : "false"}
                              onChange={(e) => setEditingSetor(editingSetor ? { ...editingSetor, ativo: e.target.value === "true" } : null)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="true">Ativo</option>
                              <option value="false">Inativo</option>
                            </select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={handleCloseEditSetor}>
                            Cancelar
                          </Button>
                          <Button onClick={handleUpdateSetor} disabled={isUpdating}>
                            {isUpdating ? "Salvando..." : "Salvar"}
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
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {setores.map((setor) => (
                        <TableRow key={setor.id}>
                          <TableCell className="font-medium">{setor.codigo}</TableCell>
                          <TableCell>{setor.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getTipoBadgeColor(setor.tipo)}>
                              {setor.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>{setor.descricao || "-"}</TableCell>
                          <TableCell>{setor.responsavel || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={setor.ativo ? "default" : "secondary"} className={setor.ativo ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}>
                              {setor.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEditSetor(setor)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA COLABORADORES */}
            <TabsContent value="colaboradores" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Colaboradores</CardTitle>
                      <CardDescription>
                        Gerencie funcionários e suas informações
                      </CardDescription>
                    </div>
                    <Dialog open={isAddColaboradorOpen} onOpenChange={setIsAddColaboradorOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Novo Colaborador
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
                          <DialogDescription>
                            Cadastre um novo funcionário
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto">
                          <div className="space-y-2">
                            <Label htmlFor="col-codigo">Código *</Label>
                            <Input
                              id="col-codigo"
                              value={newColaborador.codigo}
                              onChange={(e) => setNewColaborador({ ...newColaborador, codigo: e.target.value })}
                              placeholder="Ex: COL-001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-nome">Nome Completo *</Label>
                            <Input
                              id="col-nome"
                              value={newColaborador.nome_completo}
                              onChange={(e) => setNewColaborador({ ...newColaborador, nome_completo: e.target.value })}
                              placeholder="Ex: João Silva Santos"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-cargo">Cargo *</Label>
                            <Input
                              id="col-cargo"
                              value={newColaborador.cargo}
                              onChange={(e) => setNewColaborador({ ...newColaborador, cargo: e.target.value })}
                              placeholder="Ex: Operador de Máquinas"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-telefone">Telefone</Label>
                            <Input
                              id="col-telefone"
                              value={newColaborador.telefone}
                              onChange={(e) => setNewColaborador({ ...newColaborador, telefone: e.target.value })}
                              placeholder="Ex: (11) 99999-9999"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-email">Email</Label>
                            <Input
                              id="col-email"
                              type="email"
                              value={newColaborador.email}
                              onChange={(e) => setNewColaborador({ ...newColaborador, email: e.target.value })}
                              placeholder="Ex: joao@fazenda.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-admissao">Data de Admissão</Label>
                            <Input
                              id="col-admissao"
                              type="date"
                              value={newColaborador.data_admissao}
                              onChange={(e) => setNewColaborador({ ...newColaborador, data_admissao: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="col-status">Status</Label>
                            <select
                              id="col-status"
                              value={newColaborador.status}
                              onChange={(e) => setNewColaborador({ ...newColaborador, status: e.target.value as any })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="ativo">Ativo</option>
                              <option value="afastado">Afastado</option>
                              <option value="demitido">Demitido</option>
                            </select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddColaboradorOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddColaborador} disabled={isCreatingColaborador}>
                            {isCreatingColaborador ? "Cadastrando..." : "Cadastrar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Modal de Edição de Colaborador */}
                    <Dialog open={isEditColaboradorOpen} onOpenChange={setIsEditColaboradorOpen}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Editar Colaborador</DialogTitle>
                          <DialogDescription>
                            Atualize as informações do colaborador
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto">
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="edit-col-nome">Nome Completo *</Label>
                            <Input
                              id="edit-col-nome"
                              value={editingColaborador?.nome_completo || ""}
                              onChange={(e) => setEditingColaborador(prev => prev ? { ...prev, nome_completo: e.target.value } : null)}
                              placeholder="Ex: João da Silva"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-col-cargo">Cargo</Label>
                            <select
                              id="edit-col-cargo"
                              value={editingColaborador?.cargo_id || ""}
                              onChange={(e) => setEditingColaborador(prev => prev ? { ...prev, cargo_id: e.target.value } : null)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecione um cargo</option>
                              {cargos.map((cargo) => (
                                <option key={cargo.id} value={cargo.id}>
                                  {cargo.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-col-telefone">Telefone</Label>
                            <Input
                              id="edit-col-telefone"
                              type="tel"
                              value={editingColaborador?.telefone || ""}
                              onChange={(e) => setEditingColaborador(prev => prev ? { ...prev, telefone: e.target.value } : null)}
                              placeholder="Ex: (11) 99999-9999"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-col-email">Email</Label>
                            <Input
                              id="edit-col-email"
                              type="email"
                              value={editingColaborador?.email || ""}
                              onChange={(e) => setEditingColaborador(prev => prev ? { ...prev, email: e.target.value } : null)}
                              placeholder="Ex: joao@fazenda.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-col-admissao">Data de Admissão</Label>
                            <Input
                              id="edit-col-admissao"
                              type="date"
                              value={editingColaborador?.data_admissao || ""}
                              onChange={(e) => setEditingColaborador(prev => prev ? { ...prev, data_admissao: e.target.value } : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-col-status">Status</Label>
                            <select
                              id="edit-col-status"
                              value={editingColaborador?.status || ""}
                              onChange={(e) => setEditingColaborador(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="ativo">Ativo</option>
                              <option value="afastado">Afastado</option>
                              <option value="ferias">Férias</option>
                              <option value="demitido">Demitido</option>
                            </select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={handleCloseEditColaborador}>
                            Cancelar
                          </Button>
                          <Button onClick={handleUpdateColaborador} disabled={isUpdatingColaborador}>
                            {isUpdatingColaborador ? "Atualizando..." : "Atualizar"}
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
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Admissão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colaboradoresEnriquecidos.map((colaborador) => (
                        <TableRow key={colaborador.id}>
                          <TableCell className="font-medium">{colaborador.codigo}</TableCell>
                          <TableCell>{colaborador.nome_completo}</TableCell>
                          <TableCell>{colaborador.cargoNome}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>{colaborador.telefone || "-"}</div>
                              <div className="text-text-tertiary">{colaborador.email || "-"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(colaborador.data_admissao).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeColor(colaborador.status)}>
                              {colaborador.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditColaborador(colaborador)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteColaborador(colaborador.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA ROTAS */}
            <TabsContent value="rotas" className="space-y-4">
              <RotasTab />
            </TabsContent>

            {/* ABA LEITURA DE COCHO */}
            <TabsContent value="leitura-cocho" className="space-y-4">
              <LeituraCochoTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}