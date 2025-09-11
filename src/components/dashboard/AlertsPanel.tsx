import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  time: string;
  resolved?: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-primary" />;
    }
  };

  const getAlertBadge = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "warning":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Atenção</Badge>;
      case "info":
        return <Badge variant="default">Info</Badge>;
    }
  };

  return (
    <Card className="tech-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Alertas em Tempo Real</h3>
        <Button variant="action" size="sm">
          Ver Todos
        </Button>
      </div>
      
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className="flex items-start space-x-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
          >
            {getAlertIcon(alert.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {alert.title}
                </p>
                {getAlertBadge(alert.type)}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {alert.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {alert.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}