import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useCarregamentoFilters, UseCarregamentoFiltersReturn } from '@/hooks/useCarregamentoFilters';
import { CarregamentoFilters as FiltersType } from '@/hooks/useCarregamentoData';

interface CarregamentoFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

export const CarregamentoFilters: React.FC<CarregamentoFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  isLoading = false,
  className
}) => {
  const {
    setStartDate,
    setEndDate,
    applyPreset,
    resetFilters,
    isCustomDateRange,
    isValidDateRange,
    validationError,
    presets
  } = useCarregamentoFilters(filters);

  // Handler para mudança de preset
  const handlePresetChange = (preset: FiltersType['preset']) => {
    applyPreset(preset);

    if (preset !== 'custom') {
      // Para presets predefinidos, aplica automaticamente
      const updatedFilters = { ...filters, preset };
      onFiltersChange(updatedFilters);
    } else {
      // Para custom, apenas atualiza o preset
      onFiltersChange({ ...filters, preset: 'custom' });
    }
  };

  // Handler para mudança de data de início
  const handleStartDateChange = (date: Date | undefined) => {
    const newDate = date || null;
    setStartDate(newDate);
    onFiltersChange({
      ...filters,
      startDate: newDate,
      preset: 'custom'
    });
  };

  // Handler para mudança de data de fim
  const handleEndDateChange = (date: Date | undefined) => {
    const newDate = date || null;
    setEndDate(newDate);
    onFiltersChange({
      ...filters,
      endDate: newDate,
      preset: 'custom'
    });
  };

  // Handler para reset
  const handleReset = () => {
    resetFilters();
    onFiltersChange({
      startDate: null,
      endDate: null,
      preset: '30days'
    });
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filtros de Período</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
            >
              Limpar
            </Button>
          </div>

          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Select
              value={filters.preset}
              onValueChange={handlePresetChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um período" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {isCustomDateRange && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Início */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.startDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? (
                        format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecione a data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.startDate || undefined}
                      onSelect={handleStartDateChange}
                      disabled={(date) =>
                        date > new Date() ||
                        (filters.endDate && date > filters.endDate)
                      }
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data de Fim */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.endDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? (
                        format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecione a data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.endDate || undefined}
                      onSelect={handleEndDateChange}
                      disabled={(date) =>
                        date > new Date() ||
                        (filters.startDate && date < filters.startDate)
                      }
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Error Message */}
          {validationError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {validationError}
            </div>
          )}

          {/* Apply Button */}
          <div className="flex justify-end">
            <Button
              onClick={onApplyFilters}
              disabled={isLoading || !isValidDateRange}
              className="min-w-[120px]"
            >
              {isLoading ? "Aplicando..." : "Aplicar Filtros"}
            </Button>
          </div>

          {/* Summary */}
          {filters.startDate && filters.endDate && (
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
              <strong>Período selecionado:</strong>{" "}
              {format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })} até{" "}
              {format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};