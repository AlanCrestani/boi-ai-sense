import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, Bell, Settings, Filter } from "lucide-react";

const mockAlerts = [
  {
    id: 1,
    type: "critical",
    title: "Baixo consumo no Lote 15",
    description: "Consumo 25% abaixo do esperado nas últimas 2 horas",
    time: "há 15 min",
    agent: "Agente de Leitura de Cocho"
  },
  {
    id: 2,
    type: "warning",
    title: "Atraso na distribuição",
    description: "Rota 3 com 12 minutos de atraso devido ao trânsito",
    time: "há 28 min",
    agent: "Agente de Logística"
  },
  {
    id: 3,
    type: "info",
    title: "Carregamento otimizado",
    description: "Sequência de carregamento melhorada em 8%",
    time: "há 1h",
    agent: "Agente de Otimização"
  }
];

const getAlertIcon = (type: string) => {
  switch (type) {
    case "critical":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "info":
      return <CheckCircle className="h-4 w-4 text-accent-primary" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getAlertBadge = (type: string) => {
  switch (type) {
    case "critical":
      return <Badge variant="destructive">Crítico</Badge>;
    case "warning":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Atenção</Badge>;
    case "info":
      return <Badge variant="default">Normal</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

export default function Alerts() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Alertas & Feedbacks</h1>
            <p className="text-text-secondary">Central de notificações e feedbacks dos agentes de IA</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Status Geral</p>
                  <p className="text-2xl font-bold text-accent-primary">Normal</p>
                </div>
                <CheckCircle className="h-8 w-8 text-accent-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Alertas Ativos</p>
                  <p className="text-2xl font-bold text-yellow-600">2</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-subtle bg-card-secondary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">Críticos</p>
                  <p className="text-2xl font-bold text-destructive">1</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Últimos Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-4 p-4 rounded-lg border border-border-subtle bg-background-primary/50">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{alert.title}</h4>
                        <p className="text-sm text-text-secondary mt-1">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-text-tertiary">{alert.agent}</span>
                          <span className="text-xs text-text-tertiary">•</span>
                          <span className="text-xs text-text-tertiary">{alert.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getAlertBadge(alert.type)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}