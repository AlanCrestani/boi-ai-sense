import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AIAgentCardProps {
  name: string;
  status: "active" | "monitoring" | "alert";
  description: string;
  metrics: {
    label: string;
    value: string;
  }[];
  icon: React.ReactNode;
}

export function AIAgentCard({ name, status, description, metrics, icon }: AIAgentCardProps) {
  return (
    <Card className="tech-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            status === "active" && "bg-primary/20",
            status === "monitoring" && "bg-accent/20",
            status === "alert" && "bg-destructive/20"
          )}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant={
          status === "active" ? "default" : 
          status === "alert" ? "destructive" : 
          "secondary"
        }>
          {status === "active" && "Ativo"}
          {status === "monitoring" && "Monitorando"}
          {status === "alert" && "Alerta"}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-lg font-semibold text-primary">{metric.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}