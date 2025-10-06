import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, DollarSign, Truck, BarChart3, Target } from "lucide-react";

const mockOptimizations = [
  {
    id: 1,
    category: "Logística",
    title: "Otimização de Rota - Setor Principal",
    description: "Reordenar sequência de tratos pode reduzir tempo em 18 minutos",
    impact: "Alta",
    savings: "R$ 240/dia",
    timeReduction: "18 min",
    status: "Recomendado",
    confidence: 87
  },
  {
    id: 2,
    category: "Nutrição",
    title: "Ajuste de Dieta - Lotes 12-15",
    description: "Reduzir 5% da ração no período vespertino baseado no consumo",
    impact: "Média",
    savings: "R$ 180/dia",
    timeReduction: "-",
    status: "Em Análise",
    confidence: 92
  },
  {
    id: 3,
    category: "Operacional",
    title: "Horário de Carregamento",
    description: "Antecipar primeiro carregamento em 30 minutos melhora eficiência",
    impact: "Média",
    savings: "R$ 95/dia",
    timeReduction: "12 min",
    status: "Implementado",
    confidence: 78
  }
];

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "Alta":
      return "text-destructive";
    case "Média":
      return "text-yellow-600";
    case "Baixa":
      return "text-accent-primary";
    default:
      return "text-text-secondary";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Recomendado":
      return <Badge variant="default">Recomendado</Badge>;
    case "Em Análise":
      return <Badge variant="secondary">Em Análise</Badge>;
    case "Implementado":
      return <Badge className="bg-green-100 text-green-800 border-green-300">Implementado</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

export default function Optimizations() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Otimizações Recomendadas</h1>
            <p className="text-text-secondary">Sugestões inteligentes para melhorar eficiência operacional</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatório Completo
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Economia Potencial</p>
                  <p className="text-2xl font-bold text-accent-primary">R$ 515</p>
                  <p className="text-xs text-text-tertiary">por dia</p>
                </div>
                <DollarSign className="h-8 w-8 text-accent-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Tempo Poupado</p>
                  <p className="text-2xl font-bold text-accent-primary">30min</p>
                  <p className="text-xs text-text-tertiary">por ciclo</p>
                </div>
                <Clock className="h-8 w-8 text-accent-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Sugestões Ativas</p>
                  <p className="text-2xl font-bold text-accent-primary">3</p>
                  <p className="text-xs text-text-tertiary">não implementadas</p>
                </div>
                <Target className="h-8 w-8 text-accent-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-accent-primary">92%</p>
                  <p className="text-xs text-text-tertiary">implementações</p>
                </div>
                <TrendingUp className="h-8 w-8 text-accent-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimizations List */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recomendações por Agente de IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {mockOptimizations.map((opt) => (
                <div key={opt.id} className="p-6 rounded-lg border border-border-subtle bg-background-primary/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{opt.category}</Badge>
                        {getStatusBadge(opt.status)}
                      </div>
                      <h4 className="text-lg font-semibold text-text-primary mb-2">{opt.title}</h4>
                      <p className="text-text-secondary mb-4">{opt.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-text-tertiary">Impacto</p>
                      <p className={`text-lg font-semibold ${getImpactColor(opt.impact)}`}>{opt.impact}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-text-tertiary">Economia</p>
                      <p className="text-lg font-semibold text-accent-primary">{opt.savings}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-text-tertiary">Tempo</p>
                      <p className="text-lg font-semibold text-accent-primary">{opt.timeReduction}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-text-tertiary">Confiança</p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <Progress value={opt.confidence} className="w-12 h-2" />
                        <span className="text-sm font-semibold text-accent-primary">{opt.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {opt.status === "Recomendado" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-accent-primary hover:bg-accent-primary/90">
                        Implementar
                      </Button>
                      <Button variant="outline" size="sm">
                        Simular Cenário
                      </Button>
                      <Button variant="ghost" size="sm">
                        Descartar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}