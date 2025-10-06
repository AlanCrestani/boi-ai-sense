import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { useVagoesAtivos } from '@/hooks/useVagoes';
import { useCreateChecagemPesoVagao } from '@/hooks/useChecagemPesoVagao';
import { format } from 'date-fns';

export function NovaChecagemDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    data_checagem: format(new Date(), 'yyyy-MM-dd'),
    hora_checagem: format(new Date(), 'HH:mm'),
    vagao_id: '',
    peso_vazio_balancao: '',
    peso_carregado_balancao: '',
    peso_visor_balanca_vagao: '',
    observacoes: ''
  });

  const { data: vagoes, isLoading: loadingVagoes } = useVagoesAtivos();
  const createChecagem = useCreateChecagemPesoVagao();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createChecagem.mutateAsync({
      ...formData,
      peso_vazio_balancao: parseFloat(formData.peso_vazio_balancao),
      peso_carregado_balancao: parseFloat(formData.peso_carregado_balancao),
      peso_visor_balanca_vagao: parseFloat(formData.peso_visor_balanca_vagao)
    });

    setOpen(false);
    setFormData({
      data_checagem: format(new Date(), 'yyyy-MM-dd'),
      hora_checagem: format(new Date(), 'HH:mm'),
      vagao_id: '',
      peso_vazio_balancao: '',
      peso_carregado_balancao: '',
      peso_visor_balanca_vagao: '',
      observacoes: ''
    });
  };

  const pesoLiquido = formData.peso_carregado_balancao && formData.peso_vazio_balancao
    ? (parseFloat(formData.peso_carregado_balancao) - parseFloat(formData.peso_vazio_balancao)).toFixed(2)
    : '0.00';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Checagem
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Checagem de Peso do Vagão</DialogTitle>
          <DialogDescription>
            Preencha os dados da pesagem do vagão no balancão e no visor da balança
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data">Data da Checagem</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_checagem}
                onChange={(e) => setFormData({ ...formData, data_checagem: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="hora">Hora da Checagem</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora_checagem}
                onChange={(e) => setFormData({ ...formData, hora_checagem: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vagao">Vagão</Label>
            <Select
              value={formData.vagao_id}
              onValueChange={(value) => setFormData({ ...formData, vagao_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingVagoes ? "Carregando..." : "Selecione o vagão"} />
              </SelectTrigger>
              <SelectContent>
                {vagoes?.map((vagao) => (
                  <SelectItem key={vagao.id} value={vagao.id}>
                    {vagao.codigo} - {vagao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium">Pesagem no Balancão</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="peso_vazio">Peso Vazio (kg)</Label>
                <Input
                  id="peso_vazio"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.peso_vazio_balancao}
                  onChange={(e) => setFormData({ ...formData, peso_vazio_balancao: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="peso_carregado">Peso Carregado (kg)</Label>
                <Input
                  id="peso_carregado"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.peso_carregado_balancao}
                  onChange={(e) => setFormData({ ...formData, peso_carregado_balancao: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="bg-primary/10 p-3 rounded">
              <p className="text-sm text-muted-foreground">Peso Líquido Calculado:</p>
              <p className="text-xl font-bold">{pesoLiquido} kg</p>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium">Visor da Balança do Vagão</h4>
            <div>
              <Label htmlFor="peso_visor">Peso no Visor (kg)</Label>
              <Input
                id="peso_visor"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.peso_visor_balanca_vagao}
                onChange={(e) => setFormData({ ...formData, peso_visor_balanca_vagao: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre a checagem..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createChecagem.isPending}>
              {createChecagem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Checagem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}