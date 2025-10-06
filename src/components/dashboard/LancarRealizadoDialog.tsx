import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DistribuicaoPasto } from '@/hooks/useDistribuicaoPasto';

interface LancarRealizadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distribuicao: DistribuicaoPasto | null;
  onSubmit: (data: {
    consumo_realizado_kg: number;
    cocho_vazio: boolean;
    cocho_com_sobra: boolean;
    observacoes_cocho?: string;
  }) => void;
  isSubmitting: boolean;
}

export function LancarRealizadoDialog({
  open,
  onOpenChange,
  distribuicao,
  onSubmit,
  isSubmitting
}: LancarRealizadoDialogProps) {
  const [consumoRealizado, setConsumoRealizado] = useState('');
  const [cochoVazio, setCochoVazio] = useState(false);
  const [cochoComSobra, setCochoComSobra] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const consumoRealizadoNum = parseFloat(consumoRealizado);

    if (isNaN(consumoRealizadoNum) || consumoRealizadoNum < 0) {
      alert('Digite um valor válido para o consumo realizado');
      return;
    }

    onSubmit({
      consumo_realizado_kg: consumoRealizadoNum,
      cocho_vazio: cochoVazio,
      cocho_com_sobra: cochoComSobra,
      observacoes_cocho: observacoes.trim() || undefined
    });

    // Limpar campos
    setConsumoRealizado('');
    setCochoVazio(false);
    setCochoComSobra(false);
    setObservacoes('');
  };

  if (!distribuicao) return null;

  const desvioEstimado = consumoRealizado
    ? parseFloat(consumoRealizado) - distribuicao.consumo_previsto_kg
    : 0;
  const desvioPercentualEstimado = distribuicao.consumo_previsto_kg > 0
    ? (desvioEstimado / distribuicao.consumo_previsto_kg) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Lançar Consumo Realizado</DialogTitle>
            <DialogDescription>
              Registre o consumo real de proteinado para este lote
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Info da Distribuição */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">{new Date(distribuicao.data_registro).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consumo Previsto:</span>
                <span className="font-medium">{distribuicao.consumo_previsto_kg.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Animais:</span>
                <span className="font-medium">{distribuicao.quantidade_animais}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dias:</span>
                <span className="font-medium">{distribuicao.quantidade_dias_selecionados}</span>
              </div>
            </div>

            {/* Consumo Realizado */}
            <div className="space-y-2">
              <Label htmlFor="consumo-realizado">Consumo Realizado (kg) *</Label>
              <Input
                id="consumo-realizado"
                type="number"
                step="0.01"
                min="0"
                value={consumoRealizado}
                onChange={(e) => setConsumoRealizado(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {/* Desvio Estimado */}
            {consumoRealizado && (
              <div className="space-y-2 p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Desvio Estimado:</span>
                  <span className={`font-bold ${desvioEstimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {desvioEstimado > 0 ? '+' : ''}{desvioEstimado.toFixed(2)} kg ({desvioPercentualEstimado > 0 ? '+' : ''}{desvioPercentualEstimado.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Status do Cocho */}
            <div className="space-y-3">
              <Label>Status do Cocho</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cocho-vazio"
                    checked={cochoVazio}
                    onCheckedChange={(checked) => setCochoVazio(checked as boolean)}
                  />
                  <label
                    htmlFor="cocho-vazio"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Cocho vazio
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cocho-sobra"
                    checked={cochoComSobra}
                    onCheckedChange={(checked) => setCochoComSobra(checked as boolean)}
                  />
                  <label
                    htmlFor="cocho-sobra"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Cocho com sobra
                  </label>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre o cocho..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Realizado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
