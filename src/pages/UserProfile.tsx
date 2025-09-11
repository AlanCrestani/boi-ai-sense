import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
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
  Bell,
  Home,
  BarChart3,
  MessageSquare,
  Folder,
  User,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const { user, profile, organization, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    navigate("/signin");
    return null;
  }
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-card-secondary/50 backdrop-blur-sm border-r border-border-subtle">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="relative">
              <Activity className="h-8 w-8 text-accent-primary" />
              <div className="absolute inset-0 bg-accent-primary/20 blur-lg rounded-full" />
            </div>
            <div className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ConectaBoi
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">
              MENU
            </div>
            
            <Button variant="ghost" className="w-full justify-start text-text-secondary hover:text-text-primary hover:bg-accent-primary/10">
              <Home className="h-4 w-4 mr-3" />
              Dashboard
            </Button>
            
            <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4 mt-6">
              APPS
            </div>
            
            <Button variant="ghost" className="w-full justify-start text-text-secondary hover:text-text-primary hover:bg-accent-primary/10">
              <BarChart3 className="h-4 w-4 mr-3" />
              Analytics
              <Badge variant="secondary" className="ml-auto">3</Badge>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start text-text-secondary hover:text-text-primary hover:bg-accent-primary/10">
              <MessageSquare className="h-4 w-4 mr-3" />
              Relatórios
            </Button>
            
            <Button variant="ghost" className="w-full justify-start text-text-secondary hover:text-text-primary hover:bg-accent-primary/10">
              <Folder className="h-4 w-4 mr-3" />
              Arquivos
            </Button>
            
            <Button variant="outline" className="w-full justify-start bg-accent-primary/10 text-accent-primary border-accent-primary/20">
              <User className="h-4 w-4 mr-3" />
              Perfil
            </Button>
          </nav>

          {/* User info and logout */}
          <div className="mt-auto pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-accent-primary text-white text-sm">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {userRole && (
                    <Badge variant="secondary" className="text-xs">
                      {userRole === 'owner' ? 'Proprietário' :
                       userRole === 'admin' ? 'Admin' :
                       userRole === 'manager' ? 'Gerente' :
                       userRole === 'employee' ? 'Funcionário' : 'Visualizador'}
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-text-secondary hover:text-text-primary"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center text-sm text-text-secondary mb-1">
              <span>Dashboard</span>
              <span className="mx-2">•</span>
              <span className="text-text-primary">Perfil do Usuário</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Perfil do Usuário</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          {/* Banner */}
          <div className="h-48 bg-gradient-primary relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/20 to-primary/20" />
          </div>
          
          {/* Profile Info */}
          <CardContent className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="flex flex-col items-center -mt-16 mb-6">
              <Avatar className="w-32 h-32 border-4 border-background-primary shadow-lg">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-accent-primary text-white text-2xl font-bold">
                  JD
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center mt-4">
                <h2 className="text-2xl font-bold text-text-primary">{profile?.full_name || 'Usuário'}</h2>
                <p className="text-text-secondary">{profile?.position || 'Gestor Pecuário'}</p>
                {organization && (
                  <p className="text-sm text-text-tertiary">{organization.name}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">142</div>
                <div className="text-sm text-text-secondary">Relatórios</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">3,586</div>
                <div className="text-sm text-text-secondary">Animais</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">2,659</div>
                <div className="text-sm text-text-secondary">Análises</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 mb-6">
              <Button variant="tech" className="gap-2">
                <Camera className="h-4 w-4" />
                Adicionar Foto
              </Button>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Relatórios
              </Button>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="team">Equipe</TabsTrigger>
                <TabsTrigger value="reports">Relatórios</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Introduction */}
                  <Card className="border-border-subtle bg-background-secondary/50">
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-text-primary">Introdução</h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-text-secondary">
                        Olá, eu sou {profile?.full_name || 'um usuário'}. 
                        {profile?.position ? ` Trabalho como ${profile.position}` : ' Trabalho com gestão pecuária há mais de 15 anos'} 
                        e utilizo o ConectaBoi Insights para otimizar a produtividade do rebanho 
                        através de análises inteligentes e dados precisos.
                      </p>
                      
                      <div className="space-y-3">
                        {profile?.department && (
                          <div className="flex items-center gap-2 text-text-secondary">
                            <MapPin className="h-4 w-4" />
                            <span>{profile.department}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Mail className="h-4 w-4" />
                          <span>{profile?.email || user?.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Calendar className="h-4 w-4" />
                          <span>Membro desde {new Date(profile?.created_at).toLocaleDateString('pt-BR', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                        
                        {organization && (
                          <div className="flex items-center gap-2 text-text-secondary">
                            <Users className="h-4 w-4" />
                            <span>{organization.name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity */}
                  <Card className="border-border-subtle bg-background-secondary/50">
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-text-primary">Atividade Recente</h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-accent-primary rounded-full mt-2" />
                          <div>
                            <p className="text-sm text-text-primary">Novo relatório gerado</p>
                            <p className="text-xs text-text-secondary">Há 2 horas</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                          <div>
                            <p className="text-sm text-text-primary">Análise de peso completada</p>
                            <p className="text-xs text-text-secondary">Ontem</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-accent-secondary rounded-full mt-2" />
                          <div>
                            <p className="text-sm text-text-primary">Atualização de dados do rebanho</p>
                            <p className="text-xs text-text-secondary">3 dias atrás</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="team" className="mt-6">
                <InviteManager />
              </TabsContent>
              
              <TabsContent value="reports" className="mt-6">
                <Card className="border-border-subtle bg-background-secondary/50">
                  <CardContent className="p-6">
                    <p className="text-text-secondary">Conteúdo de Relatórios em desenvolvimento...</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <Card className="border-border-subtle bg-background-secondary/50">
                  <CardContent className="p-6">
                    <p className="text-text-secondary">Conteúdo de Configurações em desenvolvimento...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}