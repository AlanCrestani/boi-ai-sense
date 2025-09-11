import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Reports() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Relatórios</h1>
          <p className="text-text-secondary">Relatórios detalhados do sistema</p>
        </div>

        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">Módulo de relatórios em desenvolvimento</p>
              <p className="text-sm text-text-tertiary mt-2">Em breve você terá acesso aos relatórios detalhados</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}