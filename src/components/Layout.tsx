import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  LogOut, 
  Search, 
  ShoppingCart, 
  Moon, 
  Sun, 
  ChevronDown,
  MessageSquare,
  Calendar,
  Mail
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, profile, organization, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-primary">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header - Fixed */}
          <header className="bg-card-secondary/50 backdrop-blur-sm border-b border-border-subtle sticky top-0 z-50">
            <div className="flex items-center justify-between h-16 px-4">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                
                <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50">
                  <Search className="h-5 w-5" />
                </Button>
              </div>

              {/* Center Section - Navigation */}
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center">
                  <Button variant="ghost" className="gap-1">
                    Apps
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button variant="ghost" className="hover:text-accent-primary">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
                
                <Button variant="ghost" className="hover:text-accent-primary">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                
                <Button variant="ghost" className="hover:text-accent-primary">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2">
                {/* Language/Region Avatar */}
                <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src="data:image/svg+xml,%3csvg%20height='20'%20viewBox='0%200%2028%2020'%20width='28'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3e%3cdefs%3e%3crect%20id='a'%20height='20'%20rx='3'%20width='28'/%3e%3cmask%20id='b'%20fill='%23fff'%3e%3cuse%20fill='%23fff'%20fill-rule='evenodd'%20xlink:href='%23a'/%3e%3c/mask%3e%3c/defs%3e%3cg%20fill='none'%20fill-rule='evenodd'%3e%3cuse%20fill='%230a17a7'%20xlink:href='%23a'/%3e%3cpath%20d='m29.2824692-1.91644623%201.4911811%202.21076686-9.4483006%206.37223314%206.6746503.0001129v6.66666663l-6.6746503-.0007795%209.4483006%206.3731256-1.4911811%202.2107668-11.9501195-8.0608924.0009836%207.4777795h-6.6666666l-.000317-7.4777795-11.9488189%208.0608924-1.49118107-2.2107668%209.448-6.3731256-6.67434973.0007795v-6.66666663l6.67434973-.0001129-9.448-6.37223314%201.49118107-2.21076686%2011.9488189%208.06.000317-7.4768871h6.6666666l-.0009836%207.4768871z'%20fill='%23fff'%20mask='url(%23b)'/%3e%3cg%20stroke='%23db1f35'%20stroke-linecap='round'%20stroke-width='.667'%3e%3cpath%20d='m18.668%206.332%2012.665-8.332'%20mask='url(%23b)'/%3e%3cpath%20d='m20.013%2021.35%2011.354-7.652'%20mask='url(%23b)'%20transform='matrix(1%200%200%20-1%200%2035.048)'/%3e%3cpath%20d='m8.006%206.31-11.843-7.981'%20mask='url(%23b)'/%3e%3cpath%20d='m9.29%2022.31-13.127-8.705'%20mask='url(%23b)'%20transform='matrix(1%200%200%20-1%200%2035.915)'/%3e%3c/g%3e%3cpath%20d='m0%2012h12v8h4v-8h12v-4h-12v-8h-4v8h-12z'%20fill='%23e6273e'%20mask='url(%23b)'/%3e%3c/g%3e%3c/svg%3e" />
                    <AvatarFallback>BR</AvatarFallback>
                  </Avatar>
                </Button>

                {/* Shopping Cart with Badge */}
                <div className="relative">
                  <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50">
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                  <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground h-5 w-5 text-xs rounded-full flex items-center justify-center">
                    0
                  </Badge>
                </div>

                {/* Dark Mode Toggle */}
                <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50">
                  <Moon className="h-5 w-5" />
                </Button>

                {/* Notifications with Badge */}
                <div className="relative">
                  <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50">
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
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="hidden xl:flex text-text-secondary hover:text-text-primary"
                >
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
    </SidebarProvider>
  );
}