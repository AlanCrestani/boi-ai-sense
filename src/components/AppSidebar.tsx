import {
  Activity,
  Users,
  FileText,
  Settings,
  BarChart3,
  User,
  Home,
  Power,
  Database,
  TrendingUp,
  TreePine,
  MapPin,
  Package,
  Truck,
  Apple,
  ClipboardCheck
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const principalItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
];

const operationalConfinamentoItems = [
  { title: "Leitura de Cocho", url: "/feed-reading", icon: BarChart3 },
  { title: "Análise de Desvios", url: "/desvios", icon: Activity },
  { title: "Logística de Tratos", url: "/logistica", icon: FileText },
  { title: "Nutrição", url: "/nutricao", icon: Apple },
  { title: "Acompanhamento Técnico", url: "/acompanhamento-tecnico", icon: ClipboardCheck },
];

const operationalPastoItems = [
  { title: "Cadastros", url: "/cadastros-pasto", icon: MapPin },
  { title: "Estoque Produtos", url: "/estoque-pasto", icon: Package },
  { title: "Distribuição Proteinado", url: "/distribuicao-pasto", icon: Truck },
];

const aiInsightsItems = [
  { title: "Alertas & Feedbacks", url: "/alerts", icon: Activity },
  { title: "Otimizações Recomendadas", url: "/optimizations", icon: BarChart3 },
];

const managementItems = [
  { title: "Upload CSV", url: "/csv-upload", icon: FileText },
  { title: "Equipe", url: "/team", icon: Users },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, profile, organization, signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = () => {
    signOut();
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card-secondary/50 backdrop-blur-sm border-r border-border-subtle flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity className="h-8 w-8 text-accent-primary" />
              <div className="absolute inset-0 bg-accent-primary/20 blur-lg rounded-full" />
            </div>
            {!collapsed && (
              <div className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ConectaBoi
              </div>
            )}
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1">
          {/* Principal */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-text-tertiary">Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {principalItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={`flex items-center justify-between w-full py-2 px-4 text-left transition-all duration-200 ease-in-out cursor-pointer group relative overflow-hidden ${
                          isActive(item.url) 
                            ? "bg-accent-primary/20 text-accent-primary border-r-2 border-accent-primary" 
                            : "text-text-secondary hover:bg-background-secondary/50 hover:text-text-primary"
                        }`}
                      >
                        {/* Gradient effect background */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-200 ${
                            isActive(item.url)
                              ? "bg-gradient-to-r from-accent-primary/20 to-transparent opacity-100"
                              : "bg-gradient-to-l from-transparent to-accent-primary/25 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <item.icon className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                            isActive(item.url) 
                              ? "text-accent-primary" 
                              : "group-hover:text-accent-primary"
                          }`} />
                          {!collapsed && (
                            <span className={`truncate transition-all duration-200 ${
                              isActive(item.url) 
                                ? "text-accent-primary font-medium" 
                                : "group-hover:text-text-primary group-hover:font-medium"
                            }`}>
                              {item.title}
                            </span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Operacional Confinamento */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-text-tertiary">Operacional Confinamento</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operationalConfinamentoItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={`flex items-center justify-between w-full py-2 px-4 text-left transition-all duration-200 ease-in-out cursor-pointer group relative overflow-hidden ${
                          isActive(item.url) 
                            ? "bg-accent-primary/20 text-accent-primary border-r-2 border-accent-primary" 
                            : "text-text-secondary hover:bg-background-secondary/50 hover:text-text-primary"
                        }`}
                      >
                        {/* Gradient effect background */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-200 ${
                            isActive(item.url)
                              ? "bg-gradient-to-r from-accent-primary/20 to-transparent opacity-100"
                              : "bg-gradient-to-l from-transparent to-accent-primary/25 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <item.icon className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                            isActive(item.url) 
                              ? "text-accent-primary" 
                              : "group-hover:text-accent-primary"
                          }`} />
                          {!collapsed && (
                            <span className={`truncate transition-all duration-200 ${
                              isActive(item.url) 
                                ? "text-accent-primary font-medium" 
                                : "group-hover:text-text-primary group-hover:font-medium"
                            }`}>
                              {item.title}
                            </span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Operacional Pasto */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-text-tertiary">Operacional Pasto</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operationalPastoItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center justify-between w-full py-2 px-4 text-left transition-all duration-200 ease-in-out cursor-pointer group relative overflow-hidden ${
                          isActive(item.url)
                            ? "bg-accent-primary/20 text-accent-primary border-r-2 border-accent-primary"
                            : "text-text-secondary hover:bg-background-secondary/50 hover:text-text-primary"
                        }`}
                      >
                        {/* Gradient effect background */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-200 ${
                            isActive(item.url)
                              ? "bg-gradient-to-r from-accent-primary/20 to-transparent opacity-100"
                              : "bg-gradient-to-l from-transparent to-accent-primary/25 opacity-0 group-hover:opacity-100"
                          }`}
                        />

                        <div className="flex items-center gap-3 relative z-10">
                          <item.icon className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                            isActive(item.url)
                              ? "text-accent-primary"
                              : "group-hover:text-accent-primary"
                          }`} />
                          {!collapsed && (
                            <span className={`truncate transition-all duration-200 ${
                              isActive(item.url)
                                ? "text-accent-primary font-medium"
                                : "group-hover:text-text-primary group-hover:font-medium"
                            }`}>
                              {item.title}
                            </span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Insights de IA */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-text-tertiary">Insights de IA</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {aiInsightsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={`flex items-center justify-between w-full py-2 px-4 text-left transition-all duration-200 ease-in-out cursor-pointer group relative overflow-hidden ${
                          isActive(item.url) 
                            ? "bg-accent-primary/20 text-accent-primary border-r-2 border-accent-primary" 
                            : "text-text-secondary hover:bg-background-secondary/50 hover:text-text-primary"
                        }`}
                      >
                        {/* Gradient effect background */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-200 ${
                            isActive(item.url)
                              ? "bg-gradient-to-r from-accent-primary/20 to-transparent opacity-100"
                              : "bg-gradient-to-l from-transparent to-accent-primary/25 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <item.icon className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                            isActive(item.url) 
                              ? "text-accent-primary" 
                              : "group-hover:text-accent-primary"
                          }`} />
                          {!collapsed && (
                            <span className={`truncate transition-all duration-200 ${
                              isActive(item.url) 
                                ? "text-accent-primary font-medium" 
                                : "group-hover:text-text-primary group-hover:font-medium"
                            }`}>
                              {item.title}
                            </span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Gestão */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-text-tertiary">Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={`flex items-center justify-between w-full py-2 px-4 text-left transition-all duration-200 ease-in-out cursor-pointer group relative overflow-hidden ${
                          isActive(item.url) 
                            ? "bg-accent-primary/20 text-accent-primary border-r-2 border-accent-primary" 
                            : "text-text-secondary hover:bg-background-secondary/50 hover:text-text-primary"
                        }`}
                      >
                        {/* Gradient effect background */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-200 ${
                            isActive(item.url)
                              ? "bg-gradient-to-r from-accent-primary/20 to-transparent opacity-100"
                              : "bg-gradient-to-l from-transparent to-accent-primary/25 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <item.icon className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                            isActive(item.url) 
                              ? "text-accent-primary" 
                              : "group-hover:text-accent-primary"
                          }`} />
                          {!collapsed && (
                            <span className={`truncate transition-all duration-200 ${
                              isActive(item.url) 
                                ? "text-accent-primary font-medium" 
                                : "group-hover:text-text-primary group-hover:font-medium"
                            }`}>
                              {item.title}
                            </span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Profile Section */}
        <div className="p-4 border-t border-border-subtle mt-auto">
          <div className="flex items-center gap-3">
            <NavLink to="/user-profile" className="flex items-center gap-3 flex-1 group">
              <Avatar className="h-10 w-10 ring-2 ring-accent-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
                <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <h6 className="text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                    {profile?.full_name || user?.email || 'Usuário'}
                  </h6>
                  <span className="text-xs text-text-tertiary truncate block">
                    {organization?.name || 'ConectaBoi'}
                  </span>
                </div>
              )}
            </NavLink>
            {!collapsed && (
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-destructive/10 text-text-tertiary hover:text-destructive transition-all duration-200 hover:scale-105"
                aria-label="Sair"
              >
                <Power className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}