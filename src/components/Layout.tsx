import { ReactNode, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Bell, LogOut, Search, ShoppingCart, Moon, Sun, ChevronDown, MessageSquare, Calendar, Mail, AlertTriangle, XCircle, TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import { useConsumoAlerts } from "@/hooks/useConsumoAlerts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
interface LayoutProps {
  children: ReactNode;
}
export function Layout({
  children
}: LayoutProps) {
  const {
    user,
    profile,
    organization,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const { data: consumoAlerts } = useConsumoAlerts();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Calcular estatísticas dos alertas
  const alertStats = {
    total: consumoAlerts?.length || 0,
    critical: consumoAlerts?.filter(a => a.type === 'critical').length || 0,
    warning: consumoAlerts?.filter(a => a.type === 'warning').length || 0,
    consumo: consumoAlerts?.filter(a => a.category === 'consumo').length || 0,
    acuracia: consumoAlerts?.filter(a => a.category === 'acuracia').length || 0
  };

  // Estado para filtro de categoria no dropdown
  const [dropdownFilter, setDropdownFilter] = useState<'all' | 'consumo' | 'acuracia'>('all');

  // Filtrar alertas baseado na categoria selecionada
  const filteredAlerts = useMemo(() => {
    if (!consumoAlerts) return [];
    if (dropdownFilter === 'all') return consumoAlerts;
    return consumoAlerts.filter(alert => alert.category === dropdownFilter);
  }, [consumoAlerts, dropdownFilter]);

  const getAlertIcon = (type: string) => {
    if (type === 'critical') return <XCircle className="h-3 w-3 text-destructive" />;
    if (type === 'warning') return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    return <Bell className="h-3 w-3 text-muted-foreground" />;
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-primary">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - Fixed */}
          <header className="bg-card-secondary/50 backdrop-blur-sm border-b border-border-subtle sticky top-0 z-50">
            <div className="flex items-center justify-between h-16 px-2 sm:px-4">
              {/* Left Section */}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <SidebarTrigger />

                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50 hover:text-text-primary">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Buscar..."
                    className="w-64 h-9"
                  />
                </div>

                {/* Mobile Search Icon */}
                <Button variant="ghost" size="icon" className="sm:hidden hover:bg-background-secondary/50 hover:text-text-primary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Center Section - Navigation */}
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center">
                  
                </div>
                
                
                
                
                
                
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                {/* Language/Region Selector - Hidden on mobile */}
                <div className="hidden sm:block">
                  <LanguageSelector />
                </div>

                {/* Dark Mode Toggle - Hidden on mobile */}
                <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-background-secondary/50 hover:text-text-primary">
                  <Moon className="h-5 w-5" />
                </Button>

                {/* Notifications with Badge */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-background-secondary/50 hover:text-text-primary">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                      {alertStats.total > 0 && (
                        <div className="absolute -top-1 -right-1 flex items-center justify-center">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                          <Badge
                            variant={alertStats.critical > 0 ? "destructive" : "secondary"}
                            className="relative h-5 min-w-[20px] rounded-full px-1 text-[10px]"
                          >
                            {alertStats.total}
                          </Badge>
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-96">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Central de Alertas</span>
                        {alertStats.total > 0 && (
                          <div className="flex gap-2 text-xs">
                            {alertStats.critical > 0 && (
                              <Badge variant="destructive" className="px-1.5 py-0">
                                {alertStats.critical} crítico{alertStats.critical !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {alertStats.warning > 0 && (
                              <Badge variant="secondary" className="px-1.5 py-0">
                                {alertStats.warning} atenção
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {consumoAlerts && consumoAlerts.length > 0 ? (
                      <>
                        {/* Filtros por categoria */}
                        <div className="px-2 py-2">
                          <div className="flex gap-2">
                            <Badge
                              variant={dropdownFilter === 'all' ? 'default' : 'outline'}
                              className="cursor-pointer hover:bg-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownFilter('all');
                              }}
                            >
                              Todos ({alertStats.total})
                            </Badge>
                            <Badge
                              variant={dropdownFilter === 'consumo' ? 'default' : 'outline'}
                              className="cursor-pointer hover:bg-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownFilter('consumo');
                              }}
                            >
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Consumo ({alertStats.consumo})
                            </Badge>
                            <Badge
                              variant={dropdownFilter === 'acuracia' ? 'default' : 'outline'}
                              className="cursor-pointer hover:bg-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownFilter('acuracia');
                              }}
                            >
                              <Target className="h-3 w-3 mr-1" />
                              Acurácia ({alertStats.acuracia})
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenuSeparator />

                        {/* Lista de alertas com scroll para todos */}
                        <ScrollArea className="h-[400px]">
                          <div className="px-1">
                            {filteredAlerts.length > 0 ? (
                              filteredAlerts.map((alert) => (
                                <DropdownMenuItem
                                  key={alert.id}
                                  className="flex items-start gap-2 p-3 cursor-pointer mb-1"
                                  onClick={() => navigate('/alerts')}
                                >
                                  <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-1">
                                      <p className="text-sm font-medium leading-none">
                                        {alert.curralLote || alert.title}
                                      </p>
                                      {alert.category === 'consumo' && alert.realizado && alert.previsto && (
                                        alert.realizado > alert.previsto ? (
                                          <TrendingUp className="h-3 w-3 text-orange-500" />
                                        ) : (
                                          <TrendingDown className="h-3 w-3 text-blue-500" />
                                        )
                                      )}
                                      {alert.category === 'acuracia' && (
                                        <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">
                                          {alert.metricLabel}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {alert.category === 'consumo' && alert.desvioPercentual ?
                                        `Desvio de ${alert.desvioPercentual.toFixed(1)}% (${alert.desvioKg?.toFixed(1)} kg)` :
                                        alert.description.substring(0, 100) + '...'
                                      }
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {alert.escore !== undefined && (
                                        <span className="text-xs text-muted-foreground">
                                          Escore: {alert.escore > 0 ? '+' : ''}{alert.escore}
                                        </span>
                                      )}
                                      <Badge
                                        variant={alert.category === 'consumo' ? 'secondary' : 'outline'}
                                        className="text-[10px] px-1 py-0"
                                      >
                                        {alert.category === 'consumo' ? 'Consumo' : 'Acurácia'}
                                      </Badge>
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              ))
                            ) : (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Nenhum alerta nesta categoria
                              </div>
                            )}
                          </div>
                        </ScrollArea>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            to="/alerts"
                            className="flex items-center justify-center gap-2 p-2 text-sm font-medium"
                          >
                            Ver todos os alertas
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <div className="p-4 text-center">
                        <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum alerta ativo
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Todos os lotes estão dentro dos parâmetros
                        </p>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Profile */}
                <div className="flex items-center gap-1 sm:gap-3 ml-1 sm:ml-2 min-w-0">
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-accent-primary/20 hover:ring-accent-primary/40 transition-all cursor-pointer">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-accent-primary text-white text-xs sm:text-sm">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {profile?.full_name}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {organization?.name}
                    </p>
                  </div>
                </div>

                {/* Sign Out - Hidden on smaller screens */}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden xl:flex text-text-secondary hover:text-text-primary">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>;
}