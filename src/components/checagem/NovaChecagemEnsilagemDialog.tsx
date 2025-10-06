import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Loader2, Wheat } from 'lucide-react';
import { useCreateChecagemEnsilagem } from '@/hooks/useChecagemProcessoEnsilagem';
import { format } from 'date-fns';

export function NovaChecagemEnsilagemDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    data_checagem: format(new Date(), 'yyyy-MM-dd'),
    hora_checagem: format(new Date(), 'HH:mm'),
    tipo_forragem: '',
    local_silo: '',
    numero_silo: '',
    ph: '',
    materia_seca_percentual: '',
    temperatura_celsius: '',
    cor: '',
    odor: '',
    presenca_mofo: false,
    presenca_micotoxinas: false,
    densidade_kg_m3: '',
    qualidade_vedacao: '',
    presenca_ar: false,
    proteina_bruta: '',
    fibra_fdn: '',
    energia_ndt: '',
    score_qualidade: '',
    acoes_corretivas: '',
    observacoes: '',
    proxima_analise_prevista: ''
  });

  const createChecagem = useCreateChecagemEnsilagem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit: any = {
      data_checagem: formData.data_checagem,
      hora_checagem: formData.hora_checagem,
      tipo_forragem: formData.tipo_forragem || undefined,
      local_silo: formData.local_silo || undefined,
      numero_silo: formData.numero_silo || undefined,
      ph: formData.ph ? parseFloat(formData.ph) : undefined,
      materia_seca_percentual: formData.materia_seca_percentual ? parseFloat(formData.materia_seca_percentual) : undefined,
      temperatura_celsius: formData.temperatura_celsius ? parseFloat(formData.temperatura_celsius) : undefined,
      cor: formData.cor || undefined,
      odor: formData.odor || undefined,
      presenca_mofo: formData.presenca_mofo,
      presenca_micotoxinas: formData.presenca_micotoxinas,
      densidade_kg_m3: formData.densidade_kg_m3 ? parseFloat(formData.densidade_kg_m3) : undefined,
      qualidade_vedacao: formData.qualidade_vedacao || undefined,
      presenca_ar: formData.presenca_ar,
      proteina_bruta: formData.proteina_bruta ? parseFloat(formData.proteina_bruta) : undefined,
      fibra_fdn: formData.fibra_fdn ? parseFloat(formData.fibra_fdn) : undefined,
      energia_ndt: formData.energia_ndt ? parseFloat(formData.energia_ndt) : undefined,
      score_qualidade: formData.score_qualidade ? parseInt(formData.score_qualidade) : undefined,
      acoes_corretivas: formData.acoes_corretivas || undefined,
      observacoes: formData.observacoes || undefined,
      proxima_analise_prevista: formData.proxima_analise_prevista || undefined,
    };

    await createChecagem.mutateAsync(dataToSubmit);

    setOpen(false);
    // Reset form
    setFormData({
      data_checagem: format(new Date(), 'yyyy-MM-dd'),
      hora_checagem: format(new Date(), 'HH:mm'),
      tipo_forragem: '',
      local_silo: '',
      numero_silo: '',
      ph: '',
      materia_seca_percentual: '',
      temperatura_celsius: '',
      cor: '',
      odor: '',
      presenca_mofo: false,
      presenca_micotoxinas: false,
      densidade_kg_m3: '',
      qualidade_vedacao: '',
      presenca_ar: false,
      proteina_bruta: '',
      fibra_fdn: '',
      energia_ndt: '',
      score_qualidade: '',
      acoes_corretivas: '',
      observacoes: '',
      proxima_analise_prevista: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Análise de Ensilagem
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wheat className="w-5 h-5" />
            Registrar Análise de Ensilagem
          </DialogTitle>
          <DialogDescription>
            Controle de qualidade do processo de ensilagem
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data">Data da Análise</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_checagem}
                onChange={(e) => setFormData({ ...formData, data_checagem: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="hora">Hora da Análise</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora_checagem}
                onChange={(e) => setFormData({ ...formData, hora_checagem: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Identificação da Silagem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identificação da Silagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="tipo">Tipo de Forragem</Label>
                  <Select
                    value={formData.tipo_forragem || undefined}
                    onValueChange={(value) => setFormData({ ...formData, tipo_forragem: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="milho">Milho</SelectItem>
                      <SelectItem value="sorgo">Sorgo</SelectItem>
                      <SelectItem value="capim">Capim</SelectItem>
                      <SelectItem value="cana">Cana-de-açúcar</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="local">Local do Silo</Label>
                  <Input
                    id="local"
                    value={formData.local_silo}
                    onChange={(e) => setFormData({ ...formData, local_silo: e.target.value })}
                    placeholder="Ex: Trincheira 1"
                  />
                </div>
                <div>
                  <Label htmlFor="numero">Número do Silo</Label>
                  <Input
                    id="numero"
                    value={formData.numero_silo}
                    onChange={(e) => setFormData({ ...formData, numero_silo: e.target.value })}
                    placeholder="Ex: S-01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parâmetros de Qualidade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parâmetros de Qualidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="ph">pH</Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.01"
                    min="0"
                    max="14"
                    value={formData.ph}
                    onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                    placeholder="3.8 - 4.2 (ideal)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Ideal: 3.8 - 4.2</p>
                </div>
                <div>
                  <Label htmlFor="ms">Matéria Seca (%)</Label>
                  <Input
                    id="ms"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.materia_seca_percentual}
                    onChange={(e) => setFormData({ ...formData, materia_seca_percentual: e.target.value })}
                    placeholder="30 - 35% (ideal)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Ideal: 30 - 35%</p>
                </div>
                <div>
                  <Label htmlFor="temp">Temperatura (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    step="0.1"
                    value={formData.temperatura_celsius}
                    onChange={(e) => setFormData({ ...formData, temperatura_celsius: e.target.value })}
                    placeholder="Ex: 25.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características Físicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Características Físicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cor">Cor</Label>
                  <Select
                    value={formData.cor || undefined}
                    onValueChange={(value) => setFormData({ ...formData, cor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verde-oliva">Verde-oliva (ideal)</SelectItem>
                      <SelectItem value="amarelo-palido">Amarelo-pálido</SelectItem>
                      <SelectItem value="marrom">Marrom</SelectItem>
                      <SelectItem value="preto">Preto (ruim)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="odor">Odor</Label>
                  <Select
                    value={formData.odor || undefined}
                    onValueChange={(value) => setFormData({ ...formData, odor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o odor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acido-lactico">Ácido láctico (ideal)</SelectItem>
                      <SelectItem value="vinagre">Vinagre</SelectItem>
                      <SelectItem value="amonia">Amônia</SelectItem>
                      <SelectItem value="putrido">Pútrido (ruim)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mofo"
                    checked={formData.presenca_mofo}
                    onCheckedChange={(checked) => setFormData({ ...formData, presenca_mofo: checked as boolean })}
                  />
                  <Label htmlFor="mofo" className="text-sm font-normal cursor-pointer">
                    Presença de mofo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="micotoxinas"
                    checked={formData.presenca_micotoxinas}
                    onCheckedChange={(checked) => setFormData({ ...formData, presenca_micotoxinas: checked as boolean })}
                  />
                  <Label htmlFor="micotoxinas" className="text-sm font-normal cursor-pointer">
                    Presença de micotoxinas
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compactação e Vedação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compactação e Vedação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="densidade">Densidade (kg/m³)</Label>
                  <Input
                    id="densidade"
                    type="number"
                    step="0.01"
                    value={formData.densidade_kg_m3}
                    onChange={(e) => setFormData({ ...formData, densidade_kg_m3: e.target.value })}
                    placeholder="550 - 650 (ideal)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Ideal: 550 - 650 kg/m³</p>
                </div>
                <div>
                  <Label htmlFor="vedacao">Qualidade da Vedação</Label>
                  <Select
                    value={formData.qualidade_vedacao || undefined}
                    onValueChange={(value) => setFormData({ ...formData, qualidade_vedacao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excelente">Excelente</SelectItem>
                      <SelectItem value="boa">Boa</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="ruim">Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ar"
                  checked={formData.presenca_ar}
                  onCheckedChange={(checked) => setFormData({ ...formData, presenca_ar: checked as boolean })}
                />
                <Label htmlFor="ar" className="text-sm font-normal cursor-pointer">
                  Presença de ar/bolsões
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Análise Nutricional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análise Nutricional (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="pb">Proteína Bruta (%PB)</Label>
                  <Input
                    id="pb"
                    type="number"
                    step="0.01"
                    value={formData.proteina_bruta}
                    onChange={(e) => setFormData({ ...formData, proteina_bruta: e.target.value })}
                    placeholder="Ex: 8.5"
                  />
                </div>
                <div>
                  <Label htmlFor="fdn">Fibra FDN (%)</Label>
                  <Input
                    id="fdn"
                    type="number"
                    step="0.01"
                    value={formData.fibra_fdn}
                    onChange={(e) => setFormData({ ...formData, fibra_fdn: e.target.value })}
                    placeholder="Ex: 45.2"
                  />
                </div>
                <div>
                  <Label htmlFor="ndt">Energia NDT (%)</Label>
                  <Input
                    id="ndt"
                    type="number"
                    step="0.01"
                    value={formData.energia_ndt}
                    onChange={(e) => setFormData({ ...formData, energia_ndt: e.target.value })}
                    placeholder="Ex: 65.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avaliação Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Avaliação Geral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="score">Score de Qualidade (1-5)</Label>
                <Select
                  value={formData.score_qualidade || undefined}
                  onValueChange={(value) => setFormData({ ...formData, score_qualidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a nota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">⭐ 1 - Muito Ruim</SelectItem>
                    <SelectItem value="2">⭐⭐ 2 - Ruim</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ 3 - Regular</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ 4 - Bom</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Excelente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ações e Observações */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="acoes">Ações Corretivas</Label>
              <Textarea
                id="acoes"
                placeholder="Descreva ações corretivas necessárias..."
                value={formData.acoes_corretivas}
                onChange={(e) => setFormData({ ...formData, acoes_corretivas: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                placeholder="Adicione observações sobre a análise..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="proxima">Próxima Análise Prevista</Label>
              <Input
                id="proxima"
                type="date"
                value={formData.proxima_analise_prevista}
                onChange={(e) => setFormData({ ...formData, proxima_analise_prevista: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createChecagem.isPending}>
              {createChecagem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Análise
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
