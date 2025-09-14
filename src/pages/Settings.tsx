import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Configurações</h1>
          <p className="text-text-secondary">Configurações do sistema</p>
        </div>

        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <SettingsIcon className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">Configurações em desenvolvimento</p>
              <p className="text-sm text-text-tertiary mt-2">Em breve você poderá personalizar suas preferências</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}