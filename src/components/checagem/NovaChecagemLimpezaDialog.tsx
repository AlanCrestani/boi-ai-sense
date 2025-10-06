import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Droplets } from 'lucide-react';
import { useCreateChecagemLimpezaBebedouros } from '@/hooks/useChecagemLimpezaBebedouros';
import { format } from 'date-fns';

export function NovaChecagemLimpezaDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    data_checagem: format(new Date(), 'yyyy-MM-dd'),
    hora_checagem: format(new Date(), 'HH:mm'),
    curral_numero: '',
    bebedouro_identificacao: '',
    tipo_bebedouro: '' as '' | 'circular' | 'linear' | 'boia' | 'nivel' | 'outro',
    outro_tipo_bebedouro: '',

    // Qualidade da água
    temperatura_agua: '',
    ph_agua: '',
    turbidez: 'limpa' as const,
    odor_agua: 'sem_odor' as const,
    cor_agua: 'transparente' as const,

    // Limpeza física
    presenca_lodo: false,
    presenca_algas: false,
    presenca_materia_organica: false,
    presenca_racao: false,
    presenca_insetos: false,
    nivel_sujidade: 'limpo' as const,

    // Condição estrutural
    vazamento: false,
    ferrugem: false,
    danos_estruturais: false,
    funcionamento_boia: 'nao_aplicavel' as const,
    nivel_agua: 'adequado' as const,

    // Vazão e consumo
    vazao_adequada: true,
    tempo_reposicao_minutos: '',
    consumo_estimado_litros: '',

    // Scores
    score_limpeza: '',
    score_agua: '',
    score_estrutura: '',

    // Ações
    necessita_limpeza: false,
    necessita_manutencao: false,
    necessita_troca_agua: false,
    data_ultima_limpeza: '',
    proxima_limpeza_prevista: '',

    observacoes: ''
  });

  const createChecagem = useCreateChecagemLimpezaBebedouros();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit: any = {
      data_checagem: formData.data_checagem,
      hora_checagem: formData.hora_checagem,
      curral_numero: formData.curral_numero,
      bebedouro_identificacao: formData.bebedouro_identificacao || undefined,
      tipo_bebedouro: formData.tipo_bebedouro || undefined,
      outro_tipo_bebedouro: formData.outro_tipo_bebedouro || undefined,

      temperatura_agua: formData.temperatura_agua ? parseFloat(formData.temperatura_agua) : undefined,
      ph_agua: formData.ph_agua ? parseFloat(formData.ph_agua) : undefined,
      turbidez: formData.turbidez,
      odor_agua: formData.odor_agua,
      cor_agua: formData.cor_agua,

      presenca_lodo: formData.presenca_lodo,
      presenca_algas: formData.presenca_algas,
      presenca_materia_organica: formData.presenca_materia_organica,
      presenca_racao: formData.presenca_racao,
      presenca_insetos: formData.presenca_insetos,
      nivel_sujidade: formData.nivel_sujidade,

      vazamento: formData.vazamento,
      ferrugem: formData.ferrugem,
      danos_estruturais: formData.danos_estruturais,
      funcionamento_boia: formData.funcionamento_boia,
      nivel_agua: formData.nivel_agua,

      vazao_adequada: formData.vazao_adequada,
      tempo_reposicao_minutos: formData.tempo_reposicao_minutos ? parseInt(formData.tempo_reposicao_minutos) : undefined,
      consumo_estimado_litros: formData.consumo_estimado_litros ? parseFloat(formData.consumo_estimado_litros) : undefined,

      score_limpeza: formData.score_limpeza ? parseInt(formData.score_limpeza) : undefined,
      score_agua: formData.score_agua ? parseInt(formData.score_agua) : undefined,
      score_estrutura: formData.score_estrutura ? parseInt(formData.score_estrutura) : undefined,

      necessita_limpeza: formData.necessita_limpeza,
      necessita_manutencao: formData.necessita_manutencao,
      necessita_troca_agua: formData.necessita_troca_agua,
      data_ultima_limpeza: formData.data_ultima_limpeza || undefined,
      proxima_limpeza_prevista: formData.proxima_limpeza_prevista || undefined,

      observacoes: formData.observacoes || undefined,
    };

    await createChecagem.mutateAsync(dataToSubmit);

    setOpen(false);
    // Reset form
    setFormData({
      data_checagem: format(new Date(), 'yyyy-MM-dd'),
      hora_checagem: format(new Date(), 'HH:mm'),
      curral_numero: '',
      bebedouro_identificacao: '',
      tipo_bebedouro: '',
      outro_tipo_bebedouro: '',
      temperatura_agua: '',
      ph_agua: '',
      turbidez: 'limpa',
      odor_agua: 'sem_odor',
      cor_agua: 'transparente',
      presenca_lodo: false,
      presenca_algas: false,
      presenca_materia_organica: false,
      presenca_racao: false,
      presenca_insetos: false,
      nivel_sujidade: 'limpo',
      vazamento: false,
      ferrugem: false,
      danos_estruturais: false,
      funcionamento_boia: 'nao_aplicavel',
      nivel_agua: 'adequado',
      vazao_adequada: true,
      tempo_reposicao_minutos: '',
      consumo_estimado_litros: '',
      score_limpeza: '',
      score_agua: '',
      score_estrutura: '',
      necessita_limpeza: false,
      necessita_manutencao: false,
      necessita_troca_agua: false,
      data_ultima_limpeza: '',
      proxima_limpeza_prevista: '',
      observacoes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Checagem de Bebedouro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Registrar Checagem de Limpeza de Bebedouro
          </DialogTitle>
          <DialogDescription>
            Avaliação de limpeza, qualidade da água e condições estruturais
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="curral">Número do Curral *</Label>
              <Input
                id="curral"
                value={formData.curral_numero}
                onChange={(e) => setFormData({ ...formData, curral_numero: e.target.value })}
                placeholder="Ex: 15"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bebedouro_id">Identificação do Bebedouro</Label>
              <Input
                id="bebedouro_id"
                value={formData.bebedouro_identificacao}
                onChange={(e) => setFormData({ ...formData, bebedouro_identificacao: e.target.value })}
                placeholder="Ex: BEB-15-A"
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo de Bebedouro</Label>
              <Select
                value={formData.tipo_bebedouro || undefined}
                onValueChange={(value: any) => setFormData({ ...formData, tipo_bebedouro: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circular">Circular</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="boia">Boia</SelectItem>
                  <SelectItem value="nivel">Nível</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.tipo_bebedouro === 'outro' && (
              <div>
                <Label htmlFor="outro_tipo">Especificar Tipo</Label>
                <Input
                  id="outro_tipo"
                  value={formData.outro_tipo_bebedouro}
                  onChange={(e) => setFormData({ ...formData, outro_tipo_bebedouro: e.target.value })}
                  placeholder="Descreva o tipo"
                />
              </div>
            )}
          </div>

          {/* Qualidade da Água */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Qualidade da Água</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="temp">Temperatura (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    step="0.1"
                    value={formData.temperatura_agua}
                    onChange={(e) => setFormData({ ...formData, temperatura_agua: e.target.value })}
                    placeholder="25.0"
                  />
                </div>
                <div>
                  <Label htmlFor="ph">pH</Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={formData.ph_agua}
                    onChange={(e) => setFormData({ ...formData, ph_agua: e.target.value })}
                    placeholder="7.0"
                  />
                </div>
                <div>
                  <Label htmlFor="score_agua">Score Água (1-5)</Label>
                  <Input
                    id="score_agua"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.score_agua}
                    onChange={(e) => setFormData({ ...formData, score_agua: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="turbidez">Turbidez</Label>
                  <Select
                    value={formData.turbidez}
                    onValueChange={(value: any) => setFormData({ ...formData, turbidez: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="limpa">Limpa</SelectItem>
                      <SelectItem value="levemente_turva">Levemente Turva</SelectItem>
                      <SelectItem value="turva">Turva</SelectItem>
                      <SelectItem value="muito_turva">Muito Turva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="odor">Odor</Label>
                  <Select
                    value={formData.odor_agua}
                    onValueChange={(value: any) => setFormData({ ...formData, odor_agua: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem_odor">Sem Odor</SelectItem>
                      <SelectItem value="leve_odor">Leve Odor</SelectItem>
                      <SelectItem value="odor_forte">Odor Forte</SelectItem>
                      <SelectItem value="putrido">Pútrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cor">Cor</Label>
                  <Select
                    value={formData.cor_agua}
                    onValueChange={(value: any) => setFormData({ ...formData, cor_agua: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transparente">Transparente</SelectItem>
                      <SelectItem value="levemente_amarelada">Levemente Amarelada</SelectItem>
                      <SelectItem value="esverdeada">Esverdeada</SelectItem>
                      <SelectItem value="marrom">Marrom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limpeza Física */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Limpeza Física</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lodo"
                      checked={formData.presenca_lodo}
                      onCheckedChange={(checked) => setFormData({ ...formData, presenca_lodo: checked as boolean })}
                    />
                    <Label htmlFor="lodo">Presença de Lodo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="algas"
                      checked={formData.presenca_algas}
                      onCheckedChange={(checked) => setFormData({ ...formData, presenca_algas: checked as boolean })}
                    />
                    <Label htmlFor="algas">Presença de Algas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="materia"
                      checked={formData.presenca_materia_organica}
                      onCheckedChange={(checked) => setFormData({ ...formData, presenca_materia_organica: checked as boolean })}
                    />
                    <Label htmlFor="materia">Presença de Matéria Orgânica</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="racao"
                      checked={formData.presenca_racao}
                      onCheckedChange={(checked) => setFormData({ ...formData, presenca_racao: checked as boolean })}
                    />
                    <Label htmlFor="racao">Presença de Ração</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insetos"
                      checked={formData.presenca_insetos}
                      onCheckedChange={(checked) => setFormData({ ...formData, presenca_insetos: checked as boolean })}
                    />
                    <Label htmlFor="insetos">Presença de Insetos</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nivel_sujidade">Nível de Sujidade</Label>
                  <Select
                    value={formData.nivel_sujidade}
                    onValueChange={(value: any) => setFormData({ ...formData, nivel_sujidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="limpo">Limpo</SelectItem>
                      <SelectItem value="pouco_sujo">Pouco Sujo</SelectItem>
                      <SelectItem value="sujo">Sujo</SelectItem>
                      <SelectItem value="muito_sujo">Muito Sujo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="score_limpeza">Score Limpeza (1-5)</Label>
                  <Input
                    id="score_limpeza"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.score_limpeza}
                    onChange={(e) => setFormData({ ...formData, score_limpeza: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Condição Estrutural */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Condição Estrutural</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vazamento"
                      checked={formData.vazamento}
                      onCheckedChange={(checked) => setFormData({ ...formData, vazamento: checked as boolean })}
                    />
                    <Label htmlFor="vazamento">Vazamento</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ferrugem"
                      checked={formData.ferrugem}
                      onCheckedChange={(checked) => setFormData({ ...formData, ferrugem: checked as boolean })}
                    />
                    <Label htmlFor="ferrugem">Ferrugem</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="danos"
                      checked={formData.danos_estruturais}
                      onCheckedChange={(checked) => setFormData({ ...formData, danos_estruturais: checked as boolean })}
                    />
                    <Label htmlFor="danos">Danos Estruturais</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vazao"
                      checked={formData.vazao_adequada}
                      onCheckedChange={(checked) => setFormData({ ...formData, vazao_adequada: checked as boolean })}
                    />
                    <Label htmlFor="vazao">Vazão Adequada</Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="boia">Funcionamento Boia</Label>
                    <Select
                      value={formData.funcionamento_boia}
                      onValueChange={(value: any) => setFormData({ ...formData, funcionamento_boia: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="irregular">Irregular</SelectItem>
                        <SelectItem value="travada">Travada</SelectItem>
                        <SelectItem value="nao_aplicavel">Não Aplicável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nivel">Nível de Água</Label>
                    <Select
                      value={formData.nivel_agua}
                      onValueChange={(value: any) => setFormData({ ...formData, nivel_agua: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adequado">Adequado</SelectItem>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="muito_baixo">Muito Baixo</SelectItem>
                        <SelectItem value="transbordando">Transbordando</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tempo_repo">Tempo Reposição (min)</Label>
                  <Input
                    id="tempo_repo"
                    type="number"
                    value={formData.tempo_reposicao_minutos}
                    onChange={(e) => setFormData({ ...formData, tempo_reposicao_minutos: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="consumo">Consumo Estimado (L)</Label>
                  <Input
                    id="consumo"
                    type="number"
                    step="0.1"
                    value={formData.consumo_estimado_litros}
                    onChange={(e) => setFormData({ ...formData, consumo_estimado_litros: e.target.value })}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="score_estrutura">Score Estrutura (1-5)</Label>
                  <Input
                    id="score_estrutura"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.score_estrutura}
                    onChange={(e) => setFormData({ ...formData, score_estrutura: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Necessárias */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações Necessárias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nec_limpeza"
                    checked={formData.necessita_limpeza}
                    onCheckedChange={(checked) => setFormData({ ...formData, necessita_limpeza: checked as boolean })}
                  />
                  <Label htmlFor="nec_limpeza">Necessita Limpeza</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nec_manutencao"
                    checked={formData.necessita_manutencao}
                    onCheckedChange={(checked) => setFormData({ ...formData, necessita_manutencao: checked as boolean })}
                  />
                  <Label htmlFor="nec_manutencao">Necessita Manutenção</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nec_troca"
                    checked={formData.necessita_troca_agua}
                    onCheckedChange={(checked) => setFormData({ ...formData, necessita_troca_agua: checked as boolean })}
                  />
                  <Label htmlFor="nec_troca">Necessita Troca de Água</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ultima_limpeza">Data Última Limpeza</Label>
                  <Input
                    id="ultima_limpeza"
                    type="date"
                    value={formData.data_ultima_limpeza}
                    onChange={(e) => setFormData({ ...formData, data_ultima_limpeza: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="proxima_limpeza">Próxima Limpeza Prevista</Label>
                  <Input
                    id="proxima_limpeza"
                    type="date"
                    value={formData.proxima_limpeza_prevista}
                    onChange={(e) => setFormData({ ...formData, proxima_limpeza_prevista: e.target.value })}
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
