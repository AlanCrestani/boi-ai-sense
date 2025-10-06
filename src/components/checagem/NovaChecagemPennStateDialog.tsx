import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, FlaskConical } from 'lucide-react';
import { useVagoesAtivos } from '@/hooks/useVagoes';
import { useCreateChecagemPennState } from '@/hooks/useChecagemPennState';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function NovaChecagemPennStateDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    data_checagem: string;
    hora_checagem: string;
    vagao_id?: string;
    dieta_nome: string;
    inicio_19mm: string;
    inicio_08mm: string;
    inicio_04mm: string;
    inicio_fundo: string;
    peso_amostra_inicio: string;
    meio_19mm: string;
    meio_08mm: string;
    meio_04mm: string;
    meio_fundo: string;
    peso_amostra_meio: string;
    fim_19mm: string;
    fim_08mm: string;
    fim_04mm: string;
    fim_fundo: string;
    peso_amostra_fim: string;
    observacoes: string;
  }>({
    data_checagem: format(new Date(), 'yyyy-MM-dd'),
    hora_checagem: format(new Date(), 'HH:mm'),
    dieta_nome: '',

    // Início (7000-8000 kg)
    inicio_19mm: '',
    inicio_08mm: '',
    inicio_04mm: '',
    inicio_fundo: '',
    peso_amostra_inicio: '0.500',

    // Meio (3500-4500 kg)
    meio_19mm: '',
    meio_08mm: '',
    meio_04mm: '',
    meio_fundo: '',
    peso_amostra_meio: '0.500',

    // Fim (0-1000 kg)
    fim_19mm: '',
    fim_08mm: '',
    fim_04mm: '',
    fim_fundo: '',
    peso_amostra_fim: '0.500',

    observacoes: ''
  });

  const { data: vagoes, isLoading: loadingVagoes } = useVagoesAtivos();
  const createChecagem = useCreateChecagemPennState();

  // Calcular total de cada amostra
  const calcularTotal = (amostra: 'inicio' | 'meio' | 'fim') => {
    const p19 = parseFloat(formData[`${amostra}_19mm`]) || 0;
    const p08 = parseFloat(formData[`${amostra}_08mm`]) || 0;
    const p04 = parseFloat(formData[`${amostra}_04mm`]) || 0;
    const fundo = parseFloat(formData[`${amostra}_fundo`]) || 0;
    return p19 + p08 + p04 + fundo;
  };

  const totalInicio = calcularTotal('inicio');
  const totalMeio = calcularTotal('meio');
  const totalFim = calcularTotal('fim');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar totais
    const tolerance = 0.5; // 0.5% de tolerância
    if (Math.abs(totalInicio - 100) > tolerance) {
      toast({
        title: "Erro de Validação",
        description: `Total da amostra Início deve ser 100% (atual: ${totalInicio.toFixed(2)}%)`,
        variant: "destructive",
      });
      return;
    }
    if (Math.abs(totalMeio - 100) > tolerance) {
      toast({
        title: "Erro de Validação",
        description: `Total da amostra Meio deve ser 100% (atual: ${totalMeio.toFixed(2)}%)`,
        variant: "destructive",
      });
      return;
    }
    if (Math.abs(totalFim - 100) > tolerance) {
      toast({
        title: "Erro de Validação",
        description: `Total da amostra Fim deve ser 100% (atual: ${totalFim.toFixed(2)}%)`,
        variant: "destructive",
      });
      return;
    }

    const dataToSubmit: any = {
      data_checagem: formData.data_checagem,
      hora_checagem: formData.hora_checagem,
      vagao_id: formData.vagao_id || undefined,
      dieta_nome: formData.dieta_nome || undefined,

      inicio_19mm: formData.inicio_19mm ? parseFloat(formData.inicio_19mm) : undefined,
      inicio_08mm: formData.inicio_08mm ? parseFloat(formData.inicio_08mm) : undefined,
      inicio_04mm: formData.inicio_04mm ? parseFloat(formData.inicio_04mm) : undefined,
      inicio_fundo: formData.inicio_fundo ? parseFloat(formData.inicio_fundo) : undefined,
      peso_amostra_inicio: formData.peso_amostra_inicio ? parseFloat(formData.peso_amostra_inicio) : undefined,

      meio_19mm: formData.meio_19mm ? parseFloat(formData.meio_19mm) : undefined,
      meio_08mm: formData.meio_08mm ? parseFloat(formData.meio_08mm) : undefined,
      meio_04mm: formData.meio_04mm ? parseFloat(formData.meio_04mm) : undefined,
      meio_fundo: formData.meio_fundo ? parseFloat(formData.meio_fundo) : undefined,
      peso_amostra_meio: formData.peso_amostra_meio ? parseFloat(formData.peso_amostra_meio) : undefined,

      fim_19mm: formData.fim_19mm ? parseFloat(formData.fim_19mm) : undefined,
      fim_08mm: formData.fim_08mm ? parseFloat(formData.fim_08mm) : undefined,
      fim_04mm: formData.fim_04mm ? parseFloat(formData.fim_04mm) : undefined,
      fim_fundo: formData.fim_fundo ? parseFloat(formData.fim_fundo) : undefined,
      peso_amostra_fim: formData.peso_amostra_fim ? parseFloat(formData.peso_amostra_fim) : undefined,

      observacoes: formData.observacoes || undefined,
    };

    await createChecagem.mutateAsync(dataToSubmit);

    setOpen(false);
    // Reset form
    setFormData({
      data_checagem: format(new Date(), 'yyyy-MM-dd'),
      hora_checagem: format(new Date(), 'HH:mm'),
      dieta_nome: '',
      inicio_19mm: '',
      inicio_08mm: '',
      inicio_04mm: '',
      inicio_fundo: '',
      peso_amostra_inicio: '0.500',
      meio_19mm: '',
      meio_08mm: '',
      meio_04mm: '',
      meio_fundo: '',
      peso_amostra_meio: '0.500',
      fim_19mm: '',
      fim_08mm: '',
      fim_04mm: '',
      fim_fundo: '',
      peso_amostra_fim: '0.500',
      observacoes: ''
    });
  };

  const renderAmostraCard = (
    titulo: string,
    subtitulo: string,
    prefix: 'inicio' | 'meio' | 'fim',
    total: number
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{titulo}</span>
          <span className={`text-sm ${Math.abs(total - 100) > 0.5 ? 'text-destructive' : 'text-muted-foreground'}`}>
            Total: {total.toFixed(2)}%
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{subtitulo}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`${prefix}_peso`}>Peso Amostra (kg)</Label>
            <Input
              id={`${prefix}_peso`}
              type="number"
              step="0.001"
              value={formData[`peso_amostra_${prefix}`]}
              onChange={(e) => setFormData({ ...formData, [`peso_amostra_${prefix}`]: e.target.value })}
              placeholder="0.500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`${prefix}_19mm`}>Peneira 19mm (%)</Label>
            <Input
              id={`${prefix}_19mm`}
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData[`${prefix}_19mm`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_19mm`]: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}_08mm`}>Peneira 8mm (%)</Label>
            <Input
              id={`${prefix}_08mm`}
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData[`${prefix}_08mm`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_08mm`]: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`${prefix}_04mm`}>Peneira 4mm (%)</Label>
            <Input
              id={`${prefix}_04mm`}
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData[`${prefix}_04mm`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_04mm`]: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}_fundo`}>Fundo (%)</Label>
            <Input
              id={`${prefix}_fundo`}
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData[`${prefix}_fundo`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_fundo`]: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Análise Penn State
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            Registrar Análise Penn State
          </DialogTitle>
          <DialogDescription>
            Registre as 3 amostras coletadas durante a distribuição (Início, Meio e Fim)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data">Data da Coleta</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_checagem}
                onChange={(e) => setFormData({ ...formData, data_checagem: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="hora">Hora da Coleta</Label>
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
            <div>
              <Label htmlFor="dieta">Dieta</Label>
              <Input
                id="dieta"
                value={formData.dieta_nome}
                onChange={(e) => setFormData({ ...formData, dieta_nome: e.target.value })}
                placeholder="Ex: Recria, Crescimento, Terminação"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderAmostraCard(
              '1ª Amostra - Início',
              'Vagão com 7000-8000 kg',
              'inicio',
              totalInicio
            )}
            {renderAmostraCard(
              '2ª Amostra - Meio',
              'Vagão com 3500-4500 kg',
              'meio',
              totalMeio
            )}
            {renderAmostraCard(
              '3ª Amostra - Fim',
              'Vagão com 0-1000 kg',
              'fim',
              totalFim
            )}
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre a análise..."
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
              Registrar Análise
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
