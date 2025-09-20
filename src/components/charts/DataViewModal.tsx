import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

interface ChartData {
  name: string;
  previsto: number;
  realizado: number;
  diferenca: number;
}

interface DataViewModalProps {
  data: ChartData[];
  date?: Date | null;
}

export function DataViewModal({ data, date }: DataViewModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dateString = date ? date.toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

  // Calcular totais
  const totalPrevisto = data.reduce((sum, item) => sum + item.previsto, 0);
  const totalRealizado = data.reduce((sum, item) => sum + item.realizado, 0);
  const totalDesvio = totalRealizado - totalPrevisto;
  const totalDesvioPc = totalPrevisto > 0 ? ((totalRealizado / totalPrevisto - 1) * 100).toFixed(2) : '0.00';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-border-subtle bg-card-secondary/50 hover:bg-card-secondary/80 hover:text-white hover:transform hover:translate-x-px hover:-translate-y-px"
        >
          <Eye className="h-4 w-4 mr-2" />
          Visualizar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto bg-card border-border-subtle">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-text-primary">
            Dados de Carregamento - {dateString}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          <div className="rounded-lg border border-border-subtle overflow-hidden shadow-lg">
            <table className="w-full border-collapse">
              {/* Header */}
              <thead>
                <tr className="bg-gradient-to-r from-[#0528F2] to-[#3b82f6] text-[#F2F2F2]">
                  <th className="border-b-2 border-[#0528F2] p-3 text-left font-semibold rounded-tl-lg">Data</th>
                  <th className="border-b-2 border-[#0528F2] p-3 text-left font-semibold">Ingrediente</th>
                  <th className="border-b-2 border-[#0528F2] p-3 text-right font-semibold">Previsto (kg)</th>
                  <th className="border-b-2 border-[#0528F2] p-3 text-right font-semibold">Realizado (kg)</th>
                  <th className="border-b-2 border-[#0528F2] p-3 text-right font-semibold">Desvio (kg)</th>
                  <th className="border-b-2 border-[#0528F2] p-3 text-right font-semibold rounded-tr-lg">Desvio (%)</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {data.map((item, index) => {
                  const desvio = item.diferenca;
                  const desvioPc = item.previsto > 0 ? ((item.realizado / item.previsto - 1) * 100).toFixed(2) : '0.00';
                  const isEven = index % 2 === 0;

                  return (
                    <tr
                      key={index}
                      className={`${isEven ? 'bg-[#10276B]' : 'bg-[#0B1C4D]'} hover:bg-[rgba(5,40,242,0.2)] transition-colors cursor-pointer`}
                    >
                      <td className="p-3 text-[#F2F2F2]">
                        {dateString}
                      </td>
                      <td className="p-3 font-medium text-[#F2F2F2]">
                        {item.name}
                      </td>
                      <td className="p-3 text-right font-medium text-[#F2F2F2]">
                        {item.previsto.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 text-right font-medium text-[#F2F2F2]">
                        {item.realizado.toLocaleString('pt-BR')}
                      </td>
                      <td className={`p-3 text-right font-bold ${
                        desvio >= 0 ? 'text-[#05F283]' : 'text-[#F2133C]'
                      }`}>
                        {desvio >= 0 ? '+' : ''}{desvio.toLocaleString('pt-BR')}
                      </td>
                      <td className={`p-3 text-right font-bold ${
                        desvio >= 0 ? 'text-[#05F283]' : 'text-[#F2133C]'
                      }`}>
                        {desvio >= 0 ? '+' : ''}{desvioPc}%
                      </td>
                    </tr>
                  );
                })}

                {/* Linha de totais */}
                <tr className="bg-gradient-to-r from-[#0528F2] to-[#3b82f6] text-[#F2F2F2] font-bold">
                  <td className="p-4 text-lg font-bold rounded-bl-lg" colSpan={2}>
                    TOTAL GERAL
                  </td>
                  <td className="p-4 text-right text-lg font-bold">
                    {totalPrevisto.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-4 text-right text-lg font-bold">
                    {totalRealizado.toLocaleString('pt-BR')}
                  </td>
                  <td className={`p-4 text-right text-lg font-bold ${
                    totalDesvio >= 0 ? 'text-[#05F283]' : 'text-[#F2133C]'
                  }`}>
                    {totalDesvio >= 0 ? '+' : ''}{totalDesvio.toLocaleString('pt-BR')}
                  </td>
                  <td className={`p-4 text-right text-lg font-bold rounded-br-lg ${
                    totalDesvio >= 0 ? 'text-[#05F283]' : 'text-[#F2133C]'
                  }`}>
                    {totalDesvio >= 0 ? '+' : ''}{totalDesvioPc}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}