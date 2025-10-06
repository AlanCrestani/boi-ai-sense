import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Wheat, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateChecagemGranulometria } from '@/hooks/useChecagemGranulometria';
import { format } from 'date-fns';

export function NovaChecagemGranulometriaDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    data_checagem: format(new Date(), 'yyyy-MM-dd'),
    hora_checagem: format(new Date(), 'HH:mm'),

    // Grain info
    tipo_grao: 'milho' as const,
    outro_grao: '',
    lote_grao: '',
    fornecedor: '',

    // Equipment
    equipamento_moagem: 'moinho_martelo',
    peneira_utilizada: '',

    // Granulometry results
    particulas_finas: '', // < 0.5mm
    particulas_pequenas: '', // 0.5-1.0mm
    particulas_medias: '', // 1.0-2.0mm
    particulas_grandes: '', // 2.0-4.0mm
    particulas_muito_grandes: '', // > 4.0mm

    // Quality
    uniformidade: 'boa' as const,
    dentro_especificacao: true,
    especificacao_min: '',
    especificacao_max: '',

    // Visual
    presenca_pos: false,
    presenca_graos_inteiros: false,
    umidade_aparente: 'adequada' as const,

    // Test
    metodo_analise: 'peneiramento',
    numero_amostras: '3',
    peso_amostra: '500',

    observacoes: ''
  });

  const createChecagem = useCreateChecagemGranulometria();

  // Calculate if percentages sum to 100
  const calculateTotal = () => {
    const values = [
      parseFloat(formData.particulas_finas) || 0,
      parseFloat(formData.particulas_pequenas) || 0,
      parseFloat(formData.particulas_medias) || 0,
      parseFloat(formData.particulas_grandes) || 0,
      parseFloat(formData.particulas_muito_grandes) || 0,
    ];
    return values.reduce((sum, val) => sum + val, 0);
  };

  const total = calculateTotal();
  const isValidTotal = Math.abs(total - 100) < 0.1; // Allow 0.1% tolerance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidTotal && formData.metodo_analise === 'peneiramento') {
      return; // Don't submit if percentages don't sum to 100
    }

    const dataToSubmit: any = {
      ...formData,
      peneira_utilizada: formData.peneira_utilizada ? parseFloat(formData.peneira_utilizada) : undefined,
      particulas_finas: formData.particulas_finas ? parseFloat(formData.particulas_finas) : undefined,
      particulas_pequenas: formData.particulas_pequenas ? parseFloat(formData.particulas_pequenas) : undefined,
      particulas_medias: formData.particulas_medias ? parseFloat(formData.particulas_medias) : undefined,
      particulas_grandes: formData.particulas_grandes ? parseFloat(formData.particulas_grandes) : undefined,
      particulas_muito_grandes: formData.particulas_muito_grandes ? parseFloat(formData.particulas_muito_grandes) : undefined,
      especificacao_min: formData.especificacao_min ? parseFloat(formData.especificacao_min) : undefined,
      especificacao_max: formData.especificacao_max ? parseFloat(formData.especificacao_max) : undefined,
      numero_amostras: formData.numero_amostras ? parseInt(formData.numero_amostras) : undefined,
      peso_amostra: formData.peso_amostra ? parseFloat(formData.peso_amostra) : undefined,
    };

    // Remove empty strings
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
      tipo_grao: 'milho',
      outro_grao: '',
      lote_grao: '',
      fornecedor: '',
      equipamento_moagem: 'moinho_martelo',
      peneira_utilizada: '',
      particulas_finas: '',
      particulas_pequenas: '',
      particulas_medias: '',
      particulas_grandes: '',
      particulas_muito_grandes: '',
      uniformidade: 'boa',
      dentro_especificacao: true,
      especificacao_min: '',
      especificacao_max: '',
      presenca_pos: false,
      presenca_graos_inteiros: false,
      umidade_aparente: 'adequada',
      metodo_analise: 'peneiramento',
      numero_amostras: '3',
      peso_amostra: '500',
      observacoes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Checagem de Granulometria
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Checagem de Granulometria dos Grãos</DialogTitle>
          <DialogDescription>
            Avalie o tamanho das partículas dos grãos processados
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

          {/* Grain Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wheat className="w-4 h-4" />
                Informações do Grão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Grão</Label>
                  <Select
                    value={formData.tipo_grao}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo_grao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="milho">Milho</SelectItem>
                      <SelectItem value="sorgo">Sorgo</SelectItem>
                      <SelectItem value="soja">Soja</SelectItem>
                      <SelectItem value="caroco_algodao">Caroço de Algodão</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.tipo_grao === 'outro' && (
                  <div>
                    <Label htmlFor="outro">Especifique o Grão</Label>
                    <Input
                      id="outro"
                      value={formData.outro_grao}
                      onChange={(e) => setFormData({ ...formData, outro_grao: e.target.value })}
                      placeholder="Nome do grão"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lote">Lote do Grão</Label>
                  <Input
                    id="lote"
                    value={formData.lote_grao}
                    onChange={(e) => setFormData({ ...formData, lote_grao: e.target.value })}
                    placeholder="Ex: LOTE-2024-001"
                  />
                </div>
                <div>
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    placeholder="Nome do fornecedor"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipamento de Moagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipamento">Tipo de Equipamento</Label>
                  <Select
                    value={formData.equipamento_moagem}
                    onValueChange={(value) => setFormData({ ...formData, equipamento_moagem: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moinho_martelo">Moinho de Martelo</SelectItem>
                      <SelectItem value="moinho_rolo">Moinho de Rolo</SelectItem>
                      <SelectItem value="quebrador">Quebrador</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="peneira">Tamanho da Peneira (mm)</Label>
                  <Input
                    id="peneira"
                    type="number"
                    step="0.1"
                    value={formData.peneira_utilizada}
                    onChange={(e) => setFormData({ ...formData, peneira_utilizada: e.target.value })}
                    placeholder="Ex: 3.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Granulometry Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultados da Granulometria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Informe a porcentagem de partículas retidas em cada peneira. O total deve somar 100%.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="finas">Partículas Finas (&lt; 0.5mm) %</Label>
                  <Input
                    id="finas"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.particulas_finas}
                    onChange={(e) => setFormData({ ...formData, particulas_finas: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label htmlFor="pequenas">Partículas Pequenas (0.5-1.0mm) %</Label>
                  <Input
                    id="pequenas"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.particulas_pequenas}
                    onChange={(e) => setFormData({ ...formData, particulas_pequenas: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medias">Partículas Médias (1.0-2.0mm) %</Label>
                  <Input
                    id="medias"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.particulas_medias}
                    onChange={(e) => setFormData({ ...formData, particulas_medias: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label htmlFor="grandes">Partículas Grandes (2.0-4.0mm) %</Label>
                  <Input
                    id="grandes"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.particulas_grandes}
                    onChange={(e) => setFormData({ ...formData, particulas_grandes: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="muito_grandes">Partículas Muito Grandes (&gt; 4.0mm) %</Label>
                  <Input
                    id="muito_grandes"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.particulas_muito_grandes}
                    onChange={(e) => setFormData({ ...formData, particulas_muito_grandes: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="flex items-end">
                  <div className={`p-3 rounded-md w-full text-center font-semibold ${
                    isValidTotal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    Total: {total.toFixed(1)}%
                  </div>
                </div>
              </div>

              {!isValidTotal && formData.metodo_analise === 'peneiramento' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A soma das porcentagens deve ser igual a 100%. Atualmente: {total.toFixed(1)}%
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Quality Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Avaliação de Qualidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="uniformidade">Uniformidade das Partículas</Label>
                  <Select
                    value={formData.uniformidade}
                    onValueChange={(value: any) => setFormData({ ...formData, uniformidade: value })}
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
                  <Label htmlFor="umidade_aparente">Umidade Aparente</Label>
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

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="especificacao"
                    checked={formData.dentro_especificacao}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, dentro_especificacao: checked as boolean })
                    }
                  />
                  <Label htmlFor="especificacao">Dentro da Especificação</Label>
                </div>

                {formData.dentro_especificacao && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="espec_min">Especificação Mín (mm)</Label>
                      <Input
                        id="espec_min"
                        type="number"
                        step="0.1"
                        value={formData.especificacao_min}
                        onChange={(e) => setFormData({ ...formData, especificacao_min: e.target.value })}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="espec_max">Especificação Máx (mm)</Label>
                      <Input
                        id="espec_max"
                        type="number"
                        step="0.1"
                        value={formData.especificacao_max}
                        onChange={(e) => setFormData({ ...formData, especificacao_max: e.target.value })}
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="po"
                    checked={formData.presenca_pos}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, presenca_pos: checked as boolean })
                    }
                  />
                  <Label htmlFor="po">Presença de Pó Excessivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inteiros"
                    checked={formData.presenca_graos_inteiros}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, presenca_graos_inteiros: checked as boolean })
                    }
                  />
                  <Label htmlFor="inteiros">Presença de Grãos Inteiros (não processados)</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Método de Análise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="metodo">Método Utilizado</Label>
                  <Select
                    value={formData.metodo_analise}
                    onValueChange={(value) => setFormData({ ...formData, metodo_analise: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peneiramento">Peneiramento</SelectItem>
                      <SelectItem value="laser">Difração a Laser</SelectItem>
                      <SelectItem value="visual">Visual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amostras">Número de Amostras</Label>
                  <Input
                    id="amostras"
                    type="number"
                    min="1"
                    value={formData.numero_amostras}
                    onChange={(e) => setFormData({ ...formData, numero_amostras: e.target.value })}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="peso">Peso da Amostra (g)</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    value={formData.peso_amostra}
                    onChange={(e) => setFormData({ ...formData, peso_amostra: e.target.value })}
                    placeholder="500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
            <Button
              type="submit"
              disabled={createChecagem.isPending || (!isValidTotal && formData.metodo_analise === 'peneiramento')}
            >
              {createChecagem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Checagem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}