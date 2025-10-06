import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Beaker } from 'lucide-react';
import { useVagoesAtivos } from '@/hooks/useVagoes';
import { useCreateChecagemQualidade } from '@/hooks/useChecagemQualidadeMistura';
import { format } from 'date-fns';

export function NovaChecagemQualidadeDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    data_checagem: format(new Date(), 'yyyy-MM-dd'),
    hora_checagem: format(new Date(), 'HH:mm'),
    vagao_id: '',
    dieta_nome: '',
    lote_producao: '',
    quantidade_produzida: '',

    // Avaliação visual
    homogeneidade_visual: 'boa' as const,
    presenca_grumos: false,
    segregacao_ingredientes: false,
    umidade_aparente: 'adequada' as const,
    cor_consistencia: 'normal' as const,
    odor: 'normal' as const,

    // Teste de homogeneidade
    teste_marcador_realizado: false,
    coeficiente_variacao: '',
    numero_amostras: '',

    // Análise granulométrica
    particulas_grossas: '',
    particulas_medias: '',
    particulas_finas: '',

    // Temperatura
    temperatura_mistura: '',

    observacoes: ''
  });

  const { data: vagoes, isLoading: loadingVagoes } = useVagoesAtivos();
  const createChecagem = useCreateChecagemQualidade();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit: any = {
      ...formData,
      quantidade_produzida: formData.quantidade_produzida ? parseFloat(formData.quantidade_produzida) : undefined,
      coeficiente_variacao: formData.coeficiente_variacao ? parseFloat(formData.coeficiente_variacao) : undefined,
      numero_amostras: formData.numero_amostras ? parseInt(formData.numero_amostras) : undefined,
      particulas_grossas: formData.particulas_grossas ? parseFloat(formData.particulas_grossas) : undefined,
      particulas_medias: formData.particulas_medias ? parseFloat(formData.particulas_medias) : undefined,
      particulas_finas: formData.particulas_finas ? parseFloat(formData.particulas_finas) : undefined,
      temperatura_mistura: formData.temperatura_mistura ? parseFloat(formData.temperatura_mistura) : undefined,
    };

    // Remove campos vazios
    Object.keys(dataToSubmit).forEach(key => {
      if (dataToSubmit[key] === '' || dataToSubmit[key] === undefined) {
        delete dataToSubmit[key];
      }
    });

    await createChecagem.mutateAsync(dataToSubmit);

    setOpen(false);
    // Reset form
    setFormData({
      data_checagem: format(new Date(), 'yyyy-MM-dd'),
      hora_checagem: format(new Date(), 'HH:mm'),
      vagao_id: '',
      dieta_nome: '',
      lote_producao: '',
      quantidade_produzida: '',
      homogeneidade_visual: 'boa',
      presenca_grumos: false,
      segregacao_ingredientes: false,
      umidade_aparente: 'adequada',
      cor_consistencia: 'normal',
      odor: 'normal',
      teste_marcador_realizado: false,
      coeficiente_variacao: '',
      numero_amostras: '',
      particulas_grossas: '',
      particulas_medias: '',
      particulas_finas: '',
      temperatura_mistura: '',
      observacoes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Checagem de Qualidade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Checagem de Qualidade da Mistura</DialogTitle>
          <DialogDescription>
            Avalie a homogeneidade e qualidade da mistura de ração
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vagao">Vagão (opcional)</Label>
              <Select
                value={formData.vagao_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, vagao_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingVagoes ? "Carregando..." : "Selecione o vagão (opcional)"} />
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
            <div>
              <Label htmlFor="dieta">Nome da Dieta</Label>
              <Input
                id="dieta"
                value={formData.dieta_nome}
                onChange={(e) => setFormData({ ...formData, dieta_nome: e.target.value })}
                placeholder="Ex: Dieta Crescimento 2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lote">Lote de Produção</Label>
              <Input
                id="lote"
                value={formData.lote_producao}
                onChange={(e) => setFormData({ ...formData, lote_producao: e.target.value })}
                placeholder="Ex: LOTE-2024-001"
              />
            </div>
            <div>
              <Label htmlFor="quantidade">Quantidade Produzida (kg)</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                value={formData.quantidade_produzida}
                onChange={(e) => setFormData({ ...formData, quantidade_produzida: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Avaliação Visual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Avaliação Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homogeneidade">Homogeneidade Visual</Label>
                  <Select
                    value={formData.homogeneidade_visual}
                    onValueChange={(value: any) => setFormData({ ...formData, homogeneidade_visual: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excelente">⭐⭐⭐⭐⭐ Excelente</SelectItem>
                      <SelectItem value="boa">⭐⭐⭐⭐ Boa</SelectItem>
                      <SelectItem value="regular">⭐⭐⭐ Regular</SelectItem>
                      <SelectItem value="ruim">⭐⭐ Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="umidade">Umidade Aparente</Label>
                  <Select
                    value={formData.umidade_aparente}
                    onValueChange={(value: any) => setFormData({ ...formData, umidade_aparente: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seca">Seca</SelectItem>
                      <SelectItem value="adequada">Adequada</SelectItem>
                      <SelectItem value="umida">Úmida</SelectItem>
                      <SelectItem value="muito_umida">Muito Úmida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cor">Cor e Consistência</Label>
                  <Select
                    value={formData.cor_consistencia}
                    onValueChange={(value: any) => setFormData({ ...formData, cor_consistencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alterada">Alterada</SelectItem>
                      <SelectItem value="suspeita">Suspeita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="odor">Odor</Label>
                  <Select
                    value={formData.odor}
                    onValueChange={(value: any) => setFormData({ ...formData, odor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alterado">Alterado</SelectItem>
                      <SelectItem value="azedo">Azedo</SelectItem>
                      <SelectItem value="mofo">Mofo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="grumos"
                    checked={formData.presenca_grumos}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, presenca_grumos: checked as boolean })
                    }
                  />
                  <Label htmlFor="grumos">Presença de Grumos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="segregacao"
                    checked={formData.segregacao_ingredientes}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, segregacao_ingredientes: checked as boolean })
                    }
                  />
                  <Label htmlFor="segregacao">Segregação de Ingredientes</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teste de Homogeneidade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Teste de Homogeneidade (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="teste"
                  checked={formData.teste_marcador_realizado}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, teste_marcador_realizado: checked as boolean })
                  }
                />
                <Label htmlFor="teste">Teste de Marcador Realizado</Label>
              </div>

              {formData.teste_marcador_realizado && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cv">Coeficiente de Variação (%)</Label>
                    <Input
                      id="cv"
                      type="number"
                      step="0.01"
                      value={formData.coeficiente_variacao}
                      onChange={(e) => setFormData({ ...formData, coeficiente_variacao: e.target.value })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      &lt;10% Excelente | 10-15% Aceitável | 15-20% Marginal | &gt;20% Inadequado
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="amostras">Número de Amostras</Label>
                    <Input
                      id="amostras"
                      type="number"
                      value={formData.numero_amostras}
                      onChange={(e) => setFormData({ ...formData, numero_amostras: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Análise Granulométrica (Opcional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análise Granulométrica (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="grossas">Partículas Grossas (%)</Label>
                  <Input
                    id="grossas"
                    type="number"
                    step="0.01"
                    value={formData.particulas_grossas}
                    onChange={(e) => setFormData({ ...formData, particulas_grossas: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="medias">Partículas Médias (%)</Label>
                  <Input
                    id="medias"
                    type="number"
                    step="0.01"
                    value={formData.particulas_medias}
                    onChange={(e) => setFormData({ ...formData, particulas_medias: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="finas">Partículas Finas (%)</Label>
                  <Input
                    id="finas"
                    type="number"
                    step="0.01"
                    value={formData.particulas_finas}
                    onChange={(e) => setFormData({ ...formData, particulas_finas: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="temperatura">Temperatura da Mistura (°C)</Label>
            <Input
              id="temperatura"
              type="number"
              step="0.1"
              value={formData.temperatura_mistura}
              onChange={(e) => setFormData({ ...formData, temperatura_mistura: e.target.value })}
              placeholder="25.0"
            />
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