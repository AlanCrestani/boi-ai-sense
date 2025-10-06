import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, X, Package } from "lucide-react";

const DIAS_SEMANA = [
  { value: 1, label: "Dom", fullLabel: "Domingo" },
  { value: 2, label: "Seg", fullLabel: "Segunda" },
  { value: 3, label: "Ter", fullLabel: "Terça" },
  { value: 4, label: "Qua", fullLabel: "Quarta" },
  { value: 5, label: "Qui", fullLabel: "Quinta" },
  { value: 6, label: "Sex", fullLabel: "Sexta" },
  { value: 7, label: "Sáb", fullLabel: "Sábado" },
];

interface DistribuicaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lote: {
    id: string;
    nome: string;
    pasto?: {
      nome: string;
      setor?: {
        nome: string;
      };
    };
    quantidade_animais?: number;
    peso_medio_entrada?: number;
  };
  dieta?: {
    id: string;
    nome: string;
    cms_percentual_peso_vivo: number;
  };
  pesoAtual: number;
  consumoPrevisto: number;
  sequencia?: number;
  onConfirm: (data: {
    diasSelecionados: number[];
    consumoRealizado?: number;
    cochoVazio: boolean;
    cochoComSobra: boolean;
    observacoes: string;
  }) => void;
  isLoading?: boolean;
  saldoEstoqueLocal?: number;
}

export function DistribuicaoModal({
  isOpen,
  onClose,
  lote,
  dieta,
  pesoAtual,
  consumoPrevisto,
  sequencia,
  onConfirm,
  isLoading = false,
  saldoEstoqueLocal,
}: DistribuicaoModalProps) {
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([]);
  const [consumoRealizado, setConsumoRealizado] = useState<string>("");
  const [cochoVazio, setCochoVazio] = useState(false);
  const [cochoComSobra, setCochoComSobra] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  // Calcular consumo previsto dinamicamente: quantidade_cabeças × peso_atual × CMS × dias_selecionados
  const consumoPrevistoCalculado = diasSelecionados.length > 0 && dieta
    ? (lote.quantidade_animais || 0) * pesoAtual * dieta.cms_percentual_peso_vivo * diasSelecionados.length
    : 0;

  // Usar saldo local (passado via props) para performance
  const saldoEstoque = saldoEstoqueLocal ?? 0;

  // Validar estoque insuficiente
  const estoqueInsuficiente = consumoRealizado && parseFloat(consumoRealizado) > saldoEstoque;

  // Limpar formulário quando trocar de lote
  useEffect(() => {
    if (isOpen) {
      setDiasSelecionados([]);
      setConsumoRealizado("");
      setCochoVazio(false);
      setCochoComSobra(false);
      setObservacoes("");
    }
  }, [lote.id, isOpen]);

  const handleToggleDia = (dia: number) => {
    const novosDias = diasSelecionados.includes(dia)
      ? diasSelecionados.filter(d => d !== dia)
      : [...diasSelecionados, dia].sort();
    setDiasSelecionados(novosDias);
  };

  const handleConfirm = () => {
    if (diasSelecionados.length === 0) {
      alert("Selecione pelo menos um dia para distribuição");
      return;
    }

    // Validar estoque insuficiente
    if (consumoRealizado && parseFloat(consumoRealizado) > saldoEstoque) {
      alert(`Estoque insuficiente!\n\nSaldo disponível: ${saldoEstoque.toFixed(2)} kg\nQuantidade solicitada: ${parseFloat(consumoRealizado).toFixed(2)} kg\n\nAjuste a quantidade ou registre entrada de estoque.`);
      return;
    }

    onConfirm({
      diasSelecionados,
      consumoRealizado: consumoRealizado ? parseFloat(consumoRealizado) : undefined,
      cochoVazio,
      cochoComSobra,
      observacoes,
    });

    // Limpar form
    setDiasSelecionados([]);
    setConsumoRealizado("");
    setCochoVazio(false);
    setCochoComSobra(false);
    setObservacoes("");
  };

  const handleClose = () => {
    // Limpar form ao fechar
    setDiasSelecionados([]);
    setConsumoRealizado("");
    setCochoVazio(false);
    setCochoComSobra(false);
    setObservacoes("");
    onClose();
  };

  const formatKg = (valor: number): string => {
    return `${valor.toFixed(2)} kg`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[calc(95vh+40px)] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2 mb-1">
                {sequencia && (
                  <Badge variant="outline" className="text-sm px-2 py-0.5">
                    #{sequencia}
                  </Badge>
                )}
                <span>Próximo Cocho</span>
              </DialogTitle>
              <DialogDescription className="text-base font-semibold text-foreground">
                MÓDULO 1
              </DialogDescription>
            </div>
            <Badge variant="default" className="text-xs px-2 py-1">
              0%
            </Badge>
          </div>
        </DialogHeader>

        {/* Card verde principal */}
        <div className="bg-[#16a34a] text-white rounded-lg p-4 space-y-3 min-h-[180px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs opacity-90 mb-1">Local</div>
              <div className="font-bold text-lg uppercase">
                {lote.pasto?.setor?.nome || "SETOR"} - {lote.pasto?.nome || "PASTO"}
              </div>
              <div className="text-sm opacity-80 mt-0.5">
                Lote: {lote.nome}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-90 mb-1">Produto</div>
              <div className="font-semibold">{dieta?.nome || "Não selecionada"}</div>
            </div>
          </div>

          <div className="flex items-start justify-between border-t border-white/20 pt-3">
            <div>
              <div className="text-xs opacity-90 mb-1">Quantidade Prevista</div>
              <div className="font-bold text-lg">
                {diasSelecionados.length > 0 ? formatKg(consumoPrevistoCalculado) : "Selecione os dias"}
              </div>
              <div className="text-xs opacity-80 mt-0.5 min-h-[16px]">
                {diasSelecionados.length > 0 && dieta && (
                  <>
                    {lote.quantidade_animais || 0} animais × {pesoAtual.toFixed(2)} kg × {(dieta.cms_percentual_peso_vivo * 100).toFixed(2)}% × {diasSelecionados.length} dia(s)
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-90 mb-1">Animais</div>
              <div className="font-semibold">{lote.quantidade_animais || 0} cabeças</div>
            </div>
          </div>

          {/* Saldo de Estoque */}
          {dieta && (
            <div className="flex items-center justify-between border-t border-white/20 pt-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 opacity-90" />
                <div>
                  <div className="text-xs opacity-90">Saldo em Estoque</div>
                  <div className="font-bold">
                    {`${saldoEstoque.toFixed(2)} kg`}
                  </div>
                </div>
              </div>
              {saldoEstoque < consumoPrevistoCalculado && diasSelecionados.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Estoque baixo
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Seleção de Dias */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Dias de Fornecimento</Label>
          <div className="grid grid-cols-4 gap-2">
            {DIAS_SEMANA.map((dia) => {
              const isSelected = diasSelecionados.includes(dia.value);
              return (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => handleToggleDia(dia.value)}
                  className={`
                    flex items-center justify-center p-3 rounded-lg border-2 transition-all
                    ${isSelected
                      ? 'border-[#16a34a] bg-[#16a34a] text-white font-semibold'
                      : 'border-muted hover:border-muted-foreground/50'
                    }
                  `}
                >
                  <span className="text-sm">{dia.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campo Quantidade Distribuída */}
        <div className="space-y-2">
          <Label htmlFor="quantidade-distribuida" className="text-sm font-semibold">
            2. Quantidade Distribuída (kg) <span className="text-xs text-muted-foreground font-normal">*</span>
          </Label>
          <div className="relative">
            <Input
              id="quantidade-distribuida"
              type="number"
              step="0.01"
              min="0"
              placeholder="Digite a quantidade"
              value={consumoRealizado}
              onChange={(e) => setConsumoRealizado(e.target.value)}
              className={`h-12 text-base ${estoqueInsuficiente ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              📦
            </div>
          </div>
          {estoqueInsuficiente && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <X className="h-3 w-3" />
              Quantidade maior que o saldo disponível ({saldoEstoque.toFixed(2)} kg)
            </p>
          )}
        </div>

        {/* Ainda tinha ração no cocho? */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            3. Ainda tinha ração no cocho? <span className="text-xs text-muted-foreground font-normal">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setCochoVazio(true);
                setCochoComSobra(false);
              }}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                ${cochoVazio
                  ? 'border-[#16a34a] bg-[#16a34a]/10 text-[#16a34a]'
                  : 'border-muted hover:border-muted-foreground/50'
                }
              `}
            >
              <CheckCircle2 className="h-6 w-6 mb-2" />
              <span className="font-semibold">Não</span>
              <span className="text-xs text-muted-foreground">Cocho limpo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCochoVazio(false);
                setCochoComSobra(true);
              }}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                ${cochoComSobra
                  ? 'border-amber-500 bg-amber-500/10 text-amber-700'
                  : 'border-muted hover:border-muted-foreground/50'
                }
              `}
            >
              <X className="h-6 w-6 mb-2" />
              <span className="font-semibold">Sim</span>
              <span className="text-xs text-muted-foreground">Havia sobra</span>
            </button>
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="observacoes" className="text-sm font-semibold">
            4. Observações <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="observacoes"
            placeholder="Ex: Animais agitados, cocho com avarias..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="h-10 text-sm"
          />
        </div>

        {/* Botão Confirmar */}
        <Button
          onClick={handleConfirm}
          disabled={diasSelecionados.length === 0 || isLoading}
          className="w-full h-12 text-base font-semibold bg-[#16a34a] hover:bg-[#15803d]"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          {isLoading ? "Registrando..." : "Confirmar e Próximo"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
