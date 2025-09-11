import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Search, ShoppingCart, Moon, Sun, ChevronDown, MessageSquare, Calendar, Mail } from "lucide-react";
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
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-primary">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header - Fixed */}
          <header className="bg-card-secondary/50 backdrop-blur-sm border-b border-border-subtle sticky top-0 z-50">
            <div className="flex items-center justify-between h-16 px-4">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                
                <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50 hover:text-text-primary">
                  <Search className="h-5 w-5" />
                </Button>
              </div>

              {/* Center Section - Navigation */}
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center">
                  
                </div>
                
                
                
                
                
                
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2">
                {/* Language/Region Selector */}
                <LanguageSelector />


                {/* Dark Mode Toggle */}
                <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50 hover:text-text-primary">
                  <Moon className="h-5 w-5" />
                </Button>

                {/* Notifications with Badge */}
                <div className="relative">
                  <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50 hover:text-text-primary">
                    <Bell className="h-5 w-5" />
                  </Button>
                  <div className="absolute -top-1 -right-1 bg-accent-primary h-2 w-2 rounded-full"></div>
                </div>
                
                {/* User Profile */}
                <div className="flex items-center gap-3 ml-2">
                  <Avatar className="w-8 h-8 ring-2 ring-accent-primary/20 hover:ring-accent-primary/40 transition-all cursor-pointer">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-accent-primary text-white text-sm">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-text-primary">
                      {profile?.full_name}
                    </p>
                    <p className="text-xs text-text-secondary">
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
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>;
}