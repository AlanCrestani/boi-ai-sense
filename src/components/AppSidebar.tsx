import { 
  Activity, 
  Users, 
  FileText, 
  Settings,
  BarChart3,
  User,
  Home
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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
  { title: "Perfil", url: "/user-profile", icon: User },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Relatórios", url: "/reports", icon: FileText },
];

const managementItems = [
  { title: "Equipe", url: "/team", icon: Users },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent className="bg-card-secondary/50 backdrop-blur-sm border-r border-border-subtle">
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isActive(item.url) 
                          ? "bg-accent-primary/20 text-accent-primary font-medium border-r-2 border-accent-primary" 
                          : "hover:bg-background-secondary/50 text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isActive(item.url) 
                          ? "bg-accent-primary/20 text-accent-primary font-medium border-r-2 border-accent-primary" 
                          : "hover:bg-background-secondary/50 text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}