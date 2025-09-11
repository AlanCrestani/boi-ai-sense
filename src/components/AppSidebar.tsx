import { 
  Activity, 
  Users, 
  FileText, 
  Settings,
  BarChart3,
  User,
  Home,
  Power
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

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Leitura de Cocho", url: "/analytics", icon: BarChart3 },
  { title: "Analise de Desvios", url: "/desvios", icon: Activity },
  { title: "Logística de Tratos", url: "/logistica", icon: FileText },
  { title: "Relatórios", url: "/reports", icon: FileText },
];

const managementItems = [
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
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
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
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-text-tertiary">Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 hover-scale group ${
                          isActive(item.url) 
                            ? "bg-accent-primary/20 text-accent-primary font-medium border-r-2 border-accent-primary shadow-sm" 
                            : "hover:bg-background-secondary/80 hover:shadow-md text-text-secondary hover:text-text-primary transform hover:translate-x-1"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 flex-shrink-0 transition-all duration-300 ${
                          isActive(item.url) 
                            ? "text-accent-primary" 
                            : "group-hover:text-accent-primary group-hover:scale-110"
                        }`} />
                        {!collapsed && (
                          <span className={`truncate transition-all duration-300 ${
                            isActive(item.url) 
                              ? "text-accent-primary font-medium" 
                              : "group-hover:text-text-primary group-hover:font-medium"
                          }`}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Management */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-text-tertiary">Gerenciamento</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 hover-scale group ${
                          isActive(item.url) 
                            ? "bg-accent-primary/20 text-accent-primary font-medium border-r-2 border-accent-primary shadow-sm" 
                            : "hover:bg-background-secondary/80 hover:shadow-md text-text-secondary hover:text-text-primary transform hover:translate-x-1"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 flex-shrink-0 transition-all duration-300 ${
                          isActive(item.url) 
                            ? "text-accent-primary" 
                            : "group-hover:text-accent-primary group-hover:scale-110"
                        }`} />
                        {!collapsed && (
                          <span className={`truncate transition-all duration-300 ${
                            isActive(item.url) 
                              ? "text-accent-primary font-medium" 
                              : "group-hover:text-text-primary group-hover:font-medium"
                          }`}>
                            {item.title}
                          </span>
                        )}
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