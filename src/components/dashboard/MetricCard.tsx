import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  icon?: React.ReactNode;
  className?: string;
  animated?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  className,
  animated = false 
}: MetricCardProps) {
  return (
    <Card className={cn(
      "tech-card p-6 relative group overflow-hidden",
      animated && "pulse-data",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl font-bold gradient-text">
              {value}
            </h3>
            {trend && (
              <span className={cn(
                "text-xs font-medium",
                trend === "up" && "text-primary",
                trend === "down" && "text-destructive",
                trend === "stable" && "text-muted-foreground"
              )}>
                {trend === "up" && "↗"}
                {trend === "down" && "↘"}
                {trend === "stable" && "→"}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-primary/60 ml-4">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}