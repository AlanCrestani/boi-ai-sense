import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import InviteManager from "@/components/InviteManager";
import { 
  Activity, 
  Users, 
  FileText, 
  Camera, 
  MapPin, 
  Mail, 
  Calendar,
  Settings,
  BarChart3,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const { user, profile, organization, userRole, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated (use useEffect to avoid setState during render)
  React.useEffect(() => {
    if (!loading && (!user || !profile)) {
      navigate("/signin");
    }
  }, [loading, user, profile, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Carregando perfil...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Don't render anything while redirecting
  if (!user || !profile) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-text-secondary">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto font-normal text-text-secondary hover:text-accent-primary"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
            <span className="mx-2">•</span>
            <span className="text-text-primary">Perfil</span>
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="mb-8 overflow-hidden border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          {/* Banner */}
          <div className="h-32 sm:h-48 bg-gradient-primary relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/20 to-primary/20" />
          </div>
          
          {/* Profile Info */}
          <CardContent className="relative px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 sm:-mt-16">
              {/* Avatar */}
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background-primary shadow-lg">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-accent-primary text-white text-xl sm:text-2xl font-bold">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="mb-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
                    {profile?.full_name || 'Usuário'}
                  </h1>
                  <p className="text-text-secondary mb-1">
                    {profile?.position || 'Gestor Pecuário'}
                  </p>
                  {organization && (
                    <p className="text-sm text-text-tertiary">{organization.name}</p>
                  )}
                  {userRole && (
                    <Badge variant="secondary" className="mt-2">
                      {userRole === 'owner' ? 'Proprietário' :
                       userRole === 'admin' ? 'Administrador' :
                       userRole === 'manager' ? 'Gerente' :
                       userRole === 'employee' ? 'Funcionário' : 'Visualizador'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
                <Button variant="tech" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Foto
                </Button>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-subtle">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-text-primary">142</div>
                <div className="text-xs sm:text-sm text-text-secondary">Relatórios</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-text-primary">3,586</div>
                <div className="text-xs sm:text-sm text-text-secondary">Animais</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-text-primary">2,659</div>
                <div className="text-xs sm:text-sm text-text-secondary">Análises</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Profile Information Card */}
              <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-text-primary">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-text-secondary">
                    {profile?.full_name ? `Olá, eu sou ${profile.full_name}. ` : 'Olá! '}
                    {profile?.position ? `Trabalho como ${profile.position} ` : 'Trabalho com gestão pecuária '}
                    e utilizo o ConectaBoi Insights para otimizar a produtividade através de 
                    análises inteligentes e dados precisos.
                  </p>
                  
                  <div className="space-y-3">
                    {profile?.department && (
                      <div className="flex items-center gap-2 text-text-secondary">
                        <MapPin className="h-4 w-4 text-accent-primary" />
                        <span>{profile.department}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Mail className="h-4 w-4 text-accent-primary" />
                      <span>{profile?.email || user?.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Calendar className="h-4 w-4 text-accent-primary" />
                      <span>Membro desde {new Date(profile?.created_at || Date.now()).toLocaleDateString('pt-BR', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    
                    {organization && (
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Users className="h-4 w-4 text-accent-primary" />
                        <span>{organization.name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Card */}
              <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-text-primary">
                    <Activity className="h-5 w-5" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background-secondary/50">
                      <div className="w-2 h-2 bg-accent-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-text-primary font-medium">Novo relatório gerado</p>
                        <p className="text-xs text-text-secondary">Análise mensal do rebanho - Há 2 horas</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background-secondary/30">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-text-primary font-medium">Análise de peso completada</p>
                        <p className="text-xs text-text-secondary">350 animais analisados - Ontem</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background-secondary/30">
                      <div className="w-2 h-2 bg-accent-secondary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-text-primary font-medium">Dados sincronizados</p>
                        <p className="text-xs text-text-secondary">Atualização automática - 3 dias atrás</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-text-primary">
                    <BarChart3 className="h-5 w-5" />
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-24 flex-col gap-2">
                      <FileText className="h-6 w-6" />
                      <span className="text-sm">Gerar Relatório</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2">
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-sm">Analytics</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Gerenciar Equipe</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2">
                      <Settings className="h-6 w-6" />
                      <span className="text-sm">Configurações</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="team">
            <InviteManager />
          </TabsContent>
          
          <TabsContent value="reports">
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Relatórios</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                  <p className="text-text-secondary">Módulo de relatórios em desenvolvimento</p>
                  <p className="text-sm text-text-tertiary mt-2">Em breve você terá acesso aos relatórios detalhados</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                  <p className="text-text-secondary">Configurações em desenvolvimento</p>
                  <p className="text-sm text-text-tertiary mt-2">Em breve você poderá personalizar suas preferências</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}