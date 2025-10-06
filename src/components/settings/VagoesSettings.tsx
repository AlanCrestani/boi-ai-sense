import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Truck, Loader2, AlertCircle } from 'lucide-react';
import { useVagoes, useCreateVagao, useUpdateVagao, useDeleteVagao, CreateVagaoData, Vagao } from '@/hooks/useVagoes';
import { Skeleton } from '@/components/ui/skeleton';

export function VagoesSettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVagao, setEditingVagao] = useState<Vagao | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vagaoToDelete, setVagaoToDelete] = useState<Vagao | null>(null);

  const [formData, setFormData] = useState<CreateVagaoData>({
    codigo: '',
    nome: '',
    tipo: 'Misturador',
    capacidade_kg: undefined,
    marca: '',
    modelo: '',
    ano_fabricacao: undefined,
    ativo: true,
    observacoes: ''
  });

  const { data: vagoes, isLoading } = useVagoes();
  const createVagao = useCreateVagao();
  const updateVagao = useUpdateVagao();
  const deleteVagao = useDeleteVagao();

  const handleOpenDialog = (vagao?: Vagao) => {
    if (vagao) {
      setEditingVagao(vagao);
      setFormData({
        codigo: vagao.codigo,
        nome: vagao.nome,
        tipo: vagao.tipo || 'Misturador',
        capacidade_kg: vagao.capacidade_kg,
        marca: vagao.marca || '',
        modelo: vagao.modelo || '',
        ano_fabricacao: vagao.ano_fabricacao,
        ativo: vagao.ativo,
        observacoes: vagao.observacoes || ''
      });
    } else {
      setEditingVagao(null);
      setFormData({
        codigo: '',
        nome: '',
        tipo: 'Misturador',
        capacidade_kg: undefined,
        marca: '',
        modelo: '',
        ano_fabricacao: undefined,
        ativo: true,
        observacoes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      capacidade_kg: formData.capacidade_kg ? Number(formData.capacidade_kg) : undefined,
      ano_fabricacao: formData.ano_fabricacao ? Number(formData.ano_fabricacao) : undefined
    };

    if (editingVagao) {
      await updateVagao.mutateAsync({
        id: editingVagao.id,
        ...dataToSubmit
      });
    } else {
      await createVagao.mutateAsync(dataToSubmit);
    }

    setDialogOpen(false);
    handleOpenDialog(); // Reset form
  };

  const handleDelete = async () => {
    if (vagaoToDelete) {
      await deleteVagao.mutateAsync(vagaoToDelete.id);
      setDeleteConfirmOpen(false);
      setVagaoToDelete(null);
    }
  };

  const openDeleteConfirm = (vagao: Vagao) => {
    setVagaoToDelete(vagao);
    setDeleteConfirmOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Vagões</CardTitle>
          <CardDescription>Gerencie os vagões de mistura e distribuição</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Cadastro de Vagões</CardTitle>
              <CardDescription>Gerencie os vagões de mistura e distribuição</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Vagão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vagoes && vagoes.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum vagão cadastrado. Clique em "Novo Vagão" para adicionar o primeiro.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableCaption>Lista de vagões cadastrados</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagoes?.map((vagao) => (
                  <TableRow key={vagao.id}>
                    <TableCell className="font-mono">{vagao.codigo}</TableCell>
                    <TableCell>{vagao.nome}</TableCell>
                    <TableCell>{vagao.marca || '-'}</TableCell>
                    <TableCell>{vagao.modelo || '-'}</TableCell>
                    <TableCell>
                      {vagao.capacidade_kg
                        ? `${vagao.capacidade_kg.toLocaleString('pt-BR')} kg`
                        : '-'}
                    </TableCell>
                    <TableCell>{vagao.ano_fabricacao || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={vagao.ativo ? 'default' : 'secondary'}
                        className={vagao.ativo ? 'bg-green-100 text-green-800' : ''}
                      >
                        {vagao.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(vagao)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteConfirm(vagao)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {editingVagao ? 'Editar Vagão' : 'Novo Vagão'}
              </div>
            </DialogTitle>
            <DialogDescription>
              {editingVagao
                ? 'Atualize as informações do vagão'
                : 'Preencha os dados do novo vagão'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: V001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Vagão 1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  placeholder="Ex: Siloking"
                />
              </div>
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  placeholder="Ex: TMR 2000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacidade">Capacidade (kg)</Label>
                <Input
                  id="capacidade"
                  type="number"
                  value={formData.capacidade_kg || ''}
                  onChange={(e) => setFormData({ ...formData, capacidade_kg: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Ex: 5000"
                />
              </div>
              <div>
                <Label htmlFor="ano">Ano de Fabricação</Label>
                <Input
                  id="ano"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.ano_fabricacao || ''}
                  onChange={(e) => setFormData({ ...formData, ano_fabricacao: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Ex: 2020"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Vagão ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createVagao.isPending || updateVagao.isPending}
              >
                {(createVagao.isPending || updateVagao.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingVagao ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o vagão <strong>{vagaoToDelete?.codigo} - {vagaoToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteVagao.isPending}
            >
              {deleteVagao.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}