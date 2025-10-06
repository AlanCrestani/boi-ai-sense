import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FornecedoresTab } from "@/components/settings/FornecedoresTab";
import { IngredientesTab } from "@/components/settings/IngredientesTab";
import { DietasTab } from "@/components/settings/DietasTab";
import { DietaComposicaoTab } from "@/components/settings/DietaComposicaoTab";
import { AtualizacaoMSTab } from "@/components/settings/AtualizacaoMSTab";

export default function Nutricao() {
  const [activeTab, setActiveTab] = useState("dietas");

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-2 sm:py-8 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              Nutrição
            </h1>
            <p className="text-sm sm:text-base text-text-secondary">
              Gerencie fornecedores, ingredientes, dietas e composições nutricionais
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dietas">Dietas</TabsTrigger>
              <TabsTrigger value="composicao">Composição</TabsTrigger>
              <TabsTrigger value="atualizacao-ms">Atualização MS</TabsTrigger>
              <TabsTrigger value="ingredientes">Ingredientes</TabsTrigger>
              <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            </TabsList>

            <TabsContent value="dietas" className="space-y-4">
              <DietasTab />
            </TabsContent>

            <TabsContent value="composicao" className="space-y-4">
              <DietaComposicaoTab />
            </TabsContent>

            <TabsContent value="atualizacao-ms" className="space-y-4">
              <AtualizacaoMSTab />
            </TabsContent>

            <TabsContent value="ingredientes" className="space-y-4">
              <IngredientesTab />
            </TabsContent>

            <TabsContent value="fornecedores" className="space-y-4">
              <FornecedoresTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
