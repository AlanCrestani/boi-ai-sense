import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Package, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Dieta {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'confinamento' | 'semiconfinamento' | 'pasto' | 'enfermaria' | 'maternidade';
  categoria?: string;
  custo_kg?: number;
}

interface EstoqueProduto {
  id: string;
  dieta_id: string;
  dieta?: Dieta;
  data: string;
  quantidade_fabricada: number;
  quantidade_estoque: number;
  quantidade_distribuida: number;
  lote_fabricacao?: string;
  observacoes?: string;
}

export default function EstoqueProdutosPasto() {
  const [dietas, setDietas] = useState<Dieta[]>([]);

  const [estoque, setEstoque] = useState<EstoqueProduto[]>([]);

  const [newDieta, setNewDieta] = useState<Omit<Dieta, "id">>({
    codigo: "",
    nome: "",
    tipo: "pasto",
    categoria: "",
    custo_kg: 0
  });

  const [newEstoque, setNewEstoque] = useState<Omit<EstoqueProduto, "id">>({
    dieta_id: "",
    data: new Date().toISOString().split('T')[0],
    quantidade_fabricada: 0,
    quantidade_estoque: 0,
    quantidade_distribuida: 0,
    lote_fabricacao: ""
  });

  const [isAddDietaOpen, setIsAddDietaOpen] = useState(false);
  const [isAddEstoqueOpen, setIsAddEstoqueOpen] = useState(false);

  // Enriquecer estoque com dados da dieta
  const estoqueEnriquecido = estoque.map(item => ({
    ...item,
    dieta: dietas.find(d => d.id === item.dieta_id)
  }));

  // Calcular métricas
  const totalEstoque = estoqueEnriquecido.reduce((acc, item) => acc + item.quantidade_estoque, 0);
  const totalFabricado = estoqueEnriquecido.reduce((acc, item) => acc + item.quantidade_fabricada, 0);
  const totalDistribuido = estoqueEnriquecido.reduce((acc, item) => acc + item.quantidade_distribuida, 0);
  const percentualUtilizado = totalFabricado > 0 ? (totalDistribuido / totalFabricado) * 100 : 0;

  const handleAddDieta = () => {
    if (!newDieta.codigo || !newDieta.nome) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const dieta: Dieta = {
      ...newDieta,
      id: Date.now().toString()
    };

    setDietas([...dietas, dieta]);
    setNewDieta({ codigo: "", nome: "", tipo: "pasto", categoria: "", custo_kg: 0 });
    setIsAddDietaOpen(false);
    toast.success("Dieta cadastrada com sucesso!");
  };

  const handleAddEstoque = () => {
    if (!newEstoque.dieta_id || !newEstoque.data) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const estoqueItem: EstoqueProduto = {
      ...newEstoque,
      id: Date.now().toString()
    };

    setEstoque([...estoque, estoqueItem]);
    setNewEstoque({
      dieta_id: "",
      data: new Date().toISOString().split('T')[0],
      quantidade_fabricada: 0,
      quantidade_estoque: 0,
      quantidade_distribuida: 0,
      lote_fabricacao: ""
    });
    setIsAddEstoqueOpen(false);
    toast.success("Estoque atualizado com sucesso!");
  };

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

  const getEstoqueStatus = (estoque: number, fabricado: number) => {
    const percentual = fabricado > 0 ? (estoque / fabricado) * 100 : 0;
    if (percentual > 50) return { color: 'text-green-500', icon: <TrendingUp className="h-4 w-4" /> };
    if (percentual > 20) return { color: 'text-yellow-500', icon: <AlertCircle className="h-4 w-4" /> };
    return { color: 'text-red-500', icon: <TrendingDown className="h-4 w-4" /> };
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 py-2 sm:py-8 lg:px-8">
        <div className="space-y-6">
          <div className="mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                Estoque Produtos Pasto
              </h1>
              <p className="text-sm sm:text-base text-text-secondary">
                Controle de estoque de proteinados e suplementos para pasto
              </p>
            </div>
          </div>

          {/* Métricas Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  Total em Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {totalEstoque.toLocaleString('pt-BR')} kg
                </div>
                <Progress value={percentualUtilizado} className="mt-2" />
                <p className="text-xs text-text-tertiary mt-1">
                  {percentualUtilizado.toFixed(1)}% utilizado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  Fabricado Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {totalFabricado.toLocaleString('pt-BR')} kg
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500">+15% vs ontem</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  Distribuído
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {totalDistribuido.toLocaleString('pt-BR')} kg
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-text-tertiary">Últimas 24h</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  Tipos de Produto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {dietas.filter(d => d.tipo === 'pasto').length}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Proteinados
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Minerais
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="estoque" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="estoque">Controle de Estoque</TabsTrigger>
              <TabsTrigger value="dietas">Cadastro de Dietas</TabsTrigger>
            </TabsList>

            <TabsContent value="estoque" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Estoque Atual</CardTitle>
                      <CardDescription>
                        Acompanhe o estoque de produtos para pasto
                      </CardDescription>
                    </div>
                    <Dialog open={isAddEstoqueOpen} onOpenChange={setIsAddEstoqueOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Registrar Produção
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Nova Produção</DialogTitle>
                          <DialogDescription>
                            Adicione uma nova produção ao estoque
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="dieta">Produto *</Label>
                            <select
                              id="dieta"
                              value={newEstoque.dieta_id}
                              onChange={(e) => setNewEstoque({ ...newEstoque, dieta_id: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecione um produto</option>
                              {dietas.filter(d => d.tipo === 'pasto').map((dieta) => (
                                <option key={dieta.id} value={dieta.id}>
                                  {dieta.nome} - {dieta.codigo}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="data">Data *</Label>
                            <Input
                              id="data"
                              type="date"
                              value={newEstoque.data}
                              onChange={(e) => setNewEstoque({ ...newEstoque, data: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fabricado">Quantidade Fabricada (kg)</Label>
                            <Input
                              id="fabricado"
                              type="number"
                              value={newEstoque.quantidade_fabricada}
                              onChange={(e) => setNewEstoque({
                                ...newEstoque,
                                quantidade_fabricada: Number(e.target.value),
                                quantidade_estoque: Number(e.target.value) - newEstoque.quantidade_distribuida
                              })}
                              placeholder="Ex: 5000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="distribuido">Quantidade Distribuída (kg)</Label>
                            <Input
                              id="distribuido"
                              type="number"
                              value={newEstoque.quantidade_distribuida}
                              onChange={(e) => setNewEstoque({
                                ...newEstoque,
                                quantidade_distribuida: Number(e.target.value),
                                quantidade_estoque: newEstoque.quantidade_fabricada - Number(e.target.value)
                              })}
                              placeholder="Ex: 2000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lote">Lote de Fabricação</Label>
                            <Input
                              id="lote"
                              value={newEstoque.lote_fabricacao}
                              onChange={(e) => setNewEstoque({ ...newEstoque, lote_fabricacao: e.target.value })}
                              placeholder="Ex: LF-2024-001"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddEstoqueOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddEstoque}>
                            Registrar
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
                        <TableHead>Produto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Fabricado</TableHead>
                        <TableHead>Em Estoque</TableHead>
                        <TableHead>Distribuído</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estoqueEnriquecido.map((item) => {
                        const status = getEstoqueStatus(item.quantidade_estoque, item.quantidade_fabricada);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.dieta?.nome}</p>
                                <p className="text-xs text-text-tertiary">{item.dieta?.codigo}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.lote_fabricacao || "-"}</TableCell>
                            <TableCell>{item.quantidade_fabricada.toLocaleString('pt-BR')} kg</TableCell>
                            <TableCell>
                              <span className={status.color}>
                                {item.quantidade_estoque.toLocaleString('pt-BR')} kg
                              </span>
                            </TableCell>
                            <TableCell>{item.quantidade_distribuida.toLocaleString('pt-BR')} kg</TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 ${status.color}`}>
                                {status.icon}
                                <span className="text-xs">
                                  {((item.quantidade_estoque / item.quantidade_fabricada) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dietas" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cadastro de Dietas</CardTitle>
                      <CardDescription>
                        Gerencie os tipos de dietas e suplementos
                      </CardDescription>
                    </div>
                    <Dialog open={isAddDietaOpen} onOpenChange={setIsAddDietaOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Nova Dieta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Nova Dieta</DialogTitle>
                          <DialogDescription>
                            Cadastre uma nova dieta ou suplemento
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="codigo">Código *</Label>
                            <Input
                              id="codigo"
                              value={newDieta.codigo}
                              onChange={(e) => setNewDieta({ ...newDieta, codigo: e.target.value })}
                              placeholder="Ex: PROT-001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nome">Nome *</Label>
                            <Input
                              id="nome"
                              value={newDieta.nome}
                              onChange={(e) => setNewDieta({ ...newDieta, nome: e.target.value })}
                              placeholder="Ex: Proteinado Energético"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tipo">Tipo *</Label>
                            <select
                              id="tipo"
                              value={newDieta.tipo}
                              onChange={(e) => setNewDieta({ ...newDieta, tipo: e.target.value as any })}
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
                            <Label htmlFor="categoria">Categoria</Label>
                            <Input
                              id="categoria"
                              value={newDieta.categoria}
                              onChange={(e) => setNewDieta({ ...newDieta, categoria: e.target.value })}
                              placeholder="Ex: Proteinado, Mineral, Energético"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="custo">Custo por kg (R$)</Label>
                            <Input
                              id="custo"
                              type="number"
                              step="0.01"
                              value={newDieta.custo_kg}
                              onChange={(e) => setNewDieta({ ...newDieta, custo_kg: Number(e.target.value) })}
                              placeholder="Ex: 2.50"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddDietaOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddDieta}>
                            Cadastrar
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
                        <TableHead>Categoria</TableHead>
                        <TableHead>Custo/kg</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dietas.map((dieta) => (
                        <TableRow key={dieta.id}>
                          <TableCell className="font-medium">{dieta.codigo}</TableCell>
                          <TableCell>{dieta.nome}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getTipoBadgeColor(dieta.tipo)}
                            >
                              {dieta.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>{dieta.categoria || "-"}</TableCell>
                          <TableCell>
                            {dieta.custo_kg ? `R$ ${dieta.custo_kg.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon">
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
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}