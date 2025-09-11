import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Analytics() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-6">
            <span className="text-text-tertiary">ConectaBoi</span>
            <span className="text-text-secondary">/</span>
            <span className="text-text-primary">Leitura de Cocho</span>
          </nav>
          
          <div className="flex items-center justify-between mb-2">
            {/* Título */}
            <h1 className="text-3xl font-bold text-text-primary">Leitura de Cocho</h1>
            
            {/* Botão Voltar */}
            <Button 
              onClick={handleGoBack}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 text-white rounded-lg transition-colors duration-200 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Dashboard
            </Button>
          </div>
          <p className="text-text-secondary">Monitoramento e análise do consumo de ração</p>
        </div>

        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Leitura de Cocho
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">Sistema de leitura de cocho em desenvolvimento</p>
              <p className="text-sm text-text-tertiary mt-2">Em breve você terá acesso ao monitoramento completo do consumo de ração</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}