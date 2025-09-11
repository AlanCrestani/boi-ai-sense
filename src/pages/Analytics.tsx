import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Analytics</h1>
          <p className="text-text-secondary">Análises detalhadas do seu sistema</p>
        </div>

        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">Módulo de analytics em desenvolvimento</p>
              <p className="text-sm text-text-tertiary mt-2">Em breve você terá acesso a análises avançadas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}